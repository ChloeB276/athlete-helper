"use client";

import { useEffect, useRef, useState } from "react";
import {
  ASK_POSITION_PROMPT,
  acknowledgePosition,
  breakdownFeedback,
} from "~/lib/soccer-feedback";
import { cn } from "~/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  title: string;
  folderId: string | null;
  position: string | null;
  messages: ChatMessage[];
  updatedAt: number;
}

interface Folder {
  id: string;
  name: string;
}

const CHATS_KEY = "athlete-helper-chats";
const FOLDERS_KEY = "athlete-helper-folders";
const DEFAULT_TITLE = "New chat";

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function newChat(): Chat {
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

export default function DrillsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadedChats = loadJson<Chat[]>(CHATS_KEY, []);
    setChats(loadedChats);
    setFolders(loadJson<Folder[]>(FOLDERS_KEY, []));
    setSelectedId(loadedChats[0]?.id ?? null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  }, [chats, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  }, [folders, hydrated]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-scroll whenever the selected chat or its messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, chats]);

  const selected = chats.find((c) => c.id === selectedId) ?? null;
  const ungrouped = chats.filter((c) => c.folderId === null);

  function toggleFolder(id: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function createChat() {
    const chat = newChat();
    setChats((prev) => [chat, ...prev]);
    setSelectedId(chat.id);
    setInput("");
  }

  function createFolder() {
    const folder: Folder = { id: crypto.randomUUID(), name: "New folder" };
    setFolders((prev) => [folder, ...prev]);
    setEditingFolderId(folder.id);
    setDraftName(folder.name);
  }

  function renameChat(id: string, title: string) {
    const trimmed = title.trim();
    setChats((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: trimmed || DEFAULT_TITLE } : c,
      ),
    );
    setEditingChatId(null);
  }

  function renameFolder(id: string, name: string) {
    const trimmed = name.trim();
    setFolders((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, name: trimmed || "Untitled folder" } : f,
      ),
    );
    setEditingFolderId(null);
  }

  function moveChat(id: string, folderId: string | null) {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, folderId } : c)));
  }

  function deleteChat(id: string) {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function deleteFolder(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setChats((prev) =>
      prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c)),
    );
  }

  function sendMessage() {
    if (!selected) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    let replyContent: string;
    let nextPosition = selected.position;
    if (!selected.position) {
      nextPosition = trimmed;
      replyContent = acknowledgePosition(trimmed);
    } else {
      replyContent = breakdownFeedback(trimmed, selected.position);
    }
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: replyContent,
    };

    const shouldAutoTitle =
      selected.title === DEFAULT_TITLE && selected.position;

    setChats((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              position: nextPosition,
              title: shouldAutoTitle ? trimmed.slice(0, 40) : c.title,
              messages: [...c.messages, userMessage, assistantMessage],
              updatedAt: Date.now(),
            }
          : c,
      ),
    );
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="flex w-72 shrink-0 flex-col gap-3 border-r border-border bg-muted/30 p-3">
        <button
          type="button"
          onClick={createChat}
          className="rounded-full bg-brand px-4 py-2 text-sm font-bold tracking-wide text-brand-foreground uppercase transition-transform hover:scale-[1.02]"
        >
          + New Chat
        </button>
        <button
          type="button"
          onClick={createFolder}
          className="self-start px-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          + New folder
        </button>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {folders.map((folder) => {
            const folderChats = chats.filter((c) => c.folderId === folder.id);
            const collapsed = collapsedFolders.has(folder.id);
            return (
              <div key={folder.id} className="mb-1">
                <div className="group flex items-center gap-1 rounded-md px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => toggleFolder(folder.id)}
                    aria-label={collapsed ? "Expand folder" : "Collapse folder"}
                    className="text-xs text-muted-foreground"
                  >
                    {collapsed ? "▸" : "▾"}
                  </button>
                  {editingFolderId === folder.id ? (
                    <input
                      // biome-ignore lint/a11y/noAutofocus: rename field opens in response to an explicit user click
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={() => renameFolder(folder.id, draftName)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          renameFolder(folder.id, draftName);
                      }}
                      className="flex-1 bg-transparent text-xs font-semibold tracking-wide text-foreground uppercase outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFolderId(folder.id);
                        setDraftName(folder.name);
                      }}
                      className="flex-1 truncate text-left text-xs font-semibold tracking-wide text-foreground uppercase"
                    >
                      {folder.name}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteFolder(folder.id)}
                    aria-label="Delete folder"
                    className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  >
                    ✕
                  </button>
                </div>
                {!collapsed && (
                  <div className="ml-3 space-y-0.5 border-l border-border pl-2">
                    {folderChats.length === 0 && (
                      <p className="px-2 py-1 text-xs text-muted-foreground/70">
                        Empty
                      </p>
                    )}
                    {folderChats.map((chat) => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        folders={folders}
                        selected={chat.id === selectedId}
                        editing={editingChatId === chat.id}
                        draftName={draftName}
                        onSelect={() => setSelectedId(chat.id)}
                        onStartRename={() => {
                          setEditingChatId(chat.id);
                          setDraftName(chat.title);
                        }}
                        onDraftChange={setDraftName}
                        onCommitRename={() => renameChat(chat.id, draftName)}
                        onMove={(folderId) => moveChat(chat.id, folderId)}
                        onDelete={() => deleteChat(chat.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {ungrouped.length > 0 && (
            <p className="px-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Chats
            </p>
          )}
          <div className="space-y-0.5">
            {chats.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No chats yet. Start a new one to get drills from your feedback.
              </p>
            )}
            {ungrouped.map((chat) => (
              <ChatRow
                key={chat.id}
                chat={chat}
                folders={folders}
                selected={chat.id === selectedId}
                editing={editingChatId === chat.id}
                draftName={draftName}
                onSelect={() => setSelectedId(chat.id)}
                onStartRename={() => {
                  setEditingChatId(chat.id);
                  setDraftName(chat.title);
                }}
                onDraftChange={setDraftName}
                onCommitRename={() => renameChat(chat.id, draftName)}
                onMove={(folderId) => moveChat(chat.id, folderId)}
                onDelete={() => deleteChat(chat.id)}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <>
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <h1 className="truncate text-lg font-bold tracking-tight">
                {selected.title}
              </h1>
              {selected.position && (
                <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold tracking-widest text-brand-foreground uppercase">
                  {selected.position}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {selected.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[75%] whitespace-pre-line text-sm leading-relaxed",
                      message.role === "user"
                        ? "rounded-2xl bg-muted px-4 py-2.5 text-foreground"
                        : "px-1 text-foreground",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    selected.position
                      ? "Describe some feedback..."
                      : "e.g. center back, winger, goalkeeper..."
                  }
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-transform hover:scale-105"
                >
                  →
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Select a chat or start a new one to get drills from your feedback.
            </p>
            <button
              type="button"
              onClick={createChat}
              className="rounded-full bg-brand px-6 py-3 text-sm font-bold tracking-wide text-brand-foreground uppercase transition-transform hover:scale-105"
            >
              + New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatRow({
  chat,
  folders,
  selected,
  editing,
  draftName,
  onSelect,
  onStartRename,
  onDraftChange,
  onCommitRename,
  onMove,
  onDelete,
}: {
  chat: Chat;
  folders: Folder[];
  selected: boolean;
  editing: boolean;
  draftName: string;
  onSelect: () => void;
  onStartRename: () => void;
  onDraftChange: (value: string) => void;
  onCommitRename: () => void;
  onMove: (folderId: string | null) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
      )}
    >
      {editing ? (
        <input
          // biome-ignore lint/a11y/noAutofocus: rename field opens in response to an explicit user click
          autoFocus
          value={draftName}
          onChange={(e) => onDraftChange(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitRename();
          }}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 truncate text-left text-sm"
        >
          {chat.title}
        </button>
      )}
      <select
        value={chat.folderId ?? ""}
        onChange={(e) => onMove(e.target.value || null)}
        aria-label="Move to folder"
        onClick={(e) => e.stopPropagation()}
        className="w-0 shrink-0 overflow-hidden bg-transparent text-[10px] text-muted-foreground opacity-0 outline-none group-hover:w-auto group-hover:overflow-visible group-hover:opacity-100"
      >
        <option value="">No folder</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onStartRename}
        aria-label="Rename chat"
        className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete chat"
        className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
      >
        ✕
      </button>
    </div>
  );
}
