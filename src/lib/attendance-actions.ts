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

async function assertPlayerOnTeam(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  userId: string,
) {
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("team_id", teamId)
    .eq("player_id", userId)
    .single();
  return !!membership;
}

const MAX_DATES_PER_RANGE = 200;

function datesInRange(
  startDate: string,
  endDate: string,
  weekdays: Set<number>,
): string[] {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const cursor = new Date(Date.UTC(sy ?? 0, (sm ?? 1) - 1, sd ?? 1));
  const end = new Date(Date.UTC(ey ?? 0, (em ?? 1) - 1, ed ?? 1));

  const dates: string[] = [];
  while (cursor <= end && dates.length <= MAX_DATES_PER_RANGE) {
    if (weekdays.size === 0 || weekdays.has(cursor.getUTCDay())) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

async function seedAttendanceForDates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  dates: string[],
) {
  if (dates.length === 0) return;

  const { data: roster } = await supabase
    .from("team_members")
    .select("player_id")
    .eq("team_id", teamId);

  const rows = (roster ?? []).flatMap((member) =>
    dates.map((date) => ({
      team_id: teamId,
      player_id: member.player_id,
      date,
      present: true,
    })),
  );

  if (rows.length > 0) {
    const { error } = await supabase.from("attendance").upsert(rows, {
      onConflict: "team_id,player_id,date",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }
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

  const today = new Date().toISOString().slice(0, 10);
  await seedAttendanceForDates(supabase, teamId, [today]);

  revalidatePath(`/coach/teams/${teamId}`);
}

export async function addAttendanceDateRange(
  teamId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  if (!(await assertCoachesTeam(supabase, teamId, user.id))) {
    throw new Error("Team not found.");
  }

  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    !startDate ||
    !endDate
  ) {
    throw new Error("Start and end dates are required.");
  }
  if (endDate < startDate) {
    throw new Error("End date must be on or after the start date.");
  }

  const weekdays = new Set(
    formData
      .getAll("weekday")
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value)),
  );

  const dates = datesInRange(startDate, endDate, weekdays);
  if (dates.length > MAX_DATES_PER_RANGE) {
    throw new Error(`Date range is too large (max ${MAX_DATES_PER_RANGE}).`);
  }

  await seedAttendanceForDates(supabase, teamId, dates);

  revalidatePath(`/coach/teams/${teamId}`);
}

export async function bulkSetAttendance(
  teamId: string,
  playerId: string,
  dates: string[],
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
  if (dates.length === 0) return;

  const rows = dates.map((date) => ({
    team_id: teamId,
    player_id: playerId,
    date,
    present,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "team_id,player_id,date" });
  if (error) throw error;

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

export async function addOwnAttendanceDate(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  if (!(await assertPlayerOnTeam(supabase, teamId, user.id))) {
    throw new Error("Team not found.");
  }

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("attendance").upsert(
    {
      team_id: teamId,
      player_id: user.id,
      date: today,
      present: true,
    },
    { onConflict: "team_id,player_id,date", ignoreDuplicates: true },
  );
  if (error) throw error;

  revalidatePath(`/attendance/${teamId}`);
}

export async function setOwnAttendance(
  teamId: string,
  date: string,
  present: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  if (!(await assertPlayerOnTeam(supabase, teamId, user.id))) {
    throw new Error("Team not found.");
  }

  const { error } = await supabase.from("attendance").upsert(
    {
      team_id: teamId,
      player_id: user.id,
      date,
      present,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "team_id,player_id,date" },
  );
  if (error) throw error;

  revalidatePath(`/attendance/${teamId}`);
}
