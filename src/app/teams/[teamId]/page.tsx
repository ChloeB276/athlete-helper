import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FeedbackCard,
  type FeedbackCardItem,
} from "~/components/feedback-card";
import { Badge } from "~/components/ui/badge";
import { createClient } from "~/lib/supabase/server";

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export default async function PlayerTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, teams(name)")
    .eq("team_id", teamId)
    .eq("player_id", user.id)
    .single();

  if (!membership) {
    redirect("/teams");
  }

  const teamName =
    (membership.teams as unknown as { name: string } | null)?.name ?? "Team";

  const { data: feedback } = await supabase
    .from("feedback")
    .select(
      "id, coach_text, ai_expanded_text, ai_next_steps, ai_drills, created_at",
    )
    .eq("team_id", teamId)
    .eq("player_id", user.id)
    .order("created_at", { ascending: false });

  const feedbackItems: FeedbackCardItem[] = (feedback ?? []).map((row) => ({
    id: row.id,
    coachText: row.coach_text,
    aiExpandedText: row.ai_expanded_text,
    aiNextSteps: row.ai_next_steps,
    aiDrills: row.ai_drills as FeedbackCardItem["aiDrills"],
    createdAt: row.created_at,
  }));

  const { data: attendance } = await supabase
    .from("attendance")
    .select("date, present")
    .eq("team_id", teamId)
    .eq("player_id", user.id)
    .order("date", { ascending: false });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/teams" className="text-sm text-muted-foreground">
          ← All teams
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{teamName}</h1>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Attendance</h2>
        {attendance && attendance.length > 0 ? (
          <div className="flex flex-wrap gap-2 rounded-3xl bg-card p-6 shadow-soft">
            {attendance.map((row) => (
              <Badge
                key={row.date}
                variant={row.present ? "default" : "destructive"}
              >
                {formatDate(row.date)} · {row.present ? "Present" : "Absent"}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
            <p className="text-muted-foreground">No attendance recorded yet.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Feedback</h2>
        {feedbackItems.length > 0 ? (
          feedbackItems.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
            <p className="text-muted-foreground">
              No feedback yet. Once your coach sends some, it'll show up here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
