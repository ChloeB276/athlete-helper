"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";

export async function updateEquipment(formData: FormData) {
  const equipment = formData
    .getAll("equipment")
    .filter((value): value is string => typeof value === "string");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { error } = await supabase
    .from("profiles")
    .update({ equipment })
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/");
}
