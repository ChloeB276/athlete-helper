import Link from "next/link";
import { createClient } from "~/lib/supabase/server";

export async function CoachHome({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("coach_id", userId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-a/60 via-card to-accent-b/50 p-8 shadow-soft sm:p-10">
        <span className="text-sm font-semibold text-brand">
          Coach Dashboard
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Manage your rosters and send players feedback after practice or games.
        </p>
        <Link
          href="/coach/teams"
          className="mt-5 inline-flex w-fit rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-105"
        >
          {teams && teams.length > 0
            ? "Manage Teams"
            : "Create Your First Team"}
        </Link>
      </div>

      {teams && teams.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Your Teams</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/coach/teams/${team.id}`}
                className="flex flex-col gap-1 rounded-3xl bg-card p-6 shadow-soft transition-transform hover:-translate-y-0.5"
              >
                <span className="truncate text-sm font-semibold">
                  {team.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
