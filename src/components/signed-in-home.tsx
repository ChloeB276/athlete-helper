import Link from "next/link";
import { redirect } from "next/navigation";
import { EquipmentEditor } from "~/components/equipment-editor";
import { HelpWidget } from "~/components/help-widget";
import { PlanCard } from "~/components/plan-card";
import { TodayChecklist } from "~/components/plan-step-list";
import { Badge } from "~/components/ui/badge";
import type { PlanContext } from "~/lib/plan";
import { getSessionPlanData } from "~/lib/session-plan-data";
import { createClient } from "~/lib/supabase/server";
import { cn } from "~/lib/utils";

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function DrillRow({
  chat,
}: {
  chat: { id: string; title: string; drillCount: number; updatedAt: string };
}) {
  return (
    <Link
      href={`/drill-qa?chat=${chat.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <span className="truncate font-medium">{chat.title}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {chat.drillCount > 0
          ? `${chat.drillCount} drill${chat.drillCount === 1 ? "" : "s"}`
          : "No drills yet"}
        {" · "}
        {formatRelativeDate(chat.updatedAt)}
      </span>
    </Link>
  );
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

export async function SignedInHome({ plan }: { plan: PlanContext }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getSessionPlanData(user.id);
  const ungroupedChats = data.chats.filter((chat) => chat.folderId === null);
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
          className="flex w-fit items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-soft transition hover:scale-105 hover:bg-brand/90"
        >
          + Start New Drill
        </Link>

        {data.plan && data.plan.drills.length > 0 ? (
          <div className="rounded-3xl bg-card p-6 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold">Today</h2>
            <TodayChecklist drills={data.plan.drills} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl bg-card p-6 shadow-soft">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Drills</h2>
                <Link
                  href="/drill-qa"
                  className="text-xs font-medium text-brand hover:underline"
                >
                  View all →
                </Link>
              </div>
              {ungroupedChats.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {ungroupedChats.slice(0, 5).map((chat) => (
                    <DrillRow key={chat.id} chat={chat} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You haven't generated any drills yet. Start a new drill to get
                  going.
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-card p-6 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold">Folders</h2>
              {data.folders.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.folders.map((folder) => {
                    const folderChats = data.chats.filter(
                      (chat) => chat.folderId === folder.id,
                    );
                    return (
                      <div key={folder.id}>
                        <p className="mb-1 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          {folder.name}
                        </p>
                        {folderChats.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {folderChats.map((chat) => (
                              <DrillRow key={chat.id} chat={chat} />
                            ))}
                          </div>
                        ) : (
                          <p className="px-3 text-xs text-muted-foreground/70">
                            Empty
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No folders yet.</p>
              )}
            </div>
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

        <PlanCard plan={plan} title="Plan" />
      </div>

      <HelpWidget />
    </div>
  );
}
