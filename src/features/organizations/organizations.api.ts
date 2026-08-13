import type { operations, paths } from "@/api/generated/schema";
import {
  createOrganizationMemberRequestSchema,
  createOrganizationRequestSchema,
  organizationListResponseSchema,
  organizationMemberListResponseSchema,
  organizationMemberResponseSchema,
  organizationResponseSchema,
  updateOrganizationMemberRequestSchema,
  updateOrganizationRequestSchema,
} from "@/features/organizations/organizations.schemas";
import { apiRequest } from "@/lib/api-client";

type OrganizationListResponse =
  paths["/organizations"]["get"]["responses"][200]["content"]["application/json"];
type OrganizationResponse =
  paths["/organizations/{organizationId}"]["get"]["responses"][200]["content"]["application/json"];
type CreateOrganizationResponse =
  paths["/organizations"]["post"]["responses"][201]["content"]["application/json"];
type UpdateOrganizationResponse =
  paths["/organizations/{organizationId}"]["patch"]["responses"][200]["content"]["application/json"];
type OrganizationMemberListResponse =
  paths["/organizations/{organizationId}/members"]["get"]["responses"][200]["content"]["application/json"];
type OrganizationMemberResponse =
  paths["/organizations/{organizationId}/members"]["post"]["responses"][201]["content"]["application/json"];
type UpdateOrganizationMemberResponse =
  paths["/organizations/{organizationId}/members/{memberId}"]["patch"]["responses"][200]["content"]["application/json"];

export async function listOrganizations() {
  const response = await apiRequest<OrganizationListResponse>("/organizations", {
    method: "GET",
  });

  return organizationListResponseSchema.parse(response);
}

export async function getOrganization(organizationId: string) {
  const response = await apiRequest<OrganizationResponse>(`/organizations/${organizationId}`, {
    method: "GET",
  });

  return organizationResponseSchema.parse(response);
}

export async function createOrganization(
  payload: operations["createOrganization"]["requestBody"]["content"]["application/json"],
) {
  const body = createOrganizationRequestSchema.parse(payload);
  const response = await apiRequest<CreateOrganizationResponse>("/organizations", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return organizationResponseSchema.parse(response);
}

export async function updateOrganization(params: {
  organizationId: string;
  payload: operations["updateOrganization"]["requestBody"]["content"]["application/json"];
}) {
  const body = updateOrganizationRequestSchema.parse(params.payload);
  const response = await apiRequest<UpdateOrganizationResponse>(`/organizations/${params.organizationId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  return organizationResponseSchema.parse(response);
}

export async function deleteOrganization(organizationId: string) {
  await apiRequest<void>(`/organizations/${organizationId}`, {
    method: "DELETE",
  });
}

export async function listOrganizationMembers(organizationId: string) {
  const response = await apiRequest<OrganizationMemberListResponse>(`/organizations/${organizationId}/members`, {
    method: "GET",
  });

  return organizationMemberListResponseSchema.parse(response);
}

export async function createOrganizationMember(params: {
  organizationId: string;
  payload: operations["createOrganizationMember"]["requestBody"]["content"]["application/json"];
}) {
  const body = createOrganizationMemberRequestSchema.parse(params.payload);
  const response = await apiRequest<OrganizationMemberResponse>(`/organizations/${params.organizationId}/members`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return organizationMemberResponseSchema.parse(response);
}

export async function updateOrganizationMember(params: {
  organizationId: string;
  memberId: string;
  payload: operations["updateOrganizationMember"]["requestBody"]["content"]["application/json"];
}) {
  const body = updateOrganizationMemberRequestSchema.parse(params.payload);
  const response = await apiRequest<UpdateOrganizationMemberResponse>(
    `/organizations/${params.organizationId}/members/${params.memberId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );

  return organizationMemberResponseSchema.parse(response);
}

export async function deleteOrganizationMember(params: {
  organizationId: string;
  memberId: string;
}) {
  await apiRequest<void>(`/organizations/${params.organizationId}/members/${params.memberId}`, {
    method: "DELETE",
  });
}
