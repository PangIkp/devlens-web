import { z } from "zod";

const healthPayloadSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  dependencies: z.object({
    postgres: z.object({
      status: z.string(),
      message: z.string().optional(),
    }),
    clickhouse: z.object({
      status: z.string(),
      message: z.string().optional(),
    }),
  }),
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
