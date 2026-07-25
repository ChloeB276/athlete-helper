import { setDrillKept } from "~/lib/drill-actions";
import type { Drill } from "~/lib/soccer-feedback";
import { cn } from "~/lib/utils";

function KeepToggle({ drill }: { drill: Drill }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <form action={setDrillKept.bind(null, drill.id, true)}>
        <button
          type="submit"
          aria-label="Keep this drill"
          aria-pressed={drill.kept === true}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
            drill.kept === true
              ? "bg-brand text-brand-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent",
          )}
        >
          ✓
        </button>
      </form>
      <form action={setDrillKept.bind(null, drill.id, false)}>
        <button
          type="submit"
          aria-label="Discard this drill"
          aria-pressed={drill.kept === false}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
            drill.kept === false
              ? "bg-destructive text-white"
              : "bg-muted text-muted-foreground hover:bg-accent",
          )}
        >
          ✕
        </button>
      </form>
    </div>
  );
}

export function TodayChecklist({ drills }: { drills: Drill[] }) {
  return (
    <div className="flex flex-col gap-2">
      {drills.map((drill) => (
        <div key={drill.id} className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              drill.kept === false
                ? "text-muted-foreground line-through"
                : "text-foreground",
            )}
          >
            {drill.title}
          </span>
          <KeepToggle drill={drill} />
        </div>
      ))}
    </div>
  );
}
