import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border/80 bg-card/90 p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur", className)}
      {...props}
    />
  );
}
