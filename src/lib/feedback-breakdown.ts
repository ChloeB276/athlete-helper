import { generateObject } from "ai";
import { z } from "zod";
import { chatModel } from "~/lib/ai";
import { positionFocus } from "~/lib/soccer-feedback";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Elite"] as const;

const breakdownSchema = z.object({
  expandedFeedback: z
    .string()
    .nullable()
    .describe(
      "A more detailed elaboration of the coach's note, in the coach's voice. Null if not requested.",
    ),
  nextSteps: z.array(z.string()).min(1).max(6),
  drills: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        difficulty: z.enum(DIFFICULTIES),
      }),
    )
    .min(1)
    .max(4),
});

export interface FeedbackBreakdown {
  expandedFeedback: string | null;
  nextSteps: string[];
  drills: Array<{
    title: string;
    description: string;
    difficulty: (typeof DIFFICULTIES)[number];
  }>;
}

export async function generateFeedbackBreakdown({
  coachText,
  expand,
  position,
}: {
  coachText: string;
  expand: boolean;
  position?: string | null;
}): Promise<FeedbackBreakdown> {
  const focus = position ? positionFocus(position) : "their role on the pitch";

  const system = expand
    ? `You are a soccer coaching assistant. A coach wrote feedback for a player who plays ${focus}. Elaborate on the coach's note in more detail in "expandedFeedback" — clarify what they mean and why it matters, in an encouraging tone. Then give concrete next steps and 1-3 drills that address it.`
    : `You are a soccer coaching assistant. A coach wrote feedback for a player who plays ${focus}. Do not rephrase or add detail to the coach's note — set "expandedFeedback" to null. Just generate concrete next steps and 1-3 drills that address the coach's note as written.`;

  const { object } = await generateObject({
    model: chatModel,
    schema: breakdownSchema,
    system,
    prompt: `Coach's feedback: "${coachText}"`,
  });

  return {
    expandedFeedback: expand ? object.expandedFeedback : null,
    nextSteps: object.nextSteps,
    drills: object.drills,
  };
}
