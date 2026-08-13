import { useNavigate } from "@tanstack/react-router";
import { useUiStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/features/auth/auth.query";
import { useAuthStore } from "@/features/auth/auth.store";
import { queryClient } from "@/app/query-client";

export function AppHeader() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const session = useAuthStore((state) => state.session);
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();

  return (
    <header className="flex items-center justify-between border-b border-border/80 bg-card/70 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Engineering Intelligence Platform</p>
        <h2 className="text-lg font-semibold">DevLens Web</h2>
      </div>
      <div className="flex items-center gap-3">
        {session ? (
          <div className="text-right">
            <p className="text-sm font-medium">{session.user.name ?? session.user.email}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
        ) : null}
        <Button variant="outline" size="sm" onClick={toggleSidebar}>
          Toggle sidebar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            logoutMutation.mutate(undefined, {
              onSettled: () => {
                queryClient.clear();
                void navigate({ to: "/login", search: { redirect: "/" } });
              },
            })
          }
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
