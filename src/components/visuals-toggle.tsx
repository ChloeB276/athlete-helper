import { cn } from "~/lib/utils";

export function VisualsToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs font-bold tracking-wide uppercase transition-colors",
        enabled
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {enabled ? "Visuals On" : "Show Visuals"}
    </button>
  );
}
