import { ApiError } from "@/lib/api-client";

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
  };
};

export function getApiErrorPayload(error: unknown) {
  if (error instanceof ApiError) {
    return error.payload as ApiErrorPayload | undefined;
  }

  return undefined;
}

export function getApiErrorCode(error: unknown) {
  return getApiErrorPayload(error)?.error?.code;
}

function tryParseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function formatGitHubAppRequestError(message: string) {
  const normalizedMessage = message.trim();
  const lowerCaseMessage = normalizedMessage.toLowerCase();

  if (
    !lowerCaseMessage.includes("github app request failed") &&
    !lowerCaseMessage.includes("github api returned status")
  ) {
    return undefined;
  }

  const statusMatch = normalizedMessage.match(/status=(\d{3})/i);
  const alternateStatusMatch = normalizedMessage.match(/status\s+(\d{3})/i);
  const bodyMatch = normalizedMessage.match(/body=(\{.*\})$/i);
  const status = statusMatch?.[1] ?? alternateStatusMatch?.[1];
  const body = bodyMatch?.[1] ? tryParseJsonObject(bodyMatch[1]) : undefined;
  const bodyMessage = typeof body?.message === "string" ? body.message : undefined;
  const documentationUrl =
    typeof body?.documentation_url === "string"
      ? body.documentation_url
      : undefined;
  const trailingMessageMatch = normalizedMessage.match(/status\s+\d{3}:\s+(.+)$/i);
  const normalizedBodyMessage = bodyMessage ?? trailingMessageMatch?.[1]?.trim();

  if (
    status === "404" &&
    documentationUrl?.includes("create-an-installation-access-token-for-an-app")
  ) {
    return "The GitHub app installation for this organization is no longer available. Reconnect GitHub and try syncing again.";
  }

  if (status === "401" && normalizedBodyMessage?.toLowerCase() === "bad credentials") {
    return "DevLens could not authenticate with the GitHub app credentials for this installation. Reconnect GitHub, and if the problem continues, check the backend GitHub app credentials.";
  }

  if (status === "403" && normalizedBodyMessage?.toLowerCase().includes("resource not accessible")) {
    return "The GitHub app does not currently have access to this repository. Review the installation permissions and selected repositories, then try again.";
  }

  if (status && normalizedBodyMessage) {
    return `GitHub app request failed (${status}): ${normalizedBodyMessage}.`;
  }

  if (status) {
    return `GitHub app request failed (${status}).`;
  }

  return "GitHub app request failed. Reconnect GitHub and try again.";
}

export function formatErrorMessage(message: string) {
  return formatGitHubAppRequestError(message) ?? message;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const payload = getApiErrorPayload(error);
    const backendMessage = payload?.error?.message;
    const requestId = payload?.error?.requestId;
    const formattedBackendMessage = backendMessage
      ? formatErrorMessage(backendMessage)
      : undefined;

    if (formattedBackendMessage && requestId) {
      return `${formattedBackendMessage} (requestId: ${requestId})`;
    }

    if (formattedBackendMessage) {
      return formattedBackendMessage;
    }
  }

  return error instanceof Error ? formatErrorMessage(error.message) : "Unknown error";
}
