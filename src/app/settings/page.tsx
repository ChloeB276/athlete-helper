import { redirect } from "next/navigation";
import { SettingsForm } from "~/components/settings-form";
import { signOut } from "~/lib/auth-actions";
import { createClient } from "~/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role, sport, positions, strong_foot")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="rounded-3xl bg-card p-6 shadow-soft">
        <h2 className="mb-3 text-sm font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Sign Out
          </button>
        </form>
      </div>

      {profile?.role === "player" && (
        <div className="rounded-3xl bg-card p-6 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold">Player profile</h2>
          <SettingsForm
            sport={profile.sport ?? "Soccer"}
            positions={profile.positions ?? []}
            strongFoot={profile.strong_foot ?? null}
          />
        </div>
      )}
    </div>
  );
}
