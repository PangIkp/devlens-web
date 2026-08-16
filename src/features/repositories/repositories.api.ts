import type { operations, paths } from "@/api/generated/schema";
import { repositoryListBodySchema, repositoryResponseSchema } from "@/features/repositories/repositories.schemas";
import { apiRequest } from "@/lib/api-client";

type ListRepositoriesResponse =
  paths["/organizations/{organizationId}/repositories"]["get"]["responses"][200]["content"]["application/json"];
type GetRepositoryResponse =
  paths["/repositories/{repositoryId}"]["get"]["responses"][200]["content"]["application/json"];
type UpdateRepositoryResponse =
  paths["/repositories/{repositoryId}"]["patch"]["responses"][200]["content"]["application/json"];
type UpdateRepositoryRequestBody =
  operations["updateRepository"]["requestBody"]["content"]["application/json"];

export type ListRepositoriesParams = {
  organizationId: operations["listRepositories"]["parameters"]["path"]["organizationId"];
  page?: number;
  pageSize?: number;
  status?: "active" | "inactive" | "archived";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export async function listRepositories({
  organizationId,
  page = 1,
  pageSize = 10,
  search,
  status,
  sortBy = "createdAt",
  sortOrder = "desc",
}: ListRepositoriesParams) {
  const response = await apiRequest<ListRepositoriesResponse>(
    `/organizations/${organizationId}/repositories`,
    {
      method: "GET",
    },
    {
      page,
      pageSize,
      search: search || undefined,
      status,
      sortBy,
      sortOrder,
    },
  );

  return repositoryListBodySchema.parse(response);
}

export async function getRepository(repositoryId: string) {
  const response = await apiRequest<GetRepositoryResponse>(`/repositories/${repositoryId}`, {
    method: "GET",
  });

  return repositoryResponseSchema.parse(response);
}

export async function updateRepository(repositoryId: string, payload: UpdateRepositoryRequestBody) {
  const response = await apiRequest<UpdateRepositoryResponse>(`/repositories/${repositoryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return repositoryResponseSchema.parse(response);
}
