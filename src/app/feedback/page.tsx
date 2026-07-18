import { redirect } from "next/navigation";
import type { FeedbackBreakdown } from "~/lib/feedback-breakdown";
import { createClient } from "~/lib/supabase/server";

interface FeedbackRow {
  id: string;
  coach_text: string;
  ai_breakdown_requested: boolean;
  ai_expanded_text: string | null;
  ai_next_steps: string[];
  ai_drills: FeedbackBreakdown["drills"];
  created_at: string;
  teams: { name: string } | null;
  coach: { email: string } | null;
}

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("feedback")
    .select(
      "id, coach_text, ai_breakdown_requested, ai_expanded_text, ai_next_steps, ai_drills, created_at, teams(name), coach:profiles!feedback_coach_id_fkey(email)",
    )
    .order("created_at", { ascending: false });

  const feedbackItems = (data ?? []) as unknown as FeedbackRow[];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Coach Feedback</h1>
        <p className="text-muted-foreground">
          Notes from your coaches, broken down into next steps and drills.
        </p>
      </div>

      {feedbackItems.length > 0 ? (
        <div className="flex flex-col gap-4">
          {feedbackItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-brand">
                  {item.teams?.name ?? "Team"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.coach?.email ?? "Coach"} ·{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm">{item.coach_text}</p>

              {item.ai_expanded_text && (
                <div className="rounded-2xl bg-accent-a/15 p-4">
                  <span className="text-xs font-semibold text-brand">
                    AI breakdown
                  </span>
                  <p className="mt-1 text-sm">{item.ai_expanded_text}</p>
                </div>
              )}

              {item.ai_next_steps.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Next steps</span>
                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                    {item.ai_next_steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.ai_drills.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Drills</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {item.ai_drills.map((drill) => (
                      <div
                        key={drill.title}
                        className="flex flex-col gap-1 rounded-2xl bg-accent-b/15 p-4"
                      >
                        <span className="w-fit rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                          {drill.difficulty}
                        </span>
                        <span className="text-sm font-semibold">
                          {drill.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {drill.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-12 text-center shadow-soft">
          <p className="text-muted-foreground">
            No feedback yet. Once your coach sends some, it'll show up here.
          </p>
        </div>
      )}
    </div>
  );
}
