import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelSyncJob, createRepositorySync, getSyncJob, listRepositorySyncJobs, retrySyncJob } from "@/features/sync/sync.api";

export const syncKeys = {
  all: ["sync"] as const,
  jobs: (repositoryId: string, page: number, pageSize: number, status?: string) =>
    [...syncKeys.all, "jobs", repositoryId, page, pageSize, status] as const,
  job: (syncJobId: string) => [...syncKeys.all, "job", syncJobId] as const,
};

export function useRepositorySyncJobsQuery(params: {
  repositoryId: string;
  page: number;
  pageSize: number;
  status?: "pending" | "running" | "completed" | "failed";
}, enabled = true) {
  return useQuery({
    queryKey: syncKeys.jobs(params.repositoryId, params.page, params.pageSize, params.status),
    queryFn: () => listRepositorySyncJobs(params),
    enabled: enabled && params.repositoryId.length > 0,
    placeholderData: (previous) => previous,
    refetchInterval: (query) => {
      const jobs = query.state.data?.data ?? [];

      return jobs.some((job) => job.status === "pending" || job.status === "running") ? 5_000 : false;
    },
  });
}

export function useSyncJobDetailQuery(syncJobId: string, enabled = true) {
  return useQuery({
    queryKey: syncKeys.job(syncJobId),
    queryFn: () => getSyncJob(syncJobId),
    enabled: enabled && syncJobId.length > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.data.status;

      return status === "pending" || status === "running" ? 5_000 : false;
    },
  });
}

export function useCreateRepositorySyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRepositorySync,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: syncKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["repositories"] });
      void queryClient.setQueryData(syncKeys.job(data.data.id), data);
    },
  });
}

export function useRetrySyncJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retrySyncJob,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: syncKeys.all });
      void queryClient.setQueryData(syncKeys.job(data.data.id), data);
    },
  });
}

export function useCancelSyncJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSyncJob,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: syncKeys.all });
      void queryClient.setQueryData(syncKeys.job(data.data.id), data);
    },
  });
}
