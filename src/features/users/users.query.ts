import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/features/users/users.api";

export const usersKeys = {
  all: ["users"] as const,
  me: () => [...usersKeys.all, "me"] as const,
};

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: usersKeys.me(),
    queryFn: () => getMe(),
    enabled,
  });
}
