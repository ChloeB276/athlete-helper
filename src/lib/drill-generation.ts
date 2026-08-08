import { streamObject, streamText } from "ai";
import { z } from "zod";
import { chatModel, fastModel, gateway } from "~/lib/ai";
import { combinedPositionFocus } from "~/lib/soccer-feedback";

/**
 * Overall time budget for the whole chat pipeline (intent gate + search +
 * drill writeup combined). A real web search plus a quality multi-drill
 * writeup can legitimately take 30s+, so this is a safety net against a
 * genuine hang, not a target latency — set it too low and it aborts normal
 * requests before they finish. Stays comfortably under the route's own
 * `maxDuration` so we always get a chance to send a clean error first.
 */
const PIPELINE_TIMEOUT_MS = 45_000;

export const DRILL_DIFFICULTIES = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Elite",
] as const;
export type Difficulty = (typeof DRILL_DIFFICULTIES)[number];

export interface DrillGenerationTrainingContext {
  partners: number;
  equipment: string[];
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

/** How many prior turns to carry into the prompt as context. */
const MAX_HISTORY_TURNS = 8;

/**
 * Describes the coaching need for the search prompt. When there's prior
 * conversation, the latest message might be a follow-up ("can I have more
 * long passing focused") that only makes sense read against what came
 * before it, rather than a fresh, standalone request.
 */
function describeNeed(feedback: string, history: ConversationTurn[]): string {
  if (history.length === 0) return `this exact request: "${feedback}"`;

  const transcript = history
    .slice(-MAX_HISTORY_TURNS)
    .map(
      (turn) => `${turn.role === "user" ? "Player" : "Coach"}: ${turn.content}`,
    )
    .join("\n");
  return `the request reflected in this conversation (the latest message may refine, narrow, or build on an earlier request rather than stand alone as its own topic):\n${transcript}\nPlayer (latest): "${feedback}"`;
}

interface VideoResult {
  url: string;
  title: string;
  image?: string;
  highlights?: string[];
}

export interface GeneratedDrill {
  difficulty: Difficulty;
  title: string;
  area: string;
  setup: string;
  steps: string[];
  setsReps: string;
  rest: string;
  focus: string;
  benefit: string;
  sourceTitle: string;
  imageUrl: string | null;
  videoUrl: string;
}

export interface DrillGenerationResult {
  intro: string;
  outro: string;
  drills: GeneratedDrill[];
}

/**
 * How many of the top-ranked sources to turn into drills. Kept small
 * because the final writeup call generates all of these in one go, and
 * each additional drill directly extends how long that call takes. Sized to
 * leave room for a couple of drills per area when a request spans more than
 * one distinct area, rather than one area starving the rest.
 */
const MAX_DRILLS = 6;

function describeTrainingContext(
  context: DrillGenerationTrainingContext,
): string {
  const group =
    context.partners > 0
      ? `training with ${context.partners} other player${context.partners === 1 ? "" : "s"}`
      : "training solo";
  const equipment =
    context.equipment.length > 0
      ? `available equipment: ${context.equipment.join(", ")}`
      : "no equipment available";
  return `${group}, ${equipment}`;
}

function equipmentConstraint(
  context: DrillGenerationTrainingContext | null,
): string {
  if (!context) return "";
  return context.equipment.length > 0
    ? ` The player can only use this equipment: ${context.equipment.join(", ")} (plus a ball) — do not pick videos that require anything else (no wall, cones, or goal unless listed).`
    : " The player has no training equipment beyond a ball — do not pick videos that use a wall, cones, a goal, or anything else beyond open space.";
}

function describeAudience(positions: string[]): string {
  if (positions.length === 0) return "a player";
  const roles = positions.join(", ");
  const focus = combinedPositionFocus(positions);
  return positions.length === 1
    ? `a ${roles} focused on ${focus}`
    : `a player who plays ${roles}, focused on ${focus}`;
}

/**
 * Parses a JSON array of 0-based indices from the model's final text
 * response. Falls back to every candidate (in original order) if the text
 * can't be parsed — a screening hiccup should degrade to "unfiltered"
 * rather than to "nothing."
 */
function parseRankedIndices(text: string, resultCount: number): number[] {
  const match = text.match(/\[[\d,\s]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
        return parsed;
      }
    } catch {
      // fall through to the unfiltered fallback below
    }
  }
  return Array.from({ length: resultCount }, (_, i) => i);
}

