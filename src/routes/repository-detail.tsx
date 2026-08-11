import { createRoute } from "@tanstack/react-router";
import { repositoriesRoute } from "@/routes/repositories";

export const repositoryDetailRoute = createRoute({
  getParentRoute: () => repositoriesRoute,
  path: "$repositoryId",
  component: RepositoryDetailPage,
});

function RepositoryDetailPage() {
  const { repositoryId } = repositoryDetailRoute.useParams();

  return (
    <div className="rounded-2xl border border-dashed border-border p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Repository detail</p>
      <h2 className="mt-2 text-2xl font-semibold">{repositoryId}</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Placeholder route for repository analytics, sync status, and future tables/charts.
      </p>
    </div>
  );
}
