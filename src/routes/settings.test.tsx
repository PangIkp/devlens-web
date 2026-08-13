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

function createSettingsFetchStub() {
  return vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";

    if (url.pathname === "/api/v1/organizations" && method === "GET") {
      return Promise.resolve(
        jsonResponse(200, {
          data: [
            {
              id: organizationId,
              githubId: 1,
              slug: "devlens",
              name: "DevLens Labs",
              createdAt: "2026-08-10T10:00:00Z",
            },
          ],
          pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
        }),
      );
    }

    if (url.pathname === `/api/v1/organizations/${organizationId}` && method === "GET") {
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

    if (url.pathname === `/api/v1/organizations/${organizationId}/members` && method === "GET") {
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

    if (url.pathname === `/api/v1/organizations/${organizationId}/github/connection`) {
      return Promise.resolve(
        jsonResponse(200, {
          data: {
            organizationId,
            provider: "github",
            state: "connected",
            connectedRepositories: 1,
            accountLogin: "devlens-labs",
            lastSyncedAt: "2026-08-12T00:00:00Z",
          },
        }),
      );
    }

    if (url.pathname === `/api/v1/organizations/${organizationId}/github/installations/start`) {
      return Promise.resolve(
        jsonResponse(200, {
          data: {
            installUrl: "https://github.com/apps/devlens/installations/new",
            state: "opaque-state",
          },
        }),
      );
    }

    if (url.pathname === `/api/v1/organizations/${organizationId}/github/installations/callback`) {
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

    if (url.pathname === `/api/v1/organizations/${organizationId}/github/repositories`) {
      return Promise.resolve(
        jsonResponse(200, {
          data: [
            {
              githubRepositoryId: 1001,
              fullName: "devlens-labs/devlens-api",
              private: true,
              defaultBranch: "main",
              installationStatus: "accessible",
              selectionStatus: "selected",
            },
          ],
          pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
        }),
      );
    }

    if (url.pathname === `/api/v1/organizations/${organizationId}/github/repositories/select`) {
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

    if (url.pathname === `/api/v1/organizations/${organizationId}/repositories`) {
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
              isActive: true,
              archivedAt: null,
              lastSyncedAt: "2026-08-12T00:00:00Z",
              createdAt: "2026-08-10T10:00:00Z",
              updatedAt: "2026-08-12T00:00:00Z",
            },
          ],
          pagination: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
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

    if (url.pathname === `/api/v1/repositories/${repositoryId}/sync` && method === "POST") {
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

    if (url.pathname === `/api/v1/organizations/${organizationId}/members` && method === "POST") {
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

    if (url.pathname === `/api/v1/organizations/${organizationId}/members/${memberId}` && method === "PATCH") {
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

    return Promise.reject(new Error(`Unhandled URL: ${url.toString()} (${method})`));
  });
}

describe("settings route", () => {
  it("renders settings data and triggers backend actions", async () => {
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/settings");

    expect(await screen.findByText("Connection, onboarding, and organization settings")).toBeInTheDocument();
    expect(screen.getByText("DevLens Labs")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Retry sync job" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Connect selected repositories" }));
    await user.click(screen.getByRole("button", { name: "Retry sync job" }));
    await user.type(screen.getByPlaceholderText("User UUID"), userId);
    await user.click(screen.getByRole("button", { name: "Add member" }));

    const requestedUrls = fetchStub.mock.calls.map(([input]) => String(input));
    expect(requestedUrls.some((url) => url.includes(`/github/repositories/select`))).toBe(true);
    expect(requestedUrls.some((url) => url.includes(`/sync-jobs/${syncJobId}/retry`))).toBe(true);
    expect(requestedUrls.some((url) => url.includes(`/organizations/${organizationId}/members`))).toBe(true);
  });

  it("handles installation callback search params", async () => {
    const fetchStub = createSettingsFetchStub();
    vi.stubGlobal("fetch", fetchStub);

    renderApp(`/settings?organizationId=${organizationId}&installation_id=999&setup_action=install`);

    expect(await screen.findByText("GitHub connection")).toBeInTheDocument();
    expect(
      fetchStub.mock.calls.some(([input]) => String(input).includes(`/organizations/${organizationId}/github/installations/callback?installation_id=999&setup_action=install`)),
    ).toBe(true);
  });
});
