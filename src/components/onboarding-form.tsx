"use client";

import { useActionState } from "react";
import { Button } from "~/components/ui/button";
import { FEET, type Foot, POSITIONS } from "~/lib/onboarding";
import {
  completeOnboarding,
  type OnboardingActionState,
} from "~/lib/onboarding-actions";

const INITIAL_STATE: OnboardingActionState = {};

const POSITION_EMOJI: Record<(typeof POSITIONS)[number], string> = {
  Goalie: "🧤",
  Fullback: "🏃",
  "Centre Back": "🛡️",
  "Defensive Mid": "🧠",
  "Attacking Mid": "🎯",
  Winger: "💨",
  Striker: "🔥",
};

const FOOT_LABEL: Record<Foot, string> = { left: "Left", right: "Right" };
const FOOT_EMOJI: Record<Foot, string> = { left: "🦵⬅️", right: "➡️🦵" };

const pillClasses =
  "flex items-center gap-1.5 cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground hover:border-foreground";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold">Where do you play? 🏟️</span>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((position) => (
            <label key={position}>
              <input
                type="checkbox"
                name="positions"
                value={position}
                className="peer sr-only"
              />
              <span className={pillClasses}>
                <span aria-hidden="true">{POSITION_EMOJI[position]}</span>
                {position}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold">Strong foot 🎯</span>
        <div className="flex gap-2">
          {FEET.map((foot) => (
            <label key={foot}>
              <input
                type="radio"
                name="strongFoot"
                value={foot}
                required
                className="peer sr-only"
              />
              <span className={pillClasses}>
                <span aria-hidden="true">{FOOT_EMOJI[foot]}</span>
                {FOOT_LABEL[foot]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : "Let's go! 🚀"}
      </Button>
    </form>
  );
}
