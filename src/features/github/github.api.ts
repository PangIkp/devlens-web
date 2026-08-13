import type { operations, paths } from "@/api/generated/schema";
import {
  githubAccessibleRepositoryListResponseSchema,
  githubConnectionResponseSchema,
  githubRepositorySelectionResponseSchema,
  selectGitHubRepositoriesRequestSchema,
  startGitHubInstallationResponseSchema,
} from "@/features/github/github.schemas";
import { apiRequest } from "@/lib/api-client";

type GitHubConnectionResponse =
  paths["/organizations/{organizationId}/github/connection"]["get"]["responses"][200]["content"]["application/json"];
type StartGitHubInstallationResponse =
  paths["/organizations/{organizationId}/github/installations/start"]["post"]["responses"][200]["content"]["application/json"];
type CompleteGitHubInstallationResponse =
  paths["/organizations/{organizationId}/github/installations/callback"]["get"]["responses"][200]["content"]["application/json"];
type AccessibleRepositoriesResponse =
  paths["/organizations/{organizationId}/github/repositories"]["get"]["responses"][200]["content"]["application/json"];
type SelectRepositoriesResponse =
  paths["/organizations/{organizationId}/github/repositories/select"]["post"]["responses"][202]["content"]["application/json"];

export async function getGitHubConnection(organizationId: string) {
  const response = await apiRequest<GitHubConnectionResponse>(`/organizations/${organizationId}/github/connection`, {
    method: "GET",
  });

  return githubConnectionResponseSchema.parse(response);
}

export async function startGitHubInstallation(organizationId: string, redirectUrl?: string) {
  const response = await apiRequest<StartGitHubInstallationResponse>(`/organizations/${organizationId}/github/installations/start`, {
    method: "POST",
    body: redirectUrl ? JSON.stringify({ redirectUrl }) : undefined,
  });

  return startGitHubInstallationResponseSchema.parse(response);
}

export async function completeGitHubInstallation(params: {
  organizationId: string;
  installationId: operations["completeGitHubInstallation"]["parameters"]["query"]["installation_id"];
  setupAction?: operations["completeGitHubInstallation"]["parameters"]["query"]["setup_action"];
}) {
  const response = await apiRequest<CompleteGitHubInstallationResponse>(
    `/organizations/${params.organizationId}/github/installations/callback`,
    {
      method: "GET",
    },
    {
      installation_id: params.installationId,
      setup_action: params.setupAction,
    },
  );

  return githubConnectionResponseSchema.parse(response);
}

export async function listAccessibleGitHubRepositories(params: {
  organizationId: string;
  page?: number;
  pageSize?: number;
}) {
  const response = await apiRequest<AccessibleRepositoriesResponse>(
    `/organizations/${params.organizationId}/github/repositories`,
    {
      method: "GET",
    },
    {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    },
  );

  return githubAccessibleRepositoryListResponseSchema.parse(response);
}

export async function selectAccessibleGitHubRepositories(params: {
  organizationId: string;
  repositoryIds: number[];
  autoSync?: boolean;
}) {
  const payload = selectGitHubRepositoriesRequestSchema.parse({
    repositoryIds: params.repositoryIds,
    autoSync: params.autoSync ?? true,
  });

  const response = await apiRequest<SelectRepositoriesResponse>(
    `/organizations/${params.organizationId}/github/repositories/select`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return githubRepositorySelectionResponseSchema.parse(response);
}