// Field order matches reading/streaming order: intro first, then drills one
// at a time, then outro last.
const responseSchema = z.object({
  intro: z.string(),
  drills: z.array(
    z.object({
      difficulty: z.enum(DRILL_DIFFICULTIES),
      title: z.string(),
      area: z.string(),
      setup: z.string(),
      steps: z.array(z.string()).min(2).max(6),
      setsReps: z.string(),
      rest: z.string(),
      focus: z.string(),
      benefit: z.string(),
    }),
  ),
  outro: z.string(),
});

export type ChatStreamEvent =
  | { type: "answer"; text: string }
  | { type: "drills"; partial: Partial<DrillGenerationResult> }
  | { type: "not-found" }
  | { type: "error"; message: string };

type RespondOrSearchResult =
  | { needsDrills: false }
  | { needsDrills: true; ranked: VideoResult[] };

/**
 * One call that both decides what the player needs and (when they need
 * drills) finds them — merged into a single model call instead of a
 * separate classification call followed by a separate search call, since
 * that extra round-trip was the single biggest chunk of response latency.
 *
 * The model is given the search tool with `toolChoice: "auto"` for
 * follow-ups: if the latest message is a plain question/comment, it just
 * answers directly (streamed live via `onAnswerDelta`) without calling the
 * tool; if it's a request for new/different drills, it calls the tool and
 * we treat the trailing text as the ranked-index list. The first message in
 * a chat has no follow-up context to answer, so the tool is required.
 */
