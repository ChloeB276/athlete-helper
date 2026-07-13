export function QnaHint({ onAsk }: { onAsk: () => void }) {
  return (
    <button
      type="button"
      onClick={onAsk}
      className="mt-3 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold"
      >
        ?
      </span>
      Got a question about this? Ask below.
    </button>
  );
}
