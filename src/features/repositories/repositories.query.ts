import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRepository,
  listRepositories,
  updateRepository,
  type ListRepositoriesParams,
} from "@/features/repositories/repositories.api";
import type {
  RepositoryListResponse,
  RepositoryResponse,
} from "@/features/repositories/repositories.schemas";

export const repositoriesKeys = {
  all: ["repositories"] as const,
  lists: () => [...repositoriesKeys.all, "list"] as const,
  list: (params: ListRepositoriesParams) => [...repositoriesKeys.lists(), params] as const,
  details: () => [...repositoriesKeys.all, "detail"] as const,
  detail: (repositoryId: string) => [...repositoriesKeys.details(), repositoryId] as const,
};

export function useRepositoriesListQuery(params: ListRepositoriesParams, enabled = true) {
  return useQuery({
    queryKey: repositoriesKeys.list(params),
    queryFn: () => listRepositories(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useRepositoryDetailQuery(repositoryId: string) {
  return useQuery({
    queryKey: repositoriesKeys.detail(repositoryId),
    queryFn: () => getRepository(repositoryId),
  });
}

export function useUpdateRepositoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repositoryId, isActive }: { repositoryId: string; isActive: boolean }) =>
      updateRepository(repositoryId, { isActive }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: repositoriesKeys.all });

      const previousDetail = queryClient.getQueryData<RepositoryResponse>(
        repositoriesKeys.detail(variables.repositoryId),
      );
      const previousLists = queryClient.getQueriesData<RepositoryListResponse>({
        queryKey: repositoriesKeys.lists(),
      });

      queryClient.setQueryData<RepositoryResponse | undefined>(
        repositoriesKeys.detail(variables.repositoryId),
        (current) =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  isActive: variables.isActive,
                },
              }
            : current,
      );

      queryClient.setQueriesData<RepositoryListResponse | undefined>(
        { queryKey: repositoriesKeys.lists() },
        (current) =>
          current
            ? {
                ...current,
                data: current.data.map((repository) =>
                  repository.id === variables.repositoryId
                    ? { ...repository, isActive: variables.isActive }
                    : repository,
                ),
              }
            : current,
      );

      return { previousDetail, previousLists };
    },
    onError: (_error, variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          repositoriesKeys.detail(variables.repositoryId),
          context.previousDetail,
        );
      }

      for (const [queryKey, data] of context?.previousLists ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: (response, variables) => {
      queryClient.setQueryData<RepositoryResponse>(
        repositoriesKeys.detail(variables.repositoryId),
        response,
      );

      queryClient.setQueriesData<RepositoryListResponse | undefined>(
        { queryKey: repositoriesKeys.lists() },
        (current) =>
          current
            ? {
                ...current,
                data: current.data.map((repository) =>
                  repository.id === variables.repositoryId
                    ? { ...repository, ...response.data }
                    : repository,
                ),
              }
            : current,
      );

      void queryClient.invalidateQueries({ queryKey: repositoriesKeys.detail(variables.repositoryId) });
      void queryClient.invalidateQueries({ queryKey: repositoriesKeys.lists() });
    },
  });
}
