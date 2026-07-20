"use client";

import { useActionState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { renameTeam, type TeamActionState } from "~/lib/team-actions";

const INITIAL_STATE: TeamActionState = {};

export function RenameTeamForm({
  teamId,
  currentName,
}: {
  teamId: string;
  currentName: string;
}) {
  const [state, formAction, pending] = useActionState(
    renameTeam.bind(null, teamId),
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Input
        name="name"
        defaultValue={currentName}
        required
        className="max-w-xs text-lg font-bold"
      />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
