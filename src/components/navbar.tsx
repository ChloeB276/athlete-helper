import Link from "next/link";
import { LogoMark } from "~/components/logo-mark";

const SECTION_LINKS = [
  { href: "/#why", label: "Why" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#coaches", label: "For Coaches" },
];

export function Navbar() {
  return (
    <div className="sticky top-4 z-40 mx-auto w-full max-w-3xl px-4">
      <nav className="flex h-14 items-center gap-3 rounded-full border border-border/60 bg-card/90 px-4 shadow-soft backdrop-blur-sm sm:gap-5 sm:px-5">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight whitespace-nowrap"
        >
          <LogoMark className="h-7 w-7" />
          <span className="hidden sm:inline">Athlete Helper</span>
        </Link>
        <div className="hidden shrink-0 items-center gap-5 md:flex">
          {SECTION_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-brand px-3 py-1.5 text-sm font-medium whitespace-nowrap text-brand-foreground transition hover:scale-105 hover:bg-brand/90"
          >
            Sign Up
          </Link>
        </div>
      </nav>
    </div>
  );
}
