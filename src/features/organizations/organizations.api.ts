import type { paths } from "@/api/generated/schema";
import { apiRequest } from "@/lib/api-client";

type OrganizationListResponse =
  paths["/organizations"]["get"]["responses"][200]["content"]["application/json"];

export async function listOrganizations() {
  return apiRequest<OrganizationListResponse>("/organizations", {
    method: "GET",
  });
}
