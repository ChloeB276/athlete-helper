"use client";

import { useState } from "react";
import { updateEquipment } from "~/lib/home-actions";
import { EQUIPMENT_OPTIONS, type Equipment } from "~/lib/soccer-feedback";
import { cn } from "~/lib/utils";

export function EquipmentEditor({ equipment }: { equipment: Equipment[] }) {
  const [selected, setSelected] = useState<Set<Equipment>>(new Set(equipment));

  function toggle(value: Equipment) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  return (
    <form action={updateEquipment} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {EQUIPMENT_OPTIONS.map((option) => {
          const active = selected.has(option.value);
          return (
            <label key={option.value}>
              <input
                type="checkbox"
                name="equipment"
                value={option.value}
                checked={active}
                onChange={() => toggle(option.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  "cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      <button
        type="submit"
        className="self-start rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
      >
        Save
      </button>
    </form>
  );
}
