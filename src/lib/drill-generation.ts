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

async function searchDrillVideos(
  difficulty: Difficulty,
  position: string | null,
  feedback: string,
  trainingContext: DrillGenerationTrainingContext | null,
): Promise<{ difficulty: Difficulty; results: VideoResult[] }> {
  const contextClause = trainingContext
    ? ` The player is ${describeTrainingContext(trainingContext)}.`
    : "";

  try {
    const { toolResults, text } = await generateText({
      model: chatModel,
      tools: {
        exa_search: gateway.tools.exaSearch({
          numResults: 8,
        }),
      },
      toolChoice: "required",
      prompt: `Find real coaching resources (YouTube videos, coaching-site articles, or blog posts) for a ${difficulty.toLowerCase()}-difficulty soccer drill that helps with this exact coaching need: "${feedback}", for ${describeAudience(position)}.${contextClause}${equipmentConstraint(trainingContext)} Prioritize results whose title or content specifically addresses "${feedback}" over generic technique or passing content — reject a well-produced result if it doesn't actually match this need or violates the equipment constraint above. A video is preferable when one fits well, but a specific, well-matched article is better than a loosely-related video. Search for specific, well-matched drills, not general highlight reels or listicles.

After searching, respond with ONLY a JSON array of the 0-based indices of the results that genuinely and specifically match this exact need, best match first (e.g. "[2, 0]"). Leave out any result that's only generically or loosely related, or that needs equipment the player doesn't have. An empty array ("[]") is correct if none genuinely fit. No other text.`,
    });

    const output = toolResults?.[0]?.output as
      | { results?: VideoResult[] }
      | undefined;
    const results = output?.results ?? [];
    const ranked = parseRankedIndices(text, results.length);
    return {
      difficulty,
      results: ranked
        .map((i) => results[i])
        .filter((r): r is VideoResult => r !== undefined),
    };
  } catch (error) {
    // A single tier's search/screening failing (transient rate limit,
    // timeout) shouldn't take down the whole request — the other tiers can
    // still succeed, and generateDrillBreakdown only needs at least one.
    console.error(`searchDrillVideos failed for ${difficulty}`, error);
    return { difficulty, results: [] };
  }
}

/** Greedily assign each tier its highest-ranked video that no earlier tier already claimed. */
function assignDistinctVideos(
  searches: Array<{ difficulty: Difficulty; results: VideoResult[] }>,
): Array<{ difficulty: Difficulty; video: VideoResult }> {
  const claimed = new Set<string>();
  const assigned: Array<{ difficulty: Difficulty; video: VideoResult }> = [];

  for (const search of searches) {
    const video = search.results.find((r) => !claimed.has(r.url));
    if (video) {
      claimed.add(video.url);
      assigned.push({ difficulty: search.difficulty, video });
    }
  }

  return assigned;
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
 * Grounds each difficulty tier in a real YouTube video, then writes a
 * coaching explanation per tier. Returns null if no matching videos were
 * found at all (caller should surface that as an error).
 */
export async function generateDrillBreakdown(
  feedback: string,
  position: string | null,
  trainingContext: DrillGenerationTrainingContext | null,
): Promise<DrillGenerationResult | null> {
  // Sequential, not Promise.all: firing all 4 tiers' searches at once bursts
  // past the AI Gateway's rate limit and the whole request fails.
  const searches: Array<{ difficulty: Difficulty; results: VideoResult[] }> =
    [];
  for (const difficulty of DRILL_DIFFICULTIES) {
    searches.push(
      await searchDrillVideos(difficulty, position, feedback, trainingContext),
    );
  }

  const grounded = assignDistinctVideos(searches);
  if (grounded.length === 0) return null;

  const contextClause = trainingContext
    ? `, ${describeTrainingContext(trainingContext)}`
    : "";
  const { object } = await generateObject({
    model: chatModel,
    schema: responseSchema,
    system: `You are a soccer coach. For each difficulty tier below you're given a real source's title and an excerpt (from a video transcript or an article). Write a coaching explanation of the drill described in that source for ${describeAudience(position)}${contextClause}. Reference the specific technique, reps, and setup described in the excerpt — don't invent details that aren't there.${equipmentConstraint(trainingContext)} If the source's setup relies on equipment the player doesn't have, adapt the explanation to the closest equivalent the player can actually do rather than describing the unavailable setup. Keep the intro and outro to 2-3 sentences each. Write exactly one drill entry per tier listed, in the order listed.`,
    prompt: grounded
      .map(
        (g) =>
          `### ${g.difficulty}\nSource title: "${g.video.title}"\nExcerpt: ${(g.video.highlights ?? []).join(" ").slice(0, 4000)}`,
      )
      .join("\n\n"),
  });

  const drills = object.drills
    .map((drill) => {
      const source = grounded.find((g) => g.difficulty === drill.difficulty);
      if (!source) return null;
      return {
        difficulty: drill.difficulty,
        title: drill.title,
        description: drill.description,
        sourceTitle: source.video.title,
        imageUrl: source.video.image ?? null,
        videoUrl: source.video.url,
      };
    })
    .filter((drill): drill is NonNullable<typeof drill> => drill !== null);

  return { intro: object.intro, outro: object.outro, drills };
}
