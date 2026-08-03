"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DrillCard } from "~/components/drill-card";
import { QnaHint } from "~/components/qna-hint";
import { QuotaBadge } from "~/components/quota-badge";
import { TrainingContextForm } from "~/components/training-context-form";
import { TypingIndicator } from "~/components/typing-indicator";
import { VisualsToggle } from "~/components/visuals-toggle";
import {
  type Chat,
  type ChatMessage,
  DEFAULT_TITLE,
  type Folder,
  newChat,
} from "~/lib/drill-storage";
import type { DrillQuota } from "~/lib/quota";
import {
  acknowledgePosition,
  acknowledgeTrainingContext,
  breakdownFeedback,
  describeTrainingContext,
  type TrainingContext,
} from "~/lib/soccer-feedback";
import {
  appendMessagesRecord,
  createChatRecord,
  createFolderRecord,
  deleteChatRecord,
  deleteDrillRecord,
  deleteFolderRecord,
  fetchChats,
  fetchFolders,
  moveChatRecord,
  renameChatRecord,
  renameFolderRecord,
  toggleKeepDrillRecord,
  updateTrainingContextRecord,
} from "~/lib/supabase/drills-repo";
import { fetchProfilePositions } from "~/lib/supabase/profile-repo";
import { cn } from "~/lib/utils";

