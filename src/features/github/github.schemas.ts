import { z } from "zod";

export const githubConnectionStateSchema = z.enum([
  "not_connected",
  "installation_required",
  "connected",
  "syncing",
  "sync_failed",
]);

export const githubConnectionSchema = z.object({
  organizationId: z.string().min(1),
  provider: z.string(),
  state: githubConnectionStateSchema,
  installationId: z.number().int().nullable().optional(),
  accountLogin: z.string().nullable().optional(),
  accountType: z.enum(["User", "Organization"]).nullable().optional(),
  targetType: z.enum(["account", "organization", "selected_repositories"]).nullable().optional(),
  reconnectRequired: z.boolean().optional(),
  lastSyncedAt: z.string().nullable().optional(),
  lastSyncError: z.string().nullable().optional(),
  connectedRepositories: z.number().int().optional(),
});

export const githubConnectionResponseSchema = z.object({
  data: githubConnectionSchema,
});

export const startGitHubInstallationSchema = z.object({
  installUrl: z.string().url(),
  state: z.string().min(1),
});

export const startGitHubInstallationResponseSchema = z.object({
  data: startGitHubInstallationSchema,
});

export const githubAccessibleRepositorySchema = z.object({
  githubRepositoryId: z.number().int(),
  fullName: z.string(),
  name: z.string().optional(),
  ownerLogin: z.string().optional(),
  private: z.boolean(),
  defaultBranch: z.string().nullable().optional(),
  installationStatus: z.enum(["accessible", "permission_missing", "installation_required", "suspended"]),
  selectionStatus: z.enum(["not_selected", "selected", "syncing", "sync_failed", "synced"]),
  linkedRepositoryId: z.string().nullable().optional(),
  lastSyncError: z.string().nullable().optional(),
});

export const githubAccessibleRepositoryListResponseSchema = z.object({
  data: z.array(githubAccessibleRepositorySchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export const selectGitHubRepositoriesRequestSchema = z.object({
  repositoryIds: z.array(z.number().int()).min(1),
  autoSync: z.boolean().default(true),
});

export const githubRepositorySelectionResponseSchema = z.object({
  data: z.object({
    state: z.enum(["connected", "syncing", "sync_failed"]),
    selectedRepositoryIds: z.array(z.number().int()),
    createdRepositoryIds: z.array(z.string()).optional(),
    syncJobIds: z.array(z.string()).optional(),
  }),
});

export type GitHubConnection = z.infer<typeof githubConnectionSchema>;
export type GitHubAccessibleRepository = z.infer<typeof githubAccessibleRepositorySchema>;
