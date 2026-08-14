import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, logout } from "@/features/auth/auth.api";
import { clearAuthSession, setAuthSession } from "@/features/auth/auth.store";
import type { LoginRequest } from "@/features/auth/auth.schemas";

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (response) => {
      // Query keys (organizations, github connection, ...) aren't scoped by
      // user id, so switching accounts without an explicit sign-out first
      // would otherwise keep serving the previous user's cached data —
      // auto-selecting an org the new user has no membership in and
      // tripping a 403 on every org-scoped request.
      queryClient.clear();
      setAuthSession(response.data);
    },
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      clearAuthSession();
    },
  });
}
