import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrganization,
  createOrganizationMember,
  deleteOrganization,
  deleteOrganizationMember,
  getOrganization,
  listOrganizationMembers,
  listOrganizations,
  updateOrganization,
  updateOrganizationMember,
} from "@/features/organizations/organizations.api";

export const organizationsKeys = {
  all: ["organizations"] as const,
  lists: () => [...organizationsKeys.all, "list"] as const,
  detail: (organizationId: string) => [...organizationsKeys.all, "detail", organizationId] as const,
  members: (organizationId: string) => [...organizationsKeys.all, "members", organizationId] as const,
};

export function useOrganizationsQuery() {
  return useQuery({
    queryKey: organizationsKeys.lists(),
    queryFn: listOrganizations,
    staleTime: 60_000,
  });
}

export function useOrganizationDetailQuery(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: organizationsKeys.detail(organizationId),
    queryFn: () => getOrganization(organizationId),
    enabled: enabled && organizationId.length > 0,
  });
}

export function useOrganizationMembersQuery(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: organizationsKeys.members(organizationId),
    queryFn: () => listOrganizationMembers(organizationId),
    enabled: enabled && organizationId.length > 0,
  });
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.lists() });
    },
  });
}

export function useUpdateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganization,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.detail(variables.organizationId) });
    },
  });
}

export function useDeleteOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: (_, organizationId) => {
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.lists() });
      void queryClient.removeQueries({ queryKey: organizationsKeys.detail(organizationId) });
      void queryClient.removeQueries({ queryKey: organizationsKeys.members(organizationId) });
    },
  });
}

export function useCreateOrganizationMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganizationMember,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.members(variables.organizationId) });
    },
  });
}

export function useUpdateOrganizationMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganizationMember,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.members(variables.organizationId) });
    },
  });
}

export function useDeleteOrganizationMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrganizationMember,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: organizationsKeys.members(variables.organizationId) });
    },
  });
}
