import type { createClient } from "~/lib/supabase/server";

export interface PlanContext {
  role: "coach" | "player" | null;
  isSubscribed: boolean;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionEmbed {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export async function getPlanContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<PlanContext> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "role, is_admin, subscriptions(status, current_period_end, cancel_at_period_end)",
    )
    .eq("id", userId)
    .single();

  const sub = (data?.subscriptions ?? null) as SubscriptionEmbed | null;
  const subscribed = sub?.status === "active" || sub?.status === "trialing";

  return {
    role: (data?.role as PlanContext["role"]) ?? null,
    isSubscribed: !!data?.is_admin || subscribed,
    status: sub?.status ?? "none",
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
  };
}
