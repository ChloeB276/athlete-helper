"use client";

import { useState } from "react";
import { HELP_WELCOME } from "~/lib/help-assistant";
import { cn } from "~/lib/utils";

interface HelpMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: HelpMessage[] = [
  { id: "welcome", role: "assistant", content: HELP_WELCOME },
];

export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<HelpMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: HelpMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data: { answer?: string; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Help request failed");
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer ?? "",
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Sorry, I couldn't reach the help assistant just now. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-bold tracking-wide uppercase">
              Help
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close help chat"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line",
                    message.role === "user"
                      ? "bg-muted text-foreground"
                      : "text-foreground",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              placeholder={sending ? "Thinking..." : "Ask a question..."}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={sending}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
            >
              →
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close help chat" : "Open help chat"}
        aria-expanded={open}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-xl font-bold text-brand-foreground shadow-lg transition-transform hover:scale-105"
      >
        ?
      </button>
    </div>
  );
}
