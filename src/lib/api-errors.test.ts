import { ApiError } from "@/lib/api-client";
import { formatErrorMessage, getErrorMessage } from "@/lib/api-errors";

describe("api error formatting", () => {
  it("formats raw GitHub installation token 404 errors into a user-facing message", () => {
    expect(
      formatErrorMessage(
        'sync repository metadata: github app request failed: status=404 body={"message":"Not Found","documentation_url":"https://docs.github.com/rest/reference/apps#create-an-installation-access-token-for-an-app","status":"404"}',
      ),
    ).toBe(
      "The GitHub app installation for this organization is no longer available. Reconnect GitHub and try syncing again.",
    );
  });

  it("omits the request id from backend API errors shown in the UI", () => {
    const error = new ApiError("Request failed with status 409", 409, {
      error: {
        code: "GITHUB_INSTALLATION_REQUIRED",
        message:
          'sync repository metadata: github app request failed: status=404 body={"message":"Not Found","documentation_url":"https://docs.github.com/rest/reference/apps#create-an-installation-access-token-for-an-app","status":"404"}',
        requestId: "req_123",
      },
    });

    expect(getErrorMessage(error)).toBe(
      "The GitHub app installation for this organization is no longer available. Reconnect GitHub and try syncing again.",
    );
  });

  it("formats GitHub bad credentials errors into an actionable message", () => {
    expect(
      formatErrorMessage(
        'sync repository metadata: github api returned status 401: Bad credentials',
      ),
    ).toBe(
      "DevLens could not authenticate with the GitHub app credentials for this installation. Reconnect GitHub, and if the problem continues, check the backend GitHub app credentials.",
    );
  });

  it("leaves unrelated messages unchanged", () => {
    expect(formatErrorMessage("Repository onboarding is required before sync")).toBe(
      "Repository onboarding is required before sync",
    );
  });
});