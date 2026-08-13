import { useEffect, useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { formatDateTime } from "@/components/repositories/repository-utils";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { StatusPill } from "@/components/shared/status-pill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useAccessibleGitHubRepositoriesQuery,
  useCompleteGitHubInstallationMutation,
  useGitHubConnectionQuery,
  useSelectAccessibleGitHubRepositoriesMutation,
  useStartGitHubInstallationMutation,
} from "@/features/github/github.query";
import {
  useCreateOrganizationMemberMutation,
  useCreateOrganizationMutation,
  useDeleteOrganizationMemberMutation,
  useDeleteOrganizationMutation,
  useOrganizationDetailQuery,
  useOrganizationMembersQuery,
  useOrganizationsQuery,
  useUpdateOrganizationMemberMutation,
  useUpdateOrganizationMutation,
} from "@/features/organizations/use-organizations-query";
import { useRepositoriesListQuery } from "@/features/repositories/repositories.query";
import {
  useCancelSyncJobMutation,
  useCreateRepositorySyncMutation,
  useRepositorySyncJobsQuery,
  useRetrySyncJobMutation,
  useSyncJobDetailQuery,
} from "@/features/sync/sync.query";
import { useMeQuery } from "@/features/users/users.query";
import { getApiErrorCode, getErrorMessage } from "@/lib/api-errors";
import { rootRoute } from "@/routes/root";

const settingsSearchSchema = z.object({
  organizationId: z.string().min(1).optional(),
  repositoryId: z.string().min(1).optional(),
  syncJobId: z.string().min(1).optional(),
  accessiblePage: z.number().int().min(1).catch(1).default(1),
  syncPage: z.number().int().min(1).catch(1).default(1),
  installation_id: z.number().int().optional(),
  setup_action: z.string().optional(),
});

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  validateSearch: (search) =>
    settingsSearchSchema.parse({
      organizationId: typeof search.organizationId === "string" ? search.organizationId : undefined,
      repositoryId: typeof search.repositoryId === "string" ? search.repositoryId : undefined,
      syncJobId: typeof search.syncJobId === "string" ? search.syncJobId : undefined,
      accessiblePage:
        typeof search.accessiblePage === "number"
          ? search.accessiblePage
          : typeof search.accessiblePage === "string"
            ? Number(search.accessiblePage)
            : 1,
      syncPage:
        typeof search.syncPage === "number"
          ? search.syncPage
          : typeof search.syncPage === "string"
            ? Number(search.syncPage)
            : 1,
      installation_id:
        typeof search.installation_id === "number"
          ? search.installation_id
          : typeof search.installation_id === "string"
            ? Number(search.installation_id)
            : undefined,
      setup_action: typeof search.setup_action === "string" ? search.setup_action : undefined,
    }),
  component: SettingsPage,
});

function getConnectionTone(state: string) {
  if (state === "connected") {
    return "success" as const;
  }

  if (state === "syncing") {
    return "info" as const;
  }

  if (state === "sync_failed") {
    return "danger" as const;
  }

  return "warning" as const;
}

