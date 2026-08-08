"use client";

import { useState, useTransition } from "react";
import { toggleFeedbackDrillCompleted } from "~/lib/feedback-actions";
import type { FeedbackBreakdown } from "~/lib/feedback-breakdown";
import { cn } from "~/lib/utils";

type Drill = FeedbackBreakdown["drills"][number];

export function FeedbackDrillsChecklist({
  feedbackId,
  drills,
}: {
  feedbackId: string;
  drills: Drill[];
}) {
  const [completed, setCompleted] = useState<boolean[]>(
    drills.map((drill) => drill.completed === true),
  );
  const [, startTransition] = useTransition();

  function toggle(index: number) {
    const next = !completed[index];
    setCompleted((prev) => prev.map((v, i) => (i === index ? next : v)));
    startTransition(async () => {
      const result = await toggleFeedbackDrillCompleted(
        feedbackId,
        index,
        next,
      );
      if (result.error) {
        setCompleted((prev) => prev.map((v, i) => (i === index ? !next : v)));
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">Drills</span>
      <div className="grid gap-2 sm:grid-cols-2">
        {drills.map((drill, i) => (
          <label
            key={drill.title}
            className={cn(
              "flex cursor-pointer flex-col gap-1 rounded-2xl bg-accent-b/15 p-4 transition-colors",
              completed[i] && "opacity-60",
            )}
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={completed[i]}
                onChange={() => toggle(i)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-brand"
                aria-label={`Mark "${drill.title}" as done`}
              />
              <div className="flex flex-col gap-1">
                <span className="w-fit rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                  {drill.difficulty}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    completed[i] && "line-through",
                  )}
                >
                  {drill.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {drill.description}
                </span>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
