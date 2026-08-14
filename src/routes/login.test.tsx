import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/render-app";

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
});
