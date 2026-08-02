import {
  createCheckoutSession,
  createPortalSession,
} from "~/lib/billing-actions";
import type { PlanContext } from "~/lib/plan";
import { cn } from "~/lib/utils";

export const FEATURES: Record<
  "player" | "coach",
  { free: string[]; pro: string[] }
> = {
  player: {
    free: ["5 drill generations / month"],
    pro: ["30 drill generations / month"],
  },
  coach: {
    free: ["1 team", "3 drill recommendations / week"],
    pro: ["Unlimited teams", "10 drill recommendations / week"],
  },
};

function Check() {
  return (
    <span
      aria-hidden="true"
      className="flex h-4 w-4 shrink-0 items-center justify-center text-brand"
    >
      ✓
    </span>
  );
}

export function PlanCard({
  plan,
  title = "Plan",
}: {
  plan: PlanContext;
  title?: string;
}) {
  const features = FEATURES[plan.role === "coach" ? "coach" : "player"];

  return (
    <div className="@container flex flex-col gap-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
        <div
          className={cn(
            "flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-soft ring-1",
            !plan.isSubscribed ? "ring-brand" : "ring-transparent",
          )}
        >
          <div>
            <span className="text-sm font-semibold text-muted-foreground">
              Free
            </span>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              $0
              <span className="text-sm font-medium text-muted-foreground">
                /mo
              </span>
            </p>
          </div>
          <ul className="flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
            {features.free.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check />
                {feature}
              </li>
            ))}
          </ul>
          <span className="rounded-full border border-border px-4 py-2 text-center text-sm font-medium text-muted-foreground">
            {plan.isSubscribed ? "—" : "Current plan"}
          </span>
        </div>

        <div
          className={cn(
            "relative flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-soft ring-1",
            plan.isSubscribed ? "ring-brand" : "ring-transparent",
          )}
        >
          {!plan.isSubscribed && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
              Recommended
            </span>
          )}
          <div>
            <span className="text-sm font-semibold text-brand">
              Athlete Helper Pro
            </span>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              $8
              <span className="text-sm font-medium text-muted-foreground">
                /mo
              </span>
            </p>
          </div>
          <ul className="flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
            {features.pro.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check />
                {feature}
              </li>
            ))}
          </ul>
          {plan.isSubscribed ? (
            <>
              <p className="text-center text-xs text-muted-foreground">
                {plan.status}
                {plan.currentPeriodEnd &&
                  ` · renews ${new Date(plan.currentPeriodEnd).toLocaleDateString()}`}
                {plan.cancelAtPeriodEnd && " (cancels at period end)"}
              </p>
              <form action={createPortalSession}>
                <button
                  type="submit"
                  className="w-full rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Manage billing
                </button>
              </form>
            </>
          ) : (
            <form action={createCheckoutSession}>
              <button
                type="submit"
                className="w-full rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:scale-[1.02] hover:bg-brand/90"
              >
                Upgrade — $8/mo
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
