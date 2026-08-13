import { useEffect } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { rootRoute } from "@/routes/root";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { DashboardSummaryGrid } from "@/components/dashboard/dashboard-summary-grid";
import { DashboardHotspotsTable } from "@/components/dashboard/dashboard-hotspots-table";
import { DashboardReviewQueueTable } from "@/components/dashboard/dashboard-review-queue-table";
import { DashboardWorkloadDistribution } from "@/components/dashboard/dashboard-workload-distribution";
import { EChartPanel } from "@/components/charts/echart-panel";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  useDashboardSummaryQuery,
  useDeploymentMetricsQuery,
  useHotspotMetricsQuery,
  usePullRequestMetricsQuery,
  useReviewMetricsQuery,
  useReviewQueueQuery,
  useWorkloadDistributionQuery,
} from "@/features/dashboard/dashboard.query";
import {
  alignComparisonSeries,
  createLineSeriesData,
  dashboardRangePresets,
  getDashboardDateRangeForPreset,
  getDashboardPresetFromRange,
  getDefaultDashboardDateRange,
  getPreviousDateRange,
  isValidDateRange,
} from "@/features/dashboard/dashboard.utils";
import { useOrganizationsQuery } from "@/features/organizations/use-organizations-query";
import { useRepositoriesListQuery } from "@/features/repositories/repositories.query";
import { getErrorMessage } from "@/lib/api-errors";
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
    reviewQueuePage: z.number().int().min(1).catch(1).default(1),
    compare: z.boolean().catch(false).default(false),
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
      reviewQueuePage:
        typeof search.reviewQueuePage === "number"
          ? search.reviewQueuePage
          : typeof search.reviewQueuePage === "string"
            ? Number(search.reviewQueuePage)
            : 1,
      compare:
        typeof search.compare === "boolean"
          ? search.compare
          : typeof search.compare === "string"
            ? search.compare === "true"
            : false,
    }),
  component: DashboardPage,
});

