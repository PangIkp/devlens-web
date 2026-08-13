import type { paths } from "@/api/generated/schema";
import { createSyncRequestSchema, syncJobListResponseSchema, syncJobResponseSchema } from "@/features/sync/sync.schemas";
import { apiRequest } from "@/lib/api-client";

type SyncJobResponse = paths["/repositories/{repositoryId}/sync"]["post"]["responses"][202]["content"]["application/json"];
type SyncJobListResponse =
  paths["/repositories/{repositoryId}/sync-jobs"]["get"]["responses"][200]["content"]["application/json"];
type SyncJobDetailResponse = paths["/sync-jobs/{syncJobId}"]["get"]["responses"][200]["content"]["application/json"];
type RetrySyncJobResponse = paths["/sync-jobs/{syncJobId}/retry"]["post"]["responses"][202]["content"]["application/json"];
type CancelSyncJobResponse = paths["/sync-jobs/{syncJobId}/cancel"]["post"]["responses"][202]["content"]["application/json"];

type SyncMode = "incremental" | "full";
type SyncJobStatusFilter = "pending" | "running" | "completed" | "failed" | "canceled";
type SyncSortOrder = "asc" | "desc";

export async function createRepositorySync(params: {
  repositoryId: string;
  mode?: SyncMode;
  from?: string;
}) {
  const payload = createSyncRequestSchema.parse({
    mode: params.mode ?? "incremental",
    from: params.from,
  });

  const response = await apiRequest<SyncJobResponse>(`/repositories/${params.repositoryId}/sync`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return syncJobResponseSchema.parse(response);
}

export async function listRepositorySyncJobs(params: {
  repositoryId: string;
  page?: number;
  pageSize?: number;
  status?: SyncJobStatusFilter;
  sortOrder?: SyncSortOrder;
}) {
  const response = await apiRequest<SyncJobListResponse>(
    `/repositories/${params.repositoryId}/sync-jobs`,
    { method: "GET" },
    {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      status: params.status,
      sortOrder: params.sortOrder ?? "desc",
    },
  );

  return syncJobListResponseSchema.parse(response);
}

export async function getSyncJob(syncJobId: string) {
  const response = await apiRequest<SyncJobDetailResponse>(`/sync-jobs/${syncJobId}`, {
    method: "GET",
  });

  return syncJobResponseSchema.parse(response);
}

export async function retrySyncJob(syncJobId: string) {
  const response = await apiRequest<RetrySyncJobResponse>(`/sync-jobs/${syncJobId}/retry`, {
    method: "POST",
  });

  return syncJobResponseSchema.parse(response);
}

export async function cancelSyncJob(syncJobId: string) {
  const response = await apiRequest<CancelSyncJobResponse>(`/sync-jobs/${syncJobId}/cancel`, {
    method: "POST",
  });

  return syncJobResponseSchema.parse(response);
}
