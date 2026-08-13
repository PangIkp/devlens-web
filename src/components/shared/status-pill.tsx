import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-border bg-muted/50 text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
} as const;

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", toneClasses[tone])}>
      {label}
    </span>
  );
}
