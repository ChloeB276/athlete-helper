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

export interface SessionPlanData {
  email: string;
  sport: string;
  position: string | null;
  plan: LatestPlan | null;
  coachCue: string | null;
  equipment: Equipment[];
  streak: number;
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
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, sport, positions")
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
      .select("coach_text, created_at")
      .eq("player_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("drills")
      .select("chat_messages(created_at)")
      .eq("kept", true),
  ]);

  const chatRow = ((chats ?? []) as unknown as ChatRow[])[0];
  const plan = chatRow ? mapPlan(chatRow) : null;

  const streakDates = (
    (keptDrills ?? []) as unknown as Array<{
      chat_messages: { created_at: string } | null;
    }>
  )
    .map((row) => row.chat_messages?.created_at?.slice(0, 10))
    .filter((date): date is string => Boolean(date));

  return {
    email: profile?.email ?? "",
    sport: profile?.sport ?? "Soccer",
    position: plan?.position ?? profile?.positions?.[0] ?? null,
    plan,
    coachCue: feedback?.coach_text ?? null,
    equipment: plan?.trainingContext?.equipment ?? [],
    streak: computeStreak(streakDates),
  };
}
