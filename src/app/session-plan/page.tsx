import { redirect } from "next/navigation";
import { PasteNotesForm } from "~/components/paste-notes-form";
import { PlanStepList } from "~/components/plan-step-list";
import { getSessionPlanData } from "~/lib/session-plan-data";
import { createClient } from "~/lib/supabase/server";

export default async function SessionPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getSessionPlanData(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Session Plan</h1>

      <PasteNotesForm />

      {data.plan ? (
        <>
          <div className="rounded-3xl bg-card p-6 shadow-soft">
            <h2 className="mb-2 text-sm font-semibold text-brand">
              Core Development Focus
            </h2>
            <p className="text-sm text-muted-foreground">{data.plan.intro}</p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Plan</h2>
            <PlanStepList drills={data.plan.drills} />
          </div>

          {data.plan.outro && (
            <p className="text-sm text-muted-foreground">{data.plan.outro}</p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
          <p className="text-muted-foreground">
            No plan yet. Paste some coach notes above to generate one.
          </p>
        </div>
      )}
    </div>
  );
}
