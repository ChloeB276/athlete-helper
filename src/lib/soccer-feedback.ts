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
  quota?: { remaining: number; max: number };
}

interface GeneratedDrill {
  difficulty: DrillDifficulty;
  title: string;
  description: string;
  sourceTitle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

type StreamEvent =
  | { type: "answer"; text: string }
  | {
      type: "drills";
      partial: { intro?: string; outro?: string; drills?: GeneratedDrill[] };
    }
  | { type: "not-found" }
  | { type: "quota"; quota: { remaining: number; max: number } }
  | { type: "error"; message: string };

export async function breakdownFeedback(
  feedback: string,
  position: string | null,
  trainingContext: TrainingContext | null,
  history: ConversationTurn[] = [],
  onUpdate?: (snapshot: FeedbackBreakdown) => void,
): Promise<FeedbackBreakdown> {
  const response = await fetch("/api/drill-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback, position, trainingContext, history }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Failed to generate drill feedback");
  }
  if (!response.body) {
    throw new Error("Failed to generate drill feedback");
  }

  const snapshot: FeedbackBreakdown = { intro: "", outro: "", drills: [] };
  const drillIds: string[] = [];
  let notFound = false;
  let errorMessage: string | null = null;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as StreamEvent;

      switch (event.type) {
        case "answer":
          snapshot.intro = event.text;
          break;
        case "drills":
          if (event.partial.intro !== undefined) {
            snapshot.intro = event.partial.intro;
          }
          if (event.partial.outro !== undefined) {
            snapshot.outro = event.partial.outro;
          }
          if (event.partial.drills) {
            snapshot.drills = event.partial.drills.map((drill, i) => {
              if (drillIds[i] === undefined) drillIds[i] = crypto.randomUUID();
              const id = drillIds[i];
              return {
                id,
                difficulty: drill.difficulty,
                title: drill.title,
                description: drill.description,
                sourceTitle: drill.sourceTitle,
                imageUrl: drill.imageUrl,
                videoUrl: drill.videoUrl,
                kept: false,
              };
            });
          }
          break;
        case "not-found":
          notFound = true;
          break;
        case "quota":
          snapshot.quota = event.quota;
          break;
        case "error":
          errorMessage = event.message;
          break;
      }

      onUpdate?.({ ...snapshot, drills: [...snapshot.drills] });
    }
  }

  if (errorMessage) throw new Error(errorMessage);
  if (notFound) throw new Error("Couldn't find any matching drill videos");

  return snapshot;
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
