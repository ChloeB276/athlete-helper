const POSITION_FOCUS: Record<string, string> = {
  goalkeeper: "shot-stopping, positioning, and distribution",
  defender: "marking, tackling, and building out from the back",
  "center back": "marking, tackling, and building out from the back",
  fullback: "1v1 defending and supporting the attack down the flank",
  midfielder: "receiving under pressure, scanning, and spraying passes",
  winger: "beating defenders 1v1 and delivering final balls",
  forward: "movement off the ball and finishing",
  striker: "movement off the ball and finishing",
};

export function positionFocus(position: string): string {
  const key = position.trim().toLowerCase();
  return POSITION_FOCUS[key] ?? "your role on the pitch";
}

export type DrillDifficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Elite";

export type Equipment = "goal" | "cones" | "wall";

export const EQUIPMENT_OPTIONS: Array<{ value: Equipment; label: string }> = [
  { value: "goal", label: "Goal" },
  { value: "cones", label: "Cones" },
  { value: "wall", label: "Wall" },
];

export interface TrainingContext {
  /** Number of other players training alongside the user. 0 means solo. */
  partners: number;
  equipment: Equipment[];
}

export interface Drill {
  id: string;
  difficulty: DrillDifficulty;
  title: string;
  description: string;
  sourceTitle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  kept: boolean;
}

export interface FeedbackBreakdown {
  intro: string;
  drills: Drill[];
  outro: string;
}

interface GeneratedDrill {
  difficulty: DrillDifficulty;
  title: string;
  description: string;
  sourceTitle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

export async function breakdownFeedback(
  feedback: string,
  position: string,
  trainingContext: TrainingContext,
): Promise<FeedbackBreakdown> {
  const response = await fetch("/api/drill-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback, position, trainingContext }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Failed to generate drill feedback");
  }

  const data: { intro: string; outro: string; drills: GeneratedDrill[] } =
    await response.json();

  return {
    intro: data.intro,
    outro: data.outro,
    drills: data.drills.map((drill) => ({
      id: crypto.randomUUID(),
      difficulty: drill.difficulty,
      title: drill.title,
      description: drill.description,
      sourceTitle: drill.sourceTitle,
      imageUrl: drill.imageUrl,
      videoUrl: drill.videoUrl,
      kept: false,
    })),
  };
}

export const ASK_POSITION_PROMPT =
  "Hi! I'm your Athlete Helper AI coach for soccer players. What position do you play?";

export function acknowledgePosition(position: string): string {
  return `Got it, you play ${position}. Before we get into drills, let's set up your training session.`;
}

export function greetingForPosition(position: string): string {
  return `Hi! I'm your Athlete Helper AI coach for soccer players. Tell me some feedback your coach gave you as a ${position}, and I'll break it down into a detailed drill plan.`;
}

export function describeTrainingContext(context: TrainingContext): string {
  const groupPart =
    context.partners > 0
      ? `Training with ${context.partners} friend${context.partners === 1 ? "" : "s"}`
      : "Training solo";
  const equipmentPart =
    context.equipment.length > 0
      ? context.equipment
          .map(
            (item) =>
              EQUIPMENT_OPTIONS.find((option) => option.value === item)
                ?.label ?? item,
          )
          .join(", ")
      : "No equipment";
  return `${groupPart} • ${equipmentPart}`;
}

export function acknowledgeTrainingContext(): string {
  return "Got it. Now tell me some feedback your coach gave you, and I'll find real drills to fix it.";
}
