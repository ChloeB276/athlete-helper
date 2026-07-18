"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "~/lib/auth-actions";
import { cn } from "~/lib/utils";

export function Navbar({
  user,
  isAdmin,
  role,
}: {
  user: User | null;
  isAdmin: boolean;
  role: "coach" | "player" | null;
}) {
  const pathname = usePathname();

  const links = user
    ? role === "coach"
      ? [{ href: "/coach/teams", label: "Teams" }]
      : [
          { href: "/drills", label: "Drills" },
          { href: "/feedback", label: "Feedback" },
        ]
    : [{ href: "/demo", label: "Demo" }];

  return (
    <div className="sticky top-4 z-40 mx-auto w-full max-w-3xl px-4">
      <nav className="flex h-14 items-center gap-3 rounded-full border border-border/60 bg-card/90 px-4 shadow-soft backdrop-blur-sm sm:gap-6 sm:px-5">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight whitespace-nowrap"
        >
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-accent-a to-accent-b"
          />
          <span className="hidden sm:inline">Athlete Helper</span>
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 text-sm whitespace-nowrap transition-colors hover:text-foreground",
              pathname === link.href
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "shrink-0 text-sm whitespace-nowrap transition-colors hover:text-foreground",
              pathname === "/admin"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            Admin
          </Link>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-border px-3 py-1.5 text-sm font-medium whitespace-nowrap text-foreground transition-colors hover:bg-accent"
              >
                Sign Out
              </button>
            </form>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:inline"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-brand px-3 py-1.5 text-sm font-medium whitespace-nowrap text-brand-foreground transition-transform hover:scale-105"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
