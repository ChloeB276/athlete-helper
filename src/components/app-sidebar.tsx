"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { useState } from "react";
import {
  ChatIcon,
  ClipboardIcon,
  CloseIcon,
  HomeIcon,
  MenuIcon,
  ShieldIcon,
  SlidersIcon,
  UsersIcon,
} from "~/components/nav-icons";
import { signOut } from "~/lib/auth-actions";
import { cn } from "~/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const PLAYER_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/attendance", label: "Attendance", icon: ClipboardIcon },
  { href: "/drill-qa", label: "Drill Q&A", icon: ChatIcon },
  { href: "/teams", label: "Teams", icon: UsersIcon },
  { href: "/settings", label: "Settings", icon: SlidersIcon },
];

const COACH_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/coach/teams", label: "Teams", icon: UsersIcon },
  { href: "/coach/attendance", label: "Attendance", icon: ClipboardIcon },
  { href: "/coach/drills", label: "Drills", icon: ChatIcon },
  { href: "/settings", label: "Settings", icon: SlidersIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand/10 text-brand"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {item.label}
    </Link>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 px-2 font-semibold tracking-tight"
    >
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-accent-a to-accent-b"
      />
      Athlete Helper
    </Link>
  );
}

function SidebarFooter({ userEmail }: { userEmail: string }) {
  return (
    <div className="flex items-center gap-2 border-t border-border/60 px-2 pt-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-foreground">
        {userEmail.slice(0, 1).toUpperCase() || "?"}
      </div>
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {userEmail}
      </span>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Sign out"
          className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}

export function AppSidebar({
  role,
  isAdmin,
  userEmail,
}: {
  role: "coach" | "player" | null;
  isAdmin: boolean;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems =
    role === "coach" ? COACH_NAV : role === "player" ? PLAYER_NAV : [];
  const adminItem: NavItem | null = isAdmin
    ? { href: "/admin", label: "Admin", icon: ShieldIcon }
    : null;

  const navContent = (onNavigate?: () => void) => (
    <>
      {navItems.map((item) => (
        <SidebarLink
          key={item.href}
          item={item}
          active={isActive(pathname, item.href)}
          onNavigate={onNavigate}
        />
      ))}
      {adminItem && (
        <SidebarLink
          item={adminItem}
          active={isActive(pathname, adminItem.href)}
          onNavigate={onNavigate}
        />
      )}
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border/60 bg-card px-4 py-3 md:hidden">
        <Logo />
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-64 flex-col gap-1 bg-card p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            {navContent(() => setMobileOpen(false))}
            <div className="mt-auto pt-4">
              <SidebarFooter userEmail={userEmail} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-1 border-r border-border/60 bg-card p-4 md:flex">
        <div className="mb-6">
          <Logo />
        </div>
        {navContent()}
        <div className="mt-auto">
          <SidebarFooter userEmail={userEmail} />
        </div>
      </aside>
    </>
  );
}
