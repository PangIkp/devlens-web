import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/render-app";

const organizationId = "11111111-1111-4111-8111-111111111111";
const repositoryId = "22222222-2222-4222-8222-222222222222";
const repositoryIdPageTwo = "33333333-3333-4333-8333-333333333333";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

function createRepositoriesFetchStub(options?: {
  repositoriesPageOne?: unknown[];
  repositoriesPageTwo?: unknown[];
  repositoriesStatus?: number;
  detailStatus?: number;
}) {
  return vi.fn().mockImplementation((input: string | URL) => {
    const url = new URL(String(input));

    if (url.pathname === "/api/v1/organizations") {
      return Promise.resolve(
        jsonResponse(200, {
          data: [
            {
              id: organizationId,
              githubId: "1",
              name: "DevLens Labs",
              role: "owner",
              createdAt: "2026-08-10T10:00:00Z",
              updatedAt: "2026-08-10T10:00:00Z",
            },
          ],
          pagination: {
            page: 1,
            pageSize: 20,
            totalItems: 1,
            totalPages: 1,
          },
        }),
      );
    }

    if (url.pathname === `/api/v1/organizations/${organizationId}/repositories`) {
      const page = url.searchParams.get("page");
      const repositories =
        page === "2"
          ? (options?.repositoriesPageTwo ?? [
              {
                id: repositoryIdPageTwo,
                organizationId,
                githubId: 1002,
                name: "devlens-web",
                fullName: "devlens-labs/devlens-web",
                defaultBranch: "main",
                isActive: true,
                archivedAt: null,
                lastSyncedAt: "2026-08-11T01:00:00Z",
                createdAt: "2026-08-10T10:00:00Z",
                updatedAt: "2026-08-11T01:00:00Z",
              },
            ])
          : (options?.repositoriesPageOne ?? [
              {
                id: repositoryId,
                organizationId,
                githubId: 1001,
                name: "devlens-api",
                fullName: "devlens-labs/devlens-api",
                defaultBranch: "main",
                isActive: true,
                archivedAt: null,
                lastSyncedAt: "2026-08-11T00:00:00Z",
                createdAt: "2026-08-10T10:00:00Z",
                updatedAt: "2026-08-11T00:00:00Z",
              },
            ]);

      return Promise.resolve(
        jsonResponse(options?.repositoriesStatus ?? 200, {
          data: repositories,
          pagination: {
            page: Number(page ?? "1"),
            pageSize: 10,
            totalItems: 11,
            totalPages: 2,
          },
        }),
      );
    }

    if (url.pathname === `/api/v1/repositories/${repositoryId}`) {
      return Promise.resolve(
        jsonResponse(options?.detailStatus ?? 200, {
          data: {
            id: repositoryId,
            organizationId,
            githubId: 1001,
            name: "devlens-api",
            fullName: "devlens-labs/devlens-api",
            defaultBranch: "main",
            isActive: true,
            archivedAt: null,
            lastSyncedAt: "2026-08-11T00:00:00Z",
            createdAt: "2026-08-10T10:00:00Z",
            updatedAt: "2026-08-11T00:00:00Z",
          },
        }),
      );
    }

    return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
  });
}

describe("repositories routes", () => {
  it("renders repository list success state", async () => {
    vi.stubGlobal("fetch", createRepositoriesFetchStub());

    renderApp("/repositories");

    expect(await screen.findByText("devlens-api")).toBeInTheDocument();
    expect(screen.getByText("devlens-labs/devlens-api")).toBeInTheDocument();
    expect(screen.getByText("Active repository")).toBeInTheDocument();
  });

  it("renders loading state while repositories are pending", async () => {
    let resolveRepositories: ((value: unknown) => void) | undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: string | URL) => {
        const url = new URL(String(input));

        if (url.pathname === "/api/v1/organizations") {
          return Promise.resolve(
            jsonResponse(200, {
              data: [
                {
                  id: organizationId,
                  githubId: "1",
                  name: "DevLens Labs",
                  role: "owner",
                  createdAt: "2026-08-10T10:00:00Z",
                },
              ],
              pagination: {
                page: 1,
                pageSize: 20,
                totalItems: 1,
                totalPages: 1,
              },
            }),
          );
        }

        if (url.pathname === `/api/v1/organizations/${organizationId}/repositories`) {
          return new Promise((resolve) => {
            resolveRepositories = resolve;
          });
        }

        return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
      }),
    );

    renderApp("/repositories");

    expect(await screen.findByLabelText("Repositories loading")).toBeInTheDocument();
    await waitFor(() => expect(resolveRepositories).toBeDefined());

    resolveRepositories?.(
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
            lastSyncedAt: "2026-08-11T00:00:00Z",
            createdAt: "2026-08-10T10:00:00Z",
            updatedAt: "2026-08-11T00:00:00Z",
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
        },
      }),
    );

    expect(await screen.findByText("devlens-api")).toBeInTheDocument();
  });

  it("renders empty state when no repositories are returned", async () => {
    vi.stubGlobal(
      "fetch",
      createRepositoriesFetchStub({
        repositoriesPageOne: [],
      }),
    );

    renderApp("/repositories");

    expect(await screen.findByText("No repositories matched")).toBeInTheDocument();
  });

  it("renders API error state for repository list failures", async () => {
    vi.stubGlobal(
      "fetch",
      createRepositoriesFetchStub({
        repositoriesStatus: 500,
      }),
    );

    renderApp("/repositories");

    expect(await screen.findByText("Could not load repositories")).toBeInTheDocument();
    expect(screen.getByText("Request failed with status 500")).toBeInTheDocument();
  });

  it("supports pagination and moves to the next page", async () => {
    vi.stubGlobal("fetch", createRepositoriesFetchStub());
    const user = userEvent.setup();

    renderApp("/repositories");

    expect(await screen.findByText("devlens-api")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByText("devlens-web")).toBeInTheDocument();
    expect(screen.getByText("Page 2 / 2")).toBeInTheDocument();
  });

  it("navigates from repository list to repository detail", async () => {
    vi.stubGlobal("fetch", createRepositoriesFetchStub());
    const user = userEvent.setup();

    renderApp("/repositories");

    await user.click(await screen.findByRole("link", { name: "Open details" }));

    expect(await screen.findByText("Open on GitHub")).toBeInTheDocument();
    expect(screen.getByText(repositoryId)).toBeInTheDocument();
  });
});
