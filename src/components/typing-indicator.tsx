export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 px-1 py-2.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
      </div>
    </div>
  );
}
