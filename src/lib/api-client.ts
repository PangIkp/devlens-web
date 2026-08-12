import { env } from "@/lib/env";

type QueryParams = Record<string, string | number | boolean | undefined>;

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

export async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
  query?: QueryParams,
): Promise<TResponse> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path, query), {
    headers,
    ...init,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status, payload);
  }

  return payload as TResponse;
}
