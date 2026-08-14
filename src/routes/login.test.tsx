import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/render-app";

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

describe("login route", () => {
  it("renders the login page for an unauthenticated session", async () => {
    renderApp("/login", { authenticated: false });

    expect(await screen.findByText("Sign in to DevLens")).toBeInTheDocument();
    expect(screen.getByDisplayValue("local@devlens.test")).toBeInTheDocument();
  });

  it("marks email as required and shows an inline error for an invalid address", async () => {
    renderApp("/login", { authenticated: false });
    const user = userEvent.setup();

    await screen.findByText("Sign in to DevLens");
    expect(screen.getByText("Email").parentElement).toHaveTextContent("Email*");

    const emailInput = screen.getByPlaceholderText("local@devlens.test");
    await user.clear(emailInput);
    await user.type(emailInput, "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email address")).toBeInTheDocument();
  });

  it("clears cached data from a previous session once a new login succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: string | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        if (url.pathname === "/api/v1/auth/login" && init?.method === "POST") {
          return Promise.resolve(
            jsonResponse(200, {
              data: {
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
                tokenType: "Bearer",
                expiresAt: "2026-08-13T12:00:00Z",
                refreshExpiresAt: "2026-08-20T12:00:00Z",
                user: {
                  id: "66666666-6666-4666-8666-666666666666",
                  email: "new-user@devlens.test",
                  name: "New User",
                  avatarUrl: null,
                  createdAt: "2026-08-13T00:00:00Z",
                  updatedAt: "2026-08-13T00:00:00Z",
                },
              },
            }),
          );
        }
        return Promise.reject(new Error(`Unhandled URL: ${url.toString()}`));
      }),
    );

    const { queryClient } = renderApp("/login", { authenticated: false });
    const user = userEvent.setup();

    // Simulates data left over from whoever was signed in before — a token
    // expiry or switching test accounts without an explicit sign-out both
    // leave this in place ahead of the next login.
    queryClient.setQueryData(["organizations", "list"], {
      data: [{ id: "stale-org-id", name: "Stale Org From Previous User" }],
    });

    await screen.findByText("Sign in to DevLens");
    const emailInput = screen.getByPlaceholderText("local@devlens.test");
    await user.clear(emailInput);
    await user.type(emailInput, "new-user@devlens.test");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(queryClient.getQueryData(["organizations", "list"])).toBeUndefined();
    });
  });
});
