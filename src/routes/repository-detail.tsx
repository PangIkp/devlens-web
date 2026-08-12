import { createRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { RepositoryDetailPanel } from "@/components/repositories/repository-detail-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { useRepositoryDetailQuery } from "@/features/repositories/repositories.query";
import { ApiError } from "@/lib/api-client";
import { rootRoute } from "@/routes/root";

export const repositoryDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/repositories/$repositoryId",
  component: RepositoryDetailPage,
});

function RepositoryDetailPage() {
  const { repositoryId } = repositoryDetailRoute.useParams();
  const repositoryQuery = useRepositoryDetailQuery(repositoryId);

  return (
    <AppLayout>
      <PageShell
        eyebrow="Repository detail"
        title="Repository detail"
        description="Inspect repository metadata, synchronization recency, and jump out to the original GitHub repository."
      >
        <div className="space-y-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/repositories">Back to repository list</Link>
          </Button>

          {repositoryQuery.isLoading ? (
            <div className="space-y-4" aria-label="Repository detail loading">
              <Skeleton className="h-28 rounded-2xl" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-24 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : null}

          {repositoryQuery.isError ? (
            repositoryQuery.error instanceof ApiError && repositoryQuery.error.status === 404 ? (
              <EmptyState
                title="Repository not found"
                description={`No repository matched id ${repositoryId}. It may have been removed or the URL is invalid.`}
                action={
                  <Button asChild variant="outline">
                    <Link to="/repositories">Return to repositories</Link>
                  </Button>
                }
              />
            ) : (
              <ErrorState
                title="Could not load repository detail"
                message={repositoryQuery.error instanceof Error ? repositoryQuery.error.message : "Unknown error"}
                onRetry={() => void repositoryQuery.refetch()}
              />
            )
          ) : null}

          {repositoryQuery.data ? <RepositoryDetailPanel repository={repositoryQuery.data.data} /> : null}
        </div>
      </PageShell>
    </AppLayout>
  );
}
