import { useEffect } from "react";
import { createRoute, Link, type SearchSchemaInput } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Gauge,
  GitPullRequest,
  MessageSquare,
  Rocket,
  Users,
} from "lucide-react";
import { z } from "zod";
import { rootRoute } from "@/routes/root";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { DashboardSummaryGrid } from "@/components/dashboard/dashboard-summary-grid";
import { DashboardHotspotsTable } from "@/components/dashboard/dashboard-hotspots-table";
import { DashboardHotspotsTableSkeleton } from "@/components/dashboard/dashboard-hotspots-table-skeleton";
import { DashboardReviewQueueTable } from "@/components/dashboard/dashboard-review-queue-table";
import { DashboardReviewQueueTableSkeleton } from "@/components/dashboard/dashboard-review-queue-table-skeleton";
import { DashboardWorkloadDistribution } from "@/components/dashboard/dashboard-workload-distribution";
import { DashboardWorkloadDistributionSkeleton } from "@/components/dashboard/dashboard-workload-distribution-skeleton";
import { EChartPanel } from "@/components/charts/echart-panel";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type DashboardSearch = z.infer<typeof dashboardSearchSchema>;

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  validateSearch: (search: Partial<DashboardSearch> & SearchSchemaInput): DashboardSearch =>
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

const CHART_ACCENT_COLOR = "#ec7040";
const CHART_PREVIOUS_COLOR = "#94a3b8";

function accentAreaGradient() {
  return {
    type: "linear" as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: "rgba(236, 112, 64, 0.35)" },
      { offset: 1, color: "rgba(236, 112, 64, 0)" },
    ],
  };
}

