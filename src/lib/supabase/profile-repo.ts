import { createClient } from "~/lib/supabase/client";

export async function fetchProfilePositions(): Promise<string[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("positions")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data?.positions ?? [];
}
