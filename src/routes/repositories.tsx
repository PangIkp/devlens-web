import { useEffect, useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import { rootRoute } from "@/routes/root";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { RepositoryListSkeleton } from "@/components/repositories/repository-list-skeleton";
import { RepositoryListTable } from "@/components/repositories/repository-list-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizationsQuery } from "@/features/organizations/use-organizations-query";
import { useRepositoriesListQuery } from "@/features/repositories/repositories.query";
import type { RepositoryStatus } from "@/features/repositories/repositories.schemas";
import { getErrorMessage } from "@/lib/api-errors";

const repositoriesSearchSchema = z.object({
  organizationId: z.string().min(1).optional(),
  page: z.number().int().min(1).catch(1).default(1),
  search: z.string().trim().optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
});

export const repositoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/repositories",
  validateSearch: (search) =>
    repositoriesSearchSchema.parse({
      organizationId: typeof search.organizationId === "string" ? search.organizationId : undefined,
      page:
        typeof search.page === "number"
          ? search.page
          : typeof search.page === "string"
            ? Number(search.page)
            : 1,
      search: typeof search.search === "string" && search.search.length > 0 ? search.search : undefined,
      status: typeof search.status === "string" ? search.status : undefined,
    }),
  component: RepositoriesPage,
});

function RepositoriesPage() {
  const navigate = repositoriesRoute.useNavigate();
  const search = repositoriesRoute.useSearch();
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const organizationsQuery = useOrganizationsQuery();
  const organizations = useMemo(() => organizationsQuery.data?.data ?? [], [organizationsQuery.data?.data]);
  const selectedOrganizationId = search.organizationId ?? organizations[0]?.id;
  const statusTab = search.status ?? "all";
  const repositoriesQuery = useRepositoriesListQuery(
    {
      organizationId: selectedOrganizationId ?? "",
      page: search.page,
      pageSize: 10,
      search: search.search,
      status: search.status,
    },
    Boolean(selectedOrganizationId),
  );

  useEffect(() => {
    setSearchInput(search.search ?? "");
  }, [search.search]);

  useEffect(() => {
    if (organizations.length === 0) {
      return;
    }
    const organizationStillExists = organizations.some((organization) => organization.id === search.organizationId);
    if (!organizationStillExists) {
      void navigate({
        search: (previous) => ({ ...previous, organizationId: organizations[0].id, page: 1 }),
        replace: true,
      });
    }
  }, [navigate, organizations, search.organizationId]);

  function updateSearch(next: {
    organizationId?: string;
    page?: number;
    search?: string;
    status?: RepositoryStatus;
  }) {
    void navigate({
      search: (previous) => ({
        organizationId: "organizationId" in next ? next.organizationId : previous.organizationId,
        page: next.page ?? previous.page ?? 1,
        search: "search" in next ? next.search : previous.search,
        status: "status" in next ? next.status : previous.status,
      }),
    });
  }

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSearch({
      page: 1,
      search: searchInput.trim() || undefined,
    });
  }

  return (
    <AppLayout>
      <PageShell unwrapped>
        <Tabs
          value={statusTab}
          onValueChange={(value) =>
            updateSearch({
              status: value === "all" ? undefined : (value as RepositoryStatus),
              page: 1,
            })
          }
          className="flex h-full min-h-0 flex-col space-y-6"
        >
          <div className="shrink-0 space-y-6 border-b border-border/60 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-accent">Repositories</p>

            <form className="grid gap-3 lg:grid-cols-[1.2fr_1.4fr_auto]" onSubmit={handleFilterSubmit}>
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Organization</span>
                <Select
                  value={selectedOrganizationId ?? ""}
                  disabled={organizationsQuery.isLoading || organizations.length === 0}
                  onValueChange={(value) =>
                    updateSearch({
                      organizationId: value,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger aria-label="Organization">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Search</span>
                <Input
                  aria-label="Search repositories"
                  placeholder="Search by repository name"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </label>

              <div className="flex items-end">
                <Button type="submit" className="w-full lg:w-auto">
                  Apply
                </Button>
              </div>
            </form>

            {!organizationsQuery.isLoading && !organizationsQuery.isError && organizations.length === 0 ? (
              <EmptyState
                title="No organizations available"
                description="Connect at least one organization in the backend before browsing repositories here."
              />
            ) : null}

            {organizationsQuery.isError ? (
              <ErrorState
                title="Could not load organizations"
                message={getErrorMessage(organizationsQuery.error)}
                onRetry={() => void organizationsQuery.refetch()}
              />
            ) : null}

            {organizations.length > 0 ? (
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            ) : null}
          </div>

          {organizations.length > 0 ? (
            <TabsContent value={statusTab} className="flex min-h-0 flex-1 flex-col space-y-4">
              {repositoriesQuery.isError ? (
                <ErrorState
                  title="Could not load repositories"
                  message={getErrorMessage(repositoriesQuery.error)}
                  onRetry={() => void repositoriesQuery.refetch()}
                />
              ) : null}

              {repositoriesQuery.data && repositoriesQuery.data.data.length === 0 ? (
                <EmptyState
                  title="No repositories matched"
                  description="Try a different search term, or sync repositories in the backend first."
                  action={
                    search.search ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSearchInput("");
                          updateSearch({ page: 1, search: undefined });
                        }}
                      >
                        Clear search
                      </Button>
                    ) : undefined
                  }
                />
              ) : null}

              {repositoriesQuery.isLoading ? (
                <RepositoryListSkeleton />
              ) : repositoriesQuery.data && repositoriesQuery.data.data.length > 0 ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <RepositoryListTable repositories={repositoriesQuery.data.data} />
                </div>
              ) : null}

              {repositoriesQuery.data && repositoriesQuery.data.data.length > 0 ? (
                <div className="flex items-center justify-center gap-4">
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
                    Page {repositoriesQuery.data.pagination.page} / {Math.max(repositoriesQuery.data.pagination.totalPages, 1)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Next page"
                    disabled={repositoriesQuery.data.pagination.page >= Math.max(repositoriesQuery.data.pagination.totalPages, 1)}
                    onClick={() => updateSearch({ page: search.page + 1 })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </TabsContent>
          ) : null}
        </Tabs>
      </PageShell>
    </AppLayout>
  );
}
