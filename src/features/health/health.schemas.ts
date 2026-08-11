import { z } from "zod";

export const healthResponseSchema = z.object({
  data: z.object({
    status: z.string(),
    service: z.string(),
    version: z.string(),
    timestamp: z.string(),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
