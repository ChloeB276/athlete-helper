import Image from "next/image";
import type { Drill } from "~/lib/soccer-feedback";
import { cn } from "~/lib/utils";

export function DrillCard({
  drill,
  showVisuals,
  onToggleKeep,
  onDelete,
}: {
  drill: Drill;
  showVisuals: boolean;
  onToggleKeep: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-4 transition-colors",
        drill.kept ? "border-brand bg-brand/5" : "border-border bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold tracking-widest text-brand uppercase">
            {drill.difficulty}
          </span>
          <h3 className="text-sm font-bold text-foreground">{drill.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleKeep}
            aria-label={drill.kept ? "Marked as kept" : "Keep this drill"}
            aria-pressed={drill.kept}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full border text-xs transition-colors",
              drill.kept
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            ✓
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete this drill"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            ✕
          </button>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {drill.description}
      </p>
      {showVisuals && (
        <div className="mt-1 flex items-center gap-3">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={drill.imageUrl}
              alt={drill.title}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <a
            href={drill.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-brand hover:underline"
          >
            ▶ Watch a video example
          </a>
        </div>
      )}
    </div>
  );
}
