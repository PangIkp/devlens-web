import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type DashboardMetricCardProps = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  loading?: boolean;
};

export function DashboardMetricCard({
  label,
  value,
  description,
  icon: Icon,
  loading = false,
}: DashboardMetricCardProps) {
  return (
    <Card className="space-y-4 bg-background/60">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{loading ? "Loading..." : value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
