import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { createClient } from "~/lib/supabase/server";

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export async function CoachHome({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [{ data: teams }, { data: attendanceRows }, { data: folders }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name")
        .eq("coach_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("attendance")
        .select("date, present, teams!inner(name, coach_id)")
        .eq("teams.coach_id", userId)
        .order("date", { ascending: false })
        .limit(5),
      supabase
        .from("folders")
        .select("id, name, chats(id)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  const recentAttendance = (
    (attendanceRows ?? []) as unknown as Array<{
      date: string;
      present: boolean;
      teams: { name: string } | null;
    }>
  ).map((row) => ({
    date: row.date,
    present: row.present,
    teamName: row.teams?.name ?? "Team",
  }));

  const folderSummaries = (
    (folders ?? []) as unknown as Array<{
      id: string;
      name: string;
      chats: Array<{ id: string }>;
    }>
  ).map((folder) => ({
    id: folder.id,
    name: folder.name,
    chatCount: folder.chats.length,
  }));

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

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent Attendance
          </h2>
          <Link
            href="/coach/attendance"
            className="text-xs font-medium text-brand hover:underline"
          >
            View all →
          </Link>
        </div>
        {recentAttendance.length > 0 ? (
          <div className="flex flex-wrap gap-2 rounded-3xl bg-card p-6 shadow-soft">
            {recentAttendance.map((row, index) => (
              <Badge
                // biome-ignore lint/suspicious/noArrayIndexKey: rows aren't individually addressable (no id)
                key={index}
                variant={row.present ? "default" : "destructive"}
              >
                {row.teamName} · {formatDate(row.date)} ·{" "}
                {row.present ? "Present" : "Absent"}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
            <p className="text-muted-foreground">No attendance taken yet.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Saved Drill Folders
          </h2>
          <Link
            href="/coach/drills"
            className="text-xs font-medium text-brand hover:underline"
          >
            Open Drills →
          </Link>
        </div>
        {folderSummaries.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {folderSummaries.map((folder) => (
              <Link
                key={folder.id}
                href={`/coach/drills?folder=${folder.id}`}
                className="flex flex-col gap-1 rounded-3xl bg-card p-6 shadow-soft transition-transform hover:-translate-y-0.5"
              >
                <span className="truncate text-sm font-semibold">
                  {folder.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {folder.chatCount} chat{folder.chatCount === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
            <p className="text-muted-foreground">No drill folders saved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
