import type { operations, paths } from "@/api/generated/schema";
import {
  dashboardSummaryResponseSchema,
  deploymentMetricsResponseSchema,
  hotspotMetricsBodySchema,
  pullRequestMetricsResponseSchema,
  reviewMetricsResponseSchema,
} from "@/features/dashboard/dashboard.schemas";
import { apiRequest } from "@/lib/api-client";

type SummaryResponse =
  paths["/repositories/{repositoryId}/dashboard/summary"]["get"]["responses"][200]["content"]["application/json"];
type PullRequestResponse =
  paths["/repositories/{repositoryId}/metrics/pull-requests"]["get"]["responses"][200]["content"]["application/json"];
type ReviewResponse =
  paths["/repositories/{repositoryId}/metrics/reviews"]["get"]["responses"][200]["content"]["application/json"];
type DeploymentResponse =
  paths["/repositories/{repositoryId}/metrics/deployments"]["get"]["responses"][200]["content"]["application/json"];
type HotspotResponse =
  paths["/repositories/{repositoryId}/metrics/hotspots"]["get"]["responses"][200]["content"]["application/json"];

export type DashboardRange = {
  from: operations["getDashboardSummary"]["parameters"]["query"]["from"];
  to: operations["getDashboardSummary"]["parameters"]["query"]["to"];
};

type RangeWithRepositoryId = DashboardRange & {
  repositoryId: operations["getDashboardSummary"]["parameters"]["path"]["repositoryId"];
};

export async function getDashboardSummary({ repositoryId, from, to }: RangeWithRepositoryId) {
  const response = await apiRequest<SummaryResponse>(
    `/repositories/${repositoryId}/dashboard/summary`,
    {
      method: "GET",
    },
    { from, to },
  );

  return dashboardSummaryResponseSchema.parse(response);
}

export async function getPullRequestMetrics({
  repositoryId,
  from,
  to,
  interval,
}: RangeWithRepositoryId & {
  interval: operations["getPullRequestMetrics"]["parameters"]["query"]["interval"];
}) {
  const response = await apiRequest<PullRequestResponse>(
    `/repositories/${repositoryId}/metrics/pull-requests`,
    {
      method: "GET",
    },
    { from, to, interval },
  );

  return pullRequestMetricsResponseSchema.parse(response);
}

export async function getReviewMetrics({
  repositoryId,
  from,
  to,
  interval,
}: RangeWithRepositoryId & {
  interval: operations["getReviewMetrics"]["parameters"]["query"]["interval"];
}) {
  const response = await apiRequest<ReviewResponse>(
    `/repositories/${repositoryId}/metrics/reviews`,
    {
      method: "GET",
    },
    { from, to, interval },
  );

  return reviewMetricsResponseSchema.parse(response);
}

export async function getDeploymentMetrics({
  repositoryId,
  from,
  to,
  interval,
}: RangeWithRepositoryId & {
  interval: operations["getDeploymentMetrics"]["parameters"]["query"]["interval"];
}) {
  const response = await apiRequest<DeploymentResponse>(
    `/repositories/${repositoryId}/metrics/deployments`,
    {
      method: "GET",
    },
    { from, to, interval },
  );

  return deploymentMetricsResponseSchema.parse(response);
}

export async function getHotspotMetrics({
  repositoryId,
  from,
  to,
  page = 1,
  pageSize = 10,
  sortOrder = "desc",
}: RangeWithRepositoryId & {
  page?: operations["getHotspotMetrics"]["parameters"]["query"]["page"];
  pageSize?: operations["getHotspotMetrics"]["parameters"]["query"]["pageSize"];
  sortOrder?: operations["getHotspotMetrics"]["parameters"]["query"]["sortOrder"];
}) {
  const response = await apiRequest<HotspotResponse>(
    `/repositories/${repositoryId}/metrics/hotspots`,
    {
      method: "GET",
    },
    { from, to, page, pageSize, sortOrder },
  );

  return hotspotMetricsBodySchema.parse(response);
}
