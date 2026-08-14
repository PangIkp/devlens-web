import { useEffect, useMemo, useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { PullRequestList } from "@/components/pull-requests/pull-request-list";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizationsQuery } from "@/features/organizations/use-organizations-query";
import { usePullRequestsQuery } from "@/features/pull-requests/pull-requests.query";
import { useRepositoriesListQuery } from "@/features/repositories/repositories.query";
import { getErrorMessage } from "@/lib/api-errors";
import { rootRoute } from "@/routes/root";

const pullRequestsSearchSchema = z.object({
  organizationId: z.string().min(1).optional(),
  repositoryId: z.string().min(1).optional(),
  search: z.string().optional(),
  status: z.enum(["open", "closed", "merged"]).optional(),
  sortBy: z.enum(["createdAt", "number"]).catch("createdAt").default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).catch("desc").default("desc"),
  page: z.number().int().min(1).catch(1).default(1),
});

export const pullRequestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pull-requests",
  validateSearch: (search) =>
    pullRequestsSearchSchema.parse({
      organizationId: typeof search.organizationId === "string" ? search.organizationId : undefined,
      repositoryId: typeof search.repositoryId === "string" ? search.repositoryId : undefined,
      search: typeof search.search === "string" ? search.search : undefined,
      status: typeof search.status === "string" ? search.status : undefined,
      sortBy: typeof search.sortBy === "string" ? search.sortBy : "createdAt",
      sortOrder: typeof search.sortOrder === "string" ? search.sortOrder : "desc",
      page: typeof search.page === "number" ? search.page : typeof search.page === "string" ? Number(search.page) : 1,
    }),
  component: PullRequestsPage,
});

function PullRequestsSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-border/60 rounded-xl border border-border/70" aria-label="Pull requests loading">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="space-y-3 p-5">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function PullRequestsPage() {
  const navigate = pullRequestsRoute.useNavigate();
  const search = pullRequestsRoute.useSearch();
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const organizationsQuery = useOrganizationsQuery();
  const organizations = useMemo(() => organizationsQuery.data?.data ?? [], [organizationsQuery.data?.data]);
  const selectedOrganizationId = search.organizationId ?? organizations[0]?.id;
  const repositoriesQuery = useRepositoriesListQuery(
    {
      organizationId: selectedOrganizationId ?? "",
      page: 1,
      pageSize: 100,
      sortBy: "name",
      sortOrder: "asc",
    },
    Boolean(selectedOrganizationId),
  );
  const repositories = useMemo(() => repositoriesQuery.data?.data ?? [], [repositoriesQuery.data?.data]);
  const selectedRepositoryId = search.repositoryId ?? repositories[0]?.id;
  const statusTab = search.status ?? "all";
  const pullRequestsQuery = usePullRequestsQuery(
    {
      repositoryId: selectedRepositoryId,
      page: search.page,
      pageSize: 10,
      search: search.search,
      status: search.status,
      sortBy: search.sortBy,
      sortOrder: search.sortOrder,
    },
    Boolean(selectedRepositoryId),
  );

  useEffect(() => {
    if (!search.organizationId && organizations[0]?.id) {
      void navigate({ search: (previous) => ({ ...previous, organizationId: organizations[0].id }), replace: true });
    }
  }, [navigate, organizations, search.organizationId]);

  useEffect(() => {
    if (selectedOrganizationId && !search.repositoryId && repositories[0]?.id) {
      void navigate({
        search: (previous) => ({ ...previous, organizationId: selectedOrganizationId, repositoryId: repositories[0].id }),
        replace: true,
      });
    }
  }, [navigate, repositories, search.repositoryId, selectedOrganizationId]);

  useEffect(() => {
    setSearchInput(search.search ?? "");
  }, [search.search]);

  function updateSearch(next: Partial<typeof search>) {
    void navigate({
      search: (previous) => ({
        ...previous,
        ...next,
      }),
    });
  }

  return (
    <AppLayout>
      <PageShell unwrapped>
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-accent">Pull Requests</p>

          <form
            className="grid gap-3 lg:grid-cols-[1.1fr_1.1fr_0.9fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              updateSearch({ search: searchInput || undefined, page: 1 });
            }}
          >
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Organization</span>
              <Select
                value={selectedOrganizationId ?? ""}
                disabled={organizationsQuery.isLoading || organizations.length === 0}
                onChange={(event) => updateSearch({ organizationId: event.target.value, repositoryId: undefined, page: 1 })}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Repository</span>
              <Select
                value={selectedRepositoryId ?? ""}
                disabled={repositoriesQuery.isLoading || repositories.length === 0}
                onChange={(event) => updateSearch({ repositoryId: event.target.value, page: 1 })}
              >
                {repositories.map((repository) => (
                  <option key={repository.id} value={repository.id}>
                    {repository.fullName}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Sort</span>
              <Select
                aria-label="Sort pull requests"
                value={`${search.sortBy}:${search.sortOrder}`}
                onChange={(event) => {
                  const [sortBy, sortOrder] = event.target.value.split(":") as [
                    "createdAt" | "number",
                    "asc" | "desc",
                  ];
                  updateSearch({ sortBy, sortOrder, page: 1 });
                }}
              >
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
                <option value="number:desc">PR number (high to low)</option>
                <option value="number:asc">PR number (low to high)</option>
              </Select>
            </label>
            <div className="flex items-end gap-3">
              <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search PR title" aria-label="Pull request search" />
              <Button type="submit">Apply</Button>
            </div>
          </form>

          {!organizationsQuery.isLoading && !organizationsQuery.isError && organizations.length === 0 ? (
            <EmptyState
              title="No organizations available"
              description="Your current account does not have access to any organization yet. Create one from Settings before browsing pull requests."
              action={
                <Button asChild variant="outline">
                  <Link to="/settings">Open Settings</Link>
                </Button>
              }
            />
          ) : null}

          {!repositoriesQuery.isLoading && !repositoriesQuery.isError && organizations.length > 0 && repositories.length === 0 ? (
            <EmptyState
              title="No repositories available"
              description="This organization does not have a managed repository yet. Connect one from Settings before opening pull requests."
              action={
                <Button asChild variant="outline">
                  <Link to="/settings">Open Settings</Link>
                </Button>
              }
            />
          ) : null}

          {selectedRepositoryId ? (
            <Tabs
              value={statusTab}
              onValueChange={(value) =>
                updateSearch({
                  status: value === "all" ? undefined : (value as NonNullable<typeof search.status>),
                  page: 1,
                })
              }
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="merged">Merged</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>

              <TabsContent value={statusTab} className="space-y-6">
                {pullRequestsQuery.isError ? (
                  <ErrorState
                    title="Could not load pull requests"
                    message={getErrorMessage(pullRequestsQuery.error)}
                    onRetry={() => void pullRequestsQuery.refetch()}
                  />
                ) : null}

                {pullRequestsQuery.data && pullRequestsQuery.data.data.length === 0 ? (
                  <EmptyState
                    title="No pull requests found"
                    description="No pull request matched the current repository and filters."
                  />
                ) : null}

                {pullRequestsQuery.isLoading ? (
                  <PullRequestsSkeleton />
                ) : pullRequestsQuery.data && pullRequestsQuery.data.data.length > 0 ? (
                  <PullRequestList pullRequests={pullRequestsQuery.data.data} />
                ) : null}

                {pullRequestsQuery.data ? (
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Previous page"
                      disabled={search.page <= 1}
                      onClick={() => updateSearch({ page: search.page - 1 })}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Page {pullRequestsQuery.data.pagination.page} / {Math.max(pullRequestsQuery.data.pagination.totalPages, 1)}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Next page"
                      disabled={pullRequestsQuery.data.pagination.page >= Math.max(pullRequestsQuery.data.pagination.totalPages, 1)}
                      onClick={() => updateSearch({ page: search.page + 1 })}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </PageShell>
    </AppLayout>
  );
}
