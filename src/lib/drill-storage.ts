import { ASK_POSITION_PROMPT, type Drill } from "~/lib/soccer-feedback";

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
  position: string | null;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
}

export const DEFAULT_TITLE = "New chat";

export function newChat(): Chat {
  return {
    id: crypto.randomUUID(),
    title: DEFAULT_TITLE,
    folderId: null,
    position: null,
    messages: [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: ASK_POSITION_PROMPT,
      },
    ],
    updatedAt: Date.now(),
  };
}
