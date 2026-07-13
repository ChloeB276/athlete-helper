"use client";

import { useRef, useState } from "react";
import { DrillCard } from "~/components/drill-card";
import { QnaHint } from "~/components/qna-hint";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { VisualsToggle } from "~/components/visuals-toggle";
import {
  ASK_POSITION_PROMPT,
  acknowledgePosition,
  breakdownFeedback,
  type Drill,
} from "~/lib/soccer-feedback";
import { cn } from "~/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  drills?: Drill[];
  outro?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: ASK_POSITION_PROMPT,
  },
];

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [position, setPosition] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showVisuals, setShowVisuals] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    let assistantMessage: Message;
    if (!position) {
      setPosition(trimmed);
      assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: acknowledgePosition(trimmed),
      };
    } else {
      const breakdown = breakdownFeedback(trimmed, position);
      assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: breakdown.intro,
        drills: breakdown.drills,
        outro: breakdown.outro,
      };
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  }

  function toggleKeepDrill(messageId: string, drillId: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              drills: m.drills?.map((d) =>
                d.id === drillId ? { ...d, kept: !d.kept } : d,
              ),
            }
          : m,
      ),
    );
  }

  function deleteDrill(messageId: string, drillId: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, drills: m.drills?.filter((d) => d.id !== drillId) }
          : m,
      ),
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Demo</h1>

      <Card className="flex flex-1 flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>AI Coach</CardTitle>
          <VisualsToggle
            enabled={showVisuals}
            onToggle={() => setShowVisuals((v) => !v)}
          />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-md border border-border bg-muted/30 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground",
                  )}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                  {message.drills && message.drills.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {message.drills.map((drill) => (
                        <DrillCard
                          key={drill.id}
                          drill={drill}
                          showVisuals={showVisuals}
                          onToggleKeep={() =>
                            toggleKeepDrill(message.id, drill.id)
                          }
                          onDelete={() => deleteDrill(message.id, drill.id)}
                        />
                      ))}
                    </div>
                  )}
                  {message.outro && (
                    <p className="mt-3 whitespace-pre-line">{message.outro}</p>
                  )}
                  {message.role === "assistant" && (
                    <QnaHint onAsk={() => inputRef.current?.focus()} />
                  )}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                position
                  ? "Describe some feedback..."
                  : "e.g. center back, winger, goalkeeper..."
              }
            />
            <Button type="submit">Send</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
