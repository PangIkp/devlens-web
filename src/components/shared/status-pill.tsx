import { cn } from "@/lib/utils";
import { formatStatusLabel } from "@/lib/format-status";

const toneClasses = {
  neutral: "border-border bg-muted/50 text-foreground",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
} as const;

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
      )}
    >
      {formatStatusLabel(label)}
    </span>
  );
}
