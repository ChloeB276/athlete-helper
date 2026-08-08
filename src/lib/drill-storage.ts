import {
  ASK_POSITION_PROMPT,
  type Drill,
  greetingForPositions,
  type TrainingContext,
} from "~/lib/soccer-feedback";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  drills?: Drill[];
  outro?: string;
}

export interface Chat {
  id: string;
  title: string;
  folderId: string | null;
  positions: string[];
  trainingContext: TrainingContext | null;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
}

export const DEFAULT_TITLE = "New chat";

export function newChat(positions: string[]): Chat {
  return {
    id: crypto.randomUUID(),
    title: DEFAULT_TITLE,
    folderId: null,
    positions,
    trainingContext: null,
    messages: [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          positions.length > 0
            ? greetingForPositions(positions)
            : ASK_POSITION_PROMPT,
      },
    ],
    updatedAt: Date.now(),
  };
}
