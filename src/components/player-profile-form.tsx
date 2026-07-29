"use client";

import { useActionState } from "react";
import { Button } from "~/components/ui/button";
import { FEET, type Foot, POSITIONS } from "~/lib/onboarding";
import {
  type TeamActionState,
  updateRosterPlayerProfile,
} from "~/lib/team-actions";

const INITIAL_STATE: TeamActionState = {};

const FOOT_LABEL: Record<Foot, string> = { left: "Left", right: "Right" };

const pillClasses =
  "flex items-center gap-1.5 cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground hover:border-foreground";

export function PlayerProfileForm({
  teamId,
  playerId,
  positions,
  strongFoot,
}: {
  teamId: string;
  playerId: string;
  positions: string[];
  strongFoot: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateRosterPlayerProfile.bind(null, teamId, playerId),
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold">Positions</span>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((position) => (
            <label key={position}>
              <input
                type="checkbox"
                name="positions"
                value={position}
                defaultChecked={positions.includes(position)}
                className="peer sr-only"
              />
              <span className={pillClasses}>{position}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold">Strong foot</span>
        <div className="flex gap-2">
          {FEET.map((foot) => (
            <label key={foot}>
              <input
                type="radio"
                name="strongFoot"
                value={foot}
                defaultChecked={strongFoot === foot}
                className="peer sr-only"
              />
              <span className={pillClasses}>{FOOT_LABEL[foot]}</span>
            </label>
          ))}
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-brand">{state.success}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
