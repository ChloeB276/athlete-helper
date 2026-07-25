import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addOwnAttendanceDate,
  setOwnAttendance,
} from "~/lib/attendance-actions";
import { createClient } from "~/lib/supabase/server";
import { cn } from "~/lib/utils";

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export default async function PlayerAttendancePage({
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

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(name)")
    .eq("team_id", teamId)
    .eq("player_id", user.id)
    .single();

  if (!membership) {
    redirect("/attendance");
  }

  const teamName =
    (membership.teams as unknown as { name: string } | null)?.name ?? "Team";

  const { data: attendance } = await supabase
    .from("attendance")
    .select("date, present")
    .eq("team_id", teamId)
    .eq("player_id", user.id)
    .order("date", { ascending: false });

  const rows = attendance ?? [];
  const hasToday = rows.some(
    (row) => row.date === new Date().toISOString().slice(0, 10),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/attendance" className="text-sm text-muted-foreground">
          ← All teams
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{teamName}</h1>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Your attendance
          </h2>
          {!hasToday && (
            <form action={addOwnAttendanceDate.bind(null, teamId)}>
              <button
                type="submit"
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-transform hover:scale-105"
              >
                + Add Today
              </button>
            </form>
          )}
        </div>

        {rows.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-3xl bg-card p-4 shadow-soft">
            {rows.map((row) => (
              <div
                key={row.date}
                className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2"
              >
                <span className="text-sm font-medium">
                  {formatDate(row.date)}
                </span>
                <div className="flex items-center gap-1">
                  <form
                    action={setOwnAttendance.bind(null, teamId, row.date, true)}
                  >
                    <button
                      type="submit"
                      aria-label="Mark present"
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                        row.present
                          ? "bg-brand text-brand-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent",
                      )}
                    >
                      ✓
                    </button>
                  </form>
                  <form
                    action={setOwnAttendance.bind(
                      null,
                      teamId,
                      row.date,
                      false,
                    )}
                  >
                    <button
                      type="submit"
                      aria-label="Mark absent"
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                        row.present === false
                          ? "bg-destructive text-white"
                          : "bg-muted text-muted-foreground hover:bg-accent",
                      )}
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
            <p className="text-muted-foreground">
              No attendance recorded yet. Click "+ Add Today" to start.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
