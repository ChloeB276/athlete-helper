"use client";

import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";
import { DrillCard } from "~/components/drill-card";
import { LogoMark } from "~/components/logo-mark";
import { Badge } from "~/components/ui/badge";
import type { Drill } from "~/lib/soccer-feedback";
import { cn } from "~/lib/utils";

const TICKER_ITEMS = [
  "PACE",
  "FINISHING",
  "PRESSING",
  "VISION",
  "BUILD-UP",
  "SET PIECES",
  "1V1s",
  "MARKING",
];

const TICKER_SEQUENCE = [0, 1, 2].flatMap((rep) =>
  TICKER_ITEMS.map((item) => ({ key: `${rep}-${item}`, item })),
);

const MOCK_DRILL: Drill = {
  id: "mock-first-touch",
  difficulty: "Intermediate",
  title: "First-Touch Control",
  description:
    "4 sets of 5 minutes of wall-pass touch-and-turn reps, building from walk-through pace to full match speed.",
  sourceTitle: null,
  imageUrl: null,
  videoUrl: null,
  kept: true,
};

const MOCK_TEAMS = ["Varsity Girls", "JV Boys"];

const MOCK_ATTENDANCE: Array<{
  team: string;
  date: string;
  present: boolean;
}> = [
  { team: "Varsity Girls", date: "4/12", present: true },
  { team: "JV Boys", date: "4/10", present: false },
  { team: "Varsity Girls", date: "4/5", present: true },
];

const PAIN_POINTS = [
  {
    step: "01",
    title: "Feedback fades fast",
    description:
      "“Tighten up your first touch” turns into a vague memory by the time you're back on the pitch. No drill, no plan, nothing to actually work on.",
  },
  {
    step: "02",
    title: "Generic drills waste reps",
    description:
      "You search “soccer drills” and get a thousand videos that have nothing to do with your position or what your coach actually said.",
  },
  {
    step: "03",
    title: "Athlete Helper turns it into a plan",
    description:
      "Paste in the feedback, get a structured, position-specific drill in seconds — built around what your coach actually meant.",
  },
];

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}

function XMarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" />
    </svg>
  );
}

function ComparisonMark({ value }: { value: boolean | "partial" }) {
  if (value === "partial") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        ~
      </span>
    );
  }
  return value ? (
    <CheckIcon className="mx-auto h-5 w-5 text-brand" />
  ) : (
    <XMarkIcon className="mx-auto h-5 w-5 text-muted-foreground/50" />
  );
}

const COMPARISON_COLUMNS = [
  "Athlete Helper",
  "Texting your coach",
  "YouTube search",
  "Guessing",
] as const;

const COMPARISON_ROWS: Array<{
  label: string;
  values: [
    boolean | "partial",
    boolean | "partial",
    boolean | "partial",
    boolean | "partial",
  ];
}> = [
  {
    label: "Matches your coach's exact words",
    values: [true, false, false, false],
  },
  {
    label: "Tuned to your specific position",
    values: [true, false, "partial", false],
  },
  {
    label: "Available the second you need it",
    values: [true, false, true, true],
  },
];

const COMPARISON_TIME_ROW = [
  "Under 1 minute",
  "Hours, if they reply",
  "10–20 min of scrolling",
  "Instant, usually wrong",
];

const FEATURES = [
  {
    title: "Drills",
    description:
      "Turn every piece of feedback into a structured drill you can revisit before the next session.",
    image: "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e",
    imageAlt: "Player controlling a soccer ball at their feet",
  },
  {
    title: "AI Coach",
    description:
      "Get a position-specific breakdown of your coach's feedback in seconds.",
    image: "https://images.unsplash.com/photo-1574772135913-d519461c3996",
    imageAlt: "Coach carrying a bag of soccer balls across a foggy pitch",
  },
  {
    title: "Every Position",
    description:
      "Goalkeeper to striker — get drills tuned to what your role actually demands.",
    image: "https://images.unsplash.com/photo-1626248801379-51a0748a5f96",
    imageAlt: "Two players from opposing teams battling for the ball",
  },
];

const COACH_FEATURES = [
  {
    title: "Rosters, not spreadsheets",
    description:
      "Build a team roster once — positions, strong foot, and all — and keep it up to date in a couple of taps.",
  },
  {
    title: "Attendance in seconds",
    description:
      "Mark who showed up to practice or a game without digging through old group chats.",
  },
  {
    title: "Feedback that becomes a drill",
    description:
      "Give a player feedback and Athlete Helper turns it into a drill they can actually run before you see them again.",
  },
];

const STATS = [
  { value: "11", label: "Positions covered" },
  { value: "100%", label: "Soccer-focused drills" },
  { value: "1:1", label: "Feedback matched to a drill" },
];