function getSyncTone(status: string) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "failed" || status === "canceled") {
    return "danger" as const;
  }

  return "info" as const;
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SettingsPage() {
  const navigate = settingsRoute.useNavigate();
  const search = settingsRoute.useSearch();
  const organizationsQuery = useOrganizationsQuery();
  const organizations = useMemo(() => organizationsQuery.data?.data ?? [], [organizationsQuery.data?.data]);
  const selectedOrganizationId = search.organizationId ?? organizations[0]?.id;
  const organizationDetailQuery = useOrganizationDetailQuery(selectedOrganizationId ?? "", Boolean(selectedOrganizationId));
  const organizationMembersQuery = useOrganizationMembersQuery(selectedOrganizationId ?? "", Boolean(selectedOrganizationId));
  const githubConnectionQuery = useGitHubConnectionQuery(selectedOrganizationId ?? "", Boolean(selectedOrganizationId));
  const accessibleRepositoriesQuery = useAccessibleGitHubRepositoriesQuery(
    {
      organizationId: selectedOrganizationId ?? "",
      page: search.accessiblePage,
      pageSize: 20,
    },
    Boolean(selectedOrganizationId) &&
      ["connected", "syncing", "sync_failed"].includes(githubConnectionQuery.data?.data.state ?? ""),
  );
  const managedRepositoriesQuery = useRepositoriesListQuery(
    {
      organizationId: selectedOrganizationId ?? "",
      page: 1,
      pageSize: 100,
      sortBy: "name",
      sortOrder: "asc",
    },
    Boolean(selectedOrganizationId),
  );
  const managedRepositories = useMemo(() => managedRepositoriesQuery.data?.data ?? [], [managedRepositoriesQuery.data?.data]);
  const selectedRepositoryId = search.repositoryId ?? managedRepositories[0]?.id;
  const syncJobsQuery = useRepositorySyncJobsQuery(
    {
      repositoryId: selectedRepositoryId ?? "",
      page: search.syncPage,
      pageSize: 10,
    },
    Boolean(selectedRepositoryId),
  );
  const selectedSyncJobId = search.syncJobId ?? syncJobsQuery.data?.data[0]?.id;
  const syncJobDetailQuery = useSyncJobDetailQuery(selectedSyncJobId ?? "", Boolean(selectedSyncJobId));
  const meQuery = useMeQuery();

  const createOrganizationMutation = useCreateOrganizationMutation();
  const updateOrganizationMutation = useUpdateOrganizationMutation();
  const deleteOrganizationMutation = useDeleteOrganizationMutation();
  const startInstallationMutation = useStartGitHubInstallationMutation(selectedOrganizationId ?? "");
  const completeInstallationMutation = useCompleteGitHubInstallationMutation();
  const selectRepositoriesMutation = useSelectAccessibleGitHubRepositoriesMutation();
  const createSyncMutation = useCreateRepositorySyncMutation();
  const retrySyncMutation = useRetrySyncJobMutation();
  const cancelSyncMutation = useCancelSyncJobMutation();
  const createMemberMutation = useCreateOrganizationMemberMutation();
  const updateMemberMutation = useUpdateOrganizationMemberMutation();
  const deleteMemberMutation = useDeleteOrganizationMemberMutation();

  const [callbackKey, setCallbackKey] = useState<string | null>(null);
  const [selectedAccessibleRepositoryIds, setSelectedAccessibleRepositoryIds] = useState<number[]>([]);
  const [createOrganizationForm, setCreateOrganizationForm] = useState({
    githubId: "",
    slug: "",
    name: "",
  });
  const [editOrganizationForm, setEditOrganizationForm] = useState({
    slug: "",
    name: "",
  });
  const [memberDrafts, setMemberDrafts] = useState<Record<string, "owner" | "admin" | "member">>({});
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"owner" | "admin" | "member">("member");

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

  useEffect(() => {
    if (selectedOrganizationId && !search.repositoryId && managedRepositories[0]?.id) {
      void navigate({
        search: (previous) => ({
          ...previous,
          repositoryId: managedRepositories[0].id,
        }),
        replace: true,
      });
    }
  }, [managedRepositories, navigate, search.repositoryId, selectedOrganizationId]);

  useEffect(() => {
    if (syncJobsQuery.data?.data[0]?.id && !search.syncJobId) {
      void navigate({
        search: (previous) => ({
          ...previous,
          syncJobId: syncJobsQuery.data?.data[0]?.id,
        }),
        replace: true,
      });
    }
  }, [navigate, search.syncJobId, syncJobsQuery.data?.data]);

  useEffect(() => {
    if (organizationDetailQuery.data?.data) {
      setEditOrganizationForm({
        slug: organizationDetailQuery.data.data.slug ?? "",
        name: organizationDetailQuery.data.data.name,
      });
    }
  }, [organizationDetailQuery.data]);

  useEffect(() => {
    const drafts = Object.fromEntries(
      (organizationMembersQuery.data?.data ?? []).map((member) => [member.id, member.role]),
    ) as Record<string, "owner" | "admin" | "member">;
    setMemberDrafts(drafts);
  }, [organizationMembersQuery.data]);

  useEffect(() => {
    const nextSelected = (accessibleRepositoriesQuery.data?.data ?? [])
      .filter((repository) => repository.selectionStatus !== "not_selected")
      .map((repository) => repository.githubRepositoryId);
    setSelectedAccessibleRepositoryIds(nextSelected);
  }, [accessibleRepositoriesQuery.data]);

  useEffect(() => {
    const nextCallbackKey =
      selectedOrganizationId && search.installation_id
        ? `${selectedOrganizationId}:${search.installation_id}:${search.setup_action ?? ""}`
        : null;

    if (!nextCallbackKey || callbackKey === nextCallbackKey) {
      return;
    }

    completeInstallationMutation.mutate({
      organizationId: selectedOrganizationId,
      installationId: search.installation_id,
      setupAction: search.setup_action,
    });
    setCallbackKey(nextCallbackKey);
  }, [
    callbackKey,
    completeInstallationMutation,
    search.installation_id,
    search.setup_action,
    selectedOrganizationId,
  ]);

  const activeSyncJob = syncJobDetailQuery.data?.data;
  const installUrl = startInstallationMutation.data?.data.installUrl;
  const connectionState = githubConnectionQuery.data?.data.state;
  const repositorySyncReady = connectionState === "connected" || connectionState === "syncing" || connectionState === "sync_failed";
  const selectedManagedRepository = managedRepositories.find((repository) => repository.id === selectedRepositoryId);
  const selectedAccessibleRepository = (accessibleRepositoriesQuery.data?.data ?? []).find(
    (repository) => String(repository.githubRepositoryId) === selectedManagedRepository?.githubId,
  );
  const selectedRepositoryNeedsOnboarding = selectedAccessibleRepository?.selectionStatus === "not_selected";
  const selectedRepositoryAccessUnavailable =
    selectedAccessibleRepository !== undefined && selectedAccessibleRepository.installationStatus !== "accessible";
  const syncActionReady =
    repositorySyncReady &&
    !selectedRepositoryNeedsOnboarding &&
    !selectedRepositoryAccessUnavailable &&
    Boolean(selectedRepositoryId);
  const createSyncErrorCode = getApiErrorCode(createSyncMutation.error);

  const accessibleSelectionSummary = useMemo(() => {
    return selectedAccessibleRepositoryIds.length === 0
      ? "No repositories selected for onboarding yet."
      : `${selectedAccessibleRepositoryIds.length} accessible repositories selected for connection.`;
  }, [selectedAccessibleRepositoryIds.length]);

  useEffect(() => {
    createSyncMutation.reset();
  }, [createSyncMutation, selectedOrganizationId, selectedRepositoryId]);

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
      <PageShell
        eyebrow="Settings"
        title="Connection, onboarding, and organization settings"
        description="Manage GitHub installation state, repository onboarding, synchronization jobs, organization records, members, and deferred user profile lookup from the backend."
      >
        <div className="space-y-8">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto]">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Organization</span>
              <Select
                aria-label="Settings organization"
                value={selectedOrganizationId ?? ""}
                onChange={(event) =>
                  updateSearch({
                    organizationId: event.target.value,
                    repositoryId: undefined,
                    syncJobId: undefined,
                    accessiblePage: 1,
                    syncPage: 1,
                  })
                }
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </Select>
            </label>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  updateSearch({
                    installation_id: undefined,
                    setup_action: undefined,
                  })
                }
              >
                Clear callback state
              </Button>
            </div>
          </div>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">User profile</h2>
                <p className="mt-2 text-sm text-muted-foreground">This card reads the current authenticated user from the bearer-token-backed <code>/me</code> endpoint.</p>
              </div>
              {meQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading current user profile...</p> : null}
              {meQuery.isError ? (
                <ErrorState
                  title="Could not load current user"
                  message={getErrorMessage(meQuery.error)}
                  onRetry={() => void meQuery.refetch()}
                />
              ) : null}
              {meQuery.data ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Email</p>
                    <p className="mt-2">{meQuery.data.data.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Name</p>
                    <p className="mt-2">{meQuery.data.data.name ?? "Unnamed user"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">User id</p>
                    <p className="mt-2 break-all font-mono text-sm">{meQuery.data.data.id}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Created</p>
                    <p className="mt-2">{formatDateTime(meQuery.data.data.createdAt)}</p>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Organization profile</h2>
                <p className="mt-2 text-sm text-muted-foreground">Create, update, or remove organizations with the APIs available in Phase 6.</p>
              </div>
              {organizationDetailQuery.data ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Slug</span>
                      <Input
                        value={editOrganizationForm.slug}
                        onChange={(event) => setEditOrganizationForm((current) => ({ ...current, slug: event.target.value }))}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Name</span>
                      <Input
                        value={editOrganizationForm.name}
                        onChange={(event) => setEditOrganizationForm((current) => ({ ...current, name: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        selectedOrganizationId &&
                        updateOrganizationMutation.mutate({
                          organizationId: selectedOrganizationId,
                          payload: editOrganizationForm,
                        })
                      }
                    >
                      Save organization
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => selectedOrganizationId && deleteOrganizationMutation.mutate(selectedOrganizationId)}
                    >
                      Delete organization
                    </Button>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                    GitHub id {organizationDetailQuery.data.data.githubId} • created {formatDateTime(organizationDetailQuery.data.data.createdAt)}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3 rounded-xl border border-dashed border-border/70 p-4">
                <h3 className="font-semibold">Create organization</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    placeholder="GitHub id"
                    value={createOrganizationForm.githubId}
                    onChange={(event) => setCreateOrganizationForm((current) => ({ ...current, githubId: event.target.value }))}
                  />
                  <Input
                    placeholder="slug"
                    value={createOrganizationForm.slug}
                    onChange={(event) => setCreateOrganizationForm((current) => ({ ...current, slug: event.target.value }))}
                  />
                  <Input
                    placeholder="name"
                    value={createOrganizationForm.name}
                    onChange={(event) => setCreateOrganizationForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() =>
                    createOrganizationMutation.mutate({
                      githubId: Number(createOrganizationForm.githubId),
                      slug: createOrganizationForm.slug,
                      name: createOrganizationForm.name,
                    })
                  }
                >
                  Create organization
                </Button>
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card id="github-connection" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">GitHub connection</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start installation, process callback state, and inspect the organization connection status from the backend.
                </p>
              </div>
              {githubConnectionQuery.isError ? (
                <ErrorState
                  title="Could not load GitHub connection"
                  message={getErrorMessage(githubConnectionQuery.error)}
                  onRetry={() => void githubConnectionQuery.refetch()}
                />
              ) : null}
              {githubConnectionQuery.data ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill label={githubConnectionQuery.data.data.state} tone={getConnectionTone(githubConnectionQuery.data.data.state)} />
                    <span className="text-sm text-muted-foreground">{githubConnectionQuery.data.data.provider}</span>
                    {githubConnectionQuery.data.data.accountLogin ? (
                      <span className="text-sm text-muted-foreground">{githubConnectionQuery.data.data.accountLogin}</span>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Connected repositories</p>
                      <p className="mt-2 text-2xl font-semibold">{githubConnectionQuery.data.data.connectedRepositories ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Last sync</p>
                      <p className="mt-2">{formatDateTime(githubConnectionQuery.data.data.lastSyncedAt)}</p>
                    </div>
                  </div>
                  {githubConnectionQuery.data.data.lastSyncError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      {githubConnectionQuery.data.data.lastSyncError}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => selectedOrganizationId && startInstallationMutation.mutate(window.location.href)}>
                  Start GitHub install
                </Button>
                {installUrl ? (
                  <Button asChild type="button" variant="outline">
                    <a href={installUrl} target="_blank" rel="noreferrer">
                      Open install URL
                    </a>
                  </Button>
                ) : null}
              </div>

              {completeInstallationMutation.isPending ? (
                <p className="text-sm text-muted-foreground">Handling GitHub installation callback...</p>
              ) : null}
            </Card>

            <Card id="accessible-repositories" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Accessible repositories</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select repositories available from the GitHub installation, then hand them off to the backend for onboarding and initial sync.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{accessibleSelectionSummary}</p>
              {accessibleRepositoriesQuery.isError ? (
                <ErrorState
                  title="Could not load accessible repositories"
                  message={getErrorMessage(accessibleRepositoriesQuery.error)}
                  onRetry={() => void accessibleRepositoriesQuery.refetch()}
                />
              ) : null}
              {accessibleRepositoriesQuery.data?.data.length === 0 ? (
                <EmptyState
                  title="No accessible repositories"
                  description="The current installation has not exposed repository data yet, or the organization is not connected."
                />
              ) : null}
              <div className="space-y-3">
                {(accessibleRepositoriesQuery.data?.data ?? []).map((repository) => (
                  <label key={repository.githubRepositoryId} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 p-4">
                    <input
                      type="checkbox"
                      checked={selectedAccessibleRepositoryIds.includes(repository.githubRepositoryId)}
                      disabled={repository.installationStatus !== "accessible"}
                      onChange={(event) =>
                        setSelectedAccessibleRepositoryIds((current) =>
                          event.target.checked
                            ? [...current, repository.githubRepositoryId]
                            : current.filter((id) => id !== repository.githubRepositoryId),
                        )
                      }
                    />
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{repository.fullName}</p>
                        <StatusPill label={repository.selectionStatus} />
                        <StatusPill label={repository.installationStatus} tone={repository.installationStatus === "accessible" ? "success" : "warning"} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {repository.private ? "Private" : "Public"} • default branch {repository.defaultBranch ?? "unknown"}
                      </p>
                      {repository.lastSyncError ? <p className="text-sm text-rose-700">{repository.lastSyncError}</p> : null}
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={selectedAccessibleRepositoryIds.length === 0}
                  onClick={() =>
                    selectedOrganizationId &&
                    selectRepositoriesMutation.mutate({
                      organizationId: selectedOrganizationId,
                      repositoryIds: selectedAccessibleRepositoryIds,
                      autoSync: true,
                    })
                  }
                >
                  Connect selected repositories
                </Button>
                {accessibleRepositoriesQuery.data ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={search.accessiblePage <= 1}
                      onClick={() => updateSearch({ accessiblePage: search.accessiblePage - 1 })}
                    >
                      Previous page
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={accessibleRepositoriesQuery.data.pagination.page >= Math.max(accessibleRepositoriesQuery.data.pagination.totalPages, 1)}
                      onClick={() => updateSearch({ accessiblePage: search.accessiblePage + 1 })}
                    >
                      Next page
                    </Button>
                  </>
                ) : null}
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Managed repository sync</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start sync jobs, inspect sync progress, and retry or cancel jobs from the server-side history.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
                <Select
                  aria-label="Managed repository"
                  value={selectedRepositoryId ?? ""}
                  disabled={!repositorySyncReady || managedRepositories.length === 0}
                  onChange={(event) => updateSearch({ repositoryId: event.target.value, syncJobId: undefined, syncPage: 1 })}
                >
                  {managedRepositories.map((repository) => (
                    <option key={repository.id} value={repository.id}>
                      {repository.fullName}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!syncActionReady}
                  onClick={() => selectedRepositoryId && createSyncMutation.mutate({ repositoryId: selectedRepositoryId, mode: "incremental" })}
                >
                  Start incremental sync
                </Button>
                <Button
                  type="button"
                  disabled={!syncActionReady}
                  onClick={() => selectedRepositoryId && createSyncMutation.mutate({ repositoryId: selectedRepositoryId, mode: "full" })}
                >
                  Start full sync
                </Button>
              </div>

              {!repositorySyncReady ? (
                <EmptyState
                  title="Repository sync is locked until onboarding is complete"
                  description="Complete GitHub installation first. This organization is not connected yet, so the backend will reject sync until installation is finished."
                />
              ) : null}

              {repositorySyncReady && selectedRepositoryNeedsOnboarding ? (
                <EmptyState
                  title="Repository selection is required before sync"
                  description="This repository exists in DevLens, but it has not been selected from the GitHub installation yet. Finish repository onboarding in the accessible repositories section first."
                  action={
                    <Button type="button" variant="outline" onClick={() => scrollToSection("accessible-repositories")}>
                      Review accessible repositories
                    </Button>
                  }
                />
              ) : null}

              {repositorySyncReady && selectedRepositoryAccessUnavailable ? (
                <EmptyState
                  title="GitHub installation access is unavailable"
                  description="The current GitHub installation no longer exposes this repository. Re-run installation or repository selection before starting sync."
                  action={
                    <Button type="button" variant="outline" onClick={() => scrollToSection("github-connection")}>
                      Review GitHub connection
                    </Button>
                  }
                />
              ) : null}

              {createSyncMutation.isError && createSyncErrorCode === "GITHUB_INSTALLATION_REQUIRED" ? (
                <EmptyState
                  title="GitHub installation is required before sync"
                  description={getErrorMessage(createSyncMutation.error)}
                  action={
                    <Button type="button" onClick={() => selectedOrganizationId && startInstallationMutation.mutate(window.location.href)}>
                      Start GitHub install
                    </Button>
                  }
                />
              ) : null}

              {createSyncMutation.isError && createSyncErrorCode === "REPOSITORY_ONBOARDING_REQUIRED" ? (
                <EmptyState
                  title="Repository onboarding is required before sync"
                  description={getErrorMessage(createSyncMutation.error)}
                  action={
                    <Button type="button" variant="outline" onClick={() => scrollToSection("accessible-repositories")}>
                      Finish repository onboarding
                    </Button>
                  }
                />
              ) : null}

              {createSyncMutation.isError &&
              createSyncErrorCode !== "GITHUB_INSTALLATION_REQUIRED" &&
              createSyncErrorCode !== "REPOSITORY_ONBOARDING_REQUIRED" ? (
                <ErrorState title="Could not start repository sync" message={getErrorMessage(createSyncMutation.error)} />
              ) : null}

              {syncJobsQuery.isError ? (
                <ErrorState
                  title="Could not load sync jobs"
                  message={getErrorMessage(syncJobsQuery.error)}
                  onRetry={() => void syncJobsQuery.refetch()}
                />
              ) : null}

              <div className="space-y-3">
                {(syncJobsQuery.data?.data ?? []).map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    className="w-full rounded-xl border border-border/70 bg-background/70 p-4 text-left"
                    onClick={() => updateSearch({ syncJobId: job.id })}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <StatusPill label={job.status} tone={getSyncTone(job.status)} />
                        <span className="text-sm text-muted-foreground">{job.progress}% complete</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{formatDateTime(job.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>

              {syncJobsQuery.data ? (
                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" disabled={search.syncPage <= 1} onClick={() => updateSearch({ syncPage: search.syncPage - 1 })}>
                    Previous page
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Page {syncJobsQuery.data.meta.page} / {Math.max(syncJobsQuery.data.meta.totalPages, 1)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={syncJobsQuery.data.meta.page >= Math.max(syncJobsQuery.data.meta.totalPages, 1)}
                    onClick={() => updateSearch({ syncPage: search.syncPage + 1 })}
                  >
                    Next page
                  </Button>
                </div>
              ) : null}
            </Card>

            <Card className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Sync job detail</h2>
                <p className="mt-2 text-sm text-muted-foreground">Track the selected sync job progress and act on failed or running work.</p>
              </div>
              {syncJobDetailQuery.isError ? (
                <ErrorState
                  title="Could not load sync job detail"
                  message={getErrorMessage(syncJobDetailQuery.error)}
                  onRetry={() => void syncJobDetailQuery.refetch()}
                />
              ) : null}
              {activeSyncJob ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill label={activeSyncJob.status} tone={getSyncTone(activeSyncJob.status)} />
                    <span className="text-sm text-muted-foreground">{activeSyncJob.progress}% complete</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Started</p>
                      <p className="mt-2">{formatDateTime(activeSyncJob.startedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Finished</p>
                      <p className="mt-2">{formatDateTime(activeSyncJob.finishedAt)}</p>
                    </div>
                  </div>
                  {activeSyncJob.errorMessage ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      {activeSyncJob.errorMessage}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    {activeSyncJob.status === "failed" ? (
                      <Button type="button" variant="outline" onClick={() => retrySyncMutation.mutate(activeSyncJob.id)}>
                        Retry sync job
                      </Button>
                    ) : null}
                    {activeSyncJob.status === "pending" || activeSyncJob.status === "running" ? (
                      <Button type="button" variant="outline" onClick={() => cancelSyncMutation.mutate(activeSyncJob.id)}>
                        Cancel sync job
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <EmptyState title="No sync job selected" description="Choose a sync job from the history list to inspect its current server-side state." />
              )}
            </Card>
          </section>

          <section>
            <Card className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Organization members</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add members with a raw `userId`, update their role, or remove them using the current backend milestone contract.
                </p>
              </div>
              {organizationMembersQuery.isError ? (
                <ErrorState
                  title="Could not load organization members"
                  message={getErrorMessage(organizationMembersQuery.error)}
                  onRetry={() => void organizationMembersQuery.refetch()}
                />
              ) : null}
              <div className="space-y-3">
                {(organizationMembersQuery.data?.data ?? []).map((member) => (
                  <div key={member.id} className="grid gap-3 rounded-xl border border-border/70 bg-background/70 p-4 md:grid-cols-[1.6fr_0.8fr_auto_auto] md:items-center">
                    <div>
                      <p className="font-mono text-sm">{member.userId}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{member.id}</p>
                    </div>
                    <Select
                      value={memberDrafts[member.id] ?? member.role}
                      onChange={(event) =>
                        setMemberDrafts((current) => ({
                          ...current,
                          [member.id]: event.target.value as "owner" | "admin" | "member",
                        }))
                      }
                    >
                      <option value="owner">owner</option>
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        selectedOrganizationId &&
                        updateMemberMutation.mutate({
                          organizationId: selectedOrganizationId,
                          memberId: member.id,
                          payload: {
                            role: memberDrafts[member.id] ?? member.role,
                          },
                        })
                      }
                    >
                      Save role
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        selectedOrganizationId &&
                        deleteMemberMutation.mutate({
                          organizationId: selectedOrganizationId,
                          memberId: member.id,
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 rounded-xl border border-dashed border-border/70 p-4 md:grid-cols-[1.6fr_0.8fr_auto]">
                <Input placeholder="User UUID" value={newMemberUserId} onChange={(event) => setNewMemberUserId(event.target.value)} />
                <Select value={newMemberRole} onChange={(event) => setNewMemberRole(event.target.value as "owner" | "admin" | "member")}>
                  <option value="owner">owner</option>
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                </Select>
                <Button
                  type="button"
                  onClick={() =>
                    selectedOrganizationId &&
                    createMemberMutation.mutate({
                      organizationId: selectedOrganizationId,
                      payload: {
                        userId: newMemberUserId,
                        role: newMemberRole,
                      },
                    })
                  }
                >
                  Add member
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </PageShell>
    </AppLayout>
  );
}
