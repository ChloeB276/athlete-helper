"use client";

import { useEffect, useState } from "react";

interface Drill {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: number;
}

const STORAGE_KEY = "lumos-drills";

const TEXT_COLOR_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
];

function loadDrills(): Drill[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Drill[]) : [];
  } catch {
    return [];
  }
}

function saveDrills(drills: Drill[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drills));
}

export default function DrillsPage() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    setDrills(loadDrills());
  }, []);

  const selected = drills.find((d) => d.id === selectedId) ?? null;

  function selectDrill(drill: Drill) {
    setSelectedId(drill.id);
    setTitle(drill.title);
    setContent(drill.content);
    setColor(drill.color ?? "");
  }

  function createDrill() {
    const drill: Drill = {
      id: crypto.randomUUID(),
      title: "Untitled",
      content: "",
      color: "",
      updatedAt: Date.now(),
    };
    setDrills((prev) => {
      const next = [drill, ...prev];
      saveDrills(next);
      return next;
    });
    selectDrill(drill);
  }

  function updateDrill(overrideColor?: string) {
    if (!selectedId) return;
    const nextColor = overrideColor ?? color;
    setDrills((prev) => {
      const next = prev.map((d) =>
        d.id === selectedId
          ? { ...d, title, content, color: nextColor, updatedAt: Date.now() }
          : d,
      );
      saveDrills(next);
      return next;
    });
  }

  function selectColor(newColor: string) {
    setColor(newColor);
    updateDrill(newColor);
  }

  function deleteDrill() {
    if (!selectedId) return;
    setDrills((prev) => {
      const next = prev.filter((d) => d.id !== selectedId);
      saveDrills(next);
      return next;
    });
    setSelectedId(null);
    setTitle("");
    setContent("");
    setColor("");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Drills</h1>
        <button
          type="button"
          onClick={createDrill}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          New Drill
        </button>
      </div>

      <div className="grid flex-1 grid-cols-[240px_1fr] gap-4 overflow-hidden rounded-lg border border-border">
        {/* Sidebar */}
        <div className="flex flex-col gap-1 overflow-y-auto border-r border-border p-2">
          {drills.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              No drills yet. Create one to get started.
            </p>
          )}
          {drills.map((drill) => (
            <button
              type="button"
              key={drill.id}
              onClick={() => selectDrill(drill)}
              className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                drill.id === selectedId
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <span className="block truncate font-medium">{drill.title}</span>
              <span className="block truncate text-xs opacity-60">
                {new Date(drill.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex flex-col gap-3 p-4">
          {selected ? (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => updateDrill()}
                placeholder="Drill title"
                className="bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-2">
                {TEXT_COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => selectColor(option.value)}
                    title={option.label}
                    aria-label={`Set text color to ${option.label}`}
                    className={`h-5 w-5 rounded-full border transition-transform ${
                      color === option.value
                        ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
                        : "border-border hover:scale-110"
                    } ${option.value === "" ? "bg-foreground" : ""}`}
                    style={
                      option.value
                        ? { backgroundColor: option.value }
                        : undefined
                    }
                  />
                ))}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={() => updateDrill()}
                placeholder="Start writing..."
                style={color ? { color } : undefined}
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={deleteDrill}
                  className="rounded-md px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a drill or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
