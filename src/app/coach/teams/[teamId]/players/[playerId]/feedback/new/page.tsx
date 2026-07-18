import Link from "next/link";
import { redirect } from "next/navigation";
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

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-6 py-12">
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

      <div className="rounded-3xl bg-card p-6 shadow-soft sm:p-8">
        <FeedbackForm teamId={team.id} playerId={playerId} />
      </div>
    </div>
  );
}
