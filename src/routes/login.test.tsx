import { screen } from "@testing-library/react";
import { renderApp } from "@/test/render-app";

describe("login route", () => {
  it("renders the login page for an unauthenticated session", async () => {
    renderApp("/login", { authenticated: false });

    expect(await screen.findByText("Sign in to DevLens")).toBeInTheDocument();
    expect(screen.getByDisplayValue("local@devlens.test")).toBeInTheDocument();
  });
});
