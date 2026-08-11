import type { PropsWithChildren } from "react";
import { Card } from "@/components/ui/card";

type PageShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-card/75 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] backdrop-blur">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-accent">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </section>
      <Card>{children}</Card>
    </div>
  );
}
