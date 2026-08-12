import { Card } from "@/components/ui/card";

type DashboardMetricCardProps = {
  label: string;
  value: string;
  description: string;
  loading?: boolean;
};

export function DashboardMetricCard({
  label,
  value,
  description,
  loading = false,
}: DashboardMetricCardProps) {
  return (
    <Card className="space-y-3 bg-background/60">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <p className="text-3xl font-bold tracking-tight">{loading ? "Loading..." : value}</p>
    </Card>
  );
}
