import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayerProfileForm } from "~/components/player-profile-form";
import { createClient } from "~/lib/supabase/server";

export default async function EditPlayerProfilePage({
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
    .select("player_id, profiles(email, positions, strong_foot)")
    .eq("team_id", teamId)
    .eq("player_id", playerId)
    .single();

  if (!member) {
    redirect(`/coach/teams/${teamId}`);
  }

  const profile = member.profiles as unknown as {
    email: string;
    positions: string[] | null;
    strong_foot: string | null;
  } | null;

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
          Edit {profile?.email ?? "player"}
        </h1>
      </div>

      <div className="mx-auto w-full max-w-md rounded-3xl bg-card p-6 shadow-soft sm:p-8">
        <PlayerProfileForm
          teamId={team.id}
          playerId={playerId}
          positions={profile?.positions ?? []}
          strongFoot={profile?.strong_foot ?? null}
        />
      </div>
    </div>
  );
}
