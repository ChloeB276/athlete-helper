"use client";

import { useState } from "react";
import {
  EQUIPMENT_OPTIONS,
  type Equipment,
  type TrainingContext,
} from "~/lib/soccer-feedback";
import { cn } from "~/lib/utils";

export function TrainingContextForm({
  onSubmit,
}: {
  onSubmit: (context: TrainingContext) => void;
}) {
  const [mode, setMode] = useState<"solo" | "group">("solo");
  const [friendCount, setFriendCount] = useState(1);
  const [equipment, setEquipment] = useState<Set<Equipment>>(new Set());

  function toggleEquipment(value: Equipment) {
    setEquipment((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function handleSubmit() {
    onSubmit({
      partners: mode === "solo" ? 0 : friendCount,
      equipment: [...equipment],
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Solo or with friends?
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("solo")}
            aria-pressed={mode === "solo"}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              mode === "solo"
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Solo
          </button>
          <button
            type="button"
            onClick={() => setMode("group")}
            aria-pressed={mode === "group"}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              mode === "group"
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            With friends
          </button>
          {mode === "group" && (
            <div className="flex items-center gap-2 pl-2">
              <button
                type="button"
                onClick={() => setFriendCount((n) => Math.max(1, n - 1))}
                aria-label="Decrease friend count"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-sm text-muted-foreground hover:text-foreground"
              >
                −
              </button>
              <span className="w-16 text-center text-sm font-semibold">
                {friendCount} friend{friendCount === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => setFriendCount((n) => Math.min(20, n + 1))}
                aria-label="Increase friend count"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-sm text-muted-foreground hover:text-foreground"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Available equipment
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {EQUIPMENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleEquipment(option.value)}
              aria-pressed={equipment.has(option.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                equipment.has(option.value)
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
          <span className="text-xs text-muted-foreground">
            {equipment.size === 0 && "(none selected = no equipment)"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="self-start rounded-full bg-brand px-6 py-2 text-sm font-bold tracking-wide text-brand-foreground uppercase transition-transform hover:scale-[1.02]"
      >
        Continue
      </button>
    </div>
  );
}
