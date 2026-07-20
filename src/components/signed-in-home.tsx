import Link from "next/link";
import { redirect } from "next/navigation";
import { EquipmentEditor } from "~/components/equipment-editor";
import { HelpWidget } from "~/components/help-widget";
import { TodayChecklist } from "~/components/plan-step-list";
import { Badge } from "~/components/ui/badge";
import { getSessionPlanData } from "~/lib/session-plan-data";
import { createClient } from "~/lib/supabase/server";
import { cn } from "~/lib/utils";

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "truncate text-right font-medium",
          highlight && "text-brand",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export async function SignedInHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getSessionPlanData(user.id);
  const coachCue = data.coachCue
    ? data.coachCue.length > 100
      ? `${data.coachCue.slice(0, 100)}…`
      : data.coachCue
    : "No coach feedback yet";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Home</h1>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              data.plan
                ? "bg-brand/10 text-brand"
                : "bg-muted text-muted-foreground",
            )}
          >
            {data.plan ? "● Session ready" : "○ No plan yet"}
          </span>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Attendance</h2>
            <Link
              href="/attendance"
              className="text-xs font-medium text-brand hover:underline"
            >
              View all →
            </Link>
          </div>
          {data.recentAttendance.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.recentAttendance.map((row) => (
                <Badge
                  key={`${row.teamId}-${row.date}`}
                  variant={row.present ? "default" : "destructive"}
                >
                  {row.teamName} · {formatDate(row.date)} ·{" "}
                  {row.present ? "Present" : "Absent"}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No attendance recorded yet.
            </p>
          )}
        </div>

        <Link
          href="/drill-qa"
          className="flex w-fit items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-105"
        >
          + Start New Drill
        </Link>

        {data.plan && data.plan.drills.length > 0 ? (
          <div className="rounded-3xl bg-card p-6 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold">Today</h2>
            <TodayChecklist drills={data.plan.drills} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
            <p className="text-muted-foreground">
              You haven't generated a plan yet. Start a new drill to get going.
            </p>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
        <div className="rounded-3xl bg-card p-6 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold">Session summary</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <SummaryRow label="Athlete" value={data.email} />
            <SummaryRow label="Sport" value={data.sport} />
            <SummaryRow label="Coach cue" value={coachCue} />
            <SummaryRow
              label="Streak"
              value={`🔥 ${data.streak}-day streak`}
              highlight
            />
          </dl>
          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
            <span className="text-sm text-muted-foreground">Equipment</span>
            <EquipmentEditor equipment={data.equipment} />
          </div>
        </div>
      </div>

      <HelpWidget />
    </div>
  );
}
