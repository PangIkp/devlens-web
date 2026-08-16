import type { paths } from "@/api/generated/schema";
import {
  organizationRetentionSettingsResponseSchema,
  organizationRuleSettingsResponseSchema,
  type OrganizationRetentionSettings,
  type OrganizationRuleSettings,
} from "@/features/organization-settings/organization-settings.schemas";
import { apiRequest } from "@/lib/api-client";

type RuleSettingsResponse =
  paths["/organizations/{organizationId}/settings/rules"]["get"]["responses"][200]["content"]["application/json"];
type RetentionSettingsResponse =
  paths["/organizations/{organizationId}/settings/retention"]["get"]["responses"][200]["content"]["application/json"];

export async function getOrganizationRuleSettings(organizationId: string) {
  const response = await apiRequest<RuleSettingsResponse>(`/organizations/${organizationId}/settings/rules`, {
    method: "GET",
  });

  return organizationRuleSettingsResponseSchema.parse(response);
}

export async function updateOrganizationRuleSettings(params: {
  organizationId: string;
  payload: Partial<Omit<OrganizationRuleSettings, "updatedAt">>;
}) {
  const response = await apiRequest<RuleSettingsResponse>(`/organizations/${params.organizationId}/settings/rules`, {
    method: "PUT",
    body: JSON.stringify(params.payload),
  });

  return organizationRuleSettingsResponseSchema.parse(response);
}

export async function getOrganizationRetentionSettings(organizationId: string) {
  const response = await apiRequest<RetentionSettingsResponse>(
    `/organizations/${organizationId}/settings/retention`,
    {
      method: "GET",
    },
  );

  return organizationRetentionSettingsResponseSchema.parse(response);
}

export async function updateOrganizationRetentionSettings(params: {
  organizationId: string;
  analyticsRawRetentionDays: OrganizationRetentionSettings["analyticsRawRetentionDays"] | null;
}) {
  const response = await apiRequest<RetentionSettingsResponse>(
    `/organizations/${params.organizationId}/settings/retention`,
    {
      method: "PUT",
      body: JSON.stringify({ analyticsRawRetentionDays: params.analyticsRawRetentionDays }),
    },
  );

  return organizationRetentionSettingsResponseSchema.parse(response);
}
