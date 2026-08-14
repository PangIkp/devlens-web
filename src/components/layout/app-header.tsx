import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLogoutMutation } from "@/features/auth/auth.query";
import { useAuthStore } from "@/features/auth/auth.store";
import { queryClient } from "@/app/query-client";

export function AppHeader() {
  const session = useAuthStore((state) => state.session);
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-card/70 px-4 py-4 backdrop-blur sm:px-6">
      <div className="min-w-0">
        <p className="hidden text-xs uppercase tracking-[0.3em] text-muted-foreground sm:block">Engineering Intelligence Platform</p>
        <h2 className="text-lg font-semibold">DevLens Web</h2>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {session ? (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{session.user.name ?? session.user.email}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
        ) : null}
        <ThemeToggle />
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
