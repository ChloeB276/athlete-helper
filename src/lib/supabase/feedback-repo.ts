import type { FeedbackBreakdown } from "~/lib/feedback-breakdown";
import { createClient } from "~/lib/supabase/client";

export interface FeedbackItem {
  id: string;
  teamName: string;
  coachEmail: string;
  coachText: string;
  aiBreakdownRequested: boolean;
  aiExpandedText: string | null;
  aiNextSteps: string[];
  aiDrills: FeedbackBreakdown["drills"];
  createdAt: string;
}

interface FeedbackRow {
  id: string;
  coach_text: string;
  ai_breakdown_requested: boolean;
  ai_expanded_text: string | null;
  ai_next_steps: string[];
  ai_drills: FeedbackBreakdown["drills"];
  created_at: string;
  teams: { name: string } | null;
  coach: { email: string } | null;
}

export async function fetchFeedbackForPlayer(): Promise<FeedbackItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("feedback")
    .select(
      "id, coach_text, ai_breakdown_requested, ai_expanded_text, ai_next_steps, ai_drills, created_at, teams(name), coach:profiles!feedback_coach_id_fkey(email)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as FeedbackRow[]).map((row) => ({
    id: row.id,
    teamName: row.teams?.name ?? "Unknown team",
    coachEmail: row.coach?.email ?? "Unknown coach",
    coachText: row.coach_text,
    aiBreakdownRequested: row.ai_breakdown_requested,
    aiExpandedText: row.ai_expanded_text,
    aiNextSteps: row.ai_next_steps,
    aiDrills: row.ai_drills,
    createdAt: row.created_at,
  }));
}
