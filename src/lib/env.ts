import { z } from "zod";

const apiBaseUrlSchema = z
  .string()
  .min(1)
  .refine((value) => value.startsWith("/") || URL.canParse(value), {
    message: "VITE_API_BASE_URL must be an absolute URL or a relative /api path.",
  });

const envSchema = z.object({
  VITE_API_BASE_URL: apiBaseUrlSchema,
});

const fallbackApiBaseUrl = import.meta.env.MODE === "production" ? undefined : "/api/v1";

const parsedEnv = envSchema.safeParse({
  VITE_API_BASE_URL: (import.meta.env.VITE_API_BASE_URL ?? fallbackApiBaseUrl) as unknown,
});

if (!parsedEnv.success) {
  throw new Error(
    "Invalid environment configuration. Set VITE_API_BASE_URL in your .env file for production builds.",
  );
}

export const env = parsedEnv.data;
