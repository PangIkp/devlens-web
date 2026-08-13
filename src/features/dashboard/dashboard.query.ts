import { useQuery } from "@tanstack/react-query";
import {
  type DashboardRange,
  getDashboardSummary,
  getDeploymentMetrics,
  getHotspotMetrics,
  getPullRequestMetrics,
  getRepositoryMetrics,
  getReviewMetrics,
  getReviewQueue,
  getWorkloadDistribution,
} from "@/features/dashboard/dashboard.api";
import { inferMetricsInterval } from "@/features/dashboard/dashboard.utils";

type RepositoryScopedRange = DashboardRange & {
  repositoryId: string;
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (repositoryId: string, range: DashboardRange) => [...dashboardKeys.all, "summary", repositoryId, range] as const,
  pullRequests: (repositoryId: string, range: DashboardRange, interval: string) =>
    [...dashboardKeys.all, "pullRequests", repositoryId, range, interval] as const,
  reviews: (repositoryId: string, range: DashboardRange, interval: string) =>
    [...dashboardKeys.all, "reviews", repositoryId, range, interval] as const,
  deployments: (repositoryId: string, range: DashboardRange, interval: string) =>
    [...dashboardKeys.all, "deployments", repositoryId, range, interval] as const,
  hotspots: (repositoryId: string, range: DashboardRange, page: number, pageSize: number) =>
    [...dashboardKeys.all, "hotspots", repositoryId, range, page, pageSize] as const,
  reviewQueue: (repositoryId: string, range: DashboardRange, page: number, pageSize: number) =>
    [...dashboardKeys.all, "reviewQueue", repositoryId, range, page, pageSize] as const,
  workloadDistribution: (repositoryId: string, range: DashboardRange) =>
    [...dashboardKeys.all, "workloadDistribution", repositoryId, range] as const,
  repositoryMetrics: (repositoryId: string, range: DashboardRange, interval: string) =>
    [...dashboardKeys.all, "repositoryMetrics", repositoryId, range, interval] as const,
};

export function useDashboardSummaryQuery(params: RepositoryScopedRange, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.summary(params.repositoryId, params),
    queryFn: () => getDashboardSummary(params),
    enabled,
  });
}

export function usePullRequestMetricsQuery(params: RepositoryScopedRange, enabled = true) {
  const interval = inferMetricsInterval(params.from, params.to);

  return useQuery({
    queryKey: dashboardKeys.pullRequests(params.repositoryId, params, interval),
    queryFn: () => getPullRequestMetrics({ ...params, interval }),
    enabled,
  });
}

export function useReviewMetricsQuery(params: RepositoryScopedRange, enabled = true) {
  const interval = inferMetricsInterval(params.from, params.to);

  return useQuery({
    queryKey: dashboardKeys.reviews(params.repositoryId, params, interval),
    queryFn: () => getReviewMetrics({ ...params, interval }),
    enabled,
  });
}

export function useDeploymentMetricsQuery(params: RepositoryScopedRange, enabled = true) {
  const interval = inferMetricsInterval(params.from, params.to);

  return useQuery({
    queryKey: dashboardKeys.deployments(params.repositoryId, params, interval),
    queryFn: () => getDeploymentMetrics({ ...params, interval }),
    enabled,
  });
}

export function useHotspotMetricsQuery(
  params: RepositoryScopedRange & {
    page: number;
    pageSize: number;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: dashboardKeys.hotspots(params.repositoryId, params, params.page, params.pageSize),
    queryFn: () => getHotspotMetrics(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useReviewQueueQuery(
  params: RepositoryScopedRange & {
    page: number;
    pageSize: number;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: dashboardKeys.reviewQueue(params.repositoryId, params, params.page, params.pageSize),
    queryFn: () => getReviewQueue(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useWorkloadDistributionQuery(params: RepositoryScopedRange, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.workloadDistribution(params.repositoryId, params),
    queryFn: () => getWorkloadDistribution(params),
    enabled,
  });
}

export function useRepositoryMetricsQuery(params: RepositoryScopedRange, enabled = true) {
  const interval = inferMetricsInterval(params.from, params.to);

  return useQuery({
    queryKey: dashboardKeys.repositoryMetrics(params.repositoryId, params, interval),
    queryFn: () => getRepositoryMetrics({ ...params, interval }),
    enabled,
  });
}
