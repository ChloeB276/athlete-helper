"use client";

import { useEffect, useState } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: number;
}

const STORAGE_KEY = "lumos-notes";

const TEXT_COLOR_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
];

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  function selectNote(note: Note) {
    setSelectedId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color ?? "");
  }

  function createNote() {
    const note: Note = {
      id: crypto.randomUUID(),
      title: "Untitled",
      content: "",
      color: "",
      updatedAt: Date.now(),
    };
    setNotes((prev) => {
      const next = [note, ...prev];
      saveNotes(next);
      return next;
    });
    selectNote(note);
  }

  function updateNote(overrideColor?: string) {
    if (!selectedId) return;
    const nextColor = overrideColor ?? color;
    setNotes((prev) => {
      const next = prev.map((n) =>
        n.id === selectedId
          ? { ...n, title, content, color: nextColor, updatedAt: Date.now() }
          : n,
      );
      saveNotes(next);
      return next;
    });
  }

  function selectColor(newColor: string) {
    setColor(newColor);
    updateNote(newColor);
  }

  function deleteNote() {
    if (!selectedId) return;
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== selectedId);
      saveNotes(next);
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
        <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
        <button
          type="button"
          onClick={createNote}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          New Note
        </button>
      </div>

      <div className="grid flex-1 grid-cols-[240px_1fr] gap-4 overflow-hidden rounded-lg border border-border">
        {/* Sidebar */}
        <div className="flex flex-col gap-1 overflow-y-auto border-r border-border p-2">
          {notes.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              No notes yet. Create one to get started.
            </p>
          )}
          {notes.map((note) => (
            <button
              type="button"
              key={note.id}
              onClick={() => selectNote(note)}
              className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                note.id === selectedId
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <span className="block truncate font-medium">{note.title}</span>
              <span className="block truncate text-xs opacity-60">
                {new Date(note.updatedAt).toLocaleDateString()}
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
                onBlur={() => updateNote()}
                placeholder="Note title"
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
                onBlur={() => updateNote()}
                placeholder="Start writing..."
                style={color ? { color } : undefined}
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={deleteNote}
                  className="rounded-md px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a note or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
