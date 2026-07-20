import { redirect } from "next/navigation";
import { HelpWidget } from "~/components/help-widget";
import { PasteNotesForm } from "~/components/paste-notes-form";
import { PlanStepList, TodayChecklist } from "~/components/plan-step-list";
import { getSessionPlanData } from "~/lib/session-plan-data";
import { EQUIPMENT_OPTIONS } from "~/lib/soccer-feedback";
import { createClient } from "~/lib/supabase/server";
import { cn } from "~/lib/utils";

function equipmentLabel(equipment: string[]): string {
  if (equipment.length === 0) return "None set";
  return equipment
    .map(
      (value) =>
        EQUIPMENT_OPTIONS.find((option) => option.value === value)?.label ??
        value,
    )
    .join(", ");
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

        <PasteNotesForm />

        {data.plan ? (
          <>
            <div className="rounded-3xl bg-card p-6 shadow-soft">
              <h2 className="mb-2 text-sm font-semibold text-brand">
                Core Development Focus
              </h2>
              <p className="text-sm text-muted-foreground">{data.plan.intro}</p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                Home Workout Plan
              </h2>
              <PlanStepList drills={data.plan.drills} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
            <p className="text-muted-foreground">
              You haven't generated a plan yet. Paste some coach notes above to
              get started.
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
              label="Equipment"
              value={equipmentLabel(data.equipment)}
            />
            <SummaryRow
              label="Streak"
              value={`${data.streak}-day streak`}
              highlight
            />
          </dl>
        </div>

        {data.plan && data.plan.drills.length > 0 && (
          <div className="rounded-3xl bg-card p-6 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold">Today</h2>
            <TodayChecklist drills={data.plan.drills} />
          </div>
        )}
      </div>

      <HelpWidget />
    </div>
  );
}
