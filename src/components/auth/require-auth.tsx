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
      // Intentionally drop the search string: it may carry resource-scoped
      // params (organizationId, repositoryId, ...) from the session that
      // just ended. Whoever logs in next — same user or a different one —
      // isn't guaranteed to have access to that exact resource, so replaying
      // it verbatim can send a freshly authenticated user straight into a
      // 403. Each page's own "pick a valid default" logic takes over instead.
      void navigate({
        to: "/login",
        search: { redirect: location.pathname },
        replace: true,
      });
    }
  }, [session, location.pathname, navigate]);

  if (!session) {
    return null;
  }

  return children;
}
