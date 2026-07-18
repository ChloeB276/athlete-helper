import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";

export default async function MyTeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, teams(name)")
    .eq("player_id", user.id)
    .order("joined_at", { ascending: true });

  const teams = (memberships ?? []).map((row) => ({
    id: row.team_id,
    name: (row.teams as unknown as { name: string } | null)?.name ?? "Team",
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
        <p className="text-muted-foreground">
          See feedback and attendance for each team you're on.
        </p>
      </div>

      {teams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="flex flex-col gap-1 rounded-3xl bg-card p-6 shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <span className="truncate text-sm font-semibold">
                {team.name}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
          <p className="text-muted-foreground">
            You're not on any team yet. Ask your coach for an invite.
          </p>
        </div>
      )}
    </div>
  );
}
