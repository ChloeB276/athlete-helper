"use client";

import { useActionState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createTeam, type TeamActionState } from "~/lib/team-actions";

const INITIAL_STATE: TeamActionState = {};

export function CreateTeamForm() {
  const [state, formAction, pending] = useActionState(
    createTeam,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
      <Input
        name="name"
        placeholder="Team name (e.g. U14 Strikers)"
        required
        className="sm:flex-1"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create Team"}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
