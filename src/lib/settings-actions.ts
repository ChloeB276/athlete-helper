"use server";

import { revalidatePath } from "next/cache";
import { FEET, type Foot } from "~/lib/onboarding";
import { createClient } from "~/lib/supabase/server";

export interface SettingsActionState {
  error?: string;
  success?: string;
}

function isFoot(value: unknown): value is Foot {
  return typeof value === "string" && FEET.includes(value as Foot);
}

export async function updateSettings(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const sport = formData.get("sport");
  const positions = formData
    .getAll("positions")
    .filter((value): value is string => typeof value === "string");
  const strongFoot = formData.get("strongFoot");

  if (typeof sport !== "string" || !sport.trim()) {
    return { error: "Sport is required." };
  }
  if (positions.length === 0) {
    return { error: "Pick at least one position." };
  }
  if (!isFoot(strongFoot)) {
    return { error: "Select your strong foot." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ sport: sport.trim(), positions, strong_foot: strongFoot })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: "Settings saved." };
}
