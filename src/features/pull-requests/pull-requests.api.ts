import type { operations, paths } from "@/api/generated/schema";
import { pullRequestListResponseSchema, pullRequestResponseSchema } from "@/features/pull-requests/pull-requests.schemas";
import { apiRequest } from "@/lib/api-client";

type PullRequestResponse =
  paths["/pull-requests/{pullRequestId}"]["get"]["responses"][200]["content"]["application/json"];
type PullRequestListResponse =
  paths["/pull-requests"]["get"]["responses"][200]["content"]["application/json"];

type PullRequestStatus = NonNullable<operations["listPullRequests"]["parameters"]["query"]>["status"];
export type PullRequestSortBy = NonNullable<operations["listPullRequests"]["parameters"]["query"]>["sortBy"];
type PullRequestSortOrder = NonNullable<operations["listPullRequests"]["parameters"]["query"]>["sortOrder"];

export async function getPullRequest(pullRequestId: string) {
  const response = await apiRequest<PullRequestResponse>(`/pull-requests/${pullRequestId}`, {
    method: "GET",
  });

  return pullRequestResponseSchema.parse(response);
}

export async function listPullRequests(params: {
  repositoryId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PullRequestStatus;
  sortBy?: PullRequestSortBy;
  sortOrder?: PullRequestSortOrder;
}) {
  const response = await apiRequest<PullRequestListResponse>(
    "/pull-requests",
    {
      method: "GET",
    },
    {
      repositoryId: params.repositoryId,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      search: params.search,
      status: params.status,
      sortBy: params.sortBy ?? "createdAt",
      sortOrder: params.sortOrder ?? "desc",
    },
  );

  const parsed = pullRequestListResponseSchema.safeParse(response);

  if (parsed.success) {
    return parsed.data;
  }

  const fallback = response as { data: unknown[]; pagination?: unknown; meta?: unknown };

  return pullRequestListResponseSchema.parse({
    data: fallback.data,
    pagination: fallback.pagination ?? fallback.meta,
  });
}
