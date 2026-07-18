import Link from "next/link";
import { redirect } from "next/navigation";
import { InviteForm } from "~/components/invite-form";
import { createClient } from "~/lib/supabase/server";
import { removeFromRoster } from "~/lib/team-actions";

export default async function CoachTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .eq("coach_id", user.id)
    .single();

  if (!team) {
    redirect("/coach/teams");
  }

  const { data: roster } = await supabase
    .from("team_members")
    .select("player_id, joined_at, profiles(email)")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/coach/teams" className="text-sm text-muted-foreground">
          ← All teams
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
      </div>

      <div className="rounded-3xl bg-card p-6 shadow-soft">
        <h2 className="mb-3 text-sm font-semibold">Invite a player</h2>
        <InviteForm teamId={team.id} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Roster</h2>
        {roster && roster.length > 0 ? (
          <div className="flex flex-col gap-2">
            {roster.map((member) => {
              const email =
                (member.profiles as unknown as { email: string } | null)
                  ?.email ?? "Unknown";
              return (
                <div
                  key={member.player_id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-soft"
                >
                  <span className="truncate text-sm font-medium">{email}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/coach/teams/${team.id}/players/${member.player_id}/feedback/new`}
                      className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-transform hover:scale-105"
                    >
                      Give Feedback
                    </Link>
                    <form
                      action={removeFromRoster.bind(
                        null,
                        team.id,
                        member.player_id,
                      )}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
            <p className="text-muted-foreground">
              No players on this roster yet. Invite one above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
