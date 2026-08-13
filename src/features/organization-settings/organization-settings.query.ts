import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrganizationRetentionSettings,
  getOrganizationRuleSettings,
  updateOrganizationRetentionSettings,
  updateOrganizationRuleSettings,
} from "@/features/organization-settings/organization-settings.api";

export const organizationSettingsKeys = {
  all: ["organizationSettings"] as const,
  rules: (organizationId: string) => [...organizationSettingsKeys.all, "rules", organizationId] as const,
  retention: (organizationId: string) => [...organizationSettingsKeys.all, "retention", organizationId] as const,
};

export function useOrganizationRuleSettingsQuery(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: organizationSettingsKeys.rules(organizationId),
    queryFn: () => getOrganizationRuleSettings(organizationId),
    enabled: enabled && organizationId.length > 0,
  });
}

export function useUpdateOrganizationRuleSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganizationRuleSettings,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: organizationSettingsKeys.rules(variables.organizationId) });
    },
  });
}

export function useOrganizationRetentionSettingsQuery(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: organizationSettingsKeys.retention(organizationId),
    queryFn: () => getOrganizationRetentionSettings(organizationId),
    enabled: enabled && organizationId.length > 0,
  });
}

export function useUpdateOrganizationRetentionSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganizationRetentionSettings,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: organizationSettingsKeys.retention(variables.organizationId) });
    },
  });
}
