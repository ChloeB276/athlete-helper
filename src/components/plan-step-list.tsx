import { setDrillKept } from "~/lib/drill-actions";
import type { Drill } from "~/lib/soccer-feedback";
import { cn } from "~/lib/utils";

// Presentational only — the AI output doesn't include a duration per drill,
// so this is a fixed estimate per difficulty tier, not generated data.
const DURATION_MINUTES: Record<string, number> = {
  Beginner: 8,
  Intermediate: 12,
  Advanced: 10,
  Elite: 15,
};

function DoneToggle({ drill }: { drill: Drill }) {
  return (
    <form action={setDrillKept.bind(null, drill.id, !drill.kept)}>
      <button
        type="submit"
        aria-label={drill.kept ? "Mark as not done" : "Mark as done"}
        aria-pressed={drill.kept}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs transition-colors",
          drill.kept
            ? "border-brand bg-brand text-brand-foreground"
            : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
        )}
      >
        ✓
      </button>
    </form>
  );
}

export function PlanStepList({ drills }: { drills: Drill[] }) {
  return (
    <div className="flex flex-col gap-3">
      {drills.map((drill, index) => (
        <div
          key={drill.id}
          className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{drill.title}</h3>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {DURATION_MINUTES[drill.difficulty] ?? 10} min
              </span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                {drill.difficulty}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{drill.description}</p>
          </div>
          <DoneToggle drill={drill} />
        </div>
      ))}
    </div>
  );
}

export function TodayChecklist({ drills }: { drills: Drill[] }) {
  return (
    <div className="flex flex-col gap-2">
      {drills.map((drill) => (
        <div key={drill.id} className="flex items-center gap-2">
          <DoneToggle drill={drill} />
          <span
            className={cn(
              "truncate text-sm",
              drill.kept
                ? "text-muted-foreground line-through"
                : "text-foreground",
            )}
          >
            {drill.title}
          </span>
        </div>
      ))}
    </div>
  );
}
