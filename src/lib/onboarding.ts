export const POSITIONS = [
  "Goalie",
  "Fullback",
  "Centre Back",
  "Defensive Mid",
  "Attacking Mid",
  "Winger",
  "Striker",
] as const;

export const FEET = ["left", "right"] as const;
export type Foot = (typeof FEET)[number];

export const ROLES = ["coach", "player"] as const;
export type Role = (typeof ROLES)[number];
