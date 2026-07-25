"use client";

import { deleteTeam } from "~/lib/team-actions";

export function DeleteTeamButton({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
}) {
  return (
    <form
      action={deleteTeam.bind(null, teamId)}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete "${teamName}"? This permanently removes its roster, attendance, and feedback.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
      >
        Delete
      </button>
    </form>
  );
}