function buildTrendOption(
  current: Array<{ date: string; value: number }>,
  previous: Array<{ date: string; value: number }> | undefined,
  seriesType: "line" | "bar",
  withArea: boolean,
): EChartsOption {
  if (!previous) {
    return {
      tooltip: { trigger: "axis", confine: true },
      xAxis: { type: "category" },
      yAxis: { type: "value" },
      series: [
        {
          type: seriesType,
          smooth: seriesType === "line" ? true : undefined,
          itemStyle: { color: CHART_ACCENT_COLOR, borderRadius: seriesType === "bar" ? [6, 6, 0, 0] : undefined },
          lineStyle: seriesType === "line" ? { color: CHART_ACCENT_COLOR, width: 3 } : undefined,
          areaStyle: withArea ? { color: accentAreaGradient() } : undefined,
          data: createLineSeriesData(current),
        },
      ],
    };
  }

  const { categories, currentValues, previousValues } = alignComparisonSeries(current, previous);

  return {
    tooltip: { trigger: "axis", confine: true },
    legend: { data: ["Current period", "Previous period"] },
    xAxis: { type: "category", data: categories },
    yAxis: { type: "value" },
    series: [
      {
        name: "Current period",
        type: seriesType,
        smooth: seriesType === "line" ? true : undefined,
        itemStyle: { color: CHART_ACCENT_COLOR, borderRadius: seriesType === "bar" ? [6, 6, 0, 0] : undefined },
        lineStyle: seriesType === "line" ? { color: CHART_ACCENT_COLOR, width: 3 } : undefined,
        areaStyle: withArea ? { color: accentAreaGradient() } : undefined,
        data: currentValues,
      },
      {
        name: "Previous period",
        type: seriesType,
        smooth: seriesType === "line" ? true : undefined,
        itemStyle: { color: CHART_PREVIOUS_COLOR, opacity: seriesType === "bar" ? 0.6 : undefined },
        lineStyle: seriesType === "line" ? { type: "dashed", color: CHART_PREVIOUS_COLOR } : undefined,
        data: previousValues,
      },
    ],
  };
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof GitPullRequest;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
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
      <PageShell unwrapped>
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 space-y-4 border-b border-border/60 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-accent">Dashboard</p>

            <form className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_1fr_auto]">
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Organization</span>
                <Select
                  value={selectedOrganizationId ?? ""}
                  disabled={organizationsQuery.isLoading || (organizations?.length ?? 0) === 0}
                  onValueChange={(value) =>
                    updateSearch({
                      organizationId: value,
                      repositoryId: undefined,
                      hotspotPage: 1,
                    })
                  }
                >
                  <SelectTrigger aria-label="Organization">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Repository</span>
                <Select
                  value={selectedRepositoryId ?? ""}
                  disabled={repositoriesQuery.isLoading || repositories.length === 0}
                  onValueChange={(value) =>
                    updateSearch({
                      repositoryId: value,
                      hotspotPage: 1,
                    })
                  }
                >
                  <SelectTrigger aria-label="Repository">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repository) => (
                      <SelectItem key={repository.id} value={repository.id}>
                        {repository.fullName}
                        {!repository.isActive ? " (inactive)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Date range</span>
                <Select
                  value={String(selectedPreset)}
                  onValueChange={(value) => {
                    const nextPreset = Number(value) as (typeof dashboardRangePresets)[number];
                    const nextRange = getDashboardDateRangeForPreset(nextPreset);
                    updateSearch({
                      from: nextRange.from,
                      to: nextRange.to,
                      hotspotPage: 1,
                    });
                  }}
                >
                  <SelectTrigger aria-label="Date range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
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

            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pt-6">
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
              {selectedRepository && !selectedRepository.isActive ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <span>
                    This repository is deactivated — new GitHub activity is no longer synced. The data below reflects
                    activity up to the last sync.
                  </span>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/settings" search={{ tab: "sync" }}>
                      Reactivate in Settings
                    </Link>
                  </Button>
                </div>
              ) : null}

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
                  <SectionHeading
                    icon={Gauge}
                    title="Summary"
                    description="Snapshot of repository workflow health for the selected date range."
                  />
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
                  <Card className="space-y-4">
                    <SectionHeading
                      icon={GitPullRequest}
                      title="Pull request metrics"
                      description="Review cycle and pull request size indicators for engineering throughput."
                    />
                    {pullRequestQuery.isError ? (
                      <ErrorState
                        title="Could not load pull request metrics"
                        message={getErrorMessage(pullRequestQuery.error)}
                        onRetry={() => void pullRequestQuery.refetch()}
                      />
                    ) : (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average cycle time</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatDurationMinutes(pullRequestQuery.data?.data.averageCycleTimeMinutes)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average files changed</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatCount(pullRequestQuery.data?.data.averageFilesChanged, 1)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average additions</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatCount(pullRequestQuery.data?.data.averageAdditions, 1)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-4">
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
                      </>
                    )}
                  </Card>

                  <Card className="space-y-4">
                    <SectionHeading
                      icon={MessageSquare}
                      title="Review metrics"
                      description="Review wait time means how long a pull request waits before the first review response arrives."
                    />
                    {reviewQuery.isError ? (
                      <ErrorState
                        title="Could not load review metrics"
                        message={getErrorMessage(reviewQuery.error)}
                        onRetry={() => void reviewQuery.refetch()}
                      />
                    ) : (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average wait time</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatDurationMinutes(reviewQuery.data?.data.averageWaitMinutes)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Average review time</p>
                            <p className="mt-2 text-2xl font-semibold">
                              {formatDurationMinutes(reviewQuery.data?.data.averageReviewMinutes)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-4 sm:col-span-2">
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
                      </>
                    )}
                  </Card>
                </section>
              ) : null}

              {repositoryMetricsReady ? (
                <Card className="space-y-4">
                  <SectionHeading
                    icon={Rocket}
                    title="Deployment metrics"
                    description="Deployment throughput and failure signals for the selected repository."
                  />
                  {deploymentQuery.isError ? (
                    <ErrorState
                      title="Could not load deployment metrics"
                      message={getErrorMessage(deploymentQuery.error)}
                      onRetry={() => void deploymentQuery.refetch()}
                    />
                  ) : (
                    <>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg bg-muted/50 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Deployment count</p>
                          <p className="mt-2 text-2xl font-semibold">
                            {formatCount(deploymentQuery.data?.data.deploymentCount)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-4">
                          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Deployment frequency</p>
                          <p className="mt-2 text-2xl font-semibold">
                            {formatCount(deploymentQuery.data?.data.deploymentFrequency, 2)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-4">
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
                    </>
                  )}
                </Card>
              ) : null}

              {repositoryMetricsReady ? (
                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="space-y-4">
                    <SectionHeading
                      icon={Flame}
                      title="Hotspot files"
                      description="Ranked files with the highest change volume and churn pressure."
                    />

                    {hotspotsQuery.isLoading ? <DashboardHotspotsTableSkeleton /> : null}

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
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label="Previous page"
                            disabled={search.hotspotPage <= 1}
                            onClick={() => updateSearch({ hotspotPage: search.hotspotPage - 1 })}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            Page {hotspotsQuery.data.meta.page} / {Math.max(hotspotsQuery.data.meta.totalPages, 1)}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label="Next page"
                            disabled={hotspotsQuery.data.meta.page >= Math.max(hotspotsQuery.data.meta.totalPages, 1)}
                            onClick={() => updateSearch({ hotspotPage: search.hotspotPage + 1 })}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </Card>

                  <Card className="space-y-4">
                    <SectionHeading
                      icon={Clock}
                      title="Review queue"
                      description="Open pull requests currently waiting for their first review response."
                    />

                    {reviewQueueQuery.isLoading ? <DashboardReviewQueueTableSkeleton /> : null}

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
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label="Previous page"
                            disabled={search.reviewQueuePage <= 1}
                            onClick={() => updateSearch({ reviewQueuePage: search.reviewQueuePage - 1 })}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            Page {reviewQueueQuery.data.meta.page} / {Math.max(reviewQueueQuery.data.meta.totalPages, 1)}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label="Next page"
                            disabled={
                              reviewQueueQuery.data.meta.page >= Math.max(reviewQueueQuery.data.meta.totalPages, 1)
                            }
                            onClick={() => updateSearch({ reviewQueuePage: search.reviewQueuePage + 1 })}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </Card>
                </section>
              ) : null}

              {repositoryMetricsReady ? (
                <Card className="space-y-4">
                  <SectionHeading
                    icon={Users}
                    title="Workload distribution"
                    description="How pull requests and reviews are distributed across the team for the selected range."
                  />

                  {workloadDistributionQuery.isLoading ? <DashboardWorkloadDistributionSkeleton /> : null}

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
                </Card>
              ) : null}
            </div>
          ) : null}
          </div>
        </div>
      </PageShell>
    </AppLayout>
  );
}
