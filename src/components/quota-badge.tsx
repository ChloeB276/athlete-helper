import { cn } from "~/lib/utils";

export function QuotaBadge({
  remaining,
  max,
  windowLabel,
}: {
  remaining: number;
  max: number;
  windowLabel: "month" | "week";
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
        remaining <= 0
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
      )}
    >
      {remaining}/{max} drills left this {windowLabel}
    </span>
  );
}
