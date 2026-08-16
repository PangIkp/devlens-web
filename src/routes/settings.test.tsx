import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/render-app";

const organizationId = "11111111-1111-4111-8111-111111111111";
const repositoryId = "22222222-2222-4222-8222-222222222222";
const syncJobId = "33333333-3333-4333-8333-333333333333";
const memberId = "44444444-4444-4444-8444-444444444444";
const userId = "55555555-5555-4555-8555-555555555555";

function jsonResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body ? JSON.stringify(body) : ""),
  };
}

function ruleSettingsBody() {
  return {
    data: {
      largePR: {
        enabled: true,
        filesThreshold: 25,
        totalChangesThreshold: 800,
      },
      slowReview: { enabled: true, waitHoursThreshold: 24 },
      hotspot: { enabled: false, scoreThreshold: 150 },
      deploymentFailure: {
        enabled: true,
        minimumDeployments: 3,
        failureRateThreshold: 0.3,
      },
      reviewConcentration: {
        enabled: true,
        minimumReviewCount: 5,
        shareThreshold: 0.6,
      },
      bottleneck: {
        enabled: true,
        minimumMergedCount: 3,
        averageCycleHoursThreshold: 72,
        staleOpenCountThreshold: 3,
        staleOpenAgeDays: 7,
      },
      metrics: {
        defaultDayType: "calendar",
        hotspotCommitWeight: 1,
        hotspotAdditionsWeight: 1,
        hotspotDeletionsWeight: 1,
      },
      updatedAt: "2026-08-13T00:00:00Z",
    },
  };
}

function retentionSettingsBody(analyticsRawRetentionDays = 45) {
  return {
    data: {
      analyticsRawRetentionDays,
      enforced: false,
      updatedAt: "2026-08-13T00:00:00Z",
    },
  };
}

