import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function createInsightsFetchStub() {
  return vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";

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

    if (url.pathname === "/api/v1/insights" && method === "GET") {
      const status = url.searchParams.get("status");

      return Promise.resolve(
        jsonResponse(200, {
          data:
            status === "dismissed"
              ? []
              : [
                  {
                    insightKey: "slow-review-1",
                    insightType: "slow_review_detection",
                    status: "open",
                    severity: "high",
                    title: "Review Wait Time increased",
                    summary: "Review Wait Time increased 62% in the last 14 days.",
                    organizationId,
                    repositoryId,
                    repositoryName: "devlens-labs/devlens-api",
                    detectedAt: "2026-08-12T10:00:00Z",
                    evidence: {
                      reviewWaitMinutes: 180,
                      baselineMinutes: 111,
                    },
                  },
                ],
          pagination: { page: 1, pageSize: 10, totalItems: status === "dismissed" ? 0 : 1, totalPages: 1 },
        }),
      );
    }

    if (url.pathname === `/api/v1/organizations/${organizationId}/insights/slow-review-1/dismiss`) {
      return Promise.resolve(
        jsonResponse(200, {
          data: {
            insightKey: "slow-review-1",
            insightType: "slow_review_detection",
            status: "dismissed",
            dismissedAt: "2026-08-12T10:30:00Z",
            updatedAt: "2026-08-12T10:30:00Z",
          },
        }),
      );
    }

    return Promise.reject(new Error(`Unhandled URL: ${url.toString()} (${method})`));
  });
}

describe("insights route", () => {
  it("renders insight evidence and supports filtering and dismiss action", async () => {
    const fetchStub = createInsightsFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    const user = userEvent.setup();

    renderApp("/insights");

    expect(await screen.findByRole("heading", { name: "Review Wait Time increased" })).toBeInTheDocument();
    expect(screen.getAllByText("devlens-labs/devlens-api").length).toBeGreaterThan(0);
    expect(screen.getByText("reviewWaitMinutes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await user.selectOptions(screen.getByLabelText("Insight status"), "dismissed");

    expect(await screen.findByText("No insights detected")).toBeInTheDocument();
    expect(fetchStub.mock.calls.some(([input]) => String(input).includes("/dismiss"))).toBe(true);
  });
});
