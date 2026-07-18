"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateFeedbackBreakdown } from "~/lib/feedback-breakdown";
import { createClient } from "~/lib/supabase/server";

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
