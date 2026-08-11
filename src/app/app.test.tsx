import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HealthStatusCard } from "@/routes/shared/health-status-card";

describe("HealthStatusCard", () => {
  it("shows health data from the query", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              data: {
                status: "ok",
                service: "devlens-api",
                version: "1.0.0",
                timestamp: "2026-08-11T00:00:00Z",
              },
            }),
          ),
      }),
    );

    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <HealthStatusCard />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("devlens-api")).toBeInTheDocument();
    expect(screen.getByText("ok")).toBeInTheDocument();
  });
});
