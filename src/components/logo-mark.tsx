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
        className="h-[68%] w-[68%] text-background"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth={1.5}
          fill="currentColor"
          fillOpacity={0.12}
        />
        <path
          d="M12 7.3 15.4 9.8 14.1 13.8 9.9 13.8 8.6 9.8Z"
          fill="currentColor"
        />
        <path
          d="M12 7.3V4.3M15.4 9.8 18.3 7.9M14.1 13.8 15.8 16.9M9.9 13.8 8.2 16.9M8.6 9.8 5.7 7.9"
          stroke="currentColor"
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
