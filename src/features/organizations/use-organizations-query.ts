import { useQuery } from "@tanstack/react-query";
import { listOrganizations } from "@/features/organizations/organizations.api";

export const organizationsKeys = {
  all: ["organizations"] as const,
  lists: () => [...organizationsKeys.all, "list"] as const,
};

export function useOrganizationsQuery() {
  return useQuery({
    queryKey: organizationsKeys.lists(),
    queryFn: listOrganizations,
    staleTime: 60_000,
  });
}
