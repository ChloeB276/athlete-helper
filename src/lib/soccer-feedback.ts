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

export interface Drill {
  id: string;
  difficulty: DrillDifficulty;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  kept: boolean;
}

export interface FeedbackBreakdown {
  intro: string;
  drills: Drill[];
  outro: string;
}

const DRILL_IMAGES = [
  "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e",
  "https://images.unsplash.com/photo-1574772135913-d519461c3996",
  "https://images.unsplash.com/photo-1626248801379-51a0748a5f96",
  "https://images.unsplash.com/photo-1624280157150-4d1ed8632989",
];

function pickImage(index: number): string {
  return DRILL_IMAGES[index % DRILL_IMAGES.length] ?? DRILL_IMAGES[0] ?? "";
}

interface GeneratedDrill {
  difficulty: DrillDifficulty;
  title: string;
  description: string;
}

export async function breakdownFeedback(
  feedback: string,
  position: string,
): Promise<FeedbackBreakdown> {
  const response = await fetch("/api/drill-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback, position }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate drill feedback");
  }

  const data: { intro: string; outro: string; drills: GeneratedDrill[] } =
    await response.json();

  return {
    intro: data.intro,
    outro: data.outro,
    drills: data.drills.map((drill, index) => ({
      id: crypto.randomUUID(),
      difficulty: drill.difficulty,
      title: drill.title,
      description: drill.description,
      imageUrl: pickImage(index),
      videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${position} ${drill.title} soccer drill`,
      )}`,
      kept: false,
    })),
  };
}

export const ASK_POSITION_PROMPT =
  "Hi! I'm your Athlete Helper AI coach for soccer players. What position do you play?";

export function acknowledgePosition(position: string): string {
  return `Got it, you play ${position}. Now tell me some feedback your coach gave you, and I'll break it down into a detailed drill plan.`;
}

export function greetingForPosition(position: string): string {
  return `Hi! I'm your Athlete Helper AI coach for soccer players. Tell me some feedback your coach gave you as a ${position}, and I'll break it down into a detailed drill plan.`;
}
