import { z } from "zod";

export const insightTypeSchema = z.enum([
  "bottleneck_detection",
  "large_pr_detection",
  "slow_review_detection",
  "hotspot_detection",
  "deployment_failure_trend",
  "review_concentration",
]);

export const insightStatusSchema = z.enum(["open", "reviewed", "dismissed"]);
export const insightSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const insightSchema = z.object({
  insightKey: z.string().min(1),
  insightType: insightTypeSchema,
  status: insightStatusSchema,
  severity: insightSeveritySchema,
  title: z.string(),
  summary: z.string(),
  organizationId: z.string().min(1),
  repositoryId: z.string().nullable().optional(),
  repositoryName: z.string().nullable().optional(),
  detectedAt: z.string(),
  evidence: z.record(z.string(), z.unknown()).optional(),
  reviewedBy: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  dismissedAt: z.string().nullable().optional(),
  reopenedAt: z.string().nullable().optional(),
});

export const insightListResponseSchema = z.object({
  data: z.array(insightSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export const insightStatusResponseSchema = z.object({
  data: z.object({
    insightKey: z.string().min(1),
    insightType: z.string(),
    status: insightStatusSchema,
    reviewedBy: z.string().nullable().optional(),
    reviewedAt: z.string().nullable().optional(),
    dismissedAt: z.string().nullable().optional(),
    reopenedAt: z.string().nullable().optional(),
    updatedAt: z.string(),
  }),
});

export type Insight = z.infer<typeof insightSchema>;
export type InsightType = z.infer<typeof insightTypeSchema>;
export type InsightStatus = z.infer<typeof insightStatusSchema>;
