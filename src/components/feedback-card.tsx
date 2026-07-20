import type { FeedbackBreakdown } from "~/lib/feedback-breakdown";

export interface FeedbackCardItem {
  id: string;
  teamName?: string;
  coachEmail?: string;
  coachText: string;
  aiExpandedText: string | null;
  aiNextSteps: string[];
  aiDrills: FeedbackBreakdown["drills"];
  createdAt: string;
}

export function FeedbackCard({ item }: { item: FeedbackCardItem }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {item.teamName && (
          <span className="text-sm font-semibold text-brand">
            {item.teamName}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {item.coachEmail && `${item.coachEmail} · `}
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="text-sm">{item.coachText}</p>

      {item.aiExpandedText && (
        <div className="rounded-2xl bg-accent-a/15 p-4">
          <span className="text-xs font-semibold text-brand">AI breakdown</span>
          <p className="mt-1 text-sm">{item.aiExpandedText}</p>
        </div>
      )}

      {item.aiNextSteps.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Next steps</span>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {item.aiNextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      {item.aiDrills.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Drills</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {item.aiDrills.map((drill) => (
              <div
                key={drill.title}
                className="flex flex-col gap-1 rounded-2xl bg-accent-b/15 p-4"
              >
                <span className="w-fit rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                  {drill.difficulty}
                </span>
                <span className="text-sm font-semibold">{drill.title}</span>
                <span className="text-xs text-muted-foreground">
                  {drill.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
