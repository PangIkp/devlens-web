import { createRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { PullRequestDetailPanel } from "@/components/pull-requests/pull-request-detail-panel";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePullRequestDetailQuery } from "@/features/pull-requests/pull-requests.query";
import { ApiError } from "@/lib/api-client";
import { rootRoute } from "@/routes/root";

export const pullRequestDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pull-requests/$pullRequestId",
  component: PullRequestDetailPage,
});

function PullRequestDetailPage() {
  const { pullRequestId } = pullRequestDetailRoute.useParams();
  const pullRequestQuery = usePullRequestDetailQuery(pullRequestId);

  return (
    <AppLayout>
      <PageShell
        eyebrow="Pull request detail"
        title="Pull request detail"
        description="Inspect reviews, changed files, and the core metadata returned by the backend for a selected pull request."
      >
        <div className="space-y-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/pull-requests">Back to pull requests</Link>
          </Button>

          {pullRequestQuery.isLoading ? <Skeleton className="h-72 rounded-2xl" /> : null}

          {pullRequestQuery.isError ? (
            pullRequestQuery.error instanceof ApiError && pullRequestQuery.error.status === 404 ? (
              <EmptyState
                title="Pull request not found"
                description={`No pull request matched id ${pullRequestId}.`}
                action={
                  <Button asChild variant="outline">
                    <Link to="/pull-requests">Return to pull requests</Link>
                  </Button>
                }
              />
            ) : (
              <ErrorState
                title="Could not load pull request detail"
                message={pullRequestQuery.error instanceof Error ? pullRequestQuery.error.message : "Unknown error"}
                onRetry={() => void pullRequestQuery.refetch()}
              />
            )
          ) : null}

          {pullRequestQuery.data ? <PullRequestDetailPanel pullRequest={pullRequestQuery.data.data} /> : null}
        </div>
      </PageShell>
    </AppLayout>
  );
}
