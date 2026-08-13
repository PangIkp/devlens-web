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
              status: "ok",
              timestamp: "2026-08-11T00:00:00Z",
              dependencies: {
                postgres: { status: "ok" },
                clickhouse: { status: "ok" },
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

    expect(await screen.findByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Postgres")).toBeInTheDocument();
    expect(screen.getByText("ClickHouse")).toBeInTheDocument();
  });
});
