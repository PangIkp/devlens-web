import { getHealth } from "@/features/health/health.api";

describe("getHealth", () => {
  it("parses a successful health response", async () => {
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

    await expect(getHealth()).resolves.toEqual({
      status: "ok",
      timestamp: "2026-08-11T00:00:00Z",
      dependencies: {
        postgres: { status: "ok" },
        clickhouse: { status: "ok" },
      },
    });
  });
});
