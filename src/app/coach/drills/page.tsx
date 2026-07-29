import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDrillQuota } from "~/lib/quota";
import { createClient } from "~/lib/supabase/server";
import { CoachDrillsChat } from "./coach-drills-chat";

export default async function CoachDrillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const quota = await getDrillQuota(supabase, user.id);

  return (
    <Suspense fallback={null}>
      <CoachDrillsChat quota={quota} />
    </Suspense>
  );
}
