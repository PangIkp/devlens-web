import { useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { RepositoryDetailPanel } from "@/components/repositories/repository-detail-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <PageShell unwrapped>
        <div className="space-y-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/repositories">Back to repositories</Link>
          </Button>

          {repositoryQuery.isLoading ? (
            <div className="space-y-4" aria-label="Repository detail loading">
              <Skeleton className="h-28 rounded-2xl" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((item) => (
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
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Repository health</h2>
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
                <div className="mt-4">
                  <EmptyState
                    title="Repository health is not ready yet"
                    description="This repository has not completed a successful sync yet, so health metrics are unavailable. Start or retry sync from Settings first."
                    action={
                      <Button asChild variant="outline">
                        <Link to="/settings">Open Settings</Link>
                      </Button>
                    }
                  />
                </div>
              ) : null}

              {healthReady && repositoryMetricsQuery.isError ? (
                <div className="mt-4">
                  <ErrorState
                    title="Could not load repository metrics"
                    message={getErrorMessage(repositoryMetricsQuery.error)}
                    onRetry={() => void repositoryMetricsQuery.refetch()}
                  />
                </div>
              ) : null}

              {healthReady && repositoryMetricsQuery.data ? (
                <div className="mt-4">
                  <DashboardSummaryGrid
                    summary={repositoryMetricsQuery.data.data.summary}
                    loading={repositoryMetricsQuery.isLoading}
                  />
                </div>
              ) : null}

              {healthReady && (repositoryMetricsQuery.data || workloadDistributionQuery.data) ? (
                <Tabs defaultValue="hotspots" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="hotspots">Hotspot files</TabsTrigger>
                    <TabsTrigger value="workload">Workload distribution</TabsTrigger>
                  </TabsList>

                  <TabsContent value="hotspots">
                    {repositoryMetricsQuery.data ? (
                      repositoryMetricsQuery.data.data.hotspots.length === 0 ? (
                        <EmptyState
                          title="No hotspot files available"
                          description="The backend returned no hotspot files for the selected range."
                        />
                      ) : (
                        <DashboardHotspotsTable hotspots={repositoryMetricsQuery.data.data.hotspots} />
                      )
                    ) : null}
                  </TabsContent>

                  <TabsContent value="workload">
                    {workloadDistributionQuery.isError ? (
                      <ErrorState
                        title="Could not load workload distribution"
                        message={getErrorMessage(workloadDistributionQuery.error)}
                        onRetry={() => void workloadDistributionQuery.refetch()}
                      />
                    ) : null}

                    {workloadDistributionQuery.data ? (
                      workloadDistributionQuery.data.data.contributors.length === 0 &&
                      workloadDistributionQuery.data.data.reviewers.length === 0 ? (
                        <EmptyState
                          title="No workload data available"
                          description="No pull requests or reviews were found for the selected range."
                        />
                      ) : (
                        <DashboardWorkloadDistribution distribution={workloadDistributionQuery.data.data} />
                      )
                    ) : null}
                  </TabsContent>
                </Tabs>
              ) : null}
            </Card>
          ) : null}
        </div>
      </PageShell>
    </AppLayout>
  );
}
