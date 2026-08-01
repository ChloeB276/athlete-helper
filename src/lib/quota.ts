import type { PlanContext } from "~/lib/plan";
import { getPlanContext } from "~/lib/plan";
import { peekRateLimit } from "~/lib/rate-limit";
import type { createClient } from "~/lib/supabase/server";

export const DAY_SECONDS = 24 * 60 * 60;
export const PLAYER_DRILL_LIMITS = { free: 5, paid: 30 };
export const COACH_DRILL_LIMITS = { free: 3, paid: 10 };
export const FREE_TEAM_LIMIT = 1;

export interface DrillQuotaWindow {
  windowSeconds: number;
  maxRequests: number;
  windowLabel: "month" | "week";
}

export function drillQuotaKey(
  plan: Pick<PlanContext, "role">,
  userId: string,
): string {
  return plan.role === "coach"
    ? `drill-gen:coach:${userId}`
    : `drill-gen:player:${userId}`;
}

export function drillQuotaWindow(
  plan: Pick<PlanContext, "role" | "isSubscribed">,
): DrillQuotaWindow {
  const isCoach = plan.role === "coach";
  const limits = isCoach ? COACH_DRILL_LIMITS : PLAYER_DRILL_LIMITS;
  return {
    windowSeconds: isCoach ? 7 * DAY_SECONDS : 30 * DAY_SECONDS,
    maxRequests: plan.isSubscribed ? limits.paid : limits.free,
    windowLabel: isCoach ? "week" : "month",
  };
}

export interface DrillQuota {
  used: number;
  max: number;
  remaining: number;
  windowLabel: "month" | "week";
}

export async function getDrillQuota(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<DrillQuota> {
  const plan = await getPlanContext(supabase, userId);
  const key = drillQuotaKey(plan, userId);
  const { windowSeconds, maxRequests, windowLabel } = drillQuotaWindow(plan);
  const { used, remaining } = await peekRateLimit(key, {
    windowSeconds,
    maxRequests,
  });
  return { used, max: maxRequests, remaining, windowLabel };
}
