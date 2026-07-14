"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "~/lib/auth-actions";
import { cn } from "~/lib/utils";

export function Navbar({
  user,
  isAdmin,
}: {
  user: User | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const link = user
    ? { href: "/drills", label: "Drills" }
    : { href: "/demo", label: "Demo" };

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-6 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Athlete Helper
        </Link>
        <Link
          href={link.href}
          className={cn(
            "text-sm transition-colors hover:text-foreground",
            pathname === link.href
              ? "text-foreground"
              : "text-muted-foreground",
          )}
        >
          {link.label}
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "text-sm transition-colors hover:text-foreground",
              pathname === "/admin"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            Admin
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Sign Out
              </button>
            </form>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
