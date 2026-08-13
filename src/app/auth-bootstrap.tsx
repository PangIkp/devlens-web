import { useEffect } from "react";
import { useMeQuery } from "@/features/users/users.query";
import { useAuthStore } from "@/features/auth/auth.store";

export function AuthBootstrap() {
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const meQuery = useMeQuery(Boolean(session));

  useEffect(() => {
    if (session && meQuery.data && session.user !== meQuery.data.data) {
      setSession({
        ...session,
        user: meQuery.data.data,
      });
    }
  }, [meQuery.data, session, setSession]);

  return null;
}
