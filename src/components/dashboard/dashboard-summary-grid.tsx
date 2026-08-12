import type { DashboardSummary } from "@/features/dashboard/dashboard.schemas";
import { formatCount, formatDurationMinutes, formatPercentage } from "@/lib/formatters";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";

export function DashboardSummaryGrid({
  summary,
  loading = false,
}: {
  summary?: DashboardSummary;
  loading?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <DashboardMetricCard
        label="PR Cycle Time"
        description="Average time from pull request open to completion within the selected range."
        value={formatDurationMinutes(summary?.prCycleTimeMinutes)}
        loading={loading}
      />
      <DashboardMetricCard
        label="Review Wait Time"
        description="Average time a pull request waits before its first review response."
        value={formatDurationMinutes(summary?.reviewWaitMinutes)}
        loading={loading}
      />
      <DashboardMetricCard
        label="Deployment Frequency"
        description="Average deployment frequency for the selected range."
        value={formatCount(summary?.deploymentFrequency, 2)}
        loading={loading}
      />
      <DashboardMetricCard
        label="Change Failure Rate"
        description="Share of deployments that resulted in failures during the selected range."
        value={formatPercentage(summary?.changeFailureRate)}
        loading={loading}
      />
      <DashboardMetricCard
        label="Review Coverage"
        description="Percentage of changes that received review before completion."
        value={formatPercentage(summary?.reviewCoverage)}
        loading={loading}
      />
    </div>
  );
}
