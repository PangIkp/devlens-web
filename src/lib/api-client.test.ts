import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/features/auth/auth.store";

const initialSession = {
  accessToken: "old-access-token",
  refreshToken: "old-refresh-token",
  tokenType: "Bearer",
  expiresAt: "2026-08-10T00:00:00Z",
  refreshExpiresAt: "2026-08-20T00:00:00Z",
  user: {
    id: "user-1",
    email: "dev@devlens.test",
    name: "Local Dev",
    createdAt: "2026-08-01T00:00:00Z",
  },
};

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

beforeEach(() => {
  useAuthStore.setState({ session: initialSession });
});

describe("apiRequest token refresh", () => {
  it("coalesces concurrent refreshes into a single /auth/refresh call", async () => {
    let refreshCalls = 0;

    const fetchStub = vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const authHeader = new Headers(init?.headers).get("Authorization");

      if (url.pathname === "/api/v1/auth/refresh") {
        refreshCalls += 1;
        const body = JSON.parse(init?.body as string) as { refreshToken: string };
        // Rotation: only the token the store currently holds is valid — a
        // second call reusing the already-rotated old token must fail, the
        // same way the real backend would reject a reused refresh token.
        if (body.refreshToken !== "old-refresh-token") {
          return Promise.resolve(jsonResponse(401, { error: { message: "invalid refresh token" } }));
        }
        return Promise.resolve(
          jsonResponse(200, {
            data: {
              ...initialSession,
              accessToken: "new-access-token",
              refreshToken: "new-refresh-token",
            },
          }),
        );
      }

      if (url.pathname === "/api/v1/protected") {
        if (authHeader === "Bearer new-access-token") {
          return Promise.resolve(jsonResponse(200, { data: "ok" }));
        }
        return Promise.resolve(jsonResponse(401, { error: { message: "unauthorized" } }));
      }

      return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
    });
    vi.stubGlobal("fetch", fetchStub);

    const results = await Promise.all(
      Array.from({ length: 5 }, () => apiRequest<{ data: string }>("/protected", { method: "GET" })),
    );

    expect(results.every((result) => result.data === "ok")).toBe(true);
    expect(refreshCalls).toBe(1);
    expect(useAuthStore.getState().session?.accessToken).toBe("new-access-token");
  });

  it("clears the session when the refresh token is rejected", async () => {
    const fetchStub = vi.fn().mockImplementation((input: string | URL) => {
      const url = new URL(String(input));

      if (url.pathname === "/api/v1/auth/refresh") {
        return Promise.resolve(jsonResponse(401, { error: { message: "invalid refresh token" } }));
      }

      if (url.pathname === "/api/v1/protected") {
        return Promise.resolve(jsonResponse(401, { error: { message: "unauthorized" } }));
      }

      return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
    });
    vi.stubGlobal("fetch", fetchStub);

    await expect(apiRequest("/protected", { method: "GET" })).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().session).toBeNull();
  });
});
