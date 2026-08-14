import { useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { RepositoryDetailPanel } from "@/components/repositories/repository-detail-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardSummaryGrid } from "@/components/dashboard/dashboard-summary-grid";
import { DashboardHotspotsTable } from "@/components/dashboard/dashboard-hotspots-table";
import { DashboardWorkloadDistribution } from "@/components/dashboard/dashboard-workload-distribution";
import { useRepositoryMetricsQuery, useWorkloadDistributionQuery } from "@/features/dashboard/dashboard.query";
import {
  dashboardRangePresets,
  getDashboardDateRangeForPreset,
  getDashboardPresetFromRange,
  getDefaultDashboardDateRange,
} from "@/features/dashboard/dashboard.utils";
import { useRepositoryDetailQuery } from "@/features/repositories/repositories.query";
import { getErrorMessage } from "@/lib/api-errors";
import { ApiError } from "@/lib/api-client";
import { rootRoute } from "@/routes/root";

export const repositoryDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/repositories/$repositoryId",
  component: RepositoryDetailPage,
});

function RepositoryDetailPage() {
  const { repositoryId } = repositoryDetailRoute.useParams();
  const repositoryQuery = useRepositoryDetailQuery(repositoryId);
  const [range, setRange] = useState(() => getDefaultDashboardDateRange());
  const selectedPreset = getDashboardPresetFromRange(range.from, range.to) ?? 30;

  const repository = repositoryQuery.data?.data;
  const healthReady = Boolean(repository?.lastSyncedAt);
  const repositoryMetricsQuery = useRepositoryMetricsQuery(
    { repositoryId, from: range.from, to: range.to },
    healthReady,
  );
  const workloadDistributionQuery = useWorkloadDistributionQuery(
    { repositoryId, from: range.from, to: range.to },
    healthReady,
  );

  return (
    <AppLayout>
      <PageShell
        eyebrow="Repository detail"
        title="Repository detail"
        description="Inspect repository metadata, synchronization recency, and jump out to the original GitHub repository."
      >
        <div className="space-y-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/repositories">Back to repository list</Link>
          </Button>

          {repositoryQuery.isLoading ? (
            <div className="space-y-4" aria-label="Repository detail loading">
              <Skeleton className="h-28 rounded-2xl" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-24 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : null}

          {repositoryQuery.isError ? (
            repositoryQuery.error instanceof ApiError && repositoryQuery.error.status === 404 ? (
              <EmptyState
                title="Repository not found"
                description={`No repository matched id ${repositoryId}. It may have been removed or the URL is invalid.`}
                action={
                  <Button asChild variant="outline">
                    <Link to="/repositories">Return to repositories</Link>
                  </Button>
                }
              />
            ) : (
              <ErrorState
                title="Could not load repository detail"
                message={getErrorMessage(repositoryQuery.error)}
                onRetry={() => void repositoryQuery.refetch()}
              />
            )
          ) : null}

          {repositoryQuery.data ? <RepositoryDetailPanel repository={repositoryQuery.data.data} /> : null}

          {repository ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">Repository health</h2>
                  <p className="text-sm text-muted-foreground">
                    Process metrics computed from synced data for the selected range. Not a ranking of contributors.
                  </p>
                </div>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Date range</span>
                  <Select
                    value={String(selectedPreset)}
                    onValueChange={(value) =>
                      setRange(getDashboardDateRangeForPreset(Number(value) as (typeof dashboardRangePresets)[number]))
                    }
                  >
                    <SelectTrigger aria-label="Repository health date range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 Days</SelectItem>
                      <SelectItem value="30">Last 30 Days</SelectItem>
                      <SelectItem value="90">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>

              {!healthReady ? (
                <EmptyState
                  title="Repository health is not ready yet"
                  description="This repository has not completed a successful sync yet, so health metrics are unavailable. Start or retry sync from Settings first."
                  action={
                    <Button asChild variant="outline">
                      <Link to="/settings">Open Settings</Link>
                    </Button>
                  }
                />
              ) : null}

              {healthReady && repositoryMetricsQuery.isError ? (
                <ErrorState
                  title="Could not load repository metrics"
                  message={getErrorMessage(repositoryMetricsQuery.error)}
                  onRetry={() => void repositoryMetricsQuery.refetch()}
                />
              ) : null}

              {healthReady && repositoryMetricsQuery.data ? (
                <DashboardSummaryGrid
                  summary={repositoryMetricsQuery.data.data.summary}
                  loading={repositoryMetricsQuery.isLoading}
                />
              ) : null}

              {healthReady && repositoryMetricsQuery.data ? (
                <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
                  <h3 className="text-lg font-semibold">Hotspot files</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Files with the highest change volume and churn pressure in the selected range.
                  </p>
                  <div className="mt-4">
                    {repositoryMetricsQuery.data.data.hotspots.length === 0 ? (
                      <EmptyState
                        title="No hotspot files available"
                        description="The backend returned no hotspot files for the selected range."
                      />
                    ) : (
                      <DashboardHotspotsTable hotspots={repositoryMetricsQuery.data.data.hotspots} />
                    )}
                  </div>
                </div>
              ) : null}

              {healthReady && workloadDistributionQuery.isError ? (
                <ErrorState
                  title="Could not load workload distribution"
                  message={getErrorMessage(workloadDistributionQuery.error)}
                  onRetry={() => void workloadDistributionQuery.refetch()}
                />
              ) : null}

              {healthReady && workloadDistributionQuery.data ? (
                <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
                  <h3 className="text-lg font-semibold">Workload distribution</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    How pull requests and reviews are distributed across the team for the selected range.
                  </p>
                  <div className="mt-4">
                    {workloadDistributionQuery.data.data.contributors.length === 0 &&
                    workloadDistributionQuery.data.data.reviewers.length === 0 ? (
                      <EmptyState
                        title="No workload data available"
                        description="No pull requests or reviews were found for the selected range."
                      />
                    ) : (
                      <DashboardWorkloadDistribution distribution={workloadDistributionQuery.data.data} />
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </PageShell>
    </AppLayout>
  );
}
