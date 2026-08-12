import { useEffect, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { rootRoute } from "@/routes/root";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { RepositoryListSkeleton } from "@/components/repositories/repository-list-skeleton";
import { RepositoryListTable } from "@/components/repositories/repository-list-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useOrganizationsQuery } from "@/features/organizations/use-organizations-query";
import { useRepositoriesListQuery } from "@/features/repositories/repositories.query";
import type { RepositoryStatus } from "@/features/repositories/repositories.schemas";

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
  const organizations = organizationsQuery.data?.data;
  const firstOrganizationId = organizations?.[0]?.id;
  const selectedOrganizationId = search.organizationId ?? firstOrganizationId;
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
    if (!search.organizationId && firstOrganizationId) {
      void navigate({
        search: (previous) => ({
          ...previous,
          organizationId: firstOrganizationId,
          page: 1,
        }),
        replace: true,
      });
    }
  }, [firstOrganizationId, navigate, search.organizationId]);

  const pagination = repositoriesQuery.data?.pagination;

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
      <PageShell
        eyebrow="Repositories"
        title="Repository management"
        description="Browse repositories from the selected organization, inspect sync recency, and drill into repository details backed by the live DevLens API."
      >
        <div className="space-y-6">
          <form className="grid gap-3 md:grid-cols-[1.2fr_1.2fr_1fr_auto]" onSubmit={handleFilterSubmit}>
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Organization</span>
              <Select
                aria-label="Organization"
                value={selectedOrganizationId ?? ""}
                disabled={organizationsQuery.isLoading || (organizations?.length ?? 0) === 0}
                onChange={(event) =>
                  updateSearch({
                    organizationId: event.target.value,
                    page: 1,
                  })
                }
              >
                {organizations?.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
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

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Status</span>
              <Select
                aria-label="Repository status"
                value={search.status ?? ""}
                onChange={(event) =>
                  updateSearch({
                    status: (event.target.value || undefined) as RepositoryStatus | undefined,
                    page: 1,
                  })
                }
              >
                <option value="">All statuses</option>
                <option value="active">Active repositories</option>
                <option value="inactive">Inactive repositories</option>
                <option value="archived">Archived repositories</option>
              </Select>
            </label>

            <div className="flex items-end">
              <Button type="submit" className="w-full md:w-auto">
                Apply filters
              </Button>
            </div>
          </form>

          {organizationsQuery.isLoading ? <RepositoryListSkeleton /> : null}

          {organizationsQuery.isError ? (
            <ErrorState
              title="Could not load organizations"
              message={organizationsQuery.error instanceof Error ? organizationsQuery.error.message : "Unknown error"}
              onRetry={() => void organizationsQuery.refetch()}
            />
          ) : null}

          {!organizationsQuery.isLoading && !organizationsQuery.isError && (organizations?.length ?? 0) === 0 ? (
            <EmptyState
              title="No organizations available"
              description="Connect at least one organization in the backend before browsing repositories here."
            />
          ) : null}

          {(organizations?.length ?? 0) > 0 && repositoriesQuery.isLoading ? <RepositoryListSkeleton /> : null}

          {(organizations?.length ?? 0) > 0 && repositoriesQuery.isError ? (
            <ErrorState
              title="Could not load repositories"
              message={repositoriesQuery.error instanceof Error ? repositoriesQuery.error.message : "Unknown error"}
              onRetry={() => void repositoriesQuery.refetch()}
            />
          ) : null}

          {(organizations?.length ?? 0) > 0 && repositoriesQuery.data && repositoriesQuery.data.data.length === 0 ? (
            <EmptyState
              title="No repositories matched"
              description="Try a different search term or status filter, or sync repositories in the backend first."
              action={
                search.search || search.status ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchInput("");
                      updateSearch({
                        page: 1,
                        search: undefined,
                        status: undefined,
                      });
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : null}

          {repositoriesQuery.data && repositoriesQuery.data.data.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                <p>
                  Showing page {repositoriesQuery.data.pagination.page} of {Math.max(repositoriesQuery.data.pagination.totalPages, 1)}
                </p>
                <p>{repositoriesQuery.data.pagination.totalItems} repositories found</p>
              </div>
              <RepositoryListTable repositories={repositoriesQuery.data.data} />
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={search.page <= 1}
                  onClick={() => updateSearch({ page: search.page - 1 })}
                >
                  Previous page
                </Button>
                <p className="text-sm text-muted-foreground">
                  Page {pagination?.page ?? search.page} / {Math.max(pagination?.totalPages ?? 1, 1)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!pagination || pagination.page >= Math.max(pagination.totalPages, 1)}
                  onClick={() => updateSearch({ page: search.page + 1 })}
                >
                  Next page
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </PageShell>
    </AppLayout>
  );
}
