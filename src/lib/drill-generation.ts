import { generateObject, generateText } from "ai";
import { z } from "zod";
import { chatModel, gateway } from "~/lib/ai";
import { positionFocus } from "~/lib/soccer-feedback";

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
  if (history.length === 0) return `this exact coaching need: "${feedback}"`;

  const transcript = history
    .slice(-MAX_HISTORY_TURNS)
    .map(
      (turn) => `${turn.role === "user" ? "Player" : "Coach"}: ${turn.content}`,
    )
    .join("\n");
  return `the coaching need reflected in this conversation (the latest message may refine, narrow, or build on an earlier request rather than stand alone as its own topic):\n${transcript}\nPlayer (latest): "${feedback}"`;
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
  description: string;
  sourceTitle: string;
  imageUrl: string | null;
  videoUrl: string;
}

export interface DrillGenerationResult {
  intro: string;
  outro: string;
  drills: GeneratedDrill[];
}

/** How many of the top-ranked sources to turn into drills. */
const MAX_DRILLS = 5;

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

function describeAudience(position: string | null): string {
  return position
    ? `a ${position} focused on ${positionFocus(position)}`
    : "a player";
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

/**
 * One broad search for the coaching need, ranked best-match first. Doesn't
 * search per difficulty tier — forcing one result per tier was padding out
 * weak/irrelevant matches just to fill a slot. Ranking never drops a
 * candidate outright (equipment-violating ones just rank last), so there's
 * always a fallback instead of a hard failure.
 */
async function searchDrillSources(
  position: string | null,
  feedback: string,
  trainingContext: DrillGenerationTrainingContext | null,
  history: ConversationTurn[],
): Promise<VideoResult[]> {
  const contextClause = trainingContext
    ? ` The player is ${describeTrainingContext(trainingContext)}.`
    : "";
  const need = describeNeed(feedback, history);

  try {
    const { toolResults, text } = await generateText({
      model: chatModel,
      tools: {
        exa_search: gateway.tools.exaSearch({
          numResults: 10,
        }),
      },
      toolChoice: "required",
      prompt: `Find real coaching resources (YouTube videos, coaching-site articles, or blog posts) for soccer drills that help with ${need}, for ${describeAudience(position)}.${contextClause}${equipmentConstraint(trainingContext)} Prioritize results whose title or content specifically addresses that need over generic technique or passing content. A video is preferable when one fits well, but a specific, well-matched article is better than a loosely-related video. Search for specific, well-matched drills, not general highlight reels or listicles.

After searching, respond with ONLY a JSON array containing every 0-based result index, ranked best match first — don't omit any index. Rank a result that specifically addresses that need above one that's only generically related, and always rank a result that needs equipment the player doesn't have below every result that doesn't (e.g. "[2, 0, 1]" for 3 results). Every result must appear exactly once, even weak ones. No other text.`,
    });

    const output = toolResults?.[0]?.output as
      | { results?: VideoResult[] }
      | undefined;
    const results = output?.results ?? [];
    const ranked = parseRankedIndices(text, results.length);
    console.log(
      `[drill-search] ${results.length} raw results, ${ranked.length} ranked`,
    );
    return ranked
      .map((i) => results[i])
      .filter((r): r is VideoResult => r !== undefined);
  } catch (error) {
    // A search/screening failure shouldn't take down the whole request —
    // the caller treats an empty result the same as "nothing found."
    console.error("searchDrillSources failed", error);
    return [];
  }
}

const responseSchema = z.object({
  intro: z.string(),
  outro: z.string(),
  drills: z.array(
    z.object({
      difficulty: z.enum(DRILL_DIFFICULTIES),
      title: z.string(),
      description: z.string(),
    }),
  ),
});

/**
 * Grounds a handful of the best-matching sources for the coaching need,
 * then writes a coaching explanation for each. Returns null if nothing was
 * found at all (caller should surface that as an error).
 */
export async function generateDrillBreakdown(
  feedback: string,
  position: string | null,
  trainingContext: DrillGenerationTrainingContext | null,
  history: ConversationTurn[] = [],
): Promise<DrillGenerationResult | null> {
  const ranked = await searchDrillSources(
    position,
    feedback,
    trainingContext,
    history,
  );
  if (ranked.length === 0) return null;

  const selected = ranked.slice(0, MAX_DRILLS);

  const contextClause = trainingContext
    ? `, ${describeTrainingContext(trainingContext)}`
    : "";
  const { object } = await generateObject({
    model: chatModel,
    schema: responseSchema,
    system: `You are a soccer coach. For each source below you're given a real source's title and an excerpt (from a video transcript or an article). Write a coaching explanation of the drill described in that source for ${describeAudience(position)}${contextClause}, and assign it a difficulty (Beginner, Intermediate, Advanced, or Elite) based on how demanding the drill itself actually is — let the difficulties vary naturally based on each source's content, don't force an even spread across tiers. Reference the specific technique, reps, and setup described in the excerpt — don't invent details that aren't there.${equipmentConstraint(trainingContext)} If a source's setup relies on equipment the player doesn't have, adapt the explanation to the closest equivalent the player can actually do rather than describing the unavailable setup. Keep the intro and outro to 2-3 sentences each. Write exactly one drill entry per source listed, in the order listed.`,
    prompt: selected
      .map(
        (source, i) =>
          `### Source ${i + 1}\nSource title: "${source.title}"\nExcerpt: ${(source.highlights ?? []).join(" ").slice(0, 4000)}`,
      )
      .join("\n\n"),
  });

  const drills = object.drills
    .map((drill, i) => {
      const source = selected[i];
      if (!source) return null;
      return {
        difficulty: drill.difficulty,
        title: drill.title,
        description: drill.description,
        sourceTitle: source.title,
        imageUrl: source.image ?? null,
        videoUrl: source.url,
      };
    })
    .filter((drill): drill is NonNullable<typeof drill> => drill !== null);

  return { intro: object.intro, outro: object.outro, drills };
}
