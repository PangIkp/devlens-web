import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { operations } from "@/api/generated/schema";
import { dismissInsight, listInsights, reopenInsight, reviewInsight } from "@/features/insights/insights.api";

export const insightsKeys = {
  all: ["insights"] as const,
  list: (params: Record<string, unknown>) => [...insightsKeys.all, "list", params] as const,
};

export function useInsightsQuery(
  params: {
    organizationId: string;
    repositoryId?: operations["listInsights"]["parameters"]["query"]["repositoryId"];
    type?: operations["listInsights"]["parameters"]["query"]["type"];
    status?: operations["listInsights"]["parameters"]["query"]["status"];
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
