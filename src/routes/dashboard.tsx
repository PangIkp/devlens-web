import { useEffect } from "react";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { rootRoute } from "@/routes/root";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { DashboardSummaryGrid } from "@/components/dashboard/dashboard-summary-grid";
import { DashboardHotspotsTable } from "@/components/dashboard/dashboard-hotspots-table";
import { EChartPanel } from "@/components/charts/echart-panel";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useDashboardSummaryQuery,
  useDeploymentMetricsQuery,
  useHotspotMetricsQuery,
  usePullRequestMetricsQuery,
  useReviewMetricsQuery,
} from "@/features/dashboard/dashboard.query";
import { createLineSeriesData, getDefaultDashboardDateRange, isValidDateRange } from "@/features/dashboard/dashboard.utils";
import { useOrganizationsQuery } from "@/features/organizations/use-organizations-query";
import { useRepositoriesListQuery } from "@/features/repositories/repositories.query";
import { formatCount, formatDateRange, formatDurationMinutes, formatPercentage } from "@/lib/formatters";
import type { EChartsOption } from "echarts";

const defaultRange = getDefaultDashboardDateRange();

const dashboardSearchSchema = z
  .object({
    organizationId: z.string().min(1).optional(),
    repositoryId: z.string().min(1).optional(),
    from: z.string().default(defaultRange.from),
    to: z.string().default(defaultRange.to),
    hotspotPage: z.number().int().min(1).catch(1).default(1),
  })
  .refine((value) => isValidDateRange(value.from, value.to), {
    message: "from must be before or equal to to",
    path: ["from"],
  });

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  validateSearch: (search) =>
    dashboardSearchSchema.parse({
      organizationId: typeof search.organizationId === "string" ? search.organizationId : undefined,
      repositoryId: typeof search.repositoryId === "string" ? search.repositoryId : undefined,
      from: typeof search.from === "string" ? search.from : defaultRange.from,
      to: typeof search.to === "string" ? search.to : defaultRange.to,
      hotspotPage:
        typeof search.hotspotPage === "number"
          ? search.hotspotPage
          : typeof search.hotspotPage === "string"
            ? Number(search.hotspotPage)
            : 1,
    }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = dashboardRoute.useNavigate();
  const search = dashboardRoute.useSearch();
  const organizationsQuery = useOrganizationsQuery();
  const organizations = organizationsQuery.data?.data;
  const selectedOrganizationId = search.organizationId ?? organizations?.[0]?.id;
  const repositoriesQuery = useRepositoriesListQuery(
    {
      organizationId: selectedOrganizationId ?? "",
      page: 1,
      pageSize: 100,
      sortBy: "name",
      sortOrder: "asc",
    },
    Boolean(selectedOrganizationId),
  );
  const repositories = repositoriesQuery.data?.data ?? [];
  const firstRepositoryId = repositories[0]?.id;
  const selectedRepositoryId = search.repositoryId ?? repositories[0]?.id;
  const dashboardParams = selectedRepositoryId
    ? {
        repositoryId: selectedRepositoryId,
        from: search.from,
        to: search.to,
      }
    : undefined;
  const summaryQuery = useDashboardSummaryQuery(dashboardParams ?? { repositoryId: "", from: search.from, to: search.to }, Boolean(dashboardParams));
  const pullRequestQuery = usePullRequestMetricsQuery(
    dashboardParams ?? { repositoryId: "", from: search.from, to: search.to },
    Boolean(dashboardParams),
  );
  const reviewQuery = useReviewMetricsQuery(
    dashboardParams ?? { repositoryId: "", from: search.from, to: search.to },
    Boolean(dashboardParams),
  );
  const deploymentQuery = useDeploymentMetricsQuery(
    dashboardParams ?? { repositoryId: "", from: search.from, to: search.to },
    Boolean(dashboardParams),
  );
  const hotspotsQuery = useHotspotMetricsQuery(
    {
      repositoryId: selectedRepositoryId ?? "",
      from: search.from,
      to: search.to,
      page: search.hotspotPage,
      pageSize: 10,
    },
    Boolean(selectedRepositoryId),
  );

  useEffect(() => {
    if (!search.organizationId && organizations?.[0]?.id) {
      void navigate({
        search: (previous) => ({
          ...previous,
          organizationId: organizations[0].id,
        }),
        replace: true,
      });
    }
  }, [navigate, organizations, search.organizationId]);

  useEffect(() => {
    if (selectedOrganizationId && !search.repositoryId && firstRepositoryId) {
      void navigate({
        search: (previous) => ({
          ...previous,
          organizationId: selectedOrganizationId,
          repositoryId: firstRepositoryId,
        }),
        replace: true,
      });
    }
  }, [firstRepositoryId, navigate, search.repositoryId, selectedOrganizationId]);

  function updateSearch(next: {
    organizationId?: string;
    repositoryId?: string;
    from?: string;
    to?: string;
    hotspotPage?: number;
  }) {
    void navigate({
      search: (previous) => ({
        organizationId: "organizationId" in next ? next.organizationId : previous.organizationId,
        repositoryId: "repositoryId" in next ? next.repositoryId : previous.repositoryId,
        from: next.from ?? previous.from,
        to: next.to ?? previous.to,
        hotspotPage: next.hotspotPage ?? previous.hotspotPage,
      }),
    });
  }

  const summaryOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category" },
    yAxis: { type: "value" },
    series: [
      {
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.08 },
        data: createLineSeriesData(pullRequestQuery.data?.data.cycleTimeTrend ?? []),
      },
    ],
  };

  const reviewOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category" },
    yAxis: { type: "value" },
    series: [
      {
        type: "line",
        smooth: true,
        data: createLineSeriesData(reviewQuery.data?.data.waitTimeTrend ?? []),
      },
    ],
  };

  const deploymentOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category" },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: createLineSeriesData(deploymentQuery.data?.data.deploymentTrend ?? []),
      },
    ],
  };

  return (
    <AppLayout>
      <PageShell
        eyebrow="Dashboard"
        title="Engineering workflow dashboard"
        description="Track repository delivery health across pull requests, reviews, deployments, and hotspot files using metrics already calculated by the backend."
      >
        <div className="space-y-6">
          <form className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto]">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Organization</span>
              <Select
                aria-label="Organization"
                value={selectedOrganizationId ?? ""}
                disabled={organizationsQuery.isLoading || (organizations?.length ?? 0) === 0}
                onChange={(event) =>
                  updateSearch({
                    organizationId: event.target.value,
                    repositoryId: undefined,
                    hotspotPage: 1,
                  })
                }
              >
                {organizations?.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Repository</span>
              <Select
                aria-label="Repository"
                value={selectedRepositoryId ?? ""}
                disabled={repositoriesQuery.isLoading || repositories.length === 0}
                onChange={(event) =>
                  updateSearch({
                    repositoryId: event.target.value,
                    hotspotPage: 1,
                  })
                }
              >
                {repositories.map((repository) => (
                  <option key={repository.id} value={repository.id}>
                    {repository.fullName}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">From</span>
              <Input
                type="date"
                aria-label="From date"
                value={search.from}
                onChange={(event) => updateSearch({ from: event.target.value, hotspotPage: 1 })}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">To</span>
              <Input
                type="date"
                aria-label="To date"
                value={search.to}
                onChange={(event) => updateSearch({ to: event.target.value, hotspotPage: 1 })}
              />
            </label>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const nextDefaultRange = getDefaultDashboardDateRange();
                  updateSearch({
                    from: nextDefaultRange.from,
                    to: nextDefaultRange.to,
                    hotspotPage: 1,
                  });
                }}
              >
                Reset range
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
            Active range: {formatDateRange(search.from, search.to)}
          </div>

          {organizationsQuery.isError ? (
            <ErrorState
              title="Could not load organizations"
              message={organizationsQuery.error instanceof Error ? organizationsQuery.error.message : "Unknown error"}
              onRetry={() => void organizationsQuery.refetch()}
            />
          ) : null}

          {!organizationsQuery.isLoading && !organizationsQuery.isError && (organizations?.length ?? 0) === 0 ? (
            <EmptyState
              title="No organizations available"
              description="Connect or sync an organization in the backend before opening the dashboard."
            />
          ) : null}

          {selectedOrganizationId && repositoriesQuery.isError ? (
            <ErrorState
              title="Could not load repositories"
              message={repositoriesQuery.error instanceof Error ? repositoriesQuery.error.message : "Unknown error"}
              onRetry={() => void repositoriesQuery.refetch()}
            />
          ) : null}

          {selectedOrganizationId && !repositoriesQuery.isLoading && repositories.length === 0 ? (
            <EmptyState
              title="No repositories available"
              description="This organization does not have repositories ready for dashboard metrics yet."
            />
          ) : null}

          {selectedRepositoryId ? (
            <div className="space-y-8">
              <section className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold">Summary</h2>
                  <p className="text-sm text-muted-foreground">
                    Snapshot of repository workflow health for the selected date range.
                  </p>
                </div>
                {summaryQuery.isError ? (
                  <ErrorState
                    title="Could not load dashboard summary"
                    message={summaryQuery.error instanceof Error ? summaryQuery.error.message : "Unknown error"}
                    onRetry={() => void summaryQuery.refetch()}
                  />
                ) : (
                  <DashboardSummaryGrid summary={summaryQuery.data?.data} loading={summaryQuery.isLoading} />
                )}
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
                    <h2 className="text-xl font-semibold">Pull request metrics</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Review cycle and pull request size indicators for engineering throughput.
                    </p>
                    {pullRequestQuery.isError ? (
                      <div className="mt-4">
                        <ErrorState
                          title="Could not load pull request metrics"
                          message={pullRequestQuery.error instanceof Error ? pullRequestQuery.error.message : "Unknown error"}
                          onRetry={() => void pullRequestQuery.refetch()}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average cycle time</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatDurationMinutes(pullRequestQuery.data?.data.averageCycleTimeMinutes)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average files changed</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatCount(pullRequestQuery.data?.data.averageFilesChanged, 1)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average additions</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatCount(pullRequestQuery.data?.data.averageAdditions, 1)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average deletions</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatCount(pullRequestQuery.data?.data.averageDeletions, 1)}
                            </p>
                          </div>
                        </div>
                        <EChartPanel
                          title="PR cycle time trend"
                          description="Trend of average pull request cycle time across the selected range."
                          option={summaryOption}
                          empty={(pullRequestQuery.data?.data.cycleTimeTrend.length ?? 0) === 0}
                          loading={pullRequestQuery.isLoading}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
                    <h2 className="text-xl font-semibold">Review metrics</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Review wait time means how long a pull request waits before the first review response arrives.
                    </p>
                    {reviewQuery.isError ? (
                      <div className="mt-4">
                        <ErrorState
                          title="Could not load review metrics"
                          message={reviewQuery.error instanceof Error ? reviewQuery.error.message : "Unknown error"}
                          onRetry={() => void reviewQuery.refetch()}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average wait time</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatDurationMinutes(reviewQuery.data?.data.averageWaitMinutes)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average review time</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatDurationMinutes(reviewQuery.data?.data.averageReviewMinutes)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-card/70 p-4 md:col-span-2">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Review coverage</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatPercentage(reviewQuery.data?.data.reviewCoverage)}
                            </p>
                          </div>
                        </div>
                        <EChartPanel
                          title="Review wait time trend"
                          description="Trend of waiting time before a pull request receives its first review."
                          option={reviewOption}
                          empty={(reviewQuery.data?.data.waitTimeTrend.length ?? 0) === 0}
                          loading={reviewQuery.isLoading}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border/70 bg-background/60 p-5">
                <h2 className="text-xl font-semibold">Deployment metrics</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Deployment throughput and failure signals for the selected repository.
                </p>
                {deploymentQuery.isError ? (
                  <div className="mt-4">
                    <ErrorState
                      title="Could not load deployment metrics"
                      message={deploymentQuery.error instanceof Error ? deploymentQuery.error.message : "Unknown error"}
                      onRetry={() => void deploymentQuery.refetch()}
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Deployment count</p>
                        <p className="mt-2 text-2xl font-semibold">
                          {formatCount(deploymentQuery.data?.data.deploymentCount)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Deployment frequency</p>
                        <p className="mt-2 text-2xl font-semibold">
                          {formatCount(deploymentQuery.data?.data.deploymentFrequency, 2)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Change failure rate</p>
                        <p className="mt-2 text-2xl font-semibold">
                          {formatPercentage(deploymentQuery.data?.data.changeFailureRate)}
                        </p>
                      </div>
                    </div>
                    <EChartPanel
                      title="Deployment trend"
                      description="Time-based deployment trend for the selected range. Empty output means no deployment data is available yet."
                      option={deploymentOption}
                      empty={(deploymentQuery.data?.data.deploymentTrend.length ?? 0) === 0}
                      loading={deploymentQuery.isLoading}
                      emptyTitle="No deployment data available"
                      emptyDescription="The backend returned no deployment datapoints for this repository and range."
                    />
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-border/70 bg-background/60 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Hotspot files</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ranked files with the highest change volume and churn pressure.
                    </p>
                  </div>
                  {hotspotsQuery.data ? (
                    <p className="text-sm text-muted-foreground">
                      Page {hotspotsQuery.data.pagination.page} / {Math.max(hotspotsQuery.data.pagination.totalPages, 1)}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 space-y-4">
                  {hotspotsQuery.isError ? (
                    <ErrorState
                      title="Could not load hotspot files"
                      message={hotspotsQuery.error instanceof Error ? hotspotsQuery.error.message : "Unknown error"}
                      onRetry={() => void hotspotsQuery.refetch()}
                    />
                  ) : null}

                  {hotspotsQuery.data && hotspotsQuery.data.data.length === 0 ? (
                    <EmptyState
                      title="No hotspot files available"
                      description="The backend returned no hotspot files for the selected range."
                    />
                  ) : null}

                  {hotspotsQuery.data && hotspotsQuery.data.data.length > 0 ? (
                    <>
                      <DashboardHotspotsTable hotspots={hotspotsQuery.data.data} />
                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={search.hotspotPage <= 1}
                          onClick={() => updateSearch({ hotspotPage: search.hotspotPage - 1 })}
                        >
                          Previous page
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            hotspotsQuery.data.pagination.page >= Math.max(hotspotsQuery.data.pagination.totalPages, 1)
                          }
                          onClick={() => updateSearch({ hotspotPage: search.hotspotPage + 1 })}
                        >
                          Next page
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </PageShell>
    </AppLayout>
  );
}
