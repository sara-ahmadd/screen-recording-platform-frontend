import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  /** Typically 1–5 for counts, or a decimal average (e.g. 3.7). */
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-6 w-6",
} as const;

function StarSlot({
  variant,
  size,
}: {
  variant: "full" | "half" | "empty";
  size: keyof typeof sizeClasses;
}) {
  const s = sizeClasses[size];
  if (variant === "full") {
    return <Star className={cn(s, "fill-amber-400 text-amber-400")} strokeWidth={1.5} aria-hidden />;
  }
  if (variant === "half") {
    return (
      <span className={cn("relative inline-flex shrink-0", s)} aria-hidden>
        <Star className={cn(s, "text-muted-foreground/40")} strokeWidth={1.5} />
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/2 overflow-hidden">
          <Star className={cn(s, "fill-amber-400 text-amber-400")} strokeWidth={1.5} />
        </span>
      </span>
    );
  }
  return <Star className={cn(s, "text-muted-foreground/40")} strokeWidth={1.5} aria-hidden />;
}

export function StarRating({ value, max = 5, size = "md", className }: StarRatingProps) {
  const clamped = Math.min(max, Math.max(0, value));
  const label =
    clamped % 1 === 0
      ? `${clamped} out of ${max} stars`
      : `${clamped.toFixed(2)} out of ${max} stars`;

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: max }, (_, i) => {
        const idx = i + 1;
        let variant: "full" | "half" | "empty" = "empty";
        if (clamped >= idx) variant = "full";
        else if (clamped >= idx - 0.5) variant = "half";
        return <StarSlot key={idx} variant={variant} size={size} />;
      })}
    </span>
  );
}
