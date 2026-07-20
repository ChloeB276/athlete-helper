"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";

export async function setDrillKept(drillId: string, kept: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { error } = await supabase
    .from("drills")
    .update({ kept })
    .eq("id", drillId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/session-plan");
}
