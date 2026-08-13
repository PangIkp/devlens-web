import { useMutation } from "@tanstack/react-query";
import { login, logout } from "@/features/auth/auth.api";
import { clearAuthSession, setAuthSession } from "@/features/auth/auth.store";
import type { LoginRequest } from "@/features/auth/auth.schemas";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (response) => {
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
