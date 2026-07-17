"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HelpWidget } from "~/components/help-widget";
import type { Chat, Folder } from "~/lib/drill-storage";
import { fetchChats, fetchFolders } from "~/lib/supabase/drills-repo";
import { cn } from "~/lib/utils";

export function SignedInHome() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [loadedChats, loadedFolders] = await Promise.all([
        fetchChats(),
        fetchFolders(),
      ]);
      if (cancelled) return;
      setChats(loadedChats);
      setFolders(loadedFolders);
      setHydrated(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hydrated) return null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-a/60 via-card to-accent-b/50 p-8 shadow-soft sm:p-10">
        <span className="text-sm font-semibold text-brand">Your Drills</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Pick up a chat where you left off, or start a new one to break down
          fresh feedback.
        </p>
        <Link
          href="/drills"
          className="mt-5 inline-flex w-fit rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-105"
        >
          Go to Drills
        </Link>
      </div>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-card p-12 text-center shadow-soft">
          <p className="text-muted-foreground">
            You haven't started any drills yet.
          </p>
          <Link
            href="/drills"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-105"
          >
            Start Your First Chat
          </Link>
        </div>
      ) : (
        <>
          {folders.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold tracking-tight">Folders</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {folders.map((folder, i) => {
                  const count = chats.filter(
                    (c) => c.folderId === folder.id,
                  ).length;
                  return (
                    <Link
                      key={folder.id}
                      href="/drills"
                      className={cn(
                        "flex flex-col gap-1 rounded-3xl p-6 shadow-soft transition-transform hover:-translate-y-0.5",
                        i % 2 === 0 ? "bg-accent-a/15" : "bg-accent-b/15",
                      )}
                    >
                      <span className="truncate text-sm font-semibold">
                        {folder.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {count} {count === 1 ? "chat" : "chats"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold tracking-tight">All Drills</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/drills?chat=${chat.id}`}
                  className="flex flex-col gap-2 rounded-3xl bg-card p-6 shadow-soft transition-transform hover:-translate-y-0.5"
                >
                  <span className="truncate text-sm font-semibold">
                    {chat.title}
                  </span>
                  {chat.position && (
                    <span className="w-fit rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                      {chat.position}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {chat.messages.length} messages
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <HelpWidget />
    </div>
  );
}
