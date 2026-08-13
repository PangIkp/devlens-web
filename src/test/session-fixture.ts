import type { SessionPayload } from "@/features/auth/auth.schemas";

export function createTestSession(overrides: Partial<SessionPayload> = {}): SessionPayload {
  return {
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    tokenType: "Bearer",
    expiresAt: "2026-08-13T12:00:00Z",
    refreshExpiresAt: "2026-08-20T12:00:00Z",
    user: {
      id: "55555555-5555-4555-8555-555555555555",
      email: "local@devlens.test",
      name: "Local Dev",
      avatarUrl: null,
      createdAt: "2026-08-10T10:00:00Z",
      updatedAt: "2026-08-12T00:00:00Z",
    },
    ...overrides,
  };
}
