import Link from "next/link";
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

const HERO_STRIPES = Array.from({ length: 16 }, (_, i) => ({
  key: `stripe-${i}`,
  shaded: i % 2 === 0,
}));

const FEATURES = [
  {
    title: "Drills",
    description:
      "Turn every piece of feedback into a structured drill you can revisit before the next session.",
    href: "/drills",
    cta: "Explore Drills",
  },
  {
    title: "AI Coach",
    description:
      "Get a position-specific breakdown of your coach's feedback in seconds.",
    href: "/demo",
    cta: "Try the Demo",
  },
  {
    title: "Every Position",
    description:
      "Goalkeeper to striker — get drills tuned to what your role actually demands.",
    href: "/drills",
    cta: "See How It Works",
  },
];

const STATS = [
  { value: "11", label: "Positions covered" },
  { value: "100%", label: "Soccer-focused drills" },
  { value: "1:1", label: "Feedback matched to a drill" },
];

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0 flex" aria-hidden="true">
          {HERO_STRIPES.map((stripe) => (
            <div
              key={stripe.key}
              className={cn("flex-1", stripe.shaded && "bg-background/[0.03]")}
            />
          ))}
        </div>
        <div className="relative mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-28 sm:py-36">
          <span className="rounded-full border border-background/30 px-3 py-1 text-xs font-semibold tracking-widest uppercase">
            Built for soccer
          </span>
          <h1 className="text-3xl leading-[0.95] font-bold tracking-tight uppercase sm:text-5xl md:text-7xl lg:text-8xl">
            Turn Feedback
            <br />
            Into Your
            <br />
            Next Level
          </h1>
          <p className="max-w-md text-lg text-background/70">
            Turn any feedback into instant drills curated to you.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/demo"
              className="rounded-full bg-background px-6 py-3 text-sm font-bold tracking-wide text-foreground uppercase transition-transform hover:scale-105"
            >
              Try the Demo
            </Link>
            <Link
              href="/drills"
              className="rounded-full border border-background px-6 py-3 text-sm font-bold tracking-wide uppercase transition-colors hover:bg-background hover:text-foreground"
            >
              View Drills
            </Link>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <section className="overflow-hidden border-b border-border bg-muted py-4">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap text-sm font-bold tracking-widest text-muted-foreground uppercase">
          {TICKER_SEQUENCE.map((entry) => (
            <span key={entry.key} className="flex items-center gap-8">
              {entry.item}
              <span aria-hidden="true">●</span>
            </span>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-20 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="group flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground"
          >
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold tracking-tight uppercase">
                {feature.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
              {feature.cta}
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
        ))}
      </section>

      {/* Stats band */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-16 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span className="text-5xl font-bold tracking-tight">
                {stat.value}
              </span>
              <span className="text-sm tracking-widest text-muted-foreground uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-foreground text-background">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
          <h2 className="text-2xl font-bold tracking-tight uppercase sm:text-4xl md:text-5xl">
            Ready to Level Up Your Game?
          </h2>
          <p className="max-w-md text-background/70">
            Get a position-specific breakdown of your next piece of coach
            feedback in under a minute.
          </p>
          <Link
            href="/demo"
            className="rounded-full bg-background px-8 py-3 text-sm font-bold tracking-wide text-foreground uppercase transition-transform hover:scale-105"
          >
            Start with the Demo
          </Link>
        </div>
      </section>
    </main>
  );
}
