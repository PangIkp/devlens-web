import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dismissInsight, listInsights, reopenInsight, reviewInsight } from "@/features/insights/insights.api";

export const insightsKeys = {
  all: ["insights"] as const,
  list: (params: Record<string, unknown>) => [...insightsKeys.all, "list", params] as const,
};

export function useInsightsQuery(
  params: {
    organizationId: string;
    repositoryId?: string;
    type?: "bottleneck_detection" | "large_pr_detection" | "slow_review_detection" | "hotspot_detection" | "deployment_failure_trend" | "review_concentration";
    status?: "open" | "reviewed" | "dismissed";
    from: string;
    to: string;
    page: number;
    pageSize: number;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: insightsKeys.list(params),
    queryFn: () => listInsights(params),
    enabled: enabled && params.organizationId.length > 0,
    placeholderData: (previous) => previous,
  });
}

function useInsightStatusMutation<TVariables extends { organizationId: string }>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: insightsKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["github", "connection", variables.organizationId] });
    },
  });
}

export function useReviewInsightMutation() {
  return useInsightStatusMutation(reviewInsight);
}

export function useDismissInsightMutation() {
  return useInsightStatusMutation(dismissInsight);
}

export function useReopenInsightMutation() {
  return useInsightStatusMutation(reopenInsight);
}
