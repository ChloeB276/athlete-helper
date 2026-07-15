import { redirect } from "next/navigation";
import { OnboardingForm } from "~/components/onboarding-form";
import { createClient } from "~/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed_at) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <span className="text-sm font-semibold text-brand">
          🎉 One last thing
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tell us about your game ⚽
        </h1>
        <p className="text-muted-foreground">
          This helps us tailor your drills to your position and footedness.
        </p>
      </div>
      <div className="rounded-3xl bg-card p-6 shadow-soft sm:p-8">
        <OnboardingForm />
      </div>
    </div>
  );
}
