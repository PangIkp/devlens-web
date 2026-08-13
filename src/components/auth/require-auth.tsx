import { useEffect, type PropsWithChildren } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/auth.store";

export function RequireAuth({ children }: PropsWithChildren) {
  const session = useAuthStore((state) => state.session);
  const location = useRouterState({
    select: (state) => state.location,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!session && location.pathname !== "/login") {
      void navigate({
        to: "/login",
        search: { redirect: `${location.pathname}${location.searchStr}` },
        replace: true,
      });
    }
  }, [session, location.pathname, location.searchStr, navigate]);

  if (!session) {
    return null;
  }

  return children;
}
