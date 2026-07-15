"use server";

import { redirect } from "next/navigation";
import { FEET, type Foot } from "~/lib/onboarding";
import { createClient } from "~/lib/supabase/server";

export interface OnboardingActionState {
  error?: string;
}

function isFoot(value: unknown): value is Foot {
  return typeof value === "string" && FEET.includes(value as Foot);
}

export async function completeOnboarding(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const positions = formData
    .getAll("positions")
    .filter((value): value is string => typeof value === "string");
  const strongFoot = formData.get("strongFoot");

  if (positions.length === 0) {
    return { error: "Pick at least one position." };
  }
  if (!isFoot(strongFoot)) {
    return { error: "Select your strong foot." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      positions,
      strong_foot: strongFoot,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}
