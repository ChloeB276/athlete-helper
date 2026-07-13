import Image from "next/image";
import Link from "next/link";

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
        <Image
          src="https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a"
          alt="Soccer player taking a shot on goal under stadium lights at night"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/60 to-foreground/10" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-28 sm:py-36">
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold tracking-widest text-brand-foreground uppercase">
            Built for athletes by athletes
          </span>
          <h1 className="text-3xl leading-[0.95] font-bold tracking-tight uppercase sm:text-5xl md:text-7xl lg:text-8xl">
            Turn Feedback
            <br />
            Into Your
            <br />
            Next Level
          </h1>
          <p className="max-w-md text-lg text-background/80">
            Turn any feedback into instant drills curated to you.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/demo"
              className="rounded-full bg-brand px-6 py-3 text-sm font-bold tracking-wide text-brand-foreground uppercase transition-transform hover:scale-105"
            >
              Try the Demo
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-background px-6 py-3 text-sm font-bold tracking-wide uppercase transition-colors hover:bg-background hover:text-foreground"
            >
              Start Now
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
              <span aria-hidden="true" className="text-brand">
                ●
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-20 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
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
              <h2 className="text-2xl font-bold tracking-tight uppercase">
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
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mx-auto mb-12 flex max-w-xl flex-col items-center gap-3 text-center">
          <span className="text-xs font-bold tracking-widest text-brand uppercase">
            How It Works
          </span>
          <h2 className="text-2xl font-bold tracking-tight uppercase sm:text-4xl">
            From Feedback To Drill
          </h2>
          <p className="text-sm text-muted-foreground">
            Hover each step to see it in action.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Step 1: Input */}
          <div className="group relative h-80 overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center transition-opacity duration-300 group-hover:opacity-0">
              <span className="text-xs font-bold tracking-widest text-brand uppercase">
                Step 01
              </span>
              <span className="text-3xl font-bold tracking-tight uppercase">
                Input
              </span>
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
          <div className="group relative h-80 overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center transition-opacity duration-300 group-hover:opacity-0">
              <span className="text-xs font-bold tracking-widest text-brand uppercase">
                Step 02
              </span>
              <span className="text-3xl font-bold tracking-tight uppercase">
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
              <p className="text-sm font-semibold tracking-wide text-foreground uppercase">
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
          <div className="group relative h-80 overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center transition-opacity duration-300 group-hover:opacity-0">
              <span className="text-xs font-bold tracking-widest text-brand uppercase">
                Step 03
              </span>
              <span className="text-3xl font-bold tracking-tight uppercase">
                Output
              </span>
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

      {/* Editorial image break */}
      <section className="relative flex min-h-[320px] items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1624280157150-4d1ed8632989"
          alt="Two players battling for the ball on a sunlit pitch"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-foreground/50" />
        <p className="relative max-w-2xl px-6 text-center text-2xl font-bold tracking-tight text-background uppercase sm:text-4xl">
          Every Touch. Every Session.
          <span className="text-brand"> Every Position.</span>
        </p>
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
          <p className="max-w-md text-background/80">
            Get a position-specific breakdown of your next piece of coach
            feedback in under a minute.
          </p>
          <Link
            href="/demo"
            className="rounded-full bg-brand px-8 py-3 text-sm font-bold tracking-wide text-brand-foreground uppercase transition-transform hover:scale-105"
          >
            Start with the Demo
          </Link>
        </div>
      </section>
    </main>
  );
}
