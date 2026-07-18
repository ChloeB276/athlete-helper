import { generateObject, generateText } from "ai";
import { z } from "zod";
import { chatModel, gateway } from "~/lib/ai";
import { checkRateLimit, getClientIp } from "~/lib/rate-limit";
import { positionFocus } from "~/lib/soccer-feedback";
import { createClient } from "~/lib/supabase/server";

const ANONYMOUS_RATE_LIMIT = { windowSeconds: 60 * 60, maxRequests: 3 };

const DRILL_DIFFICULTIES = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Elite",
] as const;
type Difficulty = (typeof DRILL_DIFFICULTIES)[number];

interface TrainingContext {
  partners: number;
  equipment: string[];
}

interface VideoResult {
  url: string;
  title: string;
  image?: string;
  highlights?: string[];
}

function describeTrainingContext(context: TrainingContext): string {
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

async function searchDrillVideos(
  difficulty: Difficulty,
  position: string,
  feedback: string,
  trainingContext: TrainingContext,
): Promise<{ difficulty: Difficulty; results: VideoResult[] }> {
  const { toolResults } = await generateText({
    model: chatModel,
    tools: {
      exa_search: gateway.tools.exaSearch({
        includeDomains: ["youtube.com"],
        numResults: 5,
      }),
    },
    toolChoice: "required",
    prompt: `Find real YouTube videos of a ${difficulty.toLowerCase()}-difficulty soccer drill that helps with this coach feedback: "${feedback}", for a ${position} focused on ${positionFocus(position)}. The player is ${describeTrainingContext(trainingContext)}. Search for specific, well-matched drill videos, not general highlight reels.`,
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

export async function POST(request: Request) {
  const { feedback, position, trainingContext } = (await request.json()) as {
    feedback?: string;
    position?: string;
    trainingContext?: TrainingContext;
  };

  if (!feedback?.trim() || !position?.trim() || !trainingContext) {
    return Response.json(
      { error: "feedback, position, and trainingContext are required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const allowed = await checkRateLimit(
      `drill-feedback:${getClientIp(request)}`,
      ANONYMOUS_RATE_LIMIT,
    );
    if (!allowed) {
      return Response.json(
        {
          error:
            "You've hit the demo's hourly limit. Sign up for unlimited access.",
        },
        { status: 429 },
      );
    }
  }

  try {
    const searches = await Promise.all(
      DRILL_DIFFICULTIES.map((difficulty) =>
        searchDrillVideos(difficulty, position, feedback, trainingContext),
      ),
    );

    const grounded = assignDistinctVideos(searches);

    if (grounded.length === 0) {
      return Response.json(
        { error: "Couldn't find any matching drill videos" },
        { status: 502 },
      );
    }

    const { object } = await generateObject({
      model: chatModel,
      schema: responseSchema,
      system: `You are a soccer coach. For each difficulty tier below you're given a real YouTube video's title and a transcript excerpt. Write a coaching explanation of the drill shown in that video for a ${position} working on ${positionFocus(position)}, ${describeTrainingContext(trainingContext)}. Reference the specific technique, reps, and setup described in the transcript — don't invent details that aren't there. Keep the intro and outro to 2-3 sentences each. Write exactly one drill entry per tier listed, in the order listed.`,
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

    return Response.json({ intro: object.intro, outro: object.outro, drills });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to generate drills" },
      { status: 502 },
    );
  }
}
