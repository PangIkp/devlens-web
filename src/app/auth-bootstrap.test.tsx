import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthBootstrap } from "@/app/auth-bootstrap";
import { useAuthStore } from "@/features/auth/auth.store";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

describe("AuthBootstrap", () => {
  afterEach(() => {
    useAuthStore.setState({ session: null });
  });

  it("refreshes the session user exactly once instead of looping", async () => {
    useAuthStore.setState({
      session: {
        accessToken: "token",
        refreshToken: "refresh",
        tokenType: "Bearer",
        expiresAt: "2026-01-01T00:00:00Z",
        refreshExpiresAt: "2026-01-02T00:00:00Z",
        user: { id: "old-user", email: "old@example.com", createdAt: "2026-01-01T00:00:00Z" },
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          data: { id: "new-user", email: "new@example.com", name: "New User", createdAt: "2026-01-01T00:00:00Z" },
        }),
      ),
    );

    let sessionChangeCount = 0;
    const unsubscribe = useAuthStore.subscribe((state, previousState) => {
      if (state.session !== previousState.session) {
        sessionChangeCount += 1;
      }
    });

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(useAuthStore.getState().session?.user.id).toBe("new-user");
    });

    // Give a regression back to the infinite-loop bug a chance to fire extra updates.
    await new Promise((resolve) => setTimeout(resolve, 50));

    unsubscribe();
    expect(sessionChangeCount).toBe(1);
  });
});
