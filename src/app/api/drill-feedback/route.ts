import { generateObject } from "ai";
import { z } from "zod";
import { chatModel } from "~/lib/ai";
import { positionFocus } from "~/lib/soccer-feedback";

const DRILL_DIFFICULTIES = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Elite",
] as const;

const responseSchema = z.object({
  intro: z.string(),
  drills: z
    .array(
      z.object({
        difficulty: z.enum(DRILL_DIFFICULTIES),
        title: z.string(),
        description: z.string(),
      }),
    )
    .length(4),
  outro: z.string(),
});

export async function POST(request: Request) {
  const { feedback, position } = (await request.json()) as {
    feedback?: string;
    position?: string;
  };

  if (!feedback?.trim() || !position?.trim()) {
    return Response.json(
      { error: "feedback and position are required" },
      { status: 400 },
    );
  }

  try {
    const { object } = await generateObject({
      model: chatModel,
      schema: responseSchema,
      system: `You are a soccer coach turning a player's feedback into a progressive training plan focused on ${positionFocus(
        position,
      )}. Write exactly one drill per difficulty tier (Beginner, Intermediate, Advanced, Elite) that each build on the last, ending at full match-speed pressure. Keep the intro and outro to 2-3 sentences each, and make drill descriptions concrete with rep/set counts and a clear coaching cue.`,
      prompt: `Position: ${position}\nCoach feedback: "${feedback}"`,
    });

    return Response.json(object);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to generate drills" },
      {
        status: 502,
      },
    );
  }
}
