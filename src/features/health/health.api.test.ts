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

    await expect(getHealth()).resolves.toEqual({
      data: {
        status: "ok",
        service: "devlens-api",
        version: "1.0.0",
        timestamp: "2026-08-11T00:00:00Z",
      },
    });
  });
});
