import { z } from "zod";

const healthPayloadSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  service: z.string().optional(),
  version: z.string().optional(),
});

export const healthResponseSchema = z
  .union([
    healthPayloadSchema,
    z.object({
      data: healthPayloadSchema,
    }),
  ])
  .transform((value) => ("data" in value ? value.data : value));

export type HealthResponse = z.infer<typeof healthResponseSchema>;
