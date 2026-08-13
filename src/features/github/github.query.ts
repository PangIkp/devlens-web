import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeGitHubInstallation,
  getGitHubConnection,
  listAccessibleGitHubRepositories,
  selectAccessibleGitHubRepositories,
  startGitHubInstallation,
} from "@/features/github/github.api";
import { organizationsKeys } from "@/features/organizations/use-organizations-query";

export const githubKeys = {
  all: ["github"] as const,
  connection: (organizationId: string) => [...githubKeys.all, "connection", organizationId] as const,
  repositories: (organizationId: string, page: number, pageSize: number) =>
    [...githubKeys.all, "repositories", organizationId, page, pageSize] as const,
};

export function useGitHubConnectionQuery(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: githubKeys.connection(organizationId),
    queryFn: () => getGitHubConnection(organizationId),
    enabled: enabled && organizationId.length > 0,
    refetchInterval: (query) => {
      const state = query.state.data?.data.state;

      return state === "syncing" ? 10_000 : false;
    },
  });
}

export function useStartGitHubInstallationMutation(organizationId: string) {
  return useMutation({
    mutationFn: (redirectUrl?: string) => startGitHubInstallation(organizationId, redirectUrl),
  });
}

export function useCompleteGitHubInstallationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeGitHubInstallation,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: githubKeys.connection(variables.organizationId) });
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.lists() });
    },
  });
}

export function useAccessibleGitHubRepositoriesQuery(params: {
  organizationId: string;
  page: number;
  pageSize: number;
}, enabled = true) {
  return useQuery({
    queryKey: githubKeys.repositories(params.organizationId, params.page, params.pageSize),
    queryFn: () => listAccessibleGitHubRepositories(params),
    enabled: enabled && params.organizationId.length > 0,
    placeholderData: (previous) => previous,
  });
}

export function useSelectAccessibleGitHubRepositoriesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: selectAccessibleGitHubRepositories,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: githubKeys.connection(variables.organizationId) });
      void queryClient.invalidateQueries({ queryKey: githubKeys.repositories(variables.organizationId, 1, 20).slice(0, 3) });
    },
  });
}
