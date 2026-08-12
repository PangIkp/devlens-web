import type { paths } from "@/api/generated/schema";
import { organizationListResponseSchema } from "@/features/organizations/organizations.schemas";
import { apiRequest } from "@/lib/api-client";

type OrganizationListResponse =
  paths["/organizations"]["get"]["responses"][200]["content"]["application/json"];

export async function listOrganizations() {
  const response = await apiRequest<OrganizationListResponse>("/organizations", {
    method: "GET",
  });

  return organizationListResponseSchema.parse(response);
}
