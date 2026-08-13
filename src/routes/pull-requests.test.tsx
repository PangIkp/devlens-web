import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/render-app";

const organizationId = "11111111-1111-4111-8111-111111111111";
const repositoryId = "22222222-2222-4222-8222-222222222222";
const pullRequestId = "33333333-3333-4333-8333-333333333333";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

function pullRequestListItem(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: pullRequestId,
    repository: { id: repositoryId, fullName: "devlens-labs/devlens-api" },
    githubPrId: 10001,
    number: 42,
    title: "Improve sync retries",
    author: "itsara",
    state: "open",
    createdAt: "2026-08-12T09:00:00Z",
    additions: 40,
    deletions: 12,
    filesChanged: 3,
    isDraft: false,
    ...overrides,
  };
}

function createPullRequestsFetchStub(options?: {
  listItemsByPage?: Record<number, unknown[]>;
  totalPages?: number;
}) {
  return vi.fn().mockImplementation((input: string | URL) => {
    const url = new URL(String(input));

    if (url.pathname === "/api/v1/organizations") {
      return Promise.resolve(
        jsonResponse(200, {
          data: [{ id: organizationId, githubId: 1, slug: "devlens", name: "DevLens Labs", createdAt: "2026-08-10T10:00:00Z" }],
          pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
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

    if (url.pathname === "/api/v1/pull-requests") {
      const page = Number(url.searchParams.get("page") ?? "1");
      const totalPages = options?.totalPages ?? 1;
      const data = options?.listItemsByPage?.[page] ?? [pullRequestListItem()];

      return Promise.resolve(
        jsonResponse(200, {
          data,
          pagination: { page, pageSize: 10, totalItems: totalPages, totalPages },
        }),
      );
    }

    if (url.pathname === `/api/v1/pull-requests/${pullRequestId}`) {
      return Promise.resolve(
        jsonResponse(200, {
          data: {
            ...pullRequestListItem(),
            reviews: [
              {
                id: "44444444-4444-4444-8444-444444444444",
                githubReviewId: 77,
                reviewer: "techlead",
                state: "APPROVED",
                reviewSubmittedAt: "2026-08-12T10:00:00Z",
              },
            ],
            fileChanges: [
              {
                id: "55555555-5555-4555-8555-555555555555",
                filePath: "internal/sync/retry.go",
                additions: 20,
                deletions: 5,
                commitCount: 2,
              },
            ],
            timeline: [
              {
                type: "created",
                label: "Pull request created",
                actor: "itsara",
                occurredAt: "2026-08-12T09:00:00Z",
              },
              {
                type: "review_submitted",
                label: "Review submitted",
                actor: "techlead",
                state: "APPROVED",
                occurredAt: "2026-08-12T10:00:00Z",
              },
            ],
            riskIndicator: {
              level: "high",
              reasons: ["Pull request touches more than 500 lines", "No tests were changed"],
            },
            cycleTimeMinutes: 120,
            reviewWaitMinutes: 45,
          },
        }),
      );
    }

    return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
  });
}

describe("pull requests routes", () => {
  it("lists pull requests and navigates to detail", async () => {
    vi.stubGlobal("fetch", createPullRequestsFetchStub());
    const user = userEvent.setup();

    renderApp("/pull-requests");

    expect(await screen.findByText("Improve sync retries")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Improve sync retries" }));

    expect(await screen.findByText("Changed files")).toBeInTheDocument();
    expect(screen.getByText("internal/sync/retry.go")).toBeInTheDocument();
    expect(screen.getByText("techlead")).toBeInTheDocument();
  });

  it("renders timeline and risk indicator on pull request detail", async () => {
    vi.stubGlobal("fetch", createPullRequestsFetchStub());
    const user = userEvent.setup();

    renderApp("/pull-requests");

    expect(await screen.findByText("Improve sync retries")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Improve sync retries" }));

    expect(await screen.findByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Pull request created")).toBeInTheDocument();
    expect(screen.getByText("Review submitted")).toBeInTheDocument();
    expect(screen.getByText("high risk")).toBeInTheDocument();
    expect(screen.getByText("Pull request touches more than 500 lines")).toBeInTheDocument();
    expect(screen.getByText("No tests were changed")).toBeInTheDocument();
    expect(screen.getByText("Cycle time")).toBeInTheDocument();
    expect(screen.getByText("2h")).toBeInTheDocument();
    expect(screen.getByText("Review wait time")).toBeInTheDocument();
    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("changes sort order and requests the backend with the selected sortBy/sortOrder", async () => {
    const fetchStub = createPullRequestsFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/pull-requests");

    expect(await screen.findByText("Improve sync retries")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Sort pull requests"), "number:asc");

    const requestedUrls = fetchStub.mock.calls.map(([input]) => String(input));

    expect(
      requestedUrls.some(
        (url) => url.includes("/api/v1/pull-requests") && url.includes("sortBy=number") && url.includes("sortOrder=asc"),
      ),
    ).toBe(true);
  });

  it("paginates through multiple pages of pull requests", async () => {
    const fetchStub = createPullRequestsFetchStub({
      totalPages: 2,
      listItemsByPage: {
        1: [pullRequestListItem({ number: 42, title: "Improve sync retries" })],
        2: [pullRequestListItem({ id: "44444444-4444-4444-8444-444444444444", number: 41, title: "Fix flaky worker test" })],
      },
    });
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/pull-requests");

    expect(await screen.findByText("Improve sync retries")).toBeInTheDocument();
    expect(screen.getByText("Page 1 / 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByText("Fix flaky worker test")).toBeInTheDocument();
    expect(screen.getByText("Page 2 / 2")).toBeInTheDocument();
  });
});
