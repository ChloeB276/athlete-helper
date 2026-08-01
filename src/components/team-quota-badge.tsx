import { cn } from "~/lib/utils";

export function TeamQuotaBadge({
  used,
  max,
}: {
  used: number;
  max: number | null;
}) {
  if (max === null) {
    return (
      <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        {used} {used === 1 ? "team" : "teams"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
        used >= max
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
      )}
    >
      {used}/{max} teams
    </span>
  );
}
