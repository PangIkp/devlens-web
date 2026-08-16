import { env } from "@/lib/env";
import { clearAuthSession, getAuthSession, setAuthSession } from "@/features/auth/auth.store";
import { sessionResponseSchema } from "@/features/auth/auth.schemas";

type QueryParams = Record<string, string | number | boolean | undefined>;
type ApiRequestOptions = {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(path: string, query?: QueryParams) {
  const normalizedPath = path.replace(/^\//, "");
  const baseUrl = env.VITE_API_BASE_URL;
  const url = baseUrl.startsWith("/")
    ? new URL(`${baseUrl.replace(/\/$/, "")}/${normalizedPath}`, window.location.origin)
    : new URL(normalizedPath, `${baseUrl}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (text.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

// The backend rotates refresh tokens on every use (the old one stops
// working the instant a new one is issued). Several requests can land a
// 401 at the same moment (e.g. every query a page fires on mount), and
// without this dedup each one would call /auth/refresh independently with
// the same now-shared token — the first call rotates it, then every other
// call's refresh fails against the now-stale token and wipes out the
// session `refreshAccessToken` just successfully set. Coalescing concurrent
// callers onto a single in-flight request keeps that from happening.
let pendingRefresh: ReturnType<typeof performTokenRefresh> | null = null;

function refreshAccessToken() {
  pendingRefresh ??= performTokenRefresh().finally(() => {
    pendingRefresh = null;
  });

  return pendingRefresh;
}

async function performTokenRefresh() {
  const session = getAuthSession();

  if (!session?.refreshToken) {
    clearAuthSession();
    return null;
  }

  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: session.refreshToken,
    }),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    clearAuthSession();
    return null;
  }

  const parsed = sessionResponseSchema.parse(payload);
  setAuthSession(parsed.data);

  return parsed.data;
}

export async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
  query?: QueryParams,
  options?: ApiRequestOptions,
): Promise<TResponse> {
  const headers = new Headers(init?.headers);
  const authEnabled = options?.auth ?? true;
  const retryOnUnauthorized = options?.retryOnUnauthorized ?? authEnabled;
  const session = getAuthSession();

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authEnabled && session?.accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `${session.tokenType} ${session.accessToken}`);
  }

  const doRequest = (requestHeaders: Headers) =>
    fetch(buildUrl(path, query), {
      headers: requestHeaders,
      ...init,
    });

  let response = await doRequest(headers);
  let payload = await parseResponse(response);

  if (response.status === 401 && retryOnUnauthorized && authEnabled && session?.refreshToken) {
    const refreshedSession = await refreshAccessToken();

    if (refreshedSession) {
      const retryHeaders = new Headers(init?.headers);

      if (init?.body && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }

      retryHeaders.set("Authorization", `${refreshedSession.tokenType} ${refreshedSession.accessToken}`);
      response = await doRequest(retryHeaders);
      payload = await parseResponse(response);
    }
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status, payload);
  }

  return payload as TResponse;
}