export function DrillsChat({ quota: initialQuota }: { quota: DrillQuota }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [quota, setQuota] = useState(initialQuota);
  const [defaultPosition, setDefaultPosition] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [input, setInput] = useState("");
  const [showVisuals, setShowVisuals] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  // biome-ignore lint/correctness/useExhaustiveDependencies: only read the ?chat= param on initial load, not on every navigation
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [loadedChats, loadedFolders, loadedPositions] = await Promise.all([
        fetchChats(),
        fetchFolders(),
        fetchProfilePositions(),
      ]);
      if (cancelled) return;
      setChats(loadedChats);
      setFolders(loadedFolders);
      setDefaultPosition(loadedPositions[0] ?? null);
      const requestedId = searchParams.get("chat");
      const pendingFeedback = searchParams.get("feedback");
      let initialId = loadedChats.some((c) => c.id === requestedId)
        ? requestedId
        : (loadedChats[0]?.id ?? null);

      if (pendingFeedback && !initialId) {
        const chat = newChat(loadedPositions[0] ?? null);
        setChats((prev) => [chat, ...prev]);
        createChatRecord(chat).catch((error) => console.error(error));
        initialId = chat.id;
      }

      setSelectedId(initialId);
      if (pendingFeedback) setInput(pendingFeedback);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-scroll whenever the selected chat or its messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, chats]);

  const selected = chats.find((c) => c.id === selectedId) ?? null;
  const ungrouped = chats.filter((c) => c.folderId === null);
  const lastMessage = selected?.messages[selected.messages.length - 1];
  const showTyping =
    sending &&
    (!lastMessage ||
      lastMessage.role !== "assistant" ||
      (!lastMessage.content && !lastMessage.drills?.length));

  function toggleFolder(id: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function createChat() {
    const chat = newChat(defaultPosition);
    setChats((prev) => [chat, ...prev]);
    setSelectedId(chat.id);
    setInput("");
    createChatRecord(chat).catch((error) => console.error(error));
  }

  function createFolder() {
    const folder: Folder = { id: crypto.randomUUID(), name: "New folder" };
    setFolders((prev) => [folder, ...prev]);
    setEditingFolderId(folder.id);
    setDraftName(folder.name);
    createFolderRecord(folder).catch((error) => console.error(error));
  }

  function renameChat(id: string, title: string) {
    const finalTitle = title.trim() || DEFAULT_TITLE;
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: finalTitle } : c)),
    );
    setEditingChatId(null);
    renameChatRecord(id, finalTitle).catch((error) => console.error(error));
  }

  function renameFolder(id: string, name: string) {
    const finalName = name.trim() || "Untitled folder";
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: finalName } : f)),
    );
    setEditingFolderId(null);
    renameFolderRecord(id, finalName).catch((error) => console.error(error));
  }

  function moveChat(id: string, folderId: string | null) {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, folderId } : c)));
    moveChatRecord(id, folderId).catch((error) => console.error(error));
  }

  function deleteChat(id: string) {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
    deleteChatRecord(id).catch((error) => console.error(error));
  }

  function deleteFolder(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setChats((prev) =>
      prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c)),
    );
    deleteFolderRecord(id).catch((error) => console.error(error));
  }

  function submitTrainingContext(context: TrainingContext) {
    if (!selected) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: describeTrainingContext(context),
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: acknowledgeTrainingContext(),
    };
    const updatedAt = Date.now();

    setChats((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              trainingContext: context,
              messages: [...c.messages, userMessage, assistantMessage],
              updatedAt,
            }
          : c,
      ),
    );

    updateTrainingContextRecord(selected.id, context).catch((error) =>
      console.error(error),
    );
    appendMessagesRecord({
      chatId: selected.id,
      userMessage,
      assistantMessage,
      position: selected.position,
      title: selected.title,
      updatedAt,
    }).catch((error) => console.error(error));
  }

  async function sendMessage() {
    if (!selected || sending) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setInput("");

    if (!selected.position) {
      const nextPosition = trimmed;
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: acknowledgePosition(trimmed),
      };
      const updatedAt = Date.now();

      setChats((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? {
                ...c,
                position: nextPosition,
                messages: [...c.messages, userMessage, assistantMessage],
                updatedAt,
              }
            : c,
        ),
      );

      appendMessagesRecord({
        chatId: selected.id,
        userMessage,
        assistantMessage,
        position: nextPosition,
        title: selected.title,
        updatedAt,
      }).catch((error) => console.error(error));
      return;
    }

    // The text input is only rendered once trainingContext is set (see the
    // TrainingContextForm branch below), so this is always non-null here.
    if (!selected.trainingContext) return;
    const trainingContext = selected.trainingContext;
    const history = selected.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const chatId = selected.id;
    const assistantId = crypto.randomUUID();
    let assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    function updateAssistantMessage(next: ChatMessage) {
      assistantMessage = next;
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantId ? assistantMessage : m,
                ),
              }
            : c,
        ),
      );
    }

    setChats((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? { ...c, messages: [...c.messages, userMessage, assistantMessage] }
          : c,
      ),
    );

    setSending(true);
    try {
      const breakdown = await breakdownFeedback(
        trimmed,
        selected.position,
        trainingContext,
        history,
        (snapshot) =>
          updateAssistantMessage({
            id: assistantId,
            role: "assistant",
            content: snapshot.intro,
            drills: snapshot.drills.length > 0 ? snapshot.drills : undefined,
            outro: snapshot.outro || undefined,
          }),
      );
      updateAssistantMessage({
        id: assistantId,
        role: "assistant",
        content: breakdown.intro,
        drills: breakdown.drills,
        outro: breakdown.outro,
      });
      if (breakdown.quota) {
        setQuota((prev) => ({ ...prev, ...breakdown.quota }));
      }
    } catch (error) {
      console.error(error);
      updateAssistantMessage({
        id: assistantId,
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Sorry, I couldn't generate drills for that just now. Please try again.",
      });
    } finally {
      setSending(false);
    }

    const shouldAutoTitle = selected.title === DEFAULT_TITLE;
    const nextTitle = shouldAutoTitle ? trimmed.slice(0, 40) : selected.title;
    const updatedAt = Date.now();

    setChats((prev) =>
      prev.map((c) =>
        c.id === selected.id ? { ...c, title: nextTitle, updatedAt } : c,
      ),
    );

    appendMessagesRecord({
      chatId: selected.id,
      userMessage,
      assistantMessage,
      position: selected.position,
      title: nextTitle,
      updatedAt,
    }).catch((error) => console.error(error));
  }

  function toggleKeepDrill(chatId: string, messageId: string, drillId: string) {
    const targetDrill = chats
      .find((c) => c.id === chatId)
      ?.messages.find((m) => m.id === messageId)
      ?.drills?.find((d) => d.id === drillId);
    const nextKept = !targetDrill?.kept;

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? {
                      ...m,
                      drills: m.drills?.map((d) =>
                        d.id === drillId ? { ...d, kept: nextKept } : d,
                      ),
                    }
                  : m,
              ),
            }
          : c,
      ),
    );
    toggleKeepDrillRecord(drillId, nextKept).catch((error) =>
      console.error(error),
    );
  }

  function deleteDrill(chatId: string, messageId: string, drillId: string) {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, drills: m.drills?.filter((d) => d.id !== drillId) }
                  : m,
              ),
            }
          : c,
      ),
    );
    deleteDrillRecord(drillId).catch((error) => console.error(error));
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="flex w-72 shrink-0 flex-col gap-3 border-r border-border bg-muted/30 p-3">
        <button
          type="button"
          onClick={createChat}
          className="rounded-full bg-brand px-4 py-2 text-sm font-bold tracking-wide text-brand-foreground uppercase transition hover:scale-[1.02] hover:bg-brand/90"
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
              <div className="ml-auto flex items-center gap-3">
                <QuotaBadge
                  remaining={quota.remaining}
                  max={quota.max}
                  windowLabel={quota.windowLabel}
                />
                <VisualsToggle
                  enabled={showVisuals}
                  onToggle={() => setShowVisuals((v) => !v)}
                />
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {selected.messages.map((message) => {
                if (
                  message.role === "assistant" &&
                  !message.content &&
                  !message.drills?.length
                ) {
                  return null;
                }
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] text-sm leading-relaxed",
                        message.role === "user"
                          ? "rounded-2xl bg-muted px-4 py-2.5 text-foreground"
                          : "px-1 text-foreground",
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
                                toggleKeepDrill(
                                  selected.id,
                                  message.id,
                                  drill.id,
                                )
                              }
                              onDelete={() =>
                                deleteDrill(selected.id, message.id, drill.id)
                              }
                            />
                          ))}
                        </div>
                      )}
                      {message.outro && (
                        <p className="mt-3 whitespace-pre-line">
                          {message.outro}
                        </p>
                      )}
                      {message.role === "assistant" && (
                        <QnaHint onAsk={() => inputRef.current?.focus()} />
                      )}
                    </div>
                  </div>
                );
              })}
              {showTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4">
              {selected.position && !selected.trainingContext ? (
                <TrainingContextForm onSubmit={submitTrainingContext} />
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={sending}
                    placeholder={
                      sending
                        ? "Searching for real drills..."
                        : selected.position
                          ? "Describe some feedback..."
                          : "e.g. center back, winger, goalkeeper..."
                    }
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    aria-label="Send"
                    disabled={sending}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition hover:scale-105 hover:bg-brand/90 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-brand"
                  >
                    →
                  </button>
                </form>
              )}
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
              className="rounded-full bg-brand px-6 py-3 text-sm font-bold tracking-wide text-brand-foreground uppercase transition hover:scale-105 hover:bg-brand/90"
            >
              + New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatRow({
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
