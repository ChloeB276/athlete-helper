import { redirect } from "next/navigation";
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

  return <DrillsChat />;
}
