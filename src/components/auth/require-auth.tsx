import type { PropsWithChildren } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/auth.store";

export function RequireAuth({ children }: PropsWithChildren) {
  const session = useAuthStore((state) => state.session);
  const location = useRouterState({
    select: (state) => state.location,
  });

  if (!session) {
    return <Navigate to="/login" search={{ redirect: `${location.pathname}${location.searchStr}` }} replace />;
  }

  return children;
}
