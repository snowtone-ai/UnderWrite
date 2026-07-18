import { cn } from "@/lib/utils";

/**
 * The UnderWrite mark: a gable (house / aperture) over a distribution range with
 * a median tick. The tile holds a fixed brand indigo across light/dark themes.
 */
export function LogoMark({
  className,
  title = "UnderWrite",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="512" height="512" rx="120" fill="#1E56B0" />
      <path
        d="M150 286 L256 168 L362 286"
        stroke="#FFFFFF"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="168"
        y1="360"
        x2="344"
        y2="360"
        stroke="#FFFFFF"
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.55"
      />
      <line
        x1="256"
        y1="336"
        x2="256"
        y2="384"
        stroke="#FFFFFF"
        strokeWidth="22"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Mark + wordmark lockup for headers. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-7" />
      <span className="text-[15px] font-bold tracking-tight">UnderWrite</span>
    </span>
  );
}
