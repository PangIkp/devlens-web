import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/features/health/health.api";

export function useHealthQuery() {
  return useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    staleTime: 30_000,
  });
}
