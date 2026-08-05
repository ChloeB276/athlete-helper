"use client";

import { useState, useTransition } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { updateFeedbackDrills } from "~/lib/feedback-actions";
import type { FeedbackBreakdown } from "~/lib/feedback-breakdown";
import { cn } from "~/lib/utils";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Elite"] as const;

type Drill = FeedbackBreakdown["drills"][number];

export function FeedbackDrillsEditor({
  feedbackId,
  drills,
}: {
  feedbackId: string;
  drills: Drill[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Drill[]>(drills);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEditing() {
    setDraft(drills.map((drill) => ({ ...drill })));
    setError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setError(null);
  }

  function updateDrill(index: number, patch: Partial<Drill>) {
    setDraft((prev) =>
      prev.map((drill, i) => (i === index ? { ...drill, ...patch } : drill)),
    );
  }

  function save() {
    startTransition(async () => {
      const result = await updateFeedbackDrills(feedbackId, draft);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
    });
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">Drills</span>
          <Button variant="ghost" size="xs" onClick={startEditing}>
            Edit
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {drills.map((drill, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: drills have no stable id
              key={i}
              className="flex flex-col gap-1 rounded-2xl bg-accent-b/15 p-4"
            >
              <span className="w-fit rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                {drill.difficulty}
              </span>
              <span className="text-sm font-semibold">{drill.title}</span>
              <span className="text-xs text-muted-foreground">
                {drill.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold">Drills</span>
      <div className="grid gap-3 sm:grid-cols-2">
        {draft.map((drill, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: drills have no stable id
            key={i}
            className="flex flex-col gap-2 rounded-2xl bg-accent-b/15 p-4"
          >
            <select
              value={drill.difficulty}
              onChange={(e) =>
                updateDrill(i, {
                  difficulty: e.target.value as Drill["difficulty"],
                })
              }
              className={cn(
                "h-8 w-fit rounded-full border border-input bg-transparent px-2.5 text-[11px] font-medium text-brand outline-none",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              )}
            >
              {DIFFICULTIES.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
            <Input
              value={drill.title}
              onChange={(e) => updateDrill(i, { title: e.target.value })}
              placeholder="Drill title"
              className="text-sm font-semibold"
            />
            <textarea
              value={drill.description}
              onChange={(e) => updateDrill(i, { description: e.target.value })}
              placeholder="Drill description"
              rows={3}
              className={cn(
                "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-xs text-muted-foreground shadow-xs outline-none",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              )}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={cancelEditing}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
