import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDrillQuota } from "~/lib/quota";
import { createClient } from "~/lib/supabase/server";
import { DrillsChat } from "./drills-chat";

export default async function DrillsPage() {
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
      <DrillsChat quota={quota} />
    </Suspense>
  );
}