const FOOTER_LINKS = [
  { href: "/#why", label: "Why" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#coaches", label: "For Coaches" },
];

export function LandingPage() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-accent-a/40 via-background to-accent-b/30"
        />
        <div
          aria-hidden="true"
          className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-accent-b/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent-a/40 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-full bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
              Built for athletes and coaches
            </span>
            <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl md:text-6xl">
              Feedback that <em className="text-brand not-italic">actually</em>{" "}
              turns into your next drill
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Paste in what your coach said and get an instant,
              position-specific drill — no more guessing what they meant.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/signup"
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-105"
              >
                Start Now
              </Link>
              <Link
                href="/#how-it-works"
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-accent"
              >
                See How It Works
              </Link>
            </div>
          </div>
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl shadow-soft lg:aspect-square">
            <Image
              src="https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a"
              alt="Soccer player taking a shot on goal under stadium lights at night"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
      </section>

      {/* Ticker */}
      <section className="overflow-hidden border-y border-border/60 bg-muted/50 py-4">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap text-sm font-medium text-muted-foreground">
          {TICKER_SEQUENCE.map((entry) => (
            <span key={entry.key} className="flex items-center gap-8">
              {entry.item}
              <span aria-hidden="true" className="text-brand">
                ●
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* See it in action — a real product mockup */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col items-start gap-4">
            <span className="text-sm font-semibold text-brand">
              See It In Action
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Instant Drills
            </h2>
            <p className="max-w-md text-muted-foreground">
              Type in the feedback your coach gave you. Athlete Helper hands
              back a real drill — keep it, tweak it, or ask for another one.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              athletehelper.app/demo
            </span>
            <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="self-start rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                Got it — quicker first touch. Here's a drill for a midfielder:
              </div>
              <DrillCard
                drill={MOCK_DRILL}
                showVisuals={false}
                onToggleKeep={() => {}}
                onDelete={() => {}}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sound familiar? */}
      <section
        id="why"
        className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 py-20"
      >
        <div className="mx-auto mb-12 flex max-w-xl flex-col items-center gap-3 text-center">
          <span className="text-sm font-semibold text-brand">
            Sound familiar?
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
            Getting feedback isn't the hard part
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {PAIN_POINTS.map((point, index) => (
            <div
              key={point.step}
              className={cn(
                "flex flex-col gap-3 rounded-3xl p-8 shadow-soft",
                index === PAIN_POINTS.length - 1
                  ? "bg-gradient-to-br from-accent-a/60 via-card to-accent-b/50"
                  : "bg-card",
              )}
            >
              <span className="text-sm font-semibold text-brand">
                {point.step}
              </span>
              <h3 className="text-lg font-semibold tracking-tight">
                {point.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-20 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col overflow-hidden rounded-3xl bg-card shadow-soft"
          >
            <div className="relative aspect-4/3 overflow-hidden">
              <Image
                src={feature.image}
                alt={feature.imageAlt}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 33vw, 100vw"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-8">
              <h2 className="text-xl font-semibold tracking-tight">
                {feature.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 py-20"
      >
        <div className="mx-auto mb-12 flex max-w-xl flex-col items-center gap-3 text-center">
          <span className="text-sm font-semibold text-brand">How It Works</span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
            From feedback to drill
          </h2>
          <p className="text-sm text-muted-foreground">
            Hover each step to see it in action.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Step 1: Input */}
          <div className="group relative h-80 overflow-hidden rounded-3xl bg-card shadow-soft">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center transition-opacity duration-300 group-hover:opacity-0">
              <span className="text-sm font-semibold text-brand">Step 01</span>
              <span className="text-3xl font-bold tracking-tight">Input</span>
              <p className="max-w-[16rem] text-sm text-muted-foreground">
                Type in feedback from your coach
              </p>
            </div>
            <div className="absolute inset-0 flex flex-col justify-end gap-3 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="self-start rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                Hey! What feedback did your coach give you?
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
                <span className="text-sm text-foreground">
                  My coach said I need a quicker first touch
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brand align-middle"
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Processing */}
          <div className="group relative h-80 overflow-hidden rounded-3xl bg-card shadow-soft">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center transition-opacity duration-300 group-hover:opacity-0">
              <span className="text-sm font-semibold text-brand">Step 02</span>
              <span className="text-3xl font-bold tracking-tight">
                Processing
              </span>
              <p className="max-w-[16rem] text-sm text-muted-foreground">
                AI configures a plan around your position
              </p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div
                aria-hidden="true"
                className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand"
              />
              <p className="text-sm font-medium text-foreground">
                Configuring your drill plan
              </p>
              <div aria-hidden="true" className="flex gap-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" />
              </div>
            </div>
          </div>

          {/* Step 3: Output */}
          <div className="group relative h-80 overflow-hidden rounded-3xl bg-card shadow-soft">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center transition-opacity duration-300 group-hover:opacity-0">
              <span className="text-sm font-semibold text-brand">Step 03</span>
              <span className="text-3xl font-bold tracking-tight">Output</span>
              <p className="max-w-[16rem] text-sm text-muted-foreground">
                Get a structured drill you can run today
              </p>
            </div>
            <div className="absolute inset-0 flex flex-col justify-between gap-4 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="rounded-2xl bg-muted/60 px-4 py-3 text-left text-sm">
                <p className="font-semibold text-foreground">
                  Drill: First-Touch Control
                </p>
                <p className="mt-1 text-muted-foreground">
                  4 sets of 5 minutes of wall-pass touch-and-turn reps, building
                  from walk-through pace to full match speed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold text-foreground"
                >
                  ?
                </span>
                Got more questions? Just ask.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mx-auto mb-12 flex max-w-xl flex-col items-center gap-3 text-center">
          <span className="text-sm font-semibold text-brand">
            Why Athlete Helper
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
            Athlete Helper vs. the old way
          </h2>
        </div>
        <div className="overflow-x-auto rounded-3xl bg-card shadow-soft">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th
                  scope="col"
                  className="p-5 text-left font-medium text-muted-foreground"
                >
                  <span className="sr-only">Category</span>
                </th>
                {COMPARISON_COLUMNS.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className={cn(
                      "p-5 text-center font-semibold tracking-tight",
                      index === 0 ? "text-brand" : "text-muted-foreground",
                    )}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-border/60 last:border-0"
                >
                  <th
                    scope="row"
                    className="p-5 text-left font-normal text-foreground"
                  >
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td
                      key={COMPARISON_COLUMNS[index]}
                      className="p-5 text-center"
                    >
                      <ComparisonMark value={value} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-muted/40">
                <th
                  scope="row"
                  className="p-5 text-left font-semibold text-foreground"
                >
                  Time to get an actual plan
                </th>
                {COMPARISON_TIME_ROW.map((value, index) => (
                  <td
                    key={COMPARISON_COLUMNS[index]}
                    className={cn(
                      "p-5 text-center font-semibold",
                      index === 0 ? "text-brand" : "text-muted-foreground",
                    )}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Editorial image break */}
      <section className="mx-auto w-full max-w-6xl px-6 py-4">
        <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-3xl shadow-soft">
          <Image
            src="https://images.unsplash.com/photo-1624280157150-4d1ed8632989"
            alt="Two players battling for the ball on a sunlit pitch"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 1152px, 100vw"
          />
          <div className="absolute inset-0 bg-foreground/45" />
          <p className="relative max-w-2xl px-6 text-center text-2xl font-bold tracking-tight text-background sm:text-4xl">
            Every touch. Every session.
            <span className="text-accent-a"> Every position.</span>
          </p>
        </div>
      </section>

      {/* For Coaches */}
      <section
        id="coaches"
        className="mx-auto w-full max-w-6xl scroll-mt-28 px-6 py-20"
      >
        <div className="relative overflow-hidden rounded-3xl bg-card shadow-soft">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-accent-b/25 via-card to-accent-a/20"
          />
          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col items-start gap-5">
              <span className="rounded-full bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
                Built for coaches too
              </span>
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
                Give feedback once. Let it become the drill.
              </h2>
              <p className="max-w-md text-muted-foreground">
                Manage your roster, track attendance, and turn what you tell
                each player into a drill they'll actually run before the next
                session — all in one place.
              </p>
              <Link
                href="/signup"
                className="mt-1 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-105"
              >
                Start Coaching
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-mono text-xs text-muted-foreground">
                athletehelper.app/coach/teams
              </span>
              <div className="flex flex-col gap-4 rounded-3xl bg-background/80 p-5 shadow-soft">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold tracking-tight">
                    Your Teams
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {MOCK_TEAMS.map((team) => (
                      <div
                        key={team}
                        className="truncate rounded-2xl bg-card p-3 text-xs font-semibold shadow-soft"
                      >
                        {team}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold tracking-tight">
                    Recent Attendance
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_ATTENDANCE.map((row, index) => (
                      <Badge
                        // biome-ignore lint/suspicious/noArrayIndexKey: illustrative rows have no id
                        key={index}
                        variant={row.present ? "default" : "destructive"}
                      >
                        {row.team} · {row.date} ·{" "}
                        {row.present ? "Present" : "Absent"}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {COACH_FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-2xl bg-background/80 p-4 shadow-soft"
                  >
                    <h3 className="text-xs font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 rounded-3xl bg-card py-10 text-center shadow-soft"
            >
              <span className="text-4xl font-bold tracking-tight text-brand">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA — dark card */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-6">
        <div className="dark relative overflow-hidden rounded-3xl bg-background shadow-soft">
          <div className="flex flex-col items-center gap-5 px-6 py-20 text-center sm:py-24">
            <span className="text-xs font-semibold tracking-widest text-brand uppercase">
              Ready when you are
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Stop guessing. Start improving.
            </h2>
            <p className="max-w-md text-foreground/70">
              Paste in your next piece of coach feedback, or bring your whole
              roster along. Free to start, no credit card required.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-foreground px-8 py-3 text-sm font-semibold text-background shadow-soft transition-transform hover:scale-105"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-8 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="flex flex-col items-center gap-4 border-t border-border/60 pt-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <LogoMark className="h-6 w-6" />
            Athlete Helper
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Athlete Helper
          </p>
        </div>
      </footer>
    </main>
  );
}
