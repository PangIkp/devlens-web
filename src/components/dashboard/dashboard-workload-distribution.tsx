import type { WorkloadDistribution } from "@/features/dashboard/dashboard.schemas";
import { formatCount, formatPercentage } from "@/lib/formatters";

function DistributionBar({ label, count, share }: { label: string; count: number; share: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatCount(count)} ({formatPercentage(share)})
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(1, Math.max(0, share)) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardWorkloadDistribution({ distribution }: { distribution: WorkloadDistribution }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total pull requests</p>
          <p className="mt-2 text-2xl font-semibold">{formatCount(distribution.summary.totalPullRequests)}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total reviews</p>
          <p className="mt-2 text-2xl font-semibold">{formatCount(distribution.summary.totalReviews)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Contributors</h3>
          <p className="text-xs text-muted-foreground">
            Share of pull requests opened per author, used to spot where authoring effort concentrates. Not a
            developer ranking.
          </p>
          <div className="space-y-3">
            {distribution.contributors.map((contributor) => (
              <DistributionBar
                key={contributor.author}
                label={contributor.author}
                count={contributor.pullRequestCount}
                share={contributor.share}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Reviewers</h3>
          <p className="text-xs text-muted-foreground">
            Share of reviews submitted per reviewer, used to spot review concentration. Not a developer ranking.
          </p>
          <div className="space-y-3">
            {distribution.reviewers.map((reviewer) => (
              <DistributionBar
                key={reviewer.reviewer}
                label={reviewer.reviewer}
                count={reviewer.reviewCount}
                share={reviewer.share}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
