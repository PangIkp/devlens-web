import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
});

const fallbackApiBaseUrl =
  import.meta.env.MODE === "production" ? undefined : "http://localhost:8080/api/v1";

const parsedEnv = envSchema.safeParse({
  VITE_API_BASE_URL: (import.meta.env.VITE_API_BASE_URL ?? fallbackApiBaseUrl) as unknown,
});

if (!parsedEnv.success) {
  throw new Error(
    "Invalid environment configuration. Set VITE_API_BASE_URL in your .env file for production builds.",
  );
}

export const env = parsedEnv.data;
