import type { operations, paths } from "@/api/generated/schema";
import { insightListResponseSchema, insightStatusResponseSchema } from "@/features/insights/insights.schemas";
import { apiRequest } from "@/lib/api-client";

type InsightListResponse = paths["/insights"]["get"]["responses"][200]["content"]["application/json"];
type InsightStatusResponse =
  paths["/organizations/{organizationId}/insights/{insightKey}/review"]["post"]["responses"][200]["content"]["application/json"];

export async function listInsights(params: {
  organizationId: string;
  repositoryId?: operations["listInsightsAlias"]["parameters"]["query"]["repositoryId"];
  type?: operations["listInsightsAlias"]["parameters"]["query"]["type"];
  status?: operations["listInsightsAlias"]["parameters"]["query"]["status"];
  from: string;
  to: string;
  page?: number;
  pageSize?: number;
}) {
  const response = await apiRequest<InsightListResponse>(
    "/insights",
    {
      method: "GET",
    },
    {
      organizationId: params.organizationId,
      repositoryId: params.repositoryId,
      type: params.type,
      status: params.status,
      from: params.from,
      to: params.to,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    },
  );

  return insightListResponseSchema.parse(response);
}

export async function reviewInsight(params: {
  organizationId: string;
  insightKey: string;
  reviewedBy?: string;
}) {
  const response = await apiRequest<InsightStatusResponse>(
    `/organizations/${params.organizationId}/insights/${params.insightKey}/review`,
    {
      method: "POST",
      body: params.reviewedBy ? JSON.stringify({ reviewedBy: params.reviewedBy }) : undefined,
    },
  );

  return insightStatusResponseSchema.parse(response);
}

export async function dismissInsight(params: { organizationId: string; insightKey: string }) {
  const response = await apiRequest<InsightStatusResponse>(
    `/organizations/${params.organizationId}/insights/${params.insightKey}/dismiss`,
    {
      method: "POST",
    },
  );

  return insightStatusResponseSchema.parse(response);
}

export async function reopenInsight(params: { organizationId: string; insightKey: string }) {
  const response = await apiRequest<InsightStatusResponse>(
    `/organizations/${params.organizationId}/insights/${params.insightKey}/reopen`,
    {
      method: "POST",
    },
  );

  return insightStatusResponseSchema.parse(response);
}
