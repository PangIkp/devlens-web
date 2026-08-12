import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/render-app";
import { getDashboardDateRangeForPreset } from "@/features/dashboard/dashboard.utils";

const organizationId = "org-devlens";
const repositoryId = "repo-devlens-api";
const repositoryIdTwo = "repo-devlens-web";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

function createDashboardFetchStub(options?: {
  summaryStatus?: number;
  pullRequestStatus?: number;
  reviewStatus?: number;
  deploymentData?: unknown;
  hotspotData?: unknown[];
  hotspotMeta?: unknown;
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
      return Promise.resolve(
        jsonResponse(200, {
          data: [
            {
              id: repositoryId,
              organizationId,
              githubId: "1001",
              name: "devlens-api",
              fullName: "devlens-labs/devlens-api",
              defaultBranch: "main",
              isActive: true,
              archivedAt: null,
              lastSyncedAt: "2026-08-12T00:00:00Z",
              createdAt: "2026-08-10T10:00:00Z",
              updatedAt: "2026-08-12T00:00:00Z",
            },
            {
              id: repositoryIdTwo,
              organizationId,
              githubId: "1002",
              name: "devlens-web",
              fullName: "devlens-labs/devlens-web",
              defaultBranch: "main",
              isActive: true,
              archivedAt: null,
              lastSyncedAt: "2026-08-12T00:00:00Z",
              createdAt: "2026-08-10T10:00:00Z",
              updatedAt: "2026-08-12T00:00:00Z",
            },
          ],
          pagination: {
            page: 1,
            pageSize: 100,
            totalItems: 2,
            totalPages: 1,
          },
        }),
      );
    }

    if (url.pathname === `/api/v1/repositories/${repositoryId}/dashboard/summary` || url.pathname === `/api/v1/repositories/${repositoryIdTwo}/dashboard/summary`) {
      return Promise.resolve(
        jsonResponse(options?.summaryStatus ?? 200, {
          data: {
            repositoryId: url.pathname.includes(repositoryIdTwo) ? repositoryIdTwo : repositoryId,
            from: url.searchParams.get("from"),
            to: url.searchParams.get("to"),
            prCycleTimeMinutes: 120,
            reviewWaitMinutes: 45,
            deploymentFrequency: 2.5,
            changeFailureRate: 0.25,
            reviewCoverage: 0.8,
          },
        }),
      );
    }

    if (url.pathname === `/api/v1/repositories/${repositoryId}/metrics/pull-requests` || url.pathname === `/api/v1/repositories/${repositoryIdTwo}/metrics/pull-requests`) {
      return Promise.resolve(
        jsonResponse(options?.pullRequestStatus ?? 200, {
          data: {
            averageCycleTimeMinutes: 120,
            averageFilesChanged: 8,
            averageAdditions: 250,
            averageDeletions: 80,
            cycleTimeTrend: [
              { date: "2026-08-01", value: 100 },
              { date: "2026-08-02", value: 120 },
            ],
          },
        }),
      );
    }

    if (url.pathname === `/api/v1/repositories/${repositoryId}/metrics/reviews` || url.pathname === `/api/v1/repositories/${repositoryIdTwo}/metrics/reviews`) {
      return Promise.resolve(
        jsonResponse(options?.reviewStatus ?? 200, {
          data: {
            averageWaitMinutes: 30,
            averageReviewMinutes: 55,
            reviewCoverage: 0.7,
            waitTimeTrend: [
              { date: "2026-08-01", value: 25 },
              { date: "2026-08-02", value: 30 },
            ],
          },
        }),
      );
    }

    if (url.pathname === `/api/v1/repositories/${repositoryId}/metrics/deployments` || url.pathname === `/api/v1/repositories/${repositoryIdTwo}/metrics/deployments`) {
      return Promise.resolve(
        jsonResponse(200, {
          data:
            options?.deploymentData ?? {
              deploymentCount: 5,
              deploymentFrequency: 1.5,
              changeFailureRate: 0.1,
              deploymentTrend: [
                { date: "2026-08-01", value: 1 },
                { date: "2026-08-02", value: 2 },
              ],
            },
        }),
      );
    }

    if (url.pathname === `/api/v1/repositories/${repositoryId}/metrics/hotspots` || url.pathname === `/api/v1/repositories/${repositoryIdTwo}/metrics/hotspots`) {
      return Promise.resolve(
        jsonResponse(200, {
          data:
            options?.hotspotData ?? [
              {
                filePath: "internal/metrics/calculator.go",
                hotspotScore: 0.91,
                additions: 120,
                deletions: 40,
                commitCount: 8,
              },
            ],
          pagination:
            options?.hotspotMeta ?? {
              page: Number(url.searchParams.get("page") ?? "1"),
              pageSize: 10,
              totalItems: 11,
              totalPages: 2,
            },
        }),
      );
    }

    return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
  });
}

