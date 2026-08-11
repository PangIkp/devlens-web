import { apiRequest } from "@/lib/api-client";
import type { paths } from "@/api/generated/schema";
import { healthResponseSchema } from "@/features/health/health.schemas";

type HealthResponse =
  paths["/health"]["get"]["responses"][200]["content"]["application/json"];

export async function getHealth() {
  const response = await apiRequest<HealthResponse>("/health", {
    method: "GET",
  });

  return healthResponseSchema.parse(response);
}
