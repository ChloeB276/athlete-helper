import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FeedbackCard,
  type FeedbackCardItem,
} from "~/components/feedback-card";
import { FeedbackForm } from "~/components/feedback-form";
import { createClient } from "~/lib/supabase/server";

export default async function NewFeedbackPage({
  params,
}: {
  params: Promise<{ teamId: string; playerId: string }>;
}) {
  const { teamId, playerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .eq("coach_id", user.id)
    .single();

  if (!team) {
    redirect("/coach/teams");
  }

  const { data: member } = await supabase
    .from("team_members")
    .select("player_id, profiles(email)")
    .eq("team_id", teamId)
    .eq("player_id", playerId)
    .single();

  if (!member) {
    redirect(`/coach/teams/${teamId}`);
  }

  const email =
    (member.profiles as unknown as { email: string } | null)?.email ?? "";

  const { data: pastFeedback } = await supabase
    .from("feedback")
    .select(
      "id, coach_text, ai_expanded_text, ai_next_steps, ai_drills, created_at",
    )
    .eq("team_id", teamId)
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  const history: FeedbackCardItem[] = (pastFeedback ?? []).map((row) => ({
    id: row.id,
    coachText: row.coach_text,
    aiExpandedText: row.ai_expanded_text,
    aiNextSteps: row.ai_next_steps,
    aiDrills: row.ai_drills as FeedbackCardItem["aiDrills"],
    createdAt: row.created_at,
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link
          href={`/coach/teams/${team.id}`}
          className="text-sm text-muted-foreground"
        >
          ← {team.name}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Feedback for {email}
        </h1>
      </div>

      <div className="mx-auto w-full max-w-md rounded-3xl bg-card p-6 shadow-soft sm:p-8">
        <FeedbackForm teamId={team.id} playerId={playerId} />
      </div>

      {history.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">History</h2>
          {history.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
