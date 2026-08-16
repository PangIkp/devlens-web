import { z } from "zod";

export const userProfileSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const meResponseSchema = z.object({
  data: userProfileSchema,
});

export type UserProfile = z.infer<typeof userProfileSchema>;
