import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/features/users/users.api";

export const usersKeys = {
  all: ["users"] as const,
  me: (userId: string) => [...usersKeys.all, "me", userId] as const,
};

export function useMeQuery(userId: string, enabled = true) {
  return useQuery({
    queryKey: usersKeys.me(userId),
    queryFn: () => getMe(userId),
    enabled: enabled && userId.length > 0,
  });
}
