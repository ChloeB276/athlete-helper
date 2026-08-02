import { cn } from "~/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-accent-a to-accent-b",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-[62%] w-[62%] text-background"
      >
        <path
          d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-4l-4.5 4v-4H8a5 5 0 0 1-5-5Z"
          fill="currentColor"
          fillOpacity={0.3}
        />
        <path
          d="M7.5 10h8M12 6.5 15.5 10 12 13.5"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
