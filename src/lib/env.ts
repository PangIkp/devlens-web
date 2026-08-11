import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
});

const fallbackApiBaseUrl =
  import.meta.env.MODE === "test" ? "http://localhost:8080/api/v1" : undefined;

export const env = envSchema.parse({
  VITE_API_BASE_URL: (import.meta.env.VITE_API_BASE_URL ?? fallbackApiBaseUrl) as unknown,
});
