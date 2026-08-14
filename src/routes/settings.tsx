import { useEffect, useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { PageShell } from "@/components/layout/page-shell";
import { formatDateTime } from "@/components/repositories/repository-utils";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/shared/query-state";
import { StatusPill } from "@/components/shared/status-pill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { RequiredMark } from "@/components/ui/required-mark";
import { FieldError } from "@/components/ui/field-error";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import {
  SuccessModal,
  type SuccessModalState,
} from "@/components/shared/success-modal";
import { OrganizationRetentionSettingsCard } from "@/components/settings/organization-retention-settings-card";
import { OrganizationRuleSettingsCard } from "@/components/settings/organization-rule-settings-card";
import { useFieldValidation } from "@/lib/use-field-validation";
import {
  useAccessibleGitHubRepositoriesQuery,
  useCompleteGitHubInstallationMutation,
  useDisconnectGitHubConnectionMutation,
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

const settingsTabs = [
  "organization",
  "github",
  "sync",
  "members",
  "rules",
] as const;
type SettingsTab = (typeof settingsTabs)[number];

const settingsSearchSchema = z.object({
  organizationId: z.string().min(1).optional(),
  repositoryId: z.string().min(1).optional(),
  syncJobId: z.string().min(1).optional(),
  accessiblePage: z.number().int().min(1).catch(1).default(1),
  syncPage: z.number().int().min(1).catch(1).default(1),
  installation_id: z.number().int().optional(),
  state: z.string().optional(),
  setup_action: z.string().optional(),
  tab: z.enum(settingsTabs).optional().catch(undefined),
});

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  validateSearch: (search) =>
    settingsSearchSchema.parse({
      organizationId:
        typeof search.organizationId === "string"
          ? search.organizationId
          : undefined,
      repositoryId:
        typeof search.repositoryId === "string"
          ? search.repositoryId
          : undefined,
      syncJobId:
        typeof search.syncJobId === "string" ? search.syncJobId : undefined,
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
      state: typeof search.state === "string" ? search.state : undefined,
      setup_action:
        typeof search.setup_action === "string"
          ? search.setup_action
          : undefined,
      tab: typeof search.tab === "string" ? search.tab : undefined,
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

function SettingsSkeleton() {
  return (
    <div className="space-y-8" aria-label="Settings loading">
      <Skeleton className="h-10 w-64" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border/80 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-4 rounded-2xl border border-border/80 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

const createOrganizationSchema = z.object({
  githubId: z
    .string()
    .min(1, "GitHub id is required")
    .regex(/^\d+$/, "GitHub id must be a number"),
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
});

const editOrganizationSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
});

const newMemberSchema = z.object({
  userId: z.uuid({ message: "Must be a valid UUID" }),
});

function SettingsPage() {
  const navigate = settingsRoute.useNavigate();
  const search = settingsRoute.useSearch();
  const organizationsQuery = useOrganizationsQuery();
  const organizations = useMemo(
    () => organizationsQuery.data?.data ?? [],
    [organizationsQuery.data?.data],
  );
  const selectedOrganizationId = search.organizationId ?? organizations[0]?.id;
  const activeTab: SettingsTab =
    search.tab ?? (search.installation_id ? "github" : "organization");
  const organizationDetailQuery = useOrganizationDetailQuery(
    selectedOrganizationId ?? "",
    Boolean(selectedOrganizationId),
  );
  const organizationMembersQuery = useOrganizationMembersQuery(
    selectedOrganizationId ?? "",
    Boolean(selectedOrganizationId),
  );
  const githubConnectionQuery = useGitHubConnectionQuery(
    selectedOrganizationId ?? "",
    Boolean(selectedOrganizationId),
  );
  const accessibleRepositoriesQuery = useAccessibleGitHubRepositoriesQuery(
    {
      organizationId: selectedOrganizationId ?? "",
      page: search.accessiblePage,
      pageSize: 20,
    },
    Boolean(selectedOrganizationId) &&
      ["connected", "syncing", "sync_failed"].includes(
        githubConnectionQuery.data?.data.state ?? "",
      ),
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
  const managedRepositories = useMemo(
    () => managedRepositoriesQuery.data?.data ?? [],
    [managedRepositoriesQuery.data?.data],
  );
  const selectedRepositoryId =
    search.repositoryId ?? managedRepositories[0]?.id;
  const syncJobsQuery = useRepositorySyncJobsQuery(
    {
      repositoryId: selectedRepositoryId ?? "",
      page: search.syncPage,
      pageSize: 10,
    },
    Boolean(selectedRepositoryId),
  );
  const selectedSyncJobId = search.syncJobId ?? syncJobsQuery.data?.data[0]?.id;
  const syncJobDetailQuery = useSyncJobDetailQuery(
    selectedSyncJobId ?? "",
    Boolean(selectedSyncJobId),
  );
  const meQuery = useMeQuery();

  const createOrganizationMutation = useCreateOrganizationMutation();
  const updateOrganizationMutation = useUpdateOrganizationMutation();
  const deleteOrganizationMutation = useDeleteOrganizationMutation();
  const startInstallationMutation = useStartGitHubInstallationMutation(
    selectedOrganizationId ?? "",
  );
  const completeInstallationMutation = useCompleteGitHubInstallationMutation();
  const selectRepositoriesMutation =
    useSelectAccessibleGitHubRepositoriesMutation();
  const disconnectGitHubMutation = useDisconnectGitHubConnectionMutation();
  const createSyncMutation = useCreateRepositorySyncMutation();
  const retrySyncMutation = useRetrySyncJobMutation();
  const cancelSyncMutation = useCancelSyncJobMutation();
  const createMemberMutation = useCreateOrganizationMemberMutation();
  const updateMemberMutation = useUpdateOrganizationMemberMutation();
  const deleteMemberMutation = useDeleteOrganizationMemberMutation();

  const [callbackKey, setCallbackKey] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmDeleteOrganization, setConfirmDeleteOrganization] =
    useState(false);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const [selectedAccessibleRepositoryIds, setSelectedAccessibleRepositoryIds] =
    useState<number[]>([]);
  const [createOrganizationForm, setCreateOrganizationForm] = useState({
    githubId: "",
    slug: "",
    name: "",
  });
  const [editOrganizationForm, setEditOrganizationForm] = useState({
    slug: "",
    name: "",
  });
  const [memberDrafts, setMemberDrafts] = useState<
    Record<string, "owner" | "admin" | "member">
  >({});
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<
    "owner" | "admin" | "member"
  >("member");
  const [successModal, setSuccessModal] = useState<SuccessModalState>(null);

  function notifySuccess(title: string, message?: string) {
    setSuccessModal({ title, message });
  }

  const createOrganizationValidation = useFieldValidation(
    createOrganizationSchema,
    createOrganizationForm,
  );
  const editOrganizationValidation = useFieldValidation(
    editOrganizationSchema,
    editOrganizationForm,
  );
  const newMemberValidation = useFieldValidation(newMemberSchema, {
    userId: newMemberUserId,
  });

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
    if (
      selectedOrganizationId &&
      !search.repositoryId &&
      managedRepositories[0]?.id
    ) {
      void navigate({
        search: (previous) => ({
          ...previous,
          repositoryId: managedRepositories[0].id,
        }),
        replace: true,
      });
    }
  }, [
    managedRepositories,
    navigate,
    search.repositoryId,
    selectedOrganizationId,
  ]);

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
      (organizationMembersQuery.data?.data ?? []).map((member) => [
        member.id,
        member.role,
      ]),
    ) as Record<string, "owner" | "admin" | "member">;
    setMemberDrafts(drafts);
  }, [organizationMembersQuery.data]);

  useEffect(() => {
    // Merge rather than replace: accessible repositories are paginated, and
    // this effect re-runs on every page change. Replacing the selection
    // outright would silently discard checkboxes the user ticked on a page
    // they've since navigated away from.
    const alreadySelected = (accessibleRepositoriesQuery.data?.data ?? [])
      .filter((repository) => repository.selectionStatus !== "not_selected")
      .map((repository) => repository.githubRepositoryId);
    setSelectedAccessibleRepositoryIds((current) =>
      Array.from(new Set([...current, ...alreadySelected])),
    );
  }, [accessibleRepositoriesQuery.data]);

  useEffect(() => {
    const nextCallbackKey =
      selectedOrganizationId && search.installation_id && search.state
        ? `${selectedOrganizationId}:${search.installation_id}:${search.state}:${search.setup_action ?? ""}`
        : null;

    if (!nextCallbackKey || callbackKey === nextCallbackKey) {
      return;
    }

    completeInstallationMutation.mutate({
      organizationId: selectedOrganizationId,
      installationId: search.installation_id,
      state: search.state,
      setupAction: search.setup_action,
    });
    setCallbackKey(nextCallbackKey);
  }, [
    callbackKey,
    completeInstallationMutation,
    search.installation_id,
    search.setup_action,
    search.state,
    selectedOrganizationId,
  ]);

  const activeSyncJob = syncJobDetailQuery.data?.data;
  const installUrl = startInstallationMutation.data?.data.installUrl;
  const connectionState = githubConnectionQuery.data?.data.state;
  const repositorySyncReady =
    connectionState === "connected" ||
    connectionState === "syncing" ||
    connectionState === "sync_failed";
  const selectedManagedRepository = managedRepositories.find(
    (repository) => repository.id === selectedRepositoryId,
  );
  const selectedAccessibleRepository = (
    accessibleRepositoriesQuery.data?.data ?? []
  ).find(
    (repository) =>
      String(repository.githubRepositoryId) ===
      selectedManagedRepository?.githubId,
  );
  const selectedRepositoryNeedsOnboarding =
    selectedAccessibleRepository?.selectionStatus === "not_selected";
  const selectedRepositoryAccessUnavailable =
    selectedAccessibleRepository !== undefined &&
    selectedAccessibleRepository.installationStatus !== "accessible";
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
      <PageShell unwrapped>
        <div className="space-y-8">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-accent">
            Settings
          </p>
          {organizationsQuery.isLoading ? (
            <SettingsSkeleton />
          ) : organizations.length === 0 ? (
            <EmptyState
              title="Create your first organization"
              description="Link a GitHub organization to start syncing repositories, tracking pull requests, and surfacing insights."
              action={
                <Button
                  type="button"
                  onClick={() => setCreateOrgDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  New organization
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto]">
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    Organization
                  </span>
                  <Select
                    aria-label="Settings organization"
                    value={selectedOrganizationId ?? ""}
                    onChange={(event) => {
                      setConfirmDisconnect(false);
                      setConfirmDeleteOrganization(false);
                      setNewMemberUserId("");
                      setNewMemberRole("member");
                      setSelectedAccessibleRepositoryIds([]);
                      updateSearch({
                        organizationId: event.target.value,
                        repositoryId: undefined,
                        syncJobId: undefined,
                        accessiblePage: 1,
                        syncPage: 1,
                      });
                    }}
                  >
                    {organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </Select>
                </label>

                {search.installation_id ? (
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        updateSearch({
                          installation_id: undefined,
                          state: undefined,
                          setup_action: undefined,
                        })
                      }
                    >
                      Dismiss GitHub redirect
                    </Button>
                  </div>
                ) : null}
              </div>

              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  updateSearch({ tab: value as SettingsTab })
                }
              >
                <TabsList>
                  <TabsTrigger value="organization">Organization</TabsTrigger>
                  <TabsTrigger value="github">GitHub</TabsTrigger>
                  <TabsTrigger value="sync">Sync</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="rules">Rules &amp; retention</TabsTrigger>
                </TabsList>

                <TabsContent value="organization">
                  <section className="grid gap-6 xl:grid-cols-2">
                    <Card className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">User profile</h2>
                        <InfoTooltip content="Your account details for this DevLens session." />
                      </div>
                      {meQuery.isLoading ? (
                        <p className="text-sm text-muted-foreground">
                          Loading current user profile...
                        </p>
                      ) : null}
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
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                              Email
                            </p>
                            <p className="mt-2">{meQuery.data.data.email}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                              Name
                            </p>
                            <p className="mt-2">
                              {meQuery.data.data.name ?? "Unnamed user"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                              User id
                            </p>
                            <p className="mt-2 break-all font-mono text-sm">
                              {meQuery.data.data.id}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                              Created
                            </p>
                            <p className="mt-2">
                              {formatDateTime(meQuery.data.data.createdAt)}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </Card>

                    <Card className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-semibold">
                            Organization profile
                          </h2>
                          <InfoTooltip content="View and update this organization's name and slug." />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCreateOrgDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                          New organization
                        </Button>
                      </div>
                      {organizationDetailQuery.isError ? (
                        <ErrorState
                          title="Could not load organization"
                          message={getErrorMessage(
                            organizationDetailQuery.error,
                          )}
                          onRetry={() => void organizationDetailQuery.refetch()}
                        />
                      ) : null}
                      {updateOrganizationMutation.isError ? (
                        <ErrorState
                          title="Could not save organization"
                          message={getErrorMessage(
                            updateOrganizationMutation.error,
                          )}
                        />
                      ) : null}
                      {deleteOrganizationMutation.isError ? (
                        <ErrorState
                          title="Could not delete organization"
                          message={getErrorMessage(
                            deleteOrganizationMutation.error,
                          )}
                        />
                      ) : null}
                      {organizationDetailQuery.data ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2">
                              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                Slug
                                <RequiredMark />
                              </span>
                              <Input
                                aria-required="true"
                                aria-invalid={
                                  editOrganizationValidation.fieldError("slug")
                                    ? "true"
                                    : "false"
                                }
                                value={editOrganizationForm.slug}
                                onChange={(event) =>
                                  setEditOrganizationForm((current) => ({
                                    ...current,
                                    slug: event.target.value,
                                  }))
                                }
                              />
                              <FieldError
                                message={editOrganizationValidation.fieldError(
                                  "slug",
                                )}
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                Name
                                <RequiredMark />
                              </span>
                              <Input
                                aria-required="true"
                                aria-invalid={
                                  editOrganizationValidation.fieldError("name")
                                    ? "true"
                                    : "false"
                                }
                                value={editOrganizationForm.name}
                                onChange={(event) =>
                                  setEditOrganizationForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                  }))
                                }
                              />
                              <FieldError
                                message={editOrganizationValidation.fieldError(
                                  "name",
                                )}
                              />
                            </label>
                          </div>
                          <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                            GitHub id{" "}
                            {organizationDetailQuery.data.data.githubId} •
                            created{" "}
                            {formatDateTime(
                              organizationDetailQuery.data.data.createdAt,
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              disabled={
                                !editOrganizationValidation.isValid ||
                                updateOrganizationMutation.isPending
                              }
                              onClick={() =>
                                selectedOrganizationId &&
                                updateOrganizationMutation.mutate(
                                  {
                                    organizationId: selectedOrganizationId,
                                    payload: editOrganizationForm,
                                  },
                                  {
                                    onSuccess: () =>
                                      notifySuccess(
                                        "Organization updated",
                                        "Your changes have been saved.",
                                      ),
                                  },
                                )
                              }
                            >
                              Save organization
                            </Button>
                            <div className="ml-auto flex flex-wrap items-center gap-3">
                              {confirmDeleteOrganization ? (
                                <>
                                  <span className="text-sm text-rose-600 dark:text-rose-400">
                                    Delete this organization? This can&apos;t be
                                    undone.
                                  </span>
                                  <Button
                                    type="button"
                                    variant="danger"
                                    disabled={
                                      deleteOrganizationMutation.isPending
                                    }
                                    onClick={() =>
                                      selectedOrganizationId &&
                                      deleteOrganizationMutation.mutate(
                                        selectedOrganizationId,
                                        {
                                          onSuccess: () => {
                                            setConfirmDeleteOrganization(false);
                                            setNewMemberUserId("");
                                            setNewMemberRole("member");
                                            setSelectedAccessibleRepositoryIds(
                                              [],
                                            );
                                            notifySuccess(
                                              "Organization deleted",
                                            );
                                            updateSearch({
                                              organizationId: undefined,
                                              repositoryId: undefined,
                                              syncJobId: undefined,
                                              accessiblePage: 1,
                                              syncPage: 1,
                                            });
                                          },
                                        },
                                      )
                                    }
                                  >
                                    {deleteOrganizationMutation.isPending
                                      ? "Deleting..."
                                      : "Confirm delete"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      setConfirmDeleteOrganization(false)
                                    }
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  type="button"
                                  variant="danger-outline"
                                  onClick={() =>
                                    setConfirmDeleteOrganization(true)
                                  }
                                >
                                  Delete organization
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </Card>
                  </section>
                </TabsContent>

                <TabsContent value="github">
                  <section className="grid gap-6 xl:grid-cols-2">
                    <Card id="github-connection" className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">
                          GitHub connection
                        </h2>
                        <InfoTooltip content="Connect this organization to GitHub so DevLens can sync its repositories." />
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
                            <StatusPill
                              label={githubConnectionQuery.data.data.state}
                              tone={getConnectionTone(
                                githubConnectionQuery.data.data.state,
                              )}
                            />
                            <span className="text-sm text-muted-foreground">
                              {githubConnectionQuery.data.data.provider}
                            </span>
                            {githubConnectionQuery.data.data.accountLogin ? (
                              <span className="text-sm text-muted-foreground">
                                {githubConnectionQuery.data.data.accountLogin}
                              </span>
                            ) : null}
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                Connected repositories
                              </p>
                              <p className="mt-2 text-2xl font-semibold">
                                {githubConnectionQuery.data.data
                                  .connectedRepositories ?? 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                Last sync
                              </p>
                              <p className="mt-2">
                                {formatDateTime(
                                  githubConnectionQuery.data.data.lastSyncedAt,
                                )}
                              </p>
                            </div>
                          </div>
                          {githubConnectionQuery.data.data.lastSyncError ? (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              {githubConnectionQuery.data.data.lastSyncError}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          disabled={
                            !selectedOrganizationId ||
                            startInstallationMutation.isPending
                          }
                          onClick={() =>
                            selectedOrganizationId &&
                            startInstallationMutation.mutate(
                              window.location.href,
                            )
                          }
                        >
                          Start GitHub install
                        </Button>
                        {installUrl ? (
                          <Button asChild type="button" variant="outline">
                            <a
                              href={installUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open install URL
                            </a>
                          </Button>
                        ) : null}
                      </div>

                      {completeInstallationMutation.isPending ? (
                        <p className="text-sm text-muted-foreground">
                          Handling GitHub installation callback...
                        </p>
                      ) : null}

                      {completeInstallationMutation.isError ? (
                        <ErrorState
                          title="Could not complete GitHub installation callback"
                          message={getErrorMessage(
                            completeInstallationMutation.error,
                          )}
                          onRetry={() =>
                            selectedOrganizationId &&
                            search.installation_id &&
                            search.state &&
                            completeInstallationMutation.mutate({
                              organizationId: selectedOrganizationId,
                              installationId: search.installation_id,
                              state: search.state,
                              setupAction: search.setup_action,
                            })
                          }
                        />
                      ) : null}

                      {githubConnectionQuery.data &&
                      (connectionState === "connected" ||
                        connectionState === "syncing" ||
                        connectionState === "sync_failed") ? (
                        <div className="space-y-3 rounded-xl bg-rose-50/60 p-4 dark:bg-rose-950/30">
                          <div>
                            <h3 className="font-semibold text-rose-600 dark:text-rose-400">
                              Disconnect GitHub
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Soft-disconnects this organization&apos;s GitHub
                              App installation and cancels any in-progress sync
                              jobs. Historical data is kept and purged later on
                              the normal retention schedule; reconnecting before
                              that purge reuses the existing data.
                            </p>
                          </div>
                          {disconnectGitHubMutation.isError ? (
                            <ErrorState
                              title="Could not disconnect GitHub"
                              message={getErrorMessage(
                                disconnectGitHubMutation.error,
                              )}
                            />
                          ) : null}
                          {confirmDisconnect ? (
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-sm text-rose-600 dark:text-rose-400">
                                Are you sure? This can&apos;t be undone from the
                                UI.
                              </span>
                              <Button
                                type="button"
                                variant="danger"
                                disabled={disconnectGitHubMutation.isPending}
                                onClick={() => {
                                  if (selectedOrganizationId) {
                                    disconnectGitHubMutation.mutate(
                                      selectedOrganizationId,
                                      {
                                        onSuccess: () => {
                                          setConfirmDisconnect(false);
                                          notifySuccess(
                                            "GitHub disconnected",
                                            "Historical data is kept until the retention purge runs.",
                                          );
                                        },
                                      },
                                    );
                                  }
                                }}
                              >
                                {disconnectGitHubMutation.isPending
                                  ? "Disconnecting..."
                                  : "Confirm disconnect"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setConfirmDisconnect(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="danger-outline"
                              onClick={() => setConfirmDisconnect(true)}
                            >
                              Disconnect GitHub
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </Card>

                    <Card id="accessible-repositories" className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">
                          Accessible repositories
                        </h2>
                        <InfoTooltip content="Choose which repositories to bring into DevLens and start syncing." />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {accessibleSelectionSummary}
                      </p>
                      {accessibleRepositoriesQuery.isError ? (
                        <ErrorState
                          title="Could not load accessible repositories"
                          message={getErrorMessage(
                            accessibleRepositoriesQuery.error,
                          )}
                          onRetry={() =>
                            void accessibleRepositoriesQuery.refetch()
                          }
                        />
                      ) : null}
                      {selectRepositoriesMutation.isError ? (
                        <ErrorState
                          title="Could not connect repositories"
                          message={getErrorMessage(
                            selectRepositoriesMutation.error,
                          )}
                        />
                      ) : null}
                      {accessibleRepositoriesQuery.data?.data.length === 0 ? (
                        <EmptyState
                          title="No accessible repositories"
                          description="The current installation has not exposed repository data yet, or the organization is not connected."
                        />
                      ) : null}
                      <div className="max-h-96 divide-y divide-border/60 overflow-y-auto rounded-xl border border-border/70">
                        {(accessibleRepositoriesQuery.data?.data ?? []).map(
                          (repository) => (
                            <label
                              key={repository.githubRepositoryId}
                              className="flex items-start gap-3 p-4"
                            >
                              <input
                                type="checkbox"
                                checked={selectedAccessibleRepositoryIds.includes(
                                  repository.githubRepositoryId,
                                )}
                                disabled={
                                  repository.installationStatus !== "accessible"
                                }
                                onChange={(event) =>
                                  setSelectedAccessibleRepositoryIds(
                                    (current) =>
                                      event.target.checked
                                        ? [
                                            ...current,
                                            repository.githubRepositoryId,
                                          ]
                                        : current.filter(
                                            (id) =>
                                              id !==
                                              repository.githubRepositoryId,
                                          ),
                                  )
                                }
                              />
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium">
                                    {repository.fullName}
                                  </p>
                                  <StatusPill
                                    label={repository.selectionStatus}
                                  />
                                  <StatusPill
                                    label={repository.installationStatus}
                                    tone={
                                      repository.installationStatus ===
                                      "accessible"
                                        ? "success"
                                        : "warning"
                                    }
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {repository.private ? "Private" : "Public"} •
                                  default branch{" "}
                                  {repository.defaultBranch ?? "unknown"}
                                </p>
                                {repository.lastSyncError ? (
                                  <p className="text-sm text-rose-600 dark:text-rose-400">
                                    {repository.lastSyncError}
                                  </p>
                                ) : null}
                              </div>
                            </label>
                          ),
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          disabled={
                            selectedAccessibleRepositoryIds.length === 0 ||
                            selectRepositoriesMutation.isPending
                          }
                          onClick={() =>
                            selectedOrganizationId &&
                            selectRepositoriesMutation.mutate(
                              {
                                organizationId: selectedOrganizationId,
                                repositoryIds: selectedAccessibleRepositoryIds,
                                autoSync: true,
                              },
                              {
                                onSuccess: () =>
                                  notifySuccess(
                                    "Repositories connected",
                                    "Selected repositories are queued for onboarding and sync.",
                                  ),
                              },
                            )
                          }
                        >
                          Connect selected repositories
                        </Button>
                        {accessibleRepositoriesQuery.data ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              aria-label="Previous page"
                              disabled={search.accessiblePage <= 1}
                              onClick={() =>
                                updateSearch({
                                  accessiblePage: search.accessiblePage - 1,
                                })
                              }
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="self-center text-sm text-muted-foreground">
                              Page{" "}
                              {accessibleRepositoriesQuery.data.pagination.page}{" "}
                              /{" "}
                              {Math.max(
                                accessibleRepositoriesQuery.data.pagination
                                  .totalPages,
                                1,
                              )}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              aria-label="Next page"
                              disabled={
                                accessibleRepositoriesQuery.data.pagination
                                  .page >=
                                Math.max(
                                  accessibleRepositoriesQuery.data.pagination
                                    .totalPages,
                                  1,
                                )
                              }
                              onClick={() =>
                                updateSearch({
                                  accessiblePage: search.accessiblePage + 1,
                                })
                              }
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </Card>
                  </section>
                </TabsContent>

                <TabsContent value="sync">
                  <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">
                          Managed repository sync
                        </h2>
                        <InfoTooltip content="Trigger a sync for a repository and track its progress." />
                      </div>

                      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                        <Select
                          aria-label="Managed repository"
                          value={selectedRepositoryId ?? ""}
                          disabled={
                            !repositorySyncReady ||
                            managedRepositories.length === 0
                          }
                          onChange={(event) =>
                            updateSearch({
                              repositoryId: event.target.value,
                              syncJobId: undefined,
                              syncPage: 1,
                            })
                          }
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
                          className="whitespace-nowrap"
                          disabled={
                            !syncActionReady || createSyncMutation.isPending
                          }
                          onClick={() =>
                            selectedRepositoryId &&
                            createSyncMutation.mutate(
                              {
                                repositoryId: selectedRepositoryId,
                                mode: "incremental",
                              },
                              {
                                onSuccess: () =>
                                  notifySuccess(
                                    "Sync started",
                                    "Incremental sync has been queued.",
                                  ),
                              },
                            )
                          }
                        >
                          Start incremental sync
                        </Button>
                        <Button
                          type="button"
                          className="whitespace-nowrap"
                          disabled={
                            !syncActionReady || createSyncMutation.isPending
                          }
                          onClick={() =>
                            selectedRepositoryId &&
                            createSyncMutation.mutate(
                              {
                                repositoryId: selectedRepositoryId,
                                mode: "full",
                              },
                              {
                                onSuccess: () =>
                                  notifySuccess(
                                    "Sync started",
                                    "Full sync has been queued.",
                                  ),
                              },
                            )
                          }
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

                      {repositorySyncReady &&
                      selectedRepositoryNeedsOnboarding ? (
                        <EmptyState
                          title="Repository selection is required before sync"
                          description="This repository exists in DevLens, but it has not been selected from the GitHub installation yet. Finish repository onboarding in the accessible repositories section first."
                          action={
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => updateSearch({ tab: "github" })}
                            >
                              Review accessible repositories
                            </Button>
                          }
                        />
                      ) : null}

                      {repositorySyncReady &&
                      selectedRepositoryAccessUnavailable ? (
                        <EmptyState
                          title="GitHub installation access is unavailable"
                          description="The current GitHub installation no longer exposes this repository. Re-run installation or repository selection before starting sync."
                          action={
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => updateSearch({ tab: "github" })}
                            >
                              Review GitHub connection
                            </Button>
                          }
                        />
                      ) : null}

                      {createSyncMutation.isError &&
                      createSyncErrorCode === "GITHUB_INSTALLATION_REQUIRED" ? (
                        <EmptyState
                          title="GitHub installation is required before sync"
                          description={getErrorMessage(
                            createSyncMutation.error,
                          )}
                          action={
                            <Button
                              type="button"
                              disabled={
                                !selectedOrganizationId ||
                                startInstallationMutation.isPending
                              }
                              onClick={() =>
                                selectedOrganizationId &&
                                startInstallationMutation.mutate(
                                  window.location.href,
                                )
                              }
                            >
                              Start GitHub install
                            </Button>
                          }
                        />
                      ) : null}

                      {createSyncMutation.isError &&
                      createSyncErrorCode ===
                        "REPOSITORY_ONBOARDING_REQUIRED" ? (
                        <EmptyState
                          title="Repository onboarding is required before sync"
                          description={getErrorMessage(
                            createSyncMutation.error,
                          )}
                          action={
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => updateSearch({ tab: "github" })}
                            >
                              Finish repository onboarding
                            </Button>
                          }
                        />
                      ) : null}

                      {createSyncMutation.isError &&
                      createSyncErrorCode !== "GITHUB_INSTALLATION_REQUIRED" &&
                      createSyncErrorCode !==
                        "REPOSITORY_ONBOARDING_REQUIRED" ? (
                        <ErrorState
                          title="Could not start repository sync"
                          message={getErrorMessage(createSyncMutation.error)}
                        />
                      ) : null}

                      {syncJobsQuery.isError ? (
                        <ErrorState
                          title="Could not load sync jobs"
                          message={getErrorMessage(syncJobsQuery.error)}
                          onRetry={() => void syncJobsQuery.refetch()}
                        />
                      ) : null}

                      <div className="max-h-96 divide-y divide-border/60 overflow-y-auto rounded-xl border border-border/70">
                        {(syncJobsQuery.data?.data ?? []).map((job) => (
                          <button
                            key={job.id}
                            type="button"
                            className={cn(
                              "w-full p-4 text-left transition-colors hover:bg-muted/60",
                              job.id === selectedSyncJobId && "bg-muted/60",
                            )}
                            onClick={() => updateSearch({ syncJobId: job.id })}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <StatusPill
                                  label={job.status}
                                  tone={getSyncTone(job.status)}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {job.progress}% complete
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatDateTime(job.createdAt)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {syncJobsQuery.data ? (
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label="Previous page"
                            disabled={search.syncPage <= 1}
                            onClick={() =>
                              updateSearch({ syncPage: search.syncPage - 1 })
                            }
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            Page {syncJobsQuery.data.meta.page} /{" "}
                            {Math.max(syncJobsQuery.data.meta.totalPages, 1)}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label="Next page"
                            disabled={
                              syncJobsQuery.data.meta.page >=
                              Math.max(syncJobsQuery.data.meta.totalPages, 1)
                            }
                            onClick={() =>
                              updateSearch({ syncPage: search.syncPage + 1 })
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </Card>

                    <Card className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">
                          Sync job detail
                        </h2>
                        <InfoTooltip content="Details for the sync job selected from the list." />
                      </div>
                      {syncJobDetailQuery.isError ? (
                        <ErrorState
                          title="Could not load sync job detail"
                          message={getErrorMessage(syncJobDetailQuery.error)}
                          onRetry={() => void syncJobDetailQuery.refetch()}
                        />
                      ) : null}
                      {retrySyncMutation.isError ? (
                        <ErrorState
                          title="Could not retry sync job"
                          message={getErrorMessage(retrySyncMutation.error)}
                        />
                      ) : null}
                      {cancelSyncMutation.isError ? (
                        <ErrorState
                          title="Could not cancel sync job"
                          message={getErrorMessage(cancelSyncMutation.error)}
                        />
                      ) : null}
                      {activeSyncJob ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusPill
                              label={activeSyncJob.status}
                              tone={getSyncTone(activeSyncJob.status)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {activeSyncJob.progress}% complete
                            </span>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                Started
                              </p>
                              <p className="mt-2">
                                {formatDateTime(activeSyncJob.startedAt)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                Finished
                              </p>
                              <p className="mt-2">
                                {formatDateTime(activeSyncJob.finishedAt)}
                              </p>
                            </div>
                          </div>
                          {activeSyncJob.errorMessage ? (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              {activeSyncJob.errorMessage}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-3">
                            {activeSyncJob.status === "failed" ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  retrySyncMutation.mutate(activeSyncJob.id, {
                                    onSuccess: () =>
                                      notifySuccess("Sync job retried"),
                                  })
                                }
                              >
                                Retry sync job
                              </Button>
                            ) : null}
                            {activeSyncJob.status === "pending" ||
                            activeSyncJob.status === "running" ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  cancelSyncMutation.mutate(activeSyncJob.id, {
                                    onSuccess: () =>
                                      notifySuccess("Sync job canceled"),
                                  })
                                }
                              >
                                Cancel sync job
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          title="No sync job selected"
                          description="Choose a sync job from the history list to inspect its current server-side state."
                        />
                      )}
                    </Card>
                  </section>
                </TabsContent>

                <TabsContent value="members">
                  <section>
                    <Card className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">
                          Organization members
                        </h2>
                        <InfoTooltip content="Manage who has access to this organization and their role." />
                      </div>
                      {organizationMembersQuery.isError ? (
                        <ErrorState
                          title="Could not load organization members"
                          message={getErrorMessage(
                            organizationMembersQuery.error,
                          )}
                          onRetry={() =>
                            void organizationMembersQuery.refetch()
                          }
                        />
                      ) : null}
                      {updateMemberMutation.isError ? (
                        <ErrorState
                          title="Could not save role"
                          message={getErrorMessage(updateMemberMutation.error)}
                        />
                      ) : null}
                      {deleteMemberMutation.isError ? (
                        <ErrorState
                          title="Could not remove member"
                          message={getErrorMessage(deleteMemberMutation.error)}
                        />
                      ) : null}
                      {createMemberMutation.isError ? (
                        <ErrorState
                          title="Could not add member"
                          message={getErrorMessage(createMemberMutation.error)}
                        />
                      ) : null}
                      <div className="max-h-96 divide-y divide-border/60 overflow-y-auto rounded-xl border border-border/70">
                        {(organizationMembersQuery.data?.data ?? []).map(
                          (member) => (
                            <div
                              key={member.id}
                              className="grid gap-3 p-4 md:grid-cols-[1.6fr_0.8fr_auto_auto] md:items-center"
                            >
                              <div>
                                <p className="font-mono text-sm">
                                  {member.userId}
                                </p>
                              </div>
                              <Select
                                aria-label={`Role for member ${member.userId}`}
                                value={memberDrafts[member.id] ?? member.role}
                                onChange={(event) =>
                                  setMemberDrafts((current) => ({
                                    ...current,
                                    [member.id]: event.target.value as
                                      "owner" | "admin" | "member",
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
                                aria-label={`Save role for member ${member.userId}`}
                                disabled={updateMemberMutation.isPending}
                                onClick={() =>
                                  selectedOrganizationId &&
                                  updateMemberMutation.mutate(
                                    {
                                      organizationId: selectedOrganizationId,
                                      memberId: member.id,
                                      payload: {
                                        role:
                                          memberDrafts[member.id] ??
                                          member.role,
                                      },
                                    },
                                    {
                                      onSuccess: () =>
                                        notifySuccess("Role updated"),
                                    },
                                  )
                                }
                              >
                                Save role
                              </Button>
                              <Button
                                type="button"
                                variant="danger-outline"
                                aria-label={`Remove member ${member.userId}`}
                                disabled={deleteMemberMutation.isPending}
                                onClick={() =>
                                  selectedOrganizationId &&
                                  deleteMemberMutation.mutate(
                                    {
                                      organizationId: selectedOrganizationId,
                                      memberId: member.id,
                                    },
                                    {
                                      onSuccess: () =>
                                        notifySuccess("Member removed"),
                                    },
                                  )
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          ),
                        )}
                      </div>
                      <div className="grid gap-3 rounded-xl bg-muted/50 p-4 md:grid-cols-[1.6fr_0.8fr_auto] md:items-start">
                        <label className="space-y-2">
                          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                            User UUID
                            <RequiredMark />
                          </span>
                          <Input
                            aria-required="true"
                            aria-invalid={
                              newMemberValidation.fieldError("userId")
                                ? "true"
                                : "false"
                            }
                            placeholder="User UUID"
                            value={newMemberUserId}
                            onChange={(event) =>
                              setNewMemberUserId(event.target.value)
                            }
                          />
                          <FieldError
                            message={newMemberValidation.fieldError("userId")}
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                            Role
                          </span>
                          <Select
                            value={newMemberRole}
                            onChange={(event) =>
                              setNewMemberRole(
                                event.target.value as
                                  "owner" | "admin" | "member",
                              )
                            }
                          >
                            <option value="owner">owner</option>
                            <option value="admin">admin</option>
                            <option value="member">member</option>
                          </Select>
                        </label>
                        <div className="space-y-2">
                          <span
                            aria-hidden="true"
                            className="block text-xs uppercase tracking-[0.24em] text-transparent"
                          >
                            {" "}
                          </span>
                          <Button
                            type="button"
                            disabled={
                              !newMemberValidation.isValid ||
                              createMemberMutation.isPending
                            }
                            onClick={() =>
                              selectedOrganizationId &&
                              createMemberMutation.mutate(
                                {
                                  organizationId: selectedOrganizationId,
                                  payload: {
                                    userId: newMemberUserId,
                                    role: newMemberRole,
                                  },
                                },
                                {
                                  onSuccess: () =>
                                    notifySuccess("Member added"),
                                },
                              )
                            }
                          >
                            Add member
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </section>
                </TabsContent>

                <TabsContent value="rules">
                  {selectedOrganizationId ? (
                    <section className="grid gap-6 xl:grid-cols-2">
                      <OrganizationRuleSettingsCard
                        organizationId={selectedOrganizationId}
                      />
                      <OrganizationRetentionSettingsCard
                        organizationId={selectedOrganizationId}
                      />
                    </section>
                  ) : null}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </PageShell>
      <SuccessModal
        state={successModal}
        onOpenChange={(open) => !open && setSuccessModal(null)}
      />
      <Dialog open={createOrgDialogOpen} onOpenChange={setCreateOrgDialogOpen}>
        <DialogContent>
          <DialogClose className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <h2 className="text-lg font-semibold">New organization</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Link another GitHub organization to DevLens.
          </p>
          {createOrganizationMutation.isError ? (
            <div className="mt-4">
              <ErrorState
                title="Could not create organization"
                message={getErrorMessage(createOrganizationMutation.error)}
              />
            </div>
          ) : null}
          <div className="mt-4 space-y-3">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                GitHub id
                <RequiredMark />
              </span>
              <Input
                aria-required="true"
                aria-invalid={
                  createOrganizationValidation.fieldError("githubId")
                    ? "true"
                    : "false"
                }
                placeholder="GitHub id"
                value={createOrganizationForm.githubId}
                onChange={(event) =>
                  setCreateOrganizationForm((current) => ({
                    ...current,
                    githubId: event.target.value,
                  }))
                }
              />
              <FieldError
                message={createOrganizationValidation.fieldError("githubId")}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Slug
                <RequiredMark />
              </span>
              <Input
                aria-required="true"
                aria-invalid={
                  createOrganizationValidation.fieldError("slug")
                    ? "true"
                    : "false"
                }
                placeholder="slug"
                value={createOrganizationForm.slug}
                onChange={(event) =>
                  setCreateOrganizationForm((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
              />
              <FieldError
                message={createOrganizationValidation.fieldError("slug")}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Name
                <RequiredMark />
              </span>
              <Input
                aria-required="true"
                aria-invalid={
                  createOrganizationValidation.fieldError("name")
                    ? "true"
                    : "false"
                }
                placeholder="name"
                value={createOrganizationForm.name}
                onChange={(event) =>
                  setCreateOrganizationForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <FieldError
                message={createOrganizationValidation.fieldError("name")}
              />
            </label>
          </div>
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={
              !createOrganizationValidation.isValid ||
              createOrganizationMutation.isPending
            }
            onClick={() =>
              createOrganizationMutation.mutate(
                {
                  githubId: Number(createOrganizationForm.githubId),
                  slug: createOrganizationForm.slug,
                  name: createOrganizationForm.name,
                },
                {
                  onSuccess: () => {
                    notifySuccess(
                      "Organization created",
                      `${createOrganizationForm.name} is ready to use.`,
                    );
                    setCreateOrgDialogOpen(false);
                    setCreateOrganizationForm({
                      githubId: "",
                      slug: "",
                      name: "",
                    });
                  },
                },
              )
            }
          >
            {createOrganizationMutation.isPending
              ? "Creating..."
              : "Create organization"}
          </Button>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
