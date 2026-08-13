import { screen } from "@testing-library/react";
import { renderApp } from "@/test/render-app";

const organizationId = "11111111-1111-4111-8111-111111111111";
const repositoryId = "22222222-2222-4222-8222-222222222222";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

function repositoryDetailBody(overrides?: Partial<Record<string, unknown>>) {
  return {
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
      ...overrides,
    },
  };
}

function createRepositoryDetailFetchStub(options?: { repositoryOverrides?: Partial<Record<string, unknown>> }) {
  return vi.fn().mockImplementation((input: string | URL) => {
    const url = new URL(String(input));

    if (url.pathname === `/api/v1/repositories/${repositoryId}`) {
      return Promise.resolve(jsonResponse(200, repositoryDetailBody(options?.repositoryOverrides)));
    }

    if (url.pathname === `/api/v1/repositories/${repositoryId}/metrics`) {
      return Promise.resolve(
        jsonResponse(200, {
          data: {
            metricVersion: 1,
            repositoryId,
            from: url.searchParams.get("from"),
            to: url.searchParams.get("to"),
            interval: "day",
            summary: {
              repositoryId,
              from: url.searchParams.get("from"),
              to: url.searchParams.get("to"),
              prCycleTimeMinutes: 120,
              reviewWaitMinutes: 45,
              deploymentFrequency: 2,
              changeFailureRate: 0.1,
              reviewCoverage: 0.9,
            },
            pullRequests: {
              averageCycleTimeMinutes: 120,
              averageFilesChanged: 5,
              averageAdditions: 100,
              averageDeletions: 20,
              cycleTimeTrend: [],
            },
            reviews: {
              averageWaitMinutes: 45,
              averageReviewMinutes: 30,
              reviewCoverage: 0.9,
              waitTimeTrend: [],
            },
            deployments: {
              deploymentCount: 4,
              deploymentFrequency: 2,
              changeFailureRate: 0.1,
              deploymentTrend: [],
            },
            hotspots: [
              {
                filePath: "internal/metrics/calculator.go",
                hotspotScore: 0.8,
                additions: 90,
                deletions: 30,
                commitCount: 6,
              },
            ],
          },
        }),
      );
    }

    if (url.pathname === `/api/v1/repositories/${repositoryId}/metrics/workload-distribution`) {
      return Promise.resolve(
        jsonResponse(200, {
          data: {
            summary: {
              repositoryId,
              from: url.searchParams.get("from"),
              to: url.searchParams.get("to"),
              totalPullRequests: 8,
              totalReviews: 10,
              topContributorShare: 0.5,
              topReviewerShare: 0.4,
            },
            contributors: [{ author: "octocat", pullRequestCount: 4, share: 0.5 }],
            reviewers: [{ reviewer: "hubot", reviewCount: 4, reviewedPullRequestCount: 4, share: 0.4 }],
          },
        }),
      );
    }

    return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
  });
}

describe("repository detail route", () => {
  it("renders repository detail success state including repository health", async () => {
    vi.stubGlobal("fetch", createRepositoryDetailFetchStub());

    renderApp(`/repositories/${repositoryId}`);

    expect(await screen.findByText("devlens-api")).toBeInTheDocument();
    expect(screen.getByText("devlens-labs/devlens-api")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/devlens-labs/devlens-api",
    );

    expect(await screen.findByText("Repository health")).toBeInTheDocument();
    expect(await screen.findByText("internal/metrics/calculator.go")).toBeInTheDocument();
    expect(screen.getByText("octocat", { selector: "span" })).toBeInTheDocument();
  });

  it("renders not found state for an invalid repository", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(404, {
          error: {
            code: "REPOSITORY_NOT_FOUND",
            message: "Repository not found",
          },
        }),
      ),
    );

    renderApp(`/repositories/${repositoryId}`);

    expect(await screen.findByText("Repository not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to repositories" })).toBeInTheDocument();
  });

  it("shows an empty state instead of health metrics when the repository has not synced yet", async () => {
    vi.stubGlobal(
      "fetch",
      createRepositoryDetailFetchStub({ repositoryOverrides: { lastSyncedAt: null } }),
    );

    renderApp(`/repositories/${repositoryId}`);

    expect(await screen.findByText("Repository health is not ready yet")).toBeInTheDocument();
  });
});
