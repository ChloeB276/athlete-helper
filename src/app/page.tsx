import { redirect } from "next/navigation";
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
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_completed_at) {
      redirect("/onboarding");
    }

    return <SignedInHome />;
  }

  return <LandingPage />;
}
