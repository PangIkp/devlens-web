import { createRoute, Link, Outlet } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export const repositoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/repositories",
  component: RepositoriesPage,
});

function RepositoriesPage() {
  return (
    <AppLayout>
      <PageShell
        eyebrow="Repositories"
        title="Repository list placeholder"
        description="This route establishes the navigation and route hierarchy for repository-focused views."
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Repository CRUD and tables are intentionally deferred.</p>
          <Button asChild>
            <Link to="/repositories/$repositoryId" params={{ repositoryId: "demo-repository" }}>
              Open placeholder detail
            </Link>
          </Button>
          <Outlet />
        </div>
      </PageShell>
    </AppLayout>
  );
}