async function respondOrSearchDrills(
  feedback: string,
  history: ConversationTurn[],
  positions: string[],
  trainingContext: DrillGenerationTrainingContext | null,
  onAnswerDelta: (cumulativeText: string) => void,
  signal: AbortSignal,
): Promise<RespondOrSearchResult> {
  const isFollowUp = history.length > 0;
  const need = describeNeed(feedback, history);
  const contextClause = trainingContext
    ? ` The player is ${describeTrainingContext(trainingContext)}.`
    : "";
  const searchInstructions = `call the exa_search tool to find real coaching resources (YouTube videos, coaching-site articles, or blog posts) for soccer drills that help with ${need}, for ${describeAudience(positions)}.${contextClause}${equipmentConstraint(trainingContext)} Prioritize results whose title or content specifically addresses that need over generic technique or passing content. A video is preferable when one fits well, but a specific, well-matched article is better than a loosely-related video. Search for specific, well-matched drills, not general highlight reels or listicles.

Write the exa_search query as a short, focused phrase (5-10 words) naming the specific skill and technique keywords — don't just paste the player's full sentence as the query. Identify precisely what skill the player is asking to execute (e.g. striking/hitting a long pass) versus a different, related skill (e.g. receiving or controlling one) and search for THAT skill specifically — if the need is about making/hitting a pass, search for how to strike or execute that pass, not how to receive or first-touch it, unless the player explicitly asked about receiving.

If the request covers more than one distinct area or skill (e.g. two different techniques, or multiple weaknesses to train in one session), call exa_search once per distinct area, each with its own focused query for that specific area — don't merge multiple areas into one vague query. Every distinct area the player named should get its own search.

Once you're done searching, respond with ONLY a JSON array of 0-based result indices, ranked best match first (e.g. "[2, 0]"). If you called exa_search more than once, number the results globally across all your calls in the order you called them (the first call's results come first, then the second call's results continue right after, and so on) and rank across that combined list — don't restart numbering per call. If multiple areas were requested, make sure at least one strong match per area is included rather than one area filling the whole list. Include ONLY results that genuinely address the need — omit any result that's just loosely/generically related, addresses a different skill, or needs equipment the player doesn't have. Don't pad the list to hit a target count; a shorter list of real matches beats a longer list with weak filler. If none of the results genuinely fit, respond with an empty array "[]". No other text.`;

  const system = isFollowUp
    ? (() => {
        const transcript = history
          .slice(-MAX_HISTORY_TURNS)
          .map(
            (turn) =>
              `${turn.role === "user" ? "Player" : "Coach"}: ${turn.content}`,
          )
          .join("\n");
        return `You are a soccer coaching assistant chatting with ${describeAudience(positions)}${contextClause}, continuing a conversation about drills you've already recommended. Talk like a friendly coach texting back, not a formal report — warm, natural, conversational phrasing. Conversation so far:\n${transcript}\n\nDecide how to respond to the player's latest message. If they're asking for new, additional, more specific, or different drills (e.g. "give me more", "focus more on X", "these don't work, find better ones", "something harder"), ${searchInstructions} Otherwise — a question, clarification, comment, or anything that doesn't require finding new drill videos — do NOT call any tool; just answer directly and conversationally in 1-4 sentences, referencing the specific drills already discussed where relevant. Don't invent drills or describe videos that weren't already discussed.`;
      })()
    : `You are a soccer coaching assistant helping ${describeAudience(positions)}. ${searchInstructions}`;

  try {
    const { fullStream } = streamText({
      model: fastModel,
      abortSignal: signal,
      tools: {
        exa_search: gateway.tools.exaSearch({ numResults: 6 }),
      },
      toolChoice: isFollowUp ? "auto" : "required",
      system,
      prompt: feedback,
    });

    let toolCalled = false;
    let answerText = "";
    let rankingText = "";
    const results: VideoResult[] = [];

    for await (const part of fullStream) {
      if (part.type === "tool-call") {
        toolCalled = true;
        console.log("[drill-search] query:", JSON.stringify(part.input));
      } else if (part.type === "tool-result") {
        const output = part.output as { results?: VideoResult[] } | undefined;
        results.push(...(output?.results ?? []));
      } else if (part.type === "text-delta") {
        if (toolCalled) {
          rankingText += part.text;
        } else {
          answerText += part.text;
          onAnswerDelta(answerText);
        }
      }
    }

    if (!toolCalled) return { needsDrills: false };

    const ranked = parseRankedIndices(rankingText, results.length);
    console.log(
      `[drill-search] ${results.length} raw results, ${ranked.length} ranked`,
    );
    return {
      needsDrills: true,
      ranked: ranked
        .map((i) => results[i])
        .filter((r): r is VideoResult => r !== undefined),
    };
  } catch (error) {
    // A search/screening failure shouldn't take down the whole request —
    // the caller treats an empty result the same as "nothing found."
    console.error("respondOrSearchDrills failed", error);
    return { needsDrills: true, ranked: [] };
  }
}

function mapPartialToResult(
  partial: {
    intro?: string;
    outro?: string;
    drills?: Array<
      | {
          difficulty?: Difficulty;
          title?: string;
          area?: string;
          setup?: string;
          steps?: Array<string | undefined>;
          setsReps?: string;
          rest?: string;
          focus?: string;
          benefit?: string;
        }
      | undefined
    >;
  },
  selected: VideoResult[],
): Partial<DrillGenerationResult> {
  const drills = (partial.drills ?? [])
    .map((drill, i) => {
      const source = selected[i];
      if (!source) return null;
      return {
        difficulty: drill?.difficulty ?? "Beginner",
        title: drill?.title ?? "",
        area: drill?.area ?? "",
        setup: drill?.setup ?? "",
        steps: (drill?.steps ?? []).filter((s): s is string => s !== undefined),
        setsReps: drill?.setsReps ?? "",
        rest: drill?.rest ?? "",
        focus: drill?.focus ?? "",
        benefit: drill?.benefit ?? "",
        sourceTitle: source.title,
        imageUrl: source.image ?? null,
        videoUrl: source.url,
      };
    })
    .filter((drill): drill is GeneratedDrill => drill !== null);

  return { intro: partial.intro, outro: partial.outro, drills };
}

