import { z } from "zod";

export const syncJobStatusSchema = z.enum(["pending", "running", "completed", "failed", "canceled"]);

export const syncJobSchema = z.object({
  id: z.string().min(1),
  repositoryId: z.string().min(1),
  status: syncJobStatusSchema,
  progress: z.number().min(0).max(100),
  triggeredBy: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  finishedAt: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const syncJobResponseSchema = z.object({
  data: syncJobSchema,
});

export const syncJobListResponseSchema = z.object({
  data: z.array(syncJobSchema),
  meta: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export const createSyncRequestSchema = z.object({
  mode: z.enum(["incremental", "full"]).default("incremental"),
  from: z.string().optional(),
});

export type SyncJob = z.infer<typeof syncJobSchema>;