function buildTrendOption(
  current: Array<{ date: string; value: number }>,
  previous: Array<{ date: string; value: number }> | undefined,
  seriesType: "line" | "bar",
  withArea: boolean,
): EChartsOption {
  if (!previous) {
    return {
      tooltip: { trigger: "axis" },
      xAxis: { type: "category" },
      yAxis: { type: "value" },
      series: [
        {
          type: seriesType,
          smooth: seriesType === "line" ? true : undefined,
          areaStyle: withArea ? { opacity: 0.08 } : undefined,
          data: createLineSeriesData(current),
        },
      ],
    };
  }

  const { categories, currentValues, previousValues } = alignComparisonSeries(current, previous);

  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["Current period", "Previous period"] },
    xAxis: { type: "category", data: categories },
    yAxis: { type: "value" },
    series: [
      {
        name: "Current period",
        type: seriesType,
        smooth: seriesType === "line" ? true : undefined,
        areaStyle: withArea ? { opacity: 0.08 } : undefined,
        data: currentValues,
      },
      {
        name: "Previous period",
        type: seriesType,
        smooth: seriesType === "line" ? true : undefined,
        lineStyle: seriesType === "line" ? { type: "dashed" } : undefined,
        itemStyle: seriesType === "bar" ? { opacity: 0.5 } : undefined,
        data: previousValues,
      },
    ],
  };
}

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
  const selectedRepository = repositories.find((repository) => repository.id === selectedRepositoryId);
  const selectedPreset = getDashboardPresetFromRange(search.from, search.to) ?? 30;
  const repositoryMetricsReady = Boolean(selectedRepository?.lastSyncedAt);
  const dashboardParams = selectedRepositoryId && repositoryMetricsReady
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
  const reviewQueueQuery = useReviewQueueQuery(
    {
      repositoryId: selectedRepositoryId ?? "",
      from: search.from,
      to: search.to,
      page: search.reviewQueuePage,
      pageSize: 10,
    },
    Boolean(dashboardParams),
  );
  const workloadDistributionQuery = useWorkloadDistributionQuery(
    dashboardParams ?? { repositoryId: "", from: search.from, to: search.to },
    Boolean(dashboardParams),
  );

  const previousRange = getPreviousDateRange(search.from, search.to);
  const previousDashboardParams = dashboardParams
    ? { repositoryId: dashboardParams.repositoryId, from: previousRange.from, to: previousRange.to }
    : undefined;
  const comparisonEnabled = search.compare && Boolean(dashboardParams);
  const previousPullRequestQuery = usePullRequestMetricsQuery(
    previousDashboardParams ?? { repositoryId: "", from: previousRange.from, to: previousRange.to },
    comparisonEnabled,
  );
  const previousReviewQuery = useReviewMetricsQuery(
    previousDashboardParams ?? { repositoryId: "", from: previousRange.from, to: previousRange.to },
    comparisonEnabled,
  );
  const previousDeploymentQuery = useDeploymentMetricsQuery(
    previousDashboardParams ?? { repositoryId: "", from: previousRange.from, to: previousRange.to },
    comparisonEnabled,
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
    reviewQueuePage?: number;
    compare?: boolean;
  }) {
    void navigate({
      search: (previous) => ({
        organizationId: "organizationId" in next ? next.organizationId : previous.organizationId,
        repositoryId: "repositoryId" in next ? next.repositoryId : previous.repositoryId,
        from: next.from ?? previous.from,
        to: next.to ?? previous.to,
        hotspotPage: next.hotspotPage ?? previous.hotspotPage,
        reviewQueuePage: next.reviewQueuePage ?? previous.reviewQueuePage,
        compare: "compare" in next ? (next.compare ?? previous.compare) : previous.compare,
      }),
    });
  }

  const summaryOption = buildTrendOption(
    pullRequestQuery.data?.data.cycleTimeTrend ?? [],
    comparisonEnabled ? previousPullRequestQuery.data?.data.cycleTimeTrend : undefined,
    "line",
    true,
  );

  const reviewOption = buildTrendOption(
    reviewQuery.data?.data.waitTimeTrend ?? [],
    comparisonEnabled ? previousReviewQuery.data?.data.waitTimeTrend : undefined,
    "line",
    false,
  );

  const deploymentOption = buildTrendOption(
    deploymentQuery.data?.data.deploymentTrend ?? [],
    comparisonEnabled ? previousDeploymentQuery.data?.data.deploymentTrend : undefined,
    "bar",
    false,
  );

  return (
    <AppLayout>
      <PageShell
        eyebrow="Dashboard"
        title="Engineering workflow dashboard"
        description="Track repository delivery health across pull requests, reviews, deployments, and hotspot files using metrics already calculated by the backend."
      >
        <div className="space-y-6">
          <form className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_1fr_auto]">
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
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Date range</span>
              <Select
                aria-label="Date range"
                value={String(selectedPreset)}
                onChange={(event) => {
                  const nextPreset = Number(event.target.value) as (typeof dashboardRangePresets)[number];
                  const nextRange = getDashboardDateRangeForPreset(nextPreset);
                  updateSearch({
                    from: nextRange.from,
                    to: nextRange.to,
                    hotspotPage: 1,
                  });
                }}
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </Select>
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
                Reset
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Active range: {formatDateRange(search.from, search.to)}
              {search.compare ? ` vs ${formatDateRange(previousRange.from, previousRange.to)}` : null}
            </span>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border/70"
                checked={search.compare}
                onChange={(event) => updateSearch({ compare: event.target.checked })}
              />
              Compare to previous period
            </label>
          </div>

          {organizationsQuery.isError ? (
            <ErrorState
              title="Could not load organizations"
              message={getErrorMessage(organizationsQuery.error)}
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
              message={getErrorMessage(repositoriesQuery.error)}
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
              {!repositoryMetricsReady ? (
                <EmptyState
                  title="Repository data is not ready yet"
                  description="This repository has not completed a successful sync yet, so dashboard metrics are unavailable. Start or retry sync from Settings first."
                  action={
                    <Button asChild variant="outline">
                      <Link to="/settings">Open Settings</Link>
                    </Button>
                  }
                />
              ) : null}

              {repositoryMetricsReady ? (
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
                      message={getErrorMessage(summaryQuery.error)}
                      onRetry={() => void summaryQuery.refetch()}
                    />
                  ) : (
                    <DashboardSummaryGrid summary={summaryQuery.data?.data} loading={summaryQuery.isLoading} />
                  )}
                </section>
              ) : null}

              {repositoryMetricsReady ? (
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
                            message={getErrorMessage(pullRequestQuery.error)}
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
                            description={
                              search.compare
                                ? "Trend of average pull request cycle time, compared against the previous period of equal length."
                                : "Trend of average pull request cycle time across the selected range."
                            }
                            option={summaryOption}
                            empty={(pullRequestQuery.data?.data.cycleTimeTrend.length ?? 0) === 0}
                            loading={pullRequestQuery.isLoading || (comparisonEnabled && previousPullRequestQuery.isLoading)}
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
                            message={getErrorMessage(reviewQuery.error)}
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
                            description={
                              search.compare
                                ? "Trend of review wait time, compared against the previous period of equal length."
                                : "Trend of waiting time before a pull request receives its first review."
                            }
                            option={reviewOption}
                            empty={(reviewQuery.data?.data.waitTimeTrend.length ?? 0) === 0}
                            loading={reviewQuery.isLoading || (comparisonEnabled && previousReviewQuery.isLoading)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ) : null}

              {repositoryMetricsReady ? (
                <section className="rounded-2xl border border-border/70 bg-background/60 p-5">
                  <h2 className="text-xl font-semibold">Deployment metrics</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Deployment throughput and failure signals for the selected repository.
                  </p>
                  {deploymentQuery.isError ? (
                    <div className="mt-4">
                      <ErrorState
                        title="Could not load deployment metrics"
                        message={getErrorMessage(deploymentQuery.error)}
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
                        description={
                          search.compare
                            ? "Deployment trend compared against the previous period of equal length. Empty output means no deployment data is available yet."
                            : "Time-based deployment trend for the selected range. Empty output means no deployment data is available yet."
                        }
                        option={deploymentOption}
                        empty={(deploymentQuery.data?.data.deploymentTrend.length ?? 0) === 0}
                        loading={deploymentQuery.isLoading || (comparisonEnabled && previousDeploymentQuery.isLoading)}
                        emptyTitle="No deployment data available"
                        emptyDescription="The backend returned no deployment datapoints for this repository and range."
                      />
                    </div>
                  )}
                </section>
              ) : null}

              {repositoryMetricsReady ? (
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
                        Page {hotspotsQuery.data.meta.page} / {Math.max(hotspotsQuery.data.meta.totalPages, 1)}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-4">
                    {hotspotsQuery.isError ? (
                      <ErrorState
                        title="Could not load hotspot files"
                        message={getErrorMessage(hotspotsQuery.error)}
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
                              hotspotsQuery.data.meta.page >= Math.max(hotspotsQuery.data.meta.totalPages, 1)
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
              ) : null}

              {repositoryMetricsReady ? (
                <section className="rounded-2xl border border-border/70 bg-background/60 p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Review queue</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Open pull requests currently waiting for their first review response.
                      </p>
                    </div>
                    {reviewQueueQuery.data ? (
                      <p className="text-sm text-muted-foreground">
                        Page {reviewQueueQuery.data.meta.page} / {Math.max(reviewQueueQuery.data.meta.totalPages, 1)}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-4">
                    {reviewQueueQuery.isError ? (
                      <ErrorState
                        title="Could not load review queue"
                        message={getErrorMessage(reviewQueueQuery.error)}
                        onRetry={() => void reviewQueueQuery.refetch()}
                      />
                    ) : null}

                    {reviewQueueQuery.data && reviewQueueQuery.data.data.length === 0 ? (
                      <EmptyState
                        title="Review queue is empty"
                        description="No open pull requests are waiting for review in the selected range."
                      />
                    ) : null}

                    {reviewQueueQuery.data && reviewQueueQuery.data.data.length > 0 ? (
                      <>
                        <DashboardReviewQueueTable items={reviewQueueQuery.data.data} />
                        <div className="flex items-center justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={search.reviewQueuePage <= 1}
                            onClick={() => updateSearch({ reviewQueuePage: search.reviewQueuePage - 1 })}
                          >
                            Previous page
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={
                              reviewQueueQuery.data.meta.page >= Math.max(reviewQueueQuery.data.meta.totalPages, 1)
                            }
                            onClick={() => updateSearch({ reviewQueuePage: search.reviewQueuePage + 1 })}
                          >
                            Next page
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {repositoryMetricsReady ? (
                <section className="rounded-2xl border border-border/70 bg-background/60 p-5">
                  <h2 className="text-xl font-semibold">Workload distribution</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    How pull requests and reviews are distributed across the team for the selected range.
                  </p>

                  <div className="mt-4">
                    {workloadDistributionQuery.isError ? (
                      <ErrorState
                        title="Could not load workload distribution"
                        message={getErrorMessage(workloadDistributionQuery.error)}
                        onRetry={() => void workloadDistributionQuery.refetch()}
                      />
                    ) : null}

                    {workloadDistributionQuery.data &&
                    workloadDistributionQuery.data.data.contributors.length === 0 &&
                    workloadDistributionQuery.data.data.reviewers.length === 0 ? (
                      <EmptyState
                        title="No workload data available"
                        description="No pull requests or reviews were found for the selected range."
                      />
                    ) : null}

                    {workloadDistributionQuery.data &&
                    (workloadDistributionQuery.data.data.contributors.length > 0 ||
                      workloadDistributionQuery.data.data.reviewers.length > 0) ? (
                      <DashboardWorkloadDistribution distribution={workloadDistributionQuery.data.data} />
                    ) : null}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </PageShell>
    </AppLayout>
  );
}
