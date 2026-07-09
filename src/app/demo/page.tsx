"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi! I'm your Athlete Helper demo assistant for soccer players. What position do you play?",
  },
];

const POSITION_FOCUS: Record<string, string> = {
  goalkeeper: "shot-stopping, positioning, and distribution",
  defender: "marking, tackling, and building out from the back",
  "center back": "marking, tackling, and building out from the back",
  fullback: "1v1 defending and supporting the attack down the flank",
  midfielder: "receiving under pressure, scanning, and spraying passes",
  winger: "beating defenders 1v1 and delivering final balls",
  forward: "movement off the ball and finishing",
  striker: "movement off the ball and finishing",
};

function positionFocus(position: string): string {
  const key = position.trim().toLowerCase();
  return POSITION_FOCUS[key] ?? "your role on the pitch";
}

function breakdownFeedback(feedback: string, position: string): string {
  const focus = positionFocus(position);
  return [
    `Here's a breakdown of that feedback for a ${position}:`,
    `• What your coach means: "${feedback}" — this usually points to a gap in ${focus}.`,
    "• Why it matters: small technical habits like this get exposed under match speed and pressure, especially in the moments that decide games.",
    `• Drill to fix it: 4 sets of 5 minutes of position-specific reps targeting "${feedback}", building from walk-through pace to full match speed.`,
    "Want to log this as a drill, or share more feedback to break down?",
  ].join("\n");
}

export default function DemoPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [position, setPosition] = useState<string | null>(null);
  const [input, setInput] = useState("");

  function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    let replyContent: string;
    if (!position) {
      setPosition(trimmed);
      replyContent = `Got it, you play ${trimmed}. Now tell me some feedback your coach gave you, and I'll break it down into a detailed drill plan.`;
    } else {
      replyContent = breakdownFeedback(trimmed, position);
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: replyContent,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Demo</h1>

      <Card className="flex flex-1 flex-col">
        <CardHeader>
          <CardTitle>AI Coach</CardTitle>
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
                  className={`max-w-[80%] whitespace-pre-line rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground"
                  }`}
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
            className="flex gap-2"
          >
            <Input
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
