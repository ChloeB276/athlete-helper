import { LandingPage } from "~/components/landing-page";
import { SignedInHome } from "~/components/signed-in-home";
import { createClient } from "~/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return <SignedInHome />;
  }

  return <LandingPage />;
}
