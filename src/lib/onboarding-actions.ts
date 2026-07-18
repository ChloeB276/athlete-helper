"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FEET, type Foot, ROLES, type Role } from "~/lib/onboarding";
import { createClient } from "~/lib/supabase/server";

export interface OnboardingActionState {
  error?: string;
}

function isFoot(value: unknown): value is Foot {
  return typeof value === "string" && FEET.includes(value as Foot);
}

function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

export async function selectRole(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const role = formData.get("role");

  if (!isRole(role)) {
    return { error: "Select coach or player." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Coaches skip the position/foot step entirely, so onboarding is done as
  // soon as they pick a role. Players still complete onboarding via
  // completeOnboarding below.
  const { error } = await supabase
    .from("profiles")
    .update(
      role === "coach"
        ? { role, onboarding_completed_at: new Date().toISOString() }
        : { role },
    )
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
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

  revalidatePath("/", "layout");
  redirect("/");
}
