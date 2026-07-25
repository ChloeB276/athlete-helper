"use client";

import { useActionState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { inviteToTeam, type TeamActionState } from "~/lib/team-actions";

const INITIAL_STATE: TeamActionState = {};

export function InviteForm({ teamId }: { teamId: string }) {
  const [state, formAction, pending] = useActionState(
    inviteToTeam,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
      <input type="hidden" name="teamId" value={teamId} />
      <Input
        name="email"
        type="email"
        placeholder="player@email.com"
        required
        className="sm:flex-1"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Inviting..." : "Invite Player"}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-muted-foreground">{state.success}</p>
      )}
    </form>
  );
}
