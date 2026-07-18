import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";

/**
 * Service-role client that bypasses RLS. Server-only — never import this
 * from a client component, and never expose SUPABASE_SERVICE_ROLE_KEY to
 * the browser.
 */
export function createAdminClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