/**
 * Entry point for the drill chat: routes a follow-up message to either a
 * plain conversational answer or a fresh drill search, depending on what
 * the player is actually asking for, streaming the response as it's
 * generated via `onEvent`. The first message in a chat (no history yet)
 * always goes straight to drill search.
 */
export async function streamChatResponse(
  feedback: string,
  positions: string[],
  trainingContext: DrillGenerationTrainingContext | null,
  history: ConversationTurn[],
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PIPELINE_TIMEOUT_MS);

  try {
    const result = await respondOrSearchDrills(
      feedback,
      history,
      positions,
      trainingContext,
      (text) => onEvent({ type: "answer", text }),
      controller.signal,
    );
    if (!result.needsDrills) return;
    if (result.ranked.length === 0) {
      onEvent({ type: "not-found" });
      return;
    }

    const selected = result.ranked.slice(0, MAX_DRILLS);
    const contextClause = trainingContext
      ? `, ${describeTrainingContext(trainingContext)}`
      : "";
    const need = describeNeed(feedback, history);

    const { partialObjectStream, object } = streamObject({
      model: chatModel,
      abortSignal: controller.signal,
      schema: responseSchema,
      system: `You are a soccer coach texting a player, not writing a formal report — warm, natural, conversational phrasing throughout. The player wants help with ${need}, for ${describeAudience(positions)}${contextClause}.

Start the intro with a short breakdown of that request itself: in plain, simple language (no jargon, explain it like you would to a teenager new to the term), say what it actually means in practice for someone playing their position(s), and why it matters in a game. If more than one distinct area was asked about, briefly acknowledge each one. Only after that breakdown, transition into the drills below.

For each source below you're given a real source's title and an excerpt (from a video transcript or an article). Turn the drill described in that source into a structured breakdown, and assign it a difficulty (Beginner, Intermediate, Advanced, or Elite) based on how demanding the drill itself actually is — let the difficulties vary naturally based on each source's content, don't force an even spread across tiers. Set "area" to a short label (2-4 words) naming which specific requested area or skill this drill addresses — if only one area was requested, use a short label for that same area. Fill in:
- "setup": the equipment/space/starting position needed, one short sentence.
- "steps": how to actually do it, as short imperative bullet points in order (e.g. "Pass to the target, then check back to receive").
- "setsReps": a concrete volume, e.g. "3 sets x 10 reps" or "4 x 30s reps".
- "rest": rest between sets, e.g. "60s between sets" (a reasonable estimate if the source doesn't say).
- "focus": the single most important thing to concentrate on while executing it.
- "benefit": one sentence on how this specific drill helps the area/weakness it's tagged with.

Reference the specific technique, reps, and setup described in the excerpt — don't invent details that aren't there; only "setsReps" and "rest" may be a reasonable estimate when the source doesn't specify them.${equipmentConstraint(trainingContext)} If a source's setup relies on equipment the player doesn't have, adapt the setup/steps to the closest equivalent the player can actually do rather than describing the unavailable setup. Keep the intro to 3-5 sentences (covering both the request breakdown and the transition) and the outro to 2-3 sentences. Write exactly one drill entry per source listed, in the order listed.`,
      prompt: selected
        .map(
          (source, i) =>
            `### Source ${i + 1}\nSource title: "${source.title}"\nExcerpt: ${(source.highlights ?? []).join(" ").slice(0, 2000)}`,
        )
        .join("\n\n"),
    });

    for await (const partial of partialObjectStream) {
      onEvent({
        type: "drills",
        partial: mapPartialToResult(partial, selected),
      });
    }

    const final = await object;
    onEvent({ type: "drills", partial: mapPartialToResult(final, selected) });
  } catch (error) {
    if (controller.signal.aborted) {
      console.error("streamChatResponse timed out", error);
      onEvent({
        type: "error",
        message:
          "That's taking longer than expected — please try again, or try a shorter request.",
      });
      return;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
