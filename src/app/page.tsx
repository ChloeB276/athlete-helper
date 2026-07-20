import { redirect } from "next/navigation";
import { CoachHome } from "~/components/coach-home";
import { LandingPage } from "~/components/landing-page";
import { SignedInHome } from "~/components/signed-in-home";
import { createClient } from "~/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed_at")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_completed_at) {
      redirect("/onboarding");
    }

    if (profile.role === "coach") {
      return <CoachHome userId={user.id} />;
    }

    return <SignedInHome />;
  }

  return <LandingPage />;
}
