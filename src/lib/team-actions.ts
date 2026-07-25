"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { env } from "~/env";
import { createAdminClient } from "~/lib/supabase/admin";
import { createClient } from "~/lib/supabase/server";

export interface TeamActionState {
  error?: string;
  success?: string;
}

export async function createTeam(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "Team name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("teams")
    .insert({ coach_id: user.id, name: name.trim() });
  if (error) return { error: error.message };

  revalidatePath("/coach/teams");
  return { success: "Team created." };
}

export async function inviteToTeam(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const teamId = formData.get("teamId");
  const email = formData.get("email");
  if (
    typeof teamId !== "string" ||
    typeof email !== "string" ||
    !email.trim()
  ) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Confirm the caller actually coaches this team before using the
  // service-role client below (which bypasses RLS entirely).
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("coach_id", user.id)
    .single();
  if (!team) return { error: "Team not found." };

  const admin = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingProfile) {
    const { error } = await admin
      .from("team_members")
      .insert({ team_id: teamId, player_id: existingProfile.id });
    if (error) return { error: error.message };

    revalidatePath(`/coach/teams/${teamId}`);
    return { success: "Player added to the roster." };
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = env.NODE_ENV === "production" ? "https" : "http";

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      data: { invited_team_id: teamId },
      redirectTo: `${protocol}://${host}/onboarding`,
    },
  );
  if (inviteError) return { error: inviteError.message };

  revalidatePath(`/coach/teams/${teamId}`);
  return { success: "Invite sent." };
}

export async function removeFromRoster(teamId: string, playerId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("player_id", playerId);
  if (error) throw error;

  revalidatePath(`/coach/teams/${teamId}`);
}

export async function renameTeam(
  teamId: string,
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "Team name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("teams")
    .update({ name: name.trim() })
    .eq("id", teamId)
    .eq("coach_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/coach/teams/${teamId}`);
  revalidatePath("/coach/teams");
  revalidatePath("/");
  return { success: "Team renamed." };
}

export async function deleteTeam(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .eq("coach_id", user.id);
  if (error) throw error;

  revalidatePath("/coach/teams");
  revalidatePath("/");
}
