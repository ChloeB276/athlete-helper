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

function buildDrills(feedback: string, position: string): Drill[] {
  const templates: Array<{
    difficulty: DrillDifficulty;
    title: string;
    description: string;
  }> = [
    {
      difficulty: "Beginner",
      title: `Walk-Through Reps: ${feedback}`,
      description: `Start at about half pace with no pressure at all. Isolate the exact movement behind "${feedback}" and repeat it slowly enough to focus purely on technique. 3 sets of 8 reps, resetting your starting position each rep. The goal isn't speed — it's grooving the correct pattern so it becomes automatic before you add pressure.`,
    },
    {
      difficulty: "Intermediate",
      title: `Pressure Reps: ${positionFocus(position)}`,
      description: `Add a passive defender, a rebound wall, or a partner feeding you balls, and work at about 75% pace. 4 sets of 6 reps, keeping the technique from the walk-through stage while a second variable (a body, a bounce, a pass) forces you to adjust. This bridges the gap between "I can do it alone" and "I can do it in a game."`,
    },
    {
      difficulty: "Advanced",
      title: `Small-Sided Application: ${position}`,
      description: `Bring it into a 3v3 or 4v4 small-sided game with a rule that forces you to use the skill — for example, a goal only counts if it comes off the technique you're working on. Play 4 rounds of 4 minutes with 1 minute of rest between rounds. This trains you to recognize the moment to use the skill without having to think about it.`,
    },
    {
      difficulty: "Elite",
      title: `Match-Speed Pressure: ${feedback}`,
      description: `Run this at full match intensity with live opposition and a shot clock, ideally once you're already a little fatigued (e.g. after a conditioning block). 5 sets of 90 seconds at game speed, with a coach or teammate calling out random cues to simulate real decision-making. This is where the habit gets tested under the exact conditions it needs to hold up in — a real match.`,
    },
  ];

  return templates.map((template, index) => ({
    id: crypto.randomUUID(),
    difficulty: template.difficulty,
    title: template.title,
    description: template.description,
    imageUrl: pickImage(index),
    videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${position} ${template.title} soccer drill`,
    )}`,
    kept: false,
  }));
}

export function breakdownFeedback(
  feedback: string,
  position: string,
): FeedbackBreakdown {
  const focus = positionFocus(position);
  const drills = buildDrills(feedback, position);

  return {
    intro: `Here's a breakdown of that feedback for a ${position}:\n\n"${feedback}" usually points to a gap in ${focus}. Small technical habits like this get exposed under match speed and pressure — especially in the moments that decide games. Here are ${drills.length} drills to fix it, ordered from easiest to hardest so you can build up:`,
    drills,
    outro:
      "Hit the check to keep a drill or the ✕ to drop it — keep whichever fit your training time. Let me know if you want to go deeper on any of them, or share more feedback to break down.",
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
