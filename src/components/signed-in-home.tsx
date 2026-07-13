"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HelpWidget } from "~/components/help-widget";
import {
  CHATS_KEY,
  type Chat,
  FOLDERS_KEY,
  type Folder,
  loadJson,
} from "~/lib/drill-storage";

export function SignedInHome() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setChats(loadJson<Chat[]>(CHATS_KEY, []));
    setFolders(loadJson<Folder[]>(FOLDERS_KEY, []));
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold tracking-widest text-brand uppercase">
          Your Drills
        </span>
        <h1 className="text-3xl font-bold tracking-tight uppercase sm:text-5xl">
          Welcome Back
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Pick up a chat where you left off, or start a new one to break down
          fresh feedback.
        </p>
        <Link
          href="/drills"
          className="mt-2 w-fit rounded-full bg-brand px-6 py-3 text-sm font-bold tracking-wide text-brand-foreground uppercase transition-transform hover:scale-105"
        >
          Go To Drills
        </Link>
      </div>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            You haven't started any drills yet.
          </p>
          <Link
            href="/drills"
            className="rounded-full bg-brand px-6 py-3 text-sm font-bold tracking-wide text-brand-foreground uppercase transition-transform hover:scale-105"
          >
            Start Your First Chat
          </Link>
        </div>
      ) : (
        <>
          {folders.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold tracking-tight uppercase">
                Folders
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {folders.map((folder) => {
                  const count = chats.filter(
                    (c) => c.folderId === folder.id,
                  ).length;
                  return (
                    <Link
                      key={folder.id}
                      href="/drills"
                      className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground"
                    >
                      <span className="truncate text-sm font-bold uppercase tracking-wide">
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
            <h2 className="text-lg font-bold tracking-tight uppercase">
              All Drills
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/drills?chat=${chat.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground"
                >
                  <span className="truncate text-sm font-bold">
                    {chat.title}
                  </span>
                  {chat.position && (
                    <span className="w-fit rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold tracking-widest text-brand-foreground uppercase">
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
