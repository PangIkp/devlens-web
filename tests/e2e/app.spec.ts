import { test, expect } from "@playwright/test";

// These tests exercise the app against a real running backend (see
// playwright.config.ts webServer + VITE_API_BASE_URL) using the local dev
// login flow. They assume a backend is reachable at localhost:8080 with the
// local seed data described in docs/08-remaining-checklist.md.

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Engineering workflow dashboard" })).toBeVisible();
}

test("redirects an unauthenticated visitor to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in to DevLens" })).toBeVisible();
});

test("logs in with the local dev account and reaches the app shell", async ({ page }) => {
  await login(page);

  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pull Requests" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Insights" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
});

test("navigates to the dashboard and loads repository metrics", async ({ page }) => {
  await login(page);

  await page.getByRole("link", { name: "Dashboard" }).click();

  await expect(page.getByRole("heading", { name: "Engineering workflow dashboard" })).toBeVisible();
  await expect(page.getByText("Summary")).toBeVisible();
});

test("navigates to pull requests and opens a pull request detail page", async ({ page }) => {
  await login(page);

  await page.getByRole("link", { name: "Pull Requests" }).click();

  await expect(page.getByRole("heading", { name: "Pull request detail flow" })).toBeVisible();

  const firstPullRequestLink = page.locator('a[href^="/pull-requests/"]').first();
  if (await firstPullRequestLink.count()) {
    await firstPullRequestLink.click();
    await expect(page.getByText("Changed files")).toBeVisible();
  }
});

test("navigates to insights and settings", async ({ page }) => {
  await login(page);

  await page.getByRole("link", { name: "Insights" }).click();
  await expect(page.getByRole("heading", { name: "Process insights" })).toBeVisible();

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("tab", { name: "Organization" })).toBeVisible();

  await page.getByRole("tab", { name: "GitHub" }).click();
  await expect(page.getByText("GitHub connection")).toBeVisible();
});
