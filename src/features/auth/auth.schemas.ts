import { z } from "zod";
import { userProfileSchema } from "@/features/users/users.schemas";

export const loginRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).optional().nullable(),
});

export const refreshSessionRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const sessionPayloadSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.string().min(1),
  expiresAt: z.string(),
  refreshExpiresAt: z.string(),
  user: userProfileSchema,
});

export const sessionResponseSchema = z.object({
  data: sessionPayloadSchema,
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type SessionPayload = z.infer<typeof sessionPayloadSchema>;
