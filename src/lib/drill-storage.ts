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

export const CHATS_KEY = "athlete-helper-chats";
export const FOLDERS_KEY = "athlete-helper-folders";
export const DEFAULT_TITLE = "New chat";

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

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
