const POSITION_FOCUS: Record<string, string> = {
  goalie: "shot-stopping, positioning, and distribution",
  goalkeeper: "shot-stopping, positioning, and distribution",
  fullback: "1v1 defending and supporting the attack down the flank",
  "centre back": "marking, tackling, and building out from the back",
  "center back": "marking, tackling, and building out from the back",
  defender: "marking, tackling, and building out from the back",
  "defensive mid":
    "shielding the back line, winning duels, and recycling possession",
  "attacking mid":
    "receiving between the lines, creating chances, and finishing",
  midfielder: "receiving under pressure, scanning, and spraying passes",
  winger: "beating defenders 1v1 and delivering final balls",
  striker: "movement off the ball and finishing",
  forward: "movement off the ball and finishing",
};

export function positionFocus(position: string): string {
  const key = position.trim().toLowerCase();
  return POSITION_FOCUS[key] ?? "your role on the pitch";
}

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Combines the focus text for each position, deduping shared focus areas (e.g. Centre Back and Defender). */
export function combinedPositionFocus(positions: string[]): string {
  const focuses = Array.from(new Set(positions.map((p) => positionFocus(p))));
  return joinWithAnd(focuses);
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
  /** Short label for which requested area this drill addresses, e.g. "Long passing". */
  area: string | null;
  /** Legacy freeform writeup, only present on drills generated before the structured format. */
  description: string | null;
  setup: string | null;
  steps: string[] | null;
  setsReps: string | null;
  rest: string | null;
  focus: string | null;
  benefit: string | null;
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
  area: string | null;
  setup: string | null;
  steps: string[] | null;
  setsReps: string | null;
  rest: string | null;
  focus: string | null;
  benefit: string | null;
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
  positions: string[],
  trainingContext: TrainingContext | null,
  history: ConversationTurn[] = [],
  onUpdate?: (snapshot: FeedbackBreakdown) => void,
): Promise<FeedbackBreakdown> {
  const response = await fetch("/api/drill-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback, positions, trainingContext, history }),
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
                area: drill.area,
                description: null,
                setup: drill.setup,
                steps: drill.steps,
                setsReps: drill.setsReps,
                rest: drill.rest,
                focus: drill.focus,
                benefit: drill.benefit,
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

export function acknowledgePosition(positions: string[]): string {
  return `Got it, you play ${joinWithAnd(positions)}. Before we get into drills, let's set up your training session.`;
}

export function greetingForPositions(positions: string[]): string {
  if (positions.length === 0) {
    return "Hi! I'm your Athlete Helper AI coach for soccer players. Tell me what you'd like to work on — describe what you feel weak at, paste feedback your coach gave you, or ask about a specific skill — and I'll build you a drill plan.";
  }
  const roles = joinWithAnd(positions);
  const focus = combinedPositionFocus(positions);
  return `Hi! I'm your Athlete Helper AI coach for soccer players. As a ${roles}, a good focus area is ${focus}. Tell me what you'd like to work on — describe what you feel weak at, paste feedback your coach gave you, or ask about a couple of different areas at once.`;
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
  return "Got it. What would you like to work on? Share your own goals, coach feedback, or a couple of different areas at once — I'll build you drills for each.";
}
