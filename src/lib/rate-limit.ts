import { createAdminClient } from "~/lib/supabase/admin";

/**
 * Returns true if the request identified by `key` is still within
 * `maxRequests` for the trailing `windowSeconds` window, atomically
 * incrementing the counter as a side effect. Backed by the
 * `check_rate_limit` Postgres function so concurrent requests can't race
 * past the limit.
 */
export async function checkRateLimit(
  key: string,
  {
    windowSeconds,
    maxRequests,
  }: { windowSeconds: number; maxRequests: number },
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });

  if (error) {
    console.error(error);
    // Fail open: a rate-limit outage shouldn't take down the feature itself.
    return true;
  }

  return data as boolean;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}
