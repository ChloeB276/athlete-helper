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

export function breakdownFeedback(feedback: string, position: string): string {
  const focus = positionFocus(position);
  return [
    `Here's a breakdown of that feedback for a ${position}:`,
    `• What your coach means: "${feedback}" — this usually points to a gap in ${focus}.`,
    "• Why it matters: small technical habits like this get exposed under match speed and pressure, especially in the moments that decide games.",
    `• Drill to fix it: 4 sets of 5 minutes of position-specific reps targeting "${feedback}", building from walk-through pace to full match speed.`,
    "Want to log this as a drill, or share more feedback to break down?",
  ].join("\n");
}

export const ASK_POSITION_PROMPT =
  "Hi! I'm your Athlete Helper AI coach for soccer players. What position do you play?";

export function acknowledgePosition(position: string): string {
  return `Got it, you play ${position}. Now tell me some feedback your coach gave you, and I'll break it down into a detailed drill plan.`;
}
