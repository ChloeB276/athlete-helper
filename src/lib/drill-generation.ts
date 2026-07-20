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

function describeAudience(position: string | null): string {
  return position
    ? `a ${position} focused on ${positionFocus(position)}`
    : "a player";
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
  const { toolResults } = await generateText({
    model: chatModel,
    tools: {
      exa_search: gateway.tools.exaSearch({
        includeDomains: ["youtube.com"],
        numResults: 5,
      }),
    },
    toolChoice: "required",
    prompt: `Find real YouTube videos of a ${difficulty.toLowerCase()}-difficulty soccer drill that helps with this coaching need: "${feedback}", for ${describeAudience(position)}.${contextClause} Search for specific, well-matched drill videos, not general highlight reels.`,
  });

  const output = toolResults?.[0]?.output as
    | { results?: VideoResult[] }
    | undefined;
  return { difficulty, results: output?.results ?? [] };
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
  const searches = await Promise.all(
    DRILL_DIFFICULTIES.map((difficulty) =>
      searchDrillVideos(difficulty, position, feedback, trainingContext),
    ),
  );

  const grounded = assignDistinctVideos(searches);
  if (grounded.length === 0) return null;

  const contextClause = trainingContext
    ? `, ${describeTrainingContext(trainingContext)}`
    : "";
  const { object } = await generateObject({
    model: chatModel,
    schema: responseSchema,
    system: `You are a soccer coach. For each difficulty tier below you're given a real YouTube video's title and a transcript excerpt. Write a coaching explanation of the drill shown in that video for ${describeAudience(position)}${contextClause}. Reference the specific technique, reps, and setup described in the transcript — don't invent details that aren't there. Keep the intro and outro to 2-3 sentences each. Write exactly one drill entry per tier listed, in the order listed.`,
    prompt: grounded
      .map(
        (g) =>
          `### ${g.difficulty}\nVideo title: "${g.video.title}"\nTranscript excerpt: ${(g.video.highlights ?? []).join(" ").slice(0, 4000)}`,
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
