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

describe("repository detail route", () => {
  it("renders repository detail success state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
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
      ),
    );

    renderApp(`/repositories/${repositoryId}`);

    expect(await screen.findByText("devlens-api")).toBeInTheDocument();
    expect(screen.getByText("devlens-labs/devlens-api")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/devlens-labs/devlens-api",
    );
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
});
