"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";

async function assertCoachesTeam(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  userId: string,
) {
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("coach_id", userId)
    .single();
  return !!team;
}

export async function addAttendanceDate(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  if (!(await assertCoachesTeam(supabase, teamId, user.id))) {
    throw new Error("Team not found.");
  }

  const { data: roster } = await supabase
    .from("team_members")
    .select("player_id")
    .eq("team_id", teamId);

  const today = new Date().toISOString().slice(0, 10);
  const rows = (roster ?? []).map((member) => ({
    team_id: teamId,
    player_id: member.player_id,
    date: today,
    present: true,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from("attendance").upsert(rows, {
      onConflict: "team_id,player_id,date",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  revalidatePath(`/coach/teams/${teamId}`);
}

export async function setAttendance(
  teamId: string,
  playerId: string,
  date: string,
  present: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  if (!(await assertCoachesTeam(supabase, teamId, user.id))) {
    throw new Error("Team not found.");
  }

  const { error } = await supabase.from("attendance").upsert(
    {
      team_id: teamId,
      player_id: playerId,
      date,
      present,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "team_id,player_id,date" },
  );
  if (error) throw error;

  revalidatePath(`/coach/teams/${teamId}`);
}
