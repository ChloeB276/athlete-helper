import { createClient } from "~/lib/supabase/client";

export interface Team {
  id: string;
  name: string;
  createdAt: string;
}

export async function fetchMyTeams(): Promise<Team[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("teams")
    .select("id, name, created_at")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((team) => ({
    id: team.id,
    name: team.name,
    createdAt: team.created_at,
  }));
}

export interface RosterPlayer {
  playerId: string;
  email: string;
  joinedAt: string;
}

export async function fetchRoster(teamId: string): Promise<RosterPlayer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("player_id, joined_at, profiles(email)")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    playerId: row.player_id,
    email: (row.profiles as unknown as { email: string } | null)?.email ?? "",
    joinedAt: row.joined_at,
  }));
}
