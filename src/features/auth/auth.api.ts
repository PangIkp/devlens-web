import { loginRequestSchema, refreshSessionRequestSchema, sessionResponseSchema, type LoginRequest } from "@/features/auth/auth.schemas";
import { apiRequest } from "@/lib/api-client";

export async function login(payload: LoginRequest) {
  const response = await apiRequest<unknown>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(loginRequestSchema.parse(payload)),
    },
    undefined,
    { auth: false, retryOnUnauthorized: false },
  );

  return sessionResponseSchema.parse(response);
}

export async function refreshSession(refreshToken: string) {
  const response = await apiRequest<unknown>(
    "/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify(refreshSessionRequestSchema.parse({ refreshToken })),
    },
    undefined,
    { auth: false, retryOnUnauthorized: false },
  );

  return sessionResponseSchema.parse(response);
}

export async function logout() {
  await apiRequest<void>(
    "/auth/logout",
    {
      method: "POST",
    },
    undefined,
    { retryOnUnauthorized: false },
  );
}
