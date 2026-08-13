import { useQuery } from "@tanstack/react-query";
import { getPullRequest, listPullRequests, type PullRequestSortBy } from "@/features/pull-requests/pull-requests.api";

export const pullRequestKeys = {
  all: ["pullRequests"] as const,
  list: (params: Record<string, unknown>) => [...pullRequestKeys.all, "list", params] as const,
  detail: (pullRequestId: string) => [...pullRequestKeys.all, "detail", pullRequestId] as const,
};

export function usePullRequestsQuery(
  params: {
    repositoryId?: string;
    page: number;
    pageSize: number;
    search?: string;
    status?: "open" | "closed" | "merged";
    sortBy?: PullRequestSortBy;
    sortOrder?: "asc" | "desc";
  },
  enabled = true,
) {
  return useQuery({
    queryKey: pullRequestKeys.list(params),
    queryFn: () => listPullRequests(params),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function usePullRequestDetailQuery(pullRequestId: string, enabled = true) {
  return useQuery({
    queryKey: pullRequestKeys.detail(pullRequestId),
    queryFn: () => getPullRequest(pullRequestId),
    enabled: enabled && pullRequestId.length > 0,
  });
}