function createSettingsFetchStub(options?: {
  connectionState?:
    | "not_connected"
    | "installation_required"
    | "connected"
    | "syncing"
    | "sync_failed";
  accessibleSelectionStatus?:
    "not_selected" | "selected" | "syncing" | "sync_failed" | "synced";
  accessibleInstallationStatus?: "accessible" | "not_installed" | "suspended";
  createSyncResponse?: { status: number; body: unknown };
  callbackStatus?: number;
  accessibleTwoPages?: boolean;
  repositoryIsActive?: boolean;
}) {
  let organizationDeleted = false;
  let repositoryIsActive = options?.repositoryIsActive ?? true;

  return vi
    .fn()
    .mockImplementation((input: string | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";

      if (url.pathname === "/api/v1/organizations" && method === "POST") {
        return Promise.resolve(
          jsonResponse(201, {
            data: {
              id: "88888888-8888-4888-8888-888888888888",
              githubId: 2,
              slug: "new-org",
              name: "New Org",
              createdAt: "2026-08-13T00:00:00Z",
            },
          }),
        );
      }

      if (
        url.pathname === `/api/v1/organizations/${organizationId}` &&
        method === "DELETE"
      ) {
        organizationDeleted = true;
        return Promise.resolve(jsonResponse(204));
      }

      if (url.pathname === "/api/v1/organizations" && method === "GET") {
        return Promise.resolve(
          jsonResponse(200, {
            data: organizationDeleted
              ? []
              : [
                  {
                    id: organizationId,
                    githubId: 1,
                    slug: "devlens",
                    name: "DevLens Labs",
                    createdAt: "2026-08-10T10:00:00Z",
                  },
                ],
            pagination: organizationDeleted
              ? { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }
              : { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
          }),
        );
      }

      if (
        url.pathname === `/api/v1/organizations/${organizationId}` &&
        method === "GET"
      ) {
        return Promise.resolve(
          jsonResponse(200, {
            data: {
              id: organizationId,
              githubId: 1,
              slug: "devlens",
              name: "DevLens Labs",
              createdAt: "2026-08-10T10:00:00Z",
              updatedAt: "2026-08-12T00:00:00Z",
            },
          }),
        );
      }

      if (
        url.pathname === `/api/v1/organizations/${organizationId}/members` &&
        method === "GET"
      ) {
        return Promise.resolve(
          jsonResponse(200, {
            data: [
              {
                id: memberId,
                organizationId,
                userId,
                role: "owner",
              },
            ],
          }),
        );
      }

      if (
        url.pathname ===
        `/api/v1/organizations/${organizationId}/github/connection`
      ) {
        return Promise.resolve(
          jsonResponse(200, {
            data: {
              organizationId,
              provider: "github",
              state: options?.connectionState ?? "connected",
              connectedRepositories: 1,
              accountLogin: "devlens-labs",
              lastSyncedAt: "2026-08-12T00:00:00Z",
            },
          }),
        );
      }

      if (
        url.pathname ===
        `/api/v1/organizations/${organizationId}/github/installations/start`
      ) {
        return Promise.resolve(
          jsonResponse(200, {
            data: {
              installUrl: "https://github.com/apps/devlens/installations/new",
              state: "opaque-state",
            },
          }),
        );
      }

      if (
        url.pathname ===
        `/api/v1/organizations/${organizationId}/github/installations/callback`
      ) {
        if (options?.callbackStatus && options.callbackStatus >= 400) {
          return Promise.resolve(
            jsonResponse(options.callbackStatus, {
              error: {
                code: "VALIDATION_ERROR",
                message: "request validation failed",
              },
            }),
          );
        }

        return Promise.resolve(
          jsonResponse(200, {
            data: {
              organizationId,
              provider: "github",
              state: "connected",
              connectedRepositories: 1,
            },
          }),
        );
      }

      if (
        url.pathname ===
        `/api/v1/organizations/${organizationId}/github/repositories`
      ) {
        if (options?.accessibleTwoPages) {
          const page = Number(url.searchParams.get("page") ?? "1");
          const data =
            page === 2
              ? [
                  {
                    githubRepositoryId: 2002,
                    fullName: "devlens-labs/page-two-repo",
                    private: true,
                    defaultBranch: "main",
                    installationStatus: "accessible",
                    selectionStatus: "not_selected",
                  },
                ]
              : [
                  {
                    githubRepositoryId: 2001,
                    fullName: "devlens-labs/page-one-repo",
                    private: true,
                    defaultBranch: "main",
                    installationStatus: "accessible",
                    selectionStatus: "not_selected",
                  },
                ];
          return Promise.resolve(
            jsonResponse(200, {
              data,
              pagination: {
                page,
                pageSize: 1,
                totalItems: 2,
                totalPages: 2,
              },
            }),
          );
        }

        return Promise.resolve(
          jsonResponse(200, {
            data: [
              {
                githubRepositoryId: 1001,
                fullName: "devlens-labs/devlens-api",
                private: true,
                defaultBranch: "main",
                installationStatus:
                  options?.accessibleInstallationStatus ?? "accessible",
                selectionStatus:
                  options?.accessibleSelectionStatus ?? "selected",
              },
            ],
            pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
          }),
        );
      }

      if (
        url.pathname ===
        `/api/v1/organizations/${organizationId}/github/repositories/select`
      ) {
        return Promise.resolve(
          jsonResponse(202, {
            data: {
              state: "syncing",
              selectedRepositoryIds: [1001],
              createdRepositoryIds: [repositoryId],
              syncJobIds: [syncJobId],
            },
          }),
        );
      }

      if (
        url.pathname === `/api/v1/organizations/${organizationId}/repositories`
      ) {
        return Promise.resolve(
          jsonResponse(200, {
            data: [
              {
                id: repositoryId,
                organizationId,
                githubId: 1001,
                name: "devlens-api",
                fullName: "devlens-labs/devlens-api",
                defaultBranch: "main",
                isActive: repositoryIsActive,
                archivedAt: null,
                lastSyncedAt: "2026-08-12T00:00:00Z",
                createdAt: "2026-08-10T10:00:00Z",
                updatedAt: "2026-08-12T00:00:00Z",
              },
            ],
            pagination: {
              page: 1,
              pageSize: 100,
              totalItems: 1,
              totalPages: 1,
            },
          }),
        );
      }

      if (
        url.pathname === `/api/v1/repositories/${repositoryId}` &&
        method === "PATCH"
      ) {
        const body = init?.body ? (JSON.parse(init.body as string) as { isActive?: boolean }) : {};
        if (typeof body.isActive === "boolean") {
          repositoryIsActive = body.isActive;
        }
        return Promise.resolve(
          jsonResponse(200, {
            data: {
              id: repositoryId,
              organizationId,
              githubId: 1001,
              name: "devlens-api",
              fullName: "devlens-labs/devlens-api",
              defaultBranch: "main",
              isActive: repositoryIsActive,
              archivedAt: null,
              lastSyncedAt: "2026-08-12T00:00:00Z",
              createdAt: "2026-08-10T10:00:00Z",
              updatedAt: "2026-08-12T00:00:00Z",
            },
          }),
        );
      }

      if (url.pathname === `/api/v1/repositories/${repositoryId}/sync-jobs`) {
        return Promise.resolve(
          jsonResponse(200, {
            data: [
              {
                id: syncJobId,
                repositoryId,
                status: "failed",
                progress: 80,
                createdAt: "2026-08-12T00:00:00Z",
              },
            ],
            meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
          }),
        );
      }

      if (url.pathname === `/api/v1/sync-jobs/${syncJobId}`) {
        return Promise.resolve(
          jsonResponse(200, {
            data: {
              id: syncJobId,
              repositoryId,
              status: "failed",
              progress: 80,
              errorMessage: "Rate limit reached",
              createdAt: "2026-08-12T00:00:00Z",
            },
          }),
        );
      }

      if (
        url.pathname === `/api/v1/repositories/${repositoryId}/sync` &&
        method === "POST"
      ) {
        if (options?.createSyncResponse) {
          return Promise.resolve(
            jsonResponse(
              options.createSyncResponse.status,
              options.createSyncResponse.body,
            ),
          );
        }

        return Promise.resolve(
          jsonResponse(202, {
            data: {
              id: "66666666-6666-4666-8666-666666666666",
              repositoryId,
              status: "pending",
              progress: 0,
              createdAt: "2026-08-12T00:00:00Z",
            },
          }),
        );
      }

      if (url.pathname === `/api/v1/sync-jobs/${syncJobId}/retry`) {
        return Promise.resolve(
          jsonResponse(202, {
            data: {
              id: syncJobId,
              repositoryId,
              status: "pending",
              progress: 0,
              createdAt: "2026-08-12T00:00:00Z",
            },
          }),
        );
      }

      if (url.pathname === "/api/v1/me") {
        return Promise.resolve(
          jsonResponse(200, {
            data: {
              id: userId,
              email: "itsara@example.com",
              name: "Itsara",
              createdAt: "2026-08-10T10:00:00Z",
            },
          }),
        );
      }

      if (
        url.pathname === `/api/v1/organizations/${organizationId}/members` &&
        method === "POST"
      ) {
        return Promise.resolve(
          jsonResponse(201, {
            data: {
              id: "77777777-7777-4777-8777-777777777777",
              organizationId,
              userId,
              role: "member",
            },
          }),
        );
      }

      if (
        url.pathname ===
          `/api/v1/organizations/${organizationId}/members/${memberId}` &&
        method === "PATCH"
      ) {
        return Promise.resolve(
          jsonResponse(200, {
            data: {
              id: memberId,
              organizationId,
              userId,
              role: "admin",
            },
          }),
        );
      }

      if (
        url.pathname ===
          `/api/v1/organizations/${organizationId}/members/${memberId}` &&
        method === "DELETE"
      ) {
        return Promise.resolve(jsonResponse(204, {}));
      }

      if (
        url.pathname ===
          `/api/v1/organizations/${organizationId}/github/connection` &&
        method === "DELETE"
      ) {
        return Promise.resolve(
          jsonResponse(200, {
            data: {
              organizationId,
              provider: "github",
              state: "not_connected",
              connectedRepositories: 0,
            },
          }),
        );
      }

      if (
        url.pathname ===
        `/api/v1/organizations/${organizationId}/settings/rules`
      ) {
        if (method === "PUT") {
          return Promise.resolve(jsonResponse(200, ruleSettingsBody()));
        }

        return Promise.resolve(jsonResponse(200, ruleSettingsBody()));
      }

      if (
        url.pathname ===
        `/api/v1/organizations/${organizationId}/settings/retention`
      ) {
        if (method === "PUT") {
          return Promise.resolve(jsonResponse(200, retentionSettingsBody(60)));
        }

        return Promise.resolve(jsonResponse(200, retentionSettingsBody()));
      }

      return Promise.reject(
        new Error(`Unhandled URL: ${url.toString()} (${method})`),
      );
    });
}

describe("settings route", () => {
  it("renders settings data and triggers backend actions", async () => {
    const fetchStub = createSettingsFetchStub({
      accessibleSelectionStatus: "not_selected",
    });
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    expect(await screen.findByText("Organization profile")).toBeInTheDocument();
    expect(screen.getByText("DevLens Labs")).toBeInTheDocument();

    await user.click(await screen.findByRole("tab", { name: "GitHub" }));
    await user.click(await screen.findByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: "Connect selected repositories" }),
    );
    expect(
      await screen.findByText("Repositories connected"),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(await screen.findByRole("tab", { name: "Sync" }));
    expect(
      await screen.findByRole("button", { name: "Retry sync job" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry sync job" }));
    expect(await screen.findByText("Sync job retried")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(await screen.findByRole("tab", { name: "Members" }));
    await user.type(screen.getByPlaceholderText("User UUID"), userId);
    await user.click(screen.getByRole("button", { name: "Add member" }));
    expect(await screen.findByText("Member added")).toBeInTheDocument();

    const requestedUrls = fetchStub.mock.calls.map(([input]) => String(input));
    expect(
      requestedUrls.some((url) => url.includes(`/github/repositories/select`)),
    ).toBe(true);
    expect(
      requestedUrls.some((url) =>
        url.includes(`/sync-jobs/${syncJobId}/retry`),
      ),
    ).toBe(true);
    expect(
      requestedUrls.some((url) =>
        url.includes(`/organizations/${organizationId}/members`),
      ),
    ).toBe(true);
  }, 15000);

  it("deactivates an already-connected accessible repository after confirming", async () => {
    const fetchStub = createSettingsFetchStub({
      accessibleSelectionStatus: "selected",
    });
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    await user.click(await screen.findByRole("tab", { name: "GitHub" }));
    expect(await screen.findByText("devlens-labs/devlens-api")).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox", {
      name: "Connected: devlens-labs/devlens-api",
    });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(
      await screen.findByText("Deactivate devlens-labs/devlens-api?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(await screen.findByText("Repository deactivated")).toBeInTheDocument();

    const patchCall = fetchStub.mock.calls.find(([input], index) => {
      const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
      return (
        String(input).endsWith(`/repositories/${repositoryId}`) &&
        init?.method === "PATCH"
      );
    });
    expect(patchCall).toBeDefined();
    const body = JSON.parse(
      (patchCall?.[1] as RequestInit).body as string,
    ) as { isActive: boolean };
    expect(body).toEqual({ isActive: false });
  });

  it("handles installation callback search params, including the required state token", async () => {
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);

    renderApp(
      `/settings?organizationId=${organizationId}&installation_id=999&state=opaque-state-token&setup_action=install`,
    );

    expect(await screen.findByText("GitHub connection")).toBeInTheDocument();
    expect(
      fetchStub.mock.calls.some(([input]) => {
        const url = String(input);
        return (
          url.includes(
            `/organizations/${organizationId}/github/installations/callback`,
          ) &&
          url.includes("installation_id=999") &&
          url.includes("state=opaque-state-token") &&
          url.includes("setup_action=install")
        );
      }),
    ).toBe(true);
  });

  it("does not call the callback endpoint when the state token is missing", async () => {
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);

    renderApp(
      `/settings?organizationId=${organizationId}&installation_id=999&setup_action=install`,
    );

    expect(await screen.findByText("GitHub connection")).toBeInTheDocument();
    expect(
      fetchStub.mock.calls.some(([input]) =>
        String(input).includes("/github/installations/callback"),
      ),
    ).toBe(false);
  });

  it("shows an error and allows retry when the installation callback fails", async () => {
    const fetchStub = createSettingsFetchStub({ callbackStatus: 400 });
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp(
      `/settings?organizationId=${organizationId}&installation_id=999&state=opaque-state-token&setup_action=install`,
    );

    expect(
      await screen.findByText(
        "Could not complete GitHub installation callback",
      ),
    ).toBeInTheDocument();

    const callbackCallsBefore = fetchStub.mock.calls.filter(([input]) =>
      String(input).includes("/github/installations/callback"),
    ).length;

    await user.click(screen.getByRole("button", { name: "Retry" }));

    const callbackCallsAfter = fetchStub.mock.calls.filter(([input]) =>
      String(input).includes("/github/installations/callback"),
    ).length;

    expect(callbackCallsAfter).toBeGreaterThan(callbackCallsBefore);
  });

  it("disconnects GitHub after a confirmation step", async () => {
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    await user.click(await screen.findByRole("tab", { name: "GitHub" }));
    expect(await screen.findByText("GitHub connection")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Disconnect GitHub" }));
    expect(
      fetchStub.mock.calls.some(([input], index) => {
        const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
        return (
          String(input).includes("/github/connection") &&
          init?.method === "DELETE"
        );
      }),
    ).toBe(false);

    expect(await screen.findByText("Disconnect GitHub?")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Disconnect" }),
    );

    expect(
      fetchStub.mock.calls.some(([input], index) => {
        const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
        return (
          String(input).includes(
            `/organizations/${organizationId}/github/connection`,
          ) && init?.method === "DELETE"
        );
      }),
    ).toBe(true);
  });

  it("creates a new organization through the New organization dialog", async () => {
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    expect(await screen.findByText("Organization profile")).toBeInTheDocument();
    expect(
      screen.queryByText("Link another GitHub organization to DevLens."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New organization" }));
    expect(
      await screen.findByText("Link another GitHub organization to DevLens."),
    ).toBeInTheDocument();

    const createButton = screen.getByRole("button", {
      name: "Create organization",
    });
    expect(createButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("GitHub id"), "2");
    await user.type(screen.getByPlaceholderText("slug"), "new-org");
    await user.type(screen.getByPlaceholderText("name"), "New Org");
    expect(createButton).toBeEnabled();

    await user.click(createButton);

    expect(await screen.findByText("Organization created")).toBeInTheDocument();
    expect(
      screen.queryByText("Link another GitHub organization to DevLens."),
    ).not.toBeInTheDocument();
    expect(
      fetchStub.mock.calls.some(([input], index) => {
        const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
        return (
          String(input).endsWith("/api/v1/organizations") &&
          init?.method === "POST"
        );
      }),
    ).toBe(true);
  });

  it("deletes an organization after a confirmation step", async () => {
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    const { router } = renderApp("/settings");

    expect(await screen.findByText("Organization profile")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Delete organization" }),
    );
    expect(
      fetchStub.mock.calls.some(([input], index) => {
        const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
        return (
          String(input).includes(`/organizations/${organizationId}`) &&
          init?.method === "DELETE"
        );
      }),
    ).toBe(false);

    expect(
      await screen.findByText("Delete this organization?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Organization deleted")).toBeInTheDocument();
    expect(
      fetchStub.mock.calls.some(([input], index) => {
        const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
        return (
          String(input).includes(`/organizations/${organizationId}`) &&
          init?.method === "DELETE"
        );
      }),
    ).toBe(true);

    // Regression: after deleting the currently selected organization, its id
    // must be cleared from the URL — otherwise the page keeps pointing at a
    // now-deleted organization instead of falling back to another one.
    expect(router.state.location.search.organizationId).toBeUndefined();
    expect(
      await screen.findByText("Create your first organization"),
    ).toBeInTheDocument();
  });

  it("saves rule settings with the full section payload", async () => {
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    await user.click(
      await screen.findByRole("tab", { name: "Rules & retention" }),
    );
    expect(
      await screen.findByText("Insight & metric rules"),
    ).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", { name: "Save rule settings" }),
    );

    const rulesPutCall = fetchStub.mock.calls.find(([input], index) => {
      const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
      return (
        String(input).includes(
          `/organizations/${organizationId}/settings/rules`,
        ) && init?.method === "PUT"
      );
    });

    expect(rulesPutCall).toBeDefined();
    const body = JSON.parse(
      (rulesPutCall?.[1] as RequestInit).body as string,
    ) as {
      largePR: unknown;
      metrics: { defaultDayType: string };
    };
    expect(body.largePR).toEqual({
      enabled: true,
      filesThreshold: 25,
      totalChangesThreshold: 800,
    });
    expect(body.metrics.defaultDayType).toBe("calendar");
  });

  it("saves retention settings", async () => {
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    await user.click(
      await screen.findByRole("tab", { name: "Rules & retention" }),
    );
    expect(await screen.findByText("Data retention")).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", { name: "Save retention settings" }),
    );

    const retentionPutCall = fetchStub.mock.calls.find(([input], index) => {
      const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
      return (
        String(input).includes(
          `/organizations/${organizationId}/settings/retention`,
        ) && init?.method === "PUT"
      );
    });

    expect(retentionPutCall).toBeDefined();
    expect(
      JSON.parse((retentionPutCall?.[1] as RequestInit).body as string),
    ).toEqual({
      analyticsRawRetentionDays: 45,
    });
  });

  it("keeps a manually checked repository selected after paginating to another page", async () => {
    const fetchStub = createSettingsFetchStub({ accessibleTwoPages: true });
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    await user.click(await screen.findByRole("tab", { name: "GitHub" }));
    expect(
      await screen.findByText("devlens-labs/page-one-repo"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox"));

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(
      await screen.findByText("devlens-labs/page-two-repo"),
    ).toBeInTheDocument();
    // Wait for the page-2 query to fully settle (and the merge effect to run
    // against it) before proceeding, so the click below reflects the final
    // post-pagination selection state rather than racing it.
    expect(
      await screen.findByText(
        "1 accessible repositories selected for connection.",
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Connect selected repositories" }),
    );
    expect(
      await screen.findByText("Repositories connected"),
    ).toBeInTheDocument();

    const selectCall = fetchStub.mock.calls.find(([input], index) => {
      const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
      return (
        String(input).includes("/github/repositories/select") &&
        init?.method === "POST"
      );
    });
    expect(selectCall).toBeDefined();
    const body = JSON.parse(
      (selectCall?.[1] as RequestInit).body as string,
    ) as { repositoryIds: number[] };
    // Only the repo checked on page 1 (2001) should be submitted — page 2's
    // repo (2002) was never checked, and page 1's pick must survive
    // navigating to page 2 rather than being silently dropped.
    expect(body.repositoryIds).toEqual([2001]);
  });

  it("blocks sync when repository onboarding is incomplete", async () => {
    const fetchStub = createSettingsFetchStub({
      accessibleSelectionStatus: "not_selected",
      createSyncResponse: {
        status: 409,
        body: {
          error: {
            code: "REPOSITORY_ONBOARDING_REQUIRED",
            message:
              "Repository must be selected from the GitHub installation before syncing",
            requestId: "req-409",
          },
        },
      },
    });
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    await user.click(await screen.findByRole("tab", { name: "Sync" }));
    expect(
      await screen.findByText("Managed repository sync"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Repository selection is required before sync"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start incremental sync" }),
    ).toBeDisabled();
    expect(
      fetchStub.mock.calls.some((call) => {
        const [input, requestInit] = call as [
          string | URL,
          RequestInit | undefined,
        ];
        const url = new URL(String(input));
        return (
          url.pathname === `/api/v1/repositories/${repositoryId}/sync` &&
          (requestInit?.method ?? "GET") === "POST"
        );
      }),
    ).toBe(false);
  });

  it("blocks sync and offers reactivation when the selected repository is deactivated", async () => {
    const fetchStub = createSettingsFetchStub({ repositoryIsActive: false });
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    await user.click(await screen.findByRole("tab", { name: "Sync" }));
    expect(await screen.findByText("Managed repository sync")).toBeInTheDocument();
    expect(await screen.findByText("This repository is deactivated")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start incremental sync" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Start full sync" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Reactivate repository" }));
    expect(await screen.findByText("Repository reactivated")).toBeInTheDocument();

    const patchCall = fetchStub.mock.calls.find(([input], index) => {
      const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
      return (
        String(input).endsWith(`/repositories/${repositoryId}`) &&
        init?.method === "PATCH"
      );
    });
    expect(patchCall).toBeDefined();
    const body = JSON.parse(
      (patchCall?.[1] as RequestInit).body as string,
    ) as { isActive: boolean };
    expect(body).toEqual({ isActive: true });
  });

  it("removes a member only after confirming", async () => {
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    await user.click(await screen.findByRole("tab", { name: "Members" }));
    expect(await screen.findByText("Organization members")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: `Remove member ${userId}` }));
    expect(await screen.findByText(`Remove ${userId}?`)).toBeInTheDocument();

    const deleteCallsBeforeConfirm = fetchStub.mock.calls.filter(([input], index) => {
      const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
      return (
        String(input).endsWith(`/members/${memberId}`) &&
        init?.method === "DELETE"
      );
    });
    expect(deleteCallsBeforeConfirm).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(await screen.findByText("Member removed")).toBeInTheDocument();

    const deleteCallsAfterConfirm = fetchStub.mock.calls.filter(([input], index) => {
      const init = fetchStub.mock.calls[index][1] as RequestInit | undefined;
      return (
        String(input).endsWith(`/members/${memberId}`) &&
        init?.method === "DELETE"
      );
    });
    expect(deleteCallsAfterConfirm).toHaveLength(1);
  });

  it("marks the member UUID field as required and keeps Add member disabled until it is valid", async () => {
    // Typing re-renders the whole settings page (now with tooltips/dialogs on
    // every card), which is slower under jsdom than the default 5s budget.
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    await user.click(await screen.findByRole("tab", { name: "Members" }));
    expect(await screen.findByText("Organization members")).toBeInTheDocument();
    expect(screen.getByText("User UUID").parentElement).toHaveTextContent(
      "User UUID*",
    );

    const addMemberButton = screen.getByRole("button", { name: "Add member" });
    expect(addMemberButton).toBeDisabled();

    const userIdInput = screen.getByPlaceholderText("User UUID");
    await user.type(userIdInput, "not-a-uuid");
    expect(await screen.findByText("Must be a valid UUID")).toBeInTheDocument();
    expect(addMemberButton).toBeDisabled();

    await user.clear(userIdInput);
    await user.type(userIdInput, userId);
    expect(screen.queryByText("Must be a valid UUID")).not.toBeInTheDocument();
    expect(addMemberButton).toBeEnabled();
  }, 15000);

  it("does not request accessible repositories when opening the GitHub tab for an org with no installation", async () => {
    const fetchStub = createSettingsFetchStub({ connectionState: "not_connected" });
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    expect(await screen.findByText("Organization profile")).toBeInTheDocument();
    await user.click(await screen.findByRole("tab", { name: "GitHub" }));
    expect(await screen.findByText("Not Connected")).toBeInTheDocument();

    const requestedUrls = fetchStub.mock.calls.map(([input]) => String(input));
    expect(
      requestedUrls.some((url) => url.includes(`/github/repositories`) && !url.includes("/select")),
    ).toBe(false);
  });

  it("prompts to create the first organization when none exist yet", async () => {
    const fetchStub = vi.fn().mockImplementation((input: string | URL) => {
      const url = new URL(String(input));

      if (url.pathname === "/api/v1/organizations") {
        return Promise.resolve(
          jsonResponse(200, {
            data: [],
            pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
          }),
        );
      }

      return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
    });
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    expect(
      await screen.findByText("Create your first organization"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New organization" }));
    expect(
      await screen.findByText("Link another GitHub organization to DevLens."),
    ).toBeInTheDocument();
  });

  it("does not leak a previous organization's accessible repositories into one with no GitHub installation", async () => {
    const connectedOrgId = "66666666-6666-4666-8666-666666666666";
    const disconnectedOrgId = "77777777-7777-4777-8777-777777777777";

    function orgResponse(id: string, name: string) {
      return { id, githubId: id === connectedOrgId ? 1 : 2, slug: name, name, createdAt: "2026-08-10T10:00:00Z" };
    }

    const fetchStub = vi.fn().mockImplementation((input: string | URL) => {
      const url = new URL(String(input));
      const match = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)(\/.*)?$/);

      if (url.pathname === "/api/v1/organizations") {
        return Promise.resolve(
          jsonResponse(200, {
            data: [orgResponse(connectedOrgId, "Connected Org"), orgResponse(disconnectedOrgId, "Disconnected Org")],
            pagination: { page: 1, pageSize: 20, totalItems: 2, totalPages: 2 },
          }),
        );
      }

      if (match) {
        const [, orgId, rest = ""] = match;

        if (rest === "") {
          return Promise.resolve(jsonResponse(200, { data: orgResponse(orgId, orgId === connectedOrgId ? "Connected Org" : "Disconnected Org") }));
        }
        if (rest === "/members") {
          return Promise.resolve(jsonResponse(200, { data: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } }));
        }
        if (rest === "/repositories") {
          return Promise.resolve(jsonResponse(200, { data: [], pagination: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 } }));
        }
        if (rest === "/github/connection") {
          const state = orgId === connectedOrgId ? "connected" : "not_connected";
          return Promise.resolve(
            jsonResponse(200, {
              data: { organizationId: orgId, provider: "github", state, connectedRepositories: orgId === connectedOrgId ? 1 : 0 },
            }),
          );
        }
        if (rest === "/github/repositories") {
          if (orgId !== connectedOrgId) {
            // The disconnected org's query must stay disabled and never
            // reach the backend — if it does, the real API would 404 with
            // "GitHub installation not found" the same way it does live.
            return Promise.resolve(
              jsonResponse(404, { error: { code: "NOT_FOUND", message: "GitHub installation not found" } }),
            );
          }
          return Promise.resolve(
            jsonResponse(200, {
              data: [
                {
                  githubRepositoryId: 9001,
                  fullName: "connected-org/only-repo",
                  private: false,
                  installationStatus: "accessible",
                  selectionStatus: "not_selected",
                },
              ],
              pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
            }),
          );
        }
      }

      return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
    });
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp(`/settings?organizationId=${connectedOrgId}`);

    await user.click(await screen.findByRole("tab", { name: "GitHub" }));
    expect(await screen.findByText("connected-org/only-repo")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Settings organization"));
    await user.click(await screen.findByRole("option", { name: "Disconnected Org" }));

    expect(await screen.findByText("Not Connected")).toBeInTheDocument();
    expect(screen.queryByText("connected-org/only-repo")).not.toBeInTheDocument();
  });
});
