import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";

export default async function CoachAttendancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Pick a team to jump straight to its attendance grid.
        </p>
      </div>

      {teams && teams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/coach/teams/${team.id}#attendance`}
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
            You haven't created a team yet.
          </p>
        </div>
      )}
    </div>
  );
}
