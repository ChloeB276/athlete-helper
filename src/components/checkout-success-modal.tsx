"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FEATURES } from "~/components/plan-card";
import type { PlanContext } from "~/lib/plan";

export function CheckoutSuccessModal({ plan }: { plan: PlanContext }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return;
    router.replace("/settings");
    if (plan.isSubscribed) setOpen(true);
  }, [searchParams, router, plan.isSubscribed]);

  if (!open) return null;

  const features = FEATURES[plan.role === "coach" ? "coach" : "player"].pro;

  function close() {
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-soft">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
        >
          ×
        </button>
        <span className="text-sm font-semibold text-brand">
          Athlete Helper Pro
        </span>
        <h2 className="mt-1 text-xl font-bold tracking-tight">
          You're on Pro now
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Thanks for subscribing. Here's what just unlocked:
        </p>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-4 w-4 shrink-0 items-center justify-center text-brand"
              >
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={close}
          className="mt-6 w-full rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.02]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
