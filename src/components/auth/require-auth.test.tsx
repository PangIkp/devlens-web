import { screen } from "@testing-library/react";
import { renderApp } from "@/test/render-app";

describe("RequireAuth", () => {
  it("redirects an unauthenticated visitor from a protected route to /login", async () => {
    renderApp("/dashboard", { authenticated: false });

    expect(await screen.findByText("Sign in to DevLens")).toBeInTheDocument();
  });

  it("redirects the index route to /login via /dashboard when unauthenticated", async () => {
    const { router } = renderApp("/", { authenticated: false });

    await screen.findByText("Sign in to DevLens");

    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search.redirect).toMatch(/^\/dashboard/);
  });
});
