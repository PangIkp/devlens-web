import { useEffect, useMemo, useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { InsightCard } from "@/components/insights/insight-card";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SuccessModal,
  type SuccessModalState,
} from "@/components/shared/success-modal";
import {
  useInsightsQuery,
  useDismissInsightMutation,
  useReopenInsightMutation,
  useReviewInsightMutation,
} from "@/features/insights/insights.query";
import {
  getDashboardDateRangeForPreset,
  getDashboardPresetFromRange,
} from "@/features/dashboard/dashboard.utils";
import { useOrganizationsQuery } from "@/features/organizations/use-organizations-query";
import { useRepositoriesListQuery } from "@/features/repositories/repositories.query";
import { getErrorMessage } from "@/lib/api-errors";
import { rootRoute } from "@/routes/root";

const defaultRange = getDashboardDateRangeForPreset(30);

const insightsSearchSchema = z.object({
  organizationId: z.string().min(1).optional(),
  repositoryId: z.string().min(1).optional(),
  type: z
    .enum([
      "bottleneck_detection",
      "large_pr_detection",
      "slow_review_detection",
      "hotspot_detection",
      "deployment_failure_trend",
      "review_concentration",
    ])
    .optional(),
  status: z.enum(["open", "reviewed", "dismissed"]).optional(),
  from: z.string().default(defaultRange.from),
  to: z.string().default(defaultRange.to),
  page: z.number().int().min(1).catch(1).default(1),
});

export const insightsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/insights",
  validateSearch: (search) =>
    insightsSearchSchema.parse({
      organizationId: typeof search.organizationId === "string" ? search.organizationId : undefined,
      repositoryId: typeof search.repositoryId === "string" ? search.repositoryId : undefined,
      type: typeof search.type === "string" ? search.type : undefined,
      status: typeof search.status === "string" ? search.status : undefined,
      from: typeof search.from === "string" ? search.from : defaultRange.from,
      to: typeof search.to === "string" ? search.to : defaultRange.to,
      page: typeof search.page === "number" ? search.page : typeof search.page === "string" ? Number(search.page) : 1,
    }),
  component: InsightsPage,
});

function InsightsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Insights loading">
      {[0, 1, 2].map((row) => (
        <div key={row} className="space-y-4 rounded-2xl border border-border/80 p-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function InsightsPage() {
  const navigate = insightsRoute.useNavigate();
  const search = insightsRoute.useSearch();
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
  const selectedPreset = getDashboardPresetFromRange(search.from, search.to) ?? 30;
  const insightsQuery = useInsightsQuery(
    {
      organizationId: selectedOrganizationId ?? "",
      repositoryId: search.repositoryId,
      type: search.type,
      status: search.status,
      from: search.from,
      to: search.to,
      page: search.page,
      pageSize: 10,
    },
    Boolean(selectedOrganizationId),
  );
  const statusTab = search.status ?? "all";
  const reviewInsightMutation = useReviewInsightMutation();
  const dismissInsightMutation = useDismissInsightMutation();
  const reopenInsightMutation = useReopenInsightMutation();
  const [successModal, setSuccessModal] = useState<SuccessModalState>(null);

  function notifySuccess(title: string, message?: string) {
    setSuccessModal({ title, message });
  }

  useEffect(() => {
    reviewInsightMutation.reset();
    dismissInsightMutation.reset();
    reopenInsightMutation.reset();
    // Reset stale mutation feedback only when the organization actually
    // changes. The mutation result objects are recreated on every render
    // regardless of state, so depending on them here would re-run this
    // effect (and re-invoke reset) on every render, looping forever once a
    // mutation has fired at least once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (!search.organizationId && organizations[0]?.id) {
      void navigate({
        search: (previous) => ({
          ...previous,
          organizationId: organizations[0].id,
        }),
        replace: true,
      });
    }
  }, [navigate, organizations, search.organizationId]);

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
        <Tabs
          value={statusTab}
          onValueChange={(value) =>
            updateSearch({
              status: value === "all" ? undefined : (value as NonNullable<typeof search.status>),
              page: 1,
            })
          }
          className="flex h-full min-h-0 flex-col space-y-6"
        >
          <div className="shrink-0 space-y-6 border-b border-border/60 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-accent">Insights</p>

            <div className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_1fr_auto]">
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Organization</span>
                <Select
                  value={selectedOrganizationId ?? ""}
                  disabled={organizationsQuery.isLoading || organizations.length === 0}
                  onValueChange={(value) => updateSearch({ organizationId: value, repositoryId: undefined, page: 1 })}
                >
                  <SelectTrigger aria-label="Insight organization">
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
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Repository</span>
                <Select
                  value={search.repositoryId ?? "all"}
                  disabled={repositoriesQuery.isLoading || (repositoriesQuery.data?.data.length ?? 0) === 0}
                  onValueChange={(value) => updateSearch({ repositoryId: value === "all" ? undefined : value, page: 1 })}
                >
                  <SelectTrigger aria-label="Insight repository">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All repositories</SelectItem>
                    {(repositoriesQuery.data?.data ?? []).map((repository) => (
                      <SelectItem key={repository.id} value={repository.id}>
                        {repository.fullName}
                        {!repository.isActive ? " (inactive)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Type</span>
                <Select
                  value={search.type ?? "all"}
                  onValueChange={(value) => updateSearch({ type: value === "all" ? undefined : (value as NonNullable<typeof search.type>), page: 1 })}
                >
                  <SelectTrigger aria-label="Insight type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="slow_review_detection">Slow review</SelectItem>
                    <SelectItem value="large_pr_detection">Large PR</SelectItem>
                    <SelectItem value="hotspot_detection">Hotspot</SelectItem>
                    <SelectItem value="review_concentration">Review concentration</SelectItem>
                    <SelectItem value="deployment_failure_trend">Deployment failure trend</SelectItem>
                    <SelectItem value="bottleneck_detection">Bottleneck</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Date range</span>
                <Select
                  value={String(selectedPreset)}
                  onValueChange={(value) => {
                    const range = getDashboardDateRangeForPreset(Number(value) as 7 | 30 | 90);
                    updateSearch({ from: range.from, to: range.to, page: 1 });
                  }}
                >
                  <SelectTrigger aria-label="Insight date range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>

            {!organizationsQuery.isLoading && !organizationsQuery.isError && organizations.length === 0 ? (
              <EmptyState
                title="No organizations available"
                description="Your current account does not have access to any organization yet. Create one from Settings before reviewing insights."
                action={
                  <Button asChild variant="outline">
                    <Link to="/settings">Open Settings</Link>
                  </Button>
                }
              />
            ) : null}

            {!repositoriesQuery.isLoading && !repositoriesQuery.isError && organizations.length > 0 && (repositoriesQuery.data?.data.length ?? 0) === 0 ? (
              <EmptyState
                title="No repositories available"
                description="This organization does not have any managed repositories yet, so the backend cannot generate insights for it."
              />
            ) : null}

            {organizations.length > 0 ? (
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
                <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
              </TabsList>
            ) : null}
          </div>

          {organizations.length > 0 ? (
            <TabsContent value={statusTab} className="flex min-h-0 flex-1 flex-col space-y-4">
              {insightsQuery.isError ? (
                <ErrorState
                  title="Could not load insights"
                  message={getErrorMessage(insightsQuery.error)}
                  onRetry={() => void insightsQuery.refetch()}
                />
              ) : null}

              {reviewInsightMutation.isError ? (
                <ErrorState
                  title="Could not mark insight as reviewed"
                  message={getErrorMessage(reviewInsightMutation.error)}
                />
              ) : null}

              {dismissInsightMutation.isError ? (
                <ErrorState
                  title="Could not dismiss insight"
                  message={getErrorMessage(dismissInsightMutation.error)}
                />
              ) : null}

              {reopenInsightMutation.isError ? (
                <ErrorState
                  title="Could not reopen insight"
                  message={getErrorMessage(reopenInsightMutation.error)}
                />
              ) : null}

              {insightsQuery.data && insightsQuery.data.data.length === 0 ? (
                <EmptyState
                  title="No insights detected"
                  description="No issue matched the current filters. This can mean the rule engine found no active problems, or there is not enough data in the selected range yet."
                />
              ) : null}

              {insightsQuery.data && insightsQuery.data.skippedCount > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {insightsQuery.data.skippedCount} insight{insightsQuery.data.skippedCount > 1 ? "s were" : " was"} hidden
                  because the backend returned an unrecognized shape. The rest of this page is unaffected.
                </div>
              ) : null}

              {insightsQuery.isLoading ? (
                <InsightsSkeleton />
              ) : (
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                  {(insightsQuery.data?.data ?? []).map((insight) => (
                    <InsightCard
                      key={insight.insightKey}
                      insight={insight}
                      actionsDisabled={
                        reviewInsightMutation.isPending || dismissInsightMutation.isPending || reopenInsightMutation.isPending
                      }
                      onReview={() =>
                        reviewInsightMutation.mutate(
                          { organizationId: insight.organizationId, insightKey: insight.insightKey },
                          { onSuccess: () => notifySuccess("Insight marked reviewed") },
                        )
                      }
                      onDismiss={() =>
                        dismissInsightMutation.mutate(
                          { organizationId: insight.organizationId, insightKey: insight.insightKey },
                          { onSuccess: () => notifySuccess("Insight dismissed") },
                        )
                      }
                      onReopen={() =>
                        reopenInsightMutation.mutate(
                          { organizationId: insight.organizationId, insightKey: insight.insightKey },
                          { onSuccess: () => notifySuccess("Insight reopened") },
                        )
                      }
                    />
                  ))}
                </div>
              )}

              {insightsQuery.data && insightsQuery.data.data.length > 0 ? (
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
                    Page {insightsQuery.data.pagination.page} / {Math.max(insightsQuery.data.pagination.totalPages, 1)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Next page"
                    disabled={insightsQuery.data.pagination.page >= Math.max(insightsQuery.data.pagination.totalPages, 1)}
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
      <SuccessModal
        state={successModal}
        onOpenChange={(open) => !open && setSuccessModal(null)}
      />
    </AppLayout>
  );
}
