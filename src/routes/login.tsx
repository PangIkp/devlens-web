import { useState } from "react";
import { createRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLoginMutation } from "@/features/auth/auth.query";
import { useAuthStore } from "@/features/auth/auth.store";
import { rootRoute } from "@/routes/root";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search) =>
    loginSearchSchema.parse({
      redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    }),
  component: LoginPage,
});

function LoginPage() {
  const search = loginRoute.useSearch();
  const session = useAuthStore((state) => state.session);
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState("local@devlens.test");
  const [name, setName] = useState("Local Dev");

  if (session) {
    return <Navigate to={search.redirect ?? "/"} replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <PageShell
        eyebrow="Authentication"
        title="Sign in to DevLens"
        description="Use the local backend login endpoint to get a bearer token, load your session, and unlock the repository workflows."
      >
        <div className="mx-auto max-w-xl">
          <Card className="space-y-6 p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Local session</h2>
              <p className="text-sm text-muted-foreground">
                This flow calls <code>/auth/login</code> and stores the returned access token plus refresh token in local storage.
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                loginMutation.mutate({
                  email,
                  name: name.trim() || undefined,
                });
              }}
            >
              <label className="block space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Email</span>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="local@devlens.test" />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Display name</span>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Local Dev" />
              </label>

              {loginMutation.isError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {loginMutation.error instanceof Error ? loginMutation.error.message : "Could not create a local session"}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Default local account matches the backend guidance from August 13, 2026.</p>
                <Button type="submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </PageShell>
    </div>
  );
}
