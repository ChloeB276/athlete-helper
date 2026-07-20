import { generatePlan } from "~/lib/home-actions";

export function PasteNotesForm() {
  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft">
      <form action={generatePlan} className="flex flex-col gap-3">
        <label htmlFor="notes" className="text-sm font-semibold">
          Paste coach notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={1000}
          placeholder="e.g. Stay lower in your stance, recover quicker after the first move, finish with more balance..."
          className="w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-brand"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Up to 1,000 characters.
          </span>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-105"
          >
            Generate plan
          </button>
        </div>
      </form>
    </div>
  );
}
