"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FeedbackBreakdown } from "~/lib/feedback-breakdown";
import { generateFeedbackBreakdown } from "~/lib/feedback-breakdown";
import { createClient } from "~/lib/supabase/server";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Elite"] as const;

export interface FeedbackActionState {
  error?: string;
}

export async function submitFeedback(
  _prevState: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const teamId = formData.get("teamId");
  const playerId = formData.get("playerId");
  const coachText = formData.get("coachText");
  const breakdownRequested = formData.get("aiBreakdown") === "on";

  if (
    typeof teamId !== "string" ||
    typeof playerId !== "string" ||
    typeof coachText !== "string" ||
    !coachText.trim()
  ) {
    return { error: "Feedback text is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // The composite FK on feedback(team_id, player_id) -> team_members
  // guarantees this insert fails if playerId isn't actually on this roster.
  const { data: playerProfile } = await supabase
    .from("profiles")
    .select("positions")
    .eq("id", playerId)
    .single();

  const trimmedText = coachText.trim();
  const breakdown = await generateFeedbackBreakdown({
    coachText: trimmedText,
    expand: breakdownRequested,
    position: playerProfile?.positions?.[0] ?? null,
  });

  const { error } = await supabase.from("feedback").insert({
    team_id: teamId,
    player_id: playerId,
    coach_id: user.id,
    coach_text: trimmedText,
    ai_breakdown_requested: breakdownRequested,
    ai_expanded_text: breakdown.expandedFeedback,
    ai_next_steps: breakdown.nextSteps,
    ai_drills: breakdown.drills,
  });

  if (error) return { error: error.message };

  revalidatePath(`/coach/teams/${teamId}`);
  redirect(`/coach/teams/${teamId}`);
}

export interface UpdateFeedbackDrillsState {
  error?: string;
}

export async function updateFeedbackDrills(
  feedbackId: string,
  drills: FeedbackBreakdown["drills"],
): Promise<UpdateFeedbackDrillsState> {
  if (
    !Array.isArray(drills) ||
    drills.some(
      (drill) =>
        typeof drill.title !== "string" ||
        !drill.title.trim() ||
        typeof drill.description !== "string" ||
        !drill.description.trim() ||
        !DIFFICULTIES.includes(drill.difficulty),
    )
  ) {
    return { error: "Each drill needs a title, description, and difficulty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: feedbackRow, error: fetchError } = await supabase
    .from("feedback")
    .select("team_id, player_id")
    .eq("id", feedbackId)
    .eq("coach_id", user.id)
    .single();

  if (fetchError || !feedbackRow) {
    return { error: "Feedback not found." };
  }

  const { error } = await supabase
    .from("feedback")
    .update({ ai_drills: drills })
    .eq("id", feedbackId)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(
    `/coach/teams/${feedbackRow.team_id}/players/${feedbackRow.player_id}/feedback/new`,
  );
  revalidatePath(`/teams/${feedbackRow.team_id}`);

  return {};
}

export interface ToggleFeedbackDrillCompletedState {
  error?: string;
}

export async function toggleFeedbackDrillCompleted(
  feedbackId: string,
  drillIndex: number,
  completed: boolean,
): Promise<ToggleFeedbackDrillCompletedState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: feedbackRow, error: fetchError } = await supabase
    .from("feedback")
    .select("team_id, ai_drills")
    .eq("id", feedbackId)
    .eq("player_id", user.id)
    .single();

  if (fetchError || !feedbackRow) {
    return { error: "Feedback not found." };
  }

  const drills = feedbackRow.ai_drills as FeedbackBreakdown["drills"];
  if (!drills[drillIndex]) {
    return { error: "Drill not found." };
  }

  const updatedDrills = drills.map((drill, i) =>
    i === drillIndex ? { ...drill, completed } : drill,
  );

  const { error } = await supabase
    .from("feedback")
    .update({ ai_drills: updatedDrills })
    .eq("id", feedbackId)
    .eq("player_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${feedbackRow.team_id}`);

  return {};
}
