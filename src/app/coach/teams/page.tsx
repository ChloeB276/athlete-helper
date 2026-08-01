import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateTeamForm } from "~/components/create-team-form";
import { DeleteTeamButton } from "~/components/delete-team-button";
import { TeamQuotaBadge } from "~/components/team-quota-badge";
import { getPlanContext } from "~/lib/plan";
import { FREE_TEAM_LIMIT } from "~/lib/quota";
import { createClient } from "~/lib/supabase/server";

export default async function CoachTeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coach") {
    redirect("/");
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, created_at")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const plan = await getPlanContext(supabase, user.id);
  const teamCount = teams?.length ?? 0;
  const teamMax = plan.isSubscribed ? null : FREE_TEAM_LIMIT;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
          <TeamQuotaBadge used={teamCount} max={teamMax} />
        </div>
        <p className="text-muted-foreground">
          Create a team, invite players, and send them feedback after practice
          or games.
        </p>
      </div>

      <div className="rounded-3xl bg-card p-6 shadow-soft">
        <CreateTeamForm />
      </div>

      {teams && teams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex flex-col gap-3 rounded-3xl bg-card p-6 shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <Link href={`/coach/teams/${team.id}`}>
                <span className="truncate text-sm font-semibold">
                  {team.name}
                </span>
              </Link>
              <DeleteTeamButton teamId={team.id} teamName={team.name} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
          <p className="text-muted-foreground">
            You haven't created a team yet.
          </p>
        </div>
      )}
    </div>
  );
}
