import Link from "next/link";
import { redirect } from "next/navigation";
import { InviteForm } from "~/components/invite-form";
import { RenameTeamForm } from "~/components/rename-team-form";
import {
  addAttendanceDate,
  addAttendanceDateRange,
  bulkSetAttendance,
  setAttendance,
} from "~/lib/attendance-actions";
import { createClient } from "~/lib/supabase/server";
import { removeFromRoster } from "~/lib/team-actions";
import { cn } from "~/lib/utils";

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

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

  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select("date, player_id, present")
    .eq("team_id", teamId)
    .order("date", { ascending: true });

  const dates = [...new Set((attendanceRows ?? []).map((row) => row.date))];
  const attendanceMap = new Map(
    (attendanceRows ?? []).map((row) => [
      `${row.date}|${row.player_id}`,
      row.present,
    ]),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/coach/teams" className="text-sm text-muted-foreground">
          ← All teams
        </Link>
        <RenameTeamForm teamId={team.id} currentName={team.name} />
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

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="attendance" className="text-lg font-semibold tracking-tight">
            Attendance
          </h2>
          {roster && roster.length > 0 && (
            <form action={addAttendanceDate.bind(null, team.id)}>
              <button
                type="submit"
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-transform hover:scale-105"
              >
                + Add Today
              </button>
            </form>
          )}
        </div>

        {roster && roster.length > 0 && (
          <form
            action={addAttendanceDateRange.bind(null, team.id)}
            className="flex flex-wrap items-end gap-4 rounded-3xl bg-card p-4 shadow-soft"
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor="startDate"
                className="text-xs text-muted-foreground"
              >
                Start date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="endDate"
                className="text-xs text-muted-foreground"
              >
                End date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                required
                className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
            <fieldset className="flex flex-col gap-1">
              <legend className="text-xs text-muted-foreground">
                Repeat on (optional)
              </legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <input
                      type="checkbox"
                      name="weekday"
                      value={day.value}
                      className="h-3.5 w-3.5 accent-brand"
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-transform hover:scale-105"
            >
              Add dates
            </button>
          </form>
        )}

        {!roster || roster.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
            <p className="text-muted-foreground">
              Invite players first to take attendance.
            </p>
          </div>
        ) : dates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
            <p className="text-muted-foreground">
              No attendance taken yet. Click "+ Add Today" to start.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-card p-4 shadow-soft">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-card px-3 py-2 text-left font-medium text-muted-foreground">
                    Player
                  </th>
                  {dates.map((date) => (
                    <th
                      key={date}
                      className="px-2 py-2 text-center font-medium whitespace-nowrap text-muted-foreground"
                    >
                      {formatDate(date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map((member) => {
                  const email =
                    (member.profiles as unknown as { email: string } | null)
                      ?.email ?? "Unknown";
                  return (
                    <tr
                      key={member.player_id}
                      className="border-t border-border/60"
                    >
                      <td className="sticky left-0 max-w-[10rem] bg-card px-3 py-3 text-left">
                        <div className="flex flex-col gap-1">
                          <span className="truncate">{email}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              Set all:
                            </span>
                            <form
                              action={bulkSetAttendance.bind(
                                null,
                                team.id,
                                member.player_id,
                                dates,
                                true,
                              )}
                            >
                              <button
                                type="submit"
                                aria-label="Mark present for all dates"
                                className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-brand hover:text-brand-foreground"
                              >
                                ✓
                              </button>
                            </form>
                            <form
                              action={bulkSetAttendance.bind(
                                null,
                                team.id,
                                member.player_id,
                                dates,
                                false,
                              )}
                            >
                              <button
                                type="submit"
                                aria-label="Mark absent for all dates"
                                className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
                              >
                                ✕
                              </button>
                            </form>
                          </div>
                        </div>
                      </td>
                      {dates.map((date) => {
                        const present = attendanceMap.get(
                          `${date}|${member.player_id}`,
                        );
                        return (
                          <td key={date} className="px-2 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <form
                                action={setAttendance.bind(
                                  null,
                                  team.id,
                                  member.player_id,
                                  date,
                                  true,
                                )}
                              >
                                <button
                                  type="submit"
                                  aria-label="Mark present"
                                  className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                                    present === true
                                      ? "bg-brand text-brand-foreground"
                                      : "bg-muted text-muted-foreground hover:bg-accent",
                                  )}
                                >
                                  ✓
                                </button>
                              </form>
                              <form
                                action={setAttendance.bind(
                                  null,
                                  team.id,
                                  member.player_id,
                                  date,
                                  false,
                                )}
                              >
                                <button
                                  type="submit"
                                  aria-label="Mark absent"
                                  className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                                    present === false
                                      ? "bg-destructive text-white"
                                      : "bg-muted text-muted-foreground hover:bg-accent",
                                  )}
                                >
                                  ✕
                                </button>
                              </form>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
