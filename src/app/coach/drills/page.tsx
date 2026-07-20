import { redirect } from "next/navigation";
import { Suspense } from "react";
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

  return (
    <Suspense fallback={null}>
      <CoachDrillsChat />
    </Suspense>
  );
}