describe("dashboard route", () => {
  it("renders dashboard summary success state", async () => {
    vi.stubGlobal("fetch", createDashboardFetchStub());

    renderApp("/dashboard");

    expect(await screen.findByText("Engineering workflow dashboard")).toBeInTheDocument();
    expect((await screen.findAllByText("2h")).length).toBeGreaterThan(0);
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("internal/metrics/calculator.go")).toBeInTheDocument();
  });

  it("renders loading state before summary resolves", async () => {
    let resolveSummary: ((value: unknown) => void) | undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: string | URL) => {
        const url = new URL(String(input));

        if (url.pathname === "/api/v1/organizations") {
          return Promise.resolve(
            jsonResponse(200, {
              data: [{ id: organizationId, githubId: "1", name: "DevLens Labs", role: "owner", createdAt: "2026-08-10T10:00:00Z" }],
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
          return Promise.resolve(
            jsonResponse(200, {
              data: [
                {
                  id: repositoryId,
                  organizationId,
                  githubId: "1001",
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

        if (url.pathname === `/api/v1/repositories/${repositoryId}/dashboard/summary`) {
          return new Promise((resolve) => {
            resolveSummary = resolve;
          });
        }

        if (url.pathname.includes("/metrics/pull-requests")) {
          return Promise.resolve(
            jsonResponse(200, { data: { averageCycleTimeMinutes: 1, averageFilesChanged: 1, averageAdditions: 1, averageDeletions: 1, cycleTimeTrend: [] } }),
          );
        }

        if (url.pathname.includes("/metrics/reviews")) {
          return Promise.resolve(
            jsonResponse(200, { data: { averageWaitMinutes: 1, averageReviewMinutes: 1, reviewCoverage: 1, waitTimeTrend: [] } }),
          );
        }

        if (url.pathname.includes("/metrics/deployments")) {
          return Promise.resolve(
            jsonResponse(200, { data: { deploymentCount: 0, deploymentFrequency: 0, changeFailureRate: 0, deploymentTrend: [] } }),
          );
        }

        if (url.pathname.includes("/metrics/hotspots")) {
          return Promise.resolve(
            jsonResponse(200, { data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } }),
          );
        }

        return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
      }),
    );

    renderApp("/dashboard");

    expect((await screen.findAllByText("Loading...")).length).toBeGreaterThan(0);
    resolveSummary?.(
      jsonResponse(200, {
        data: {
          repositoryId,
          from: "2026-08-01",
          to: "2026-08-12",
          prCycleTimeMinutes: 120,
          reviewWaitMinutes: 45,
          deploymentFrequency: 2,
          changeFailureRate: 0.2,
          reviewCoverage: 0.8,
        },
      }),
    );

    expect((await screen.findAllByText("2h")).length).toBeGreaterThan(0);
  });

  it("renders API error state for summary failures", async () => {
    vi.stubGlobal("fetch", createDashboardFetchStub({ summaryStatus: 500 }));

    renderApp("/dashboard");

    expect(await screen.findByText("Could not load dashboard summary")).toBeInTheDocument();
  });

  it("keeps other sections visible when one API fails", async () => {
    vi.stubGlobal("fetch", createDashboardFetchStub({ reviewStatus: 500 }));

    renderApp("/dashboard");

    expect(await screen.findByText("Could not load review metrics")).toBeInTheDocument();
    expect(await screen.findByText("internal/metrics/calculator.go")).toBeInTheDocument();
    expect((await screen.findAllByText("2h")).length).toBeGreaterThan(0);
  });

  it("renders empty states when deployment and hotspots are empty", async () => {
    vi.stubGlobal(
      "fetch",
      createDashboardFetchStub({
        deploymentData: {
          deploymentCount: 0,
          deploymentFrequency: 0,
          changeFailureRate: 0,
          deploymentTrend: [],
        },
        hotspotData: [],
        hotspotMeta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
      }),
    );

    renderApp("/dashboard");

    expect(await screen.findByText("No deployment data available")).toBeInTheDocument();
    expect(await screen.findByText("No hotspot files available")).toBeInTheDocument();
  });

  it("changes date range and repository selection", async () => {
    const fetchStub = createDashboardFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();
    const expectedRange = getDashboardDateRangeForPreset(7);

    renderApp("/dashboard");

    expect(await screen.findByText("internal/metrics/calculator.go")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Repository"), repositoryIdTwo);
    await user.selectOptions(screen.getByLabelText("Date range"), "7");

    const requestedUrls = fetchStub.mock.calls.map(([input]) => String(input));

    expect(
      requestedUrls.some(
        (url) =>
          url.includes(`/api/v1/repositories/${repositoryIdTwo}/dashboard/summary`) &&
          url.includes(`from=${expectedRange.from}`) &&
          url.includes(`to=${expectedRange.to}`),
      ),
    ).toBe(true);
  });
});
