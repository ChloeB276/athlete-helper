"use client";

import { useActionState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  type FeedbackActionState,
  submitFeedback,
} from "~/lib/feedback-actions";

const INITIAL_STATE: FeedbackActionState = {};

export function FeedbackForm({
  teamId,
  playerId,
}: {
  teamId: string;
  playerId: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitFeedback,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="playerId" value={playerId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="coachText">What did you see? 📝</Label>
        <textarea
          id="coachText"
          name="coachText"
          required
          rows={5}
          placeholder="e.g. Great effort tracking back today, but you're losing your marker at set pieces..."
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-border/60 p-4">
        <input
          type="checkbox"
          name="aiBreakdown"
          className="mt-1 size-4 shrink-0"
        />
        <span className="flex flex-col gap-1">
          <span className="text-sm font-semibold">AI breakdown</span>
          <span className="text-xs text-muted-foreground">
            Have the AI expand your note in more detail for the player. Either
            way, they'll get next steps and drills based on what you wrote.
          </span>
        </span>
      </label>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Generating..." : "Send Feedback"}
      </Button>
    </form>
  );
}
