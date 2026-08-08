import type { Drill, DrillDifficulty, Equipment } from "~/lib/soccer-feedback";
import { computeStreak } from "~/lib/streak";
import { createClient } from "~/lib/supabase/server";

interface DrillRow {
  id: string;
  position_index: number;
  difficulty: string;
  title: string;
  description: string;
  source_title: string | null;
  image_url: string | null;
  video_url: string | null;
  kept: boolean;
}

interface ChatMessageRow {
  id: string;
  content: string;
  outro: string | null;
  created_at: string;
  drills: DrillRow[];
}

interface ChatRow {
  id: string;
  position: string | null;
  training_partners: number | null;
  training_equipment: string[] | null;
  updated_at: string;
  chat_messages: ChatMessageRow[];
}

export interface LatestPlan {
  chatId: string;
  position: string | null;
  trainingContext: { partners: number; equipment: Equipment[] } | null;
  intro: string;
  outro: string | null;
  drills: Drill[];
  updatedAt: string;
}

export interface AttendanceSummaryRow {
  teamId: string;
  teamName: string;
  date: string;
  present: boolean;
}

export interface ChatSummary {
  id: string;
  title: string;
  folderId: string | null;
  drillCount: number;
  updatedAt: string;
}

export interface FolderSummary {
  id: string;
  name: string;
}

export interface SessionPlanData {
  email: string;
  sport: string;
  position: string | null;
  plan: LatestPlan | null;
  coachCueTeams: string[];
  equipment: Equipment[];
  streak: number;
  recentAttendance: AttendanceSummaryRow[];
  chats: ChatSummary[];
  folders: FolderSummary[];
}

function mapDrill(row: DrillRow): Drill {
  return {
    id: row.id,
    difficulty: row.difficulty as DrillDifficulty,
    title: row.title,
    description: row.description,
    sourceTitle: row.source_title,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    kept: row.kept,
  };
}

function mapPlan(row: ChatRow): LatestPlan | null {
  const latestMessage = [...row.chat_messages]
    .filter((m) => m.drills.length > 0)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!latestMessage) return null;

  const drills = [...latestMessage.drills]
    .sort((a, b) => a.position_index - b.position_index)
    .map(mapDrill);

  return {
    chatId: row.id,
    position: row.position,
    trainingContext:
      row.training_partners === null
        ? null
        : {
            partners: row.training_partners,
            equipment: (row.training_equipment ?? []) as Equipment[],
          },
    intro: latestMessage.content,
    outro: latestMessage.outro,
    drills,
    updatedAt: row.updated_at,
  };
}

export async function getSessionPlanData(
  userId: string,
): Promise<SessionPlanData> {
  const supabase = await createClient();

  const [
    { data: profile },
    { data: chats },
    { data: feedback },
    { data: keptDrills },
    { data: attendanceRows },
    { data: allChats },
    { data: allFolders },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, sport, positions, equipment")
      .eq("id", userId)
      .single(),
    supabase
      .from("chats")
      .select(
        "id, position, training_partners, training_equipment, updated_at, chat_messages(id, content, outro, created_at, drills(id, position_index, difficulty, title, description, source_title, image_url, video_url, kept))",
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("feedback")
      .select("team_id, teams(name), created_at")
      .eq("player_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("drills")
      .select("chat_messages(created_at)")
      .eq("kept", true),
    supabase
      .from("attendance")
      .select("team_id, date, present, teams(name)")
      .eq("player_id", userId)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("chats")
      .select("id, folder_id, title, updated_at, chat_messages(drills(id))")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("folders")
      .select("id, name")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const chatRow = ((chats ?? []) as unknown as ChatRow[])[0];
  const plan = chatRow ? mapPlan(chatRow) : null;

  const chatSummaries: ChatSummary[] = (
    (allChats ?? []) as unknown as Array<{
      id: string;
      folder_id: string | null;
      title: string;
      updated_at: string;
      chat_messages: Array<{ drills: Array<{ id: string }> }>;
    }>
  ).map((row) => ({
    id: row.id,
    title: row.title,
    folderId: row.folder_id,
    drillCount: row.chat_messages.reduce(
      (sum, message) => sum + message.drills.length,
      0,
    ),
    updatedAt: row.updated_at,
  }));

  const folderSummaries: FolderSummary[] = (
    (allFolders ?? []) as unknown as Array<{ id: string; name: string }>
  ).map((row) => ({ id: row.id, name: row.name }));

  const streakDates = (
    (keptDrills ?? []) as unknown as Array<{
      chat_messages: { created_at: string } | null;
    }>
  )
    .map((row) => row.chat_messages?.created_at?.slice(0, 10))
    .filter((date): date is string => Boolean(date));

  const recentAttendance: AttendanceSummaryRow[] = (
    (attendanceRows ?? []) as unknown as Array<{
      team_id: string;
      date: string;
      present: boolean;
      teams: { name: string } | null;
    }>
  ).map((row) => ({
    teamId: row.team_id,
    teamName: row.teams?.name ?? "Team",
    date: row.date,
    present: row.present,
  }));

  const coachCueTeams: string[] = [];
  const seenTeamIds = new Set<string>();
  for (const row of (feedback ?? []) as unknown as Array<{
    team_id: string;
    teams: { name: string } | null;
  }>) {
    if (seenTeamIds.has(row.team_id)) continue;
    seenTeamIds.add(row.team_id);
    coachCueTeams.push(row.teams?.name ?? "Team");
  }

  return {
    email: profile?.email ?? "",
    sport: profile?.sport ?? "Soccer",
    position: plan?.position ?? profile?.positions?.[0] ?? null,
    plan,
    coachCueTeams,
    equipment: (profile?.equipment ?? []) as Equipment[],
    streak: computeStreak(streakDates),
    recentAttendance,
    chats: chatSummaries,
    folders: folderSummaries,
  };
}
