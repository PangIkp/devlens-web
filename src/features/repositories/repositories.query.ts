import { useQuery } from "@tanstack/react-query";
import { getRepository, listRepositories, type ListRepositoriesParams } from "@/features/repositories/repositories.api";

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
