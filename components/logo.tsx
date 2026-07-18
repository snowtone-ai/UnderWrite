import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({
  className,
  title = "UnderWrite",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <Image
      src="/icon.png"
      alt={title}
      width={512}
      height={512}
      className={className}
    />
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
