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

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const payload = getApiErrorPayload(error);
    const backendMessage = payload?.error?.message;
    const requestId = payload?.error?.requestId;

    if (backendMessage && requestId) {
      return `${backendMessage} (requestId: ${requestId})`;
    }

    if (backendMessage) {
      return backendMessage;
    }
  }

  return error instanceof Error ? error.message : "Unknown error";
}
