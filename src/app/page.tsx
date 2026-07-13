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
    href: "/drills",
    cta: "Explore Drills",
    image: "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e",
    imageAlt: "Player controlling a soccer ball at their feet",
  },
  {
    title: "AI Coach",
    description:
      "Get a position-specific breakdown of your coach's feedback in seconds.",
    href: "/demo",
    cta: "Try the Demo",
    image: "https://images.unsplash.com/photo-1574772135913-d519461c3996",
    imageAlt: "Coach carrying a bag of soccer balls across a foggy pitch",
  },
  {
    title: "Every Position",
    description:
      "Goalkeeper to striker — get drills tuned to what your role actually demands.",
    href: "/drills",
    cta: "See How It Works",
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
            Built for soccer
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
          <Link
            key={feature.title}
            href={feature.href}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground"
          >
            <div className="relative aspect-4/3 overflow-hidden">
              <Image
                src={feature.image}
                alt={feature.imageAlt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(min-width: 640px) 33vw, 100vw"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between gap-4 p-8">
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
            </div>
          </Link>
        ))}
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
