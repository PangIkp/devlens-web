import { z } from "zod";

const identifierSchema = z.string().min(1);
const optionalNumberSchema = z.number().finite().nullable().optional().transform((value) => value ?? null);
const metricPointSchema = z.object({
  date: z.string(),
  value: z.number().finite(),
});

export const dashboardSummarySchema = z.object({
  repositoryId: identifierSchema,
  from: z.string(),
  to: z.string(),
  prCycleTimeMinutes: optionalNumberSchema,
  reviewWaitMinutes: optionalNumberSchema,
  deploymentFrequency: optionalNumberSchema,
  changeFailureRate: optionalNumberSchema,
  reviewCoverage: optionalNumberSchema,
});

export const dashboardSummaryResponseSchema = z.object({
  data: dashboardSummarySchema,
});

export const pullRequestMetricsSchema = z.object({
  averageCycleTimeMinutes: optionalNumberSchema,
  averageFilesChanged: optionalNumberSchema,
  averageAdditions: optionalNumberSchema,
  averageDeletions: optionalNumberSchema,
  cycleTimeTrend: z.array(metricPointSchema),
});

export const pullRequestMetricsResponseSchema = z.object({
  data: pullRequestMetricsSchema,
});

export const reviewMetricsSchema = z.object({
  averageWaitMinutes: optionalNumberSchema,
  averageReviewMinutes: optionalNumberSchema,
  reviewCoverage: optionalNumberSchema,
  waitTimeTrend: z.array(metricPointSchema),
});

export const reviewMetricsResponseSchema = z.object({
  data: reviewMetricsSchema,
});

export const deploymentMetricsSchema = z.object({
  deploymentCount: optionalNumberSchema,
  deploymentFrequency: optionalNumberSchema,
  changeFailureRate: optionalNumberSchema,
  deploymentTrend: z.array(metricPointSchema),
});

export const deploymentMetricsResponseSchema = z.object({
  data: deploymentMetricsSchema,
});

export const hotspotFileSchema = z.object({
  filePath: z.string(),
  hotspotScore: z.number().finite(),
  additions: z.number().finite(),
  deletions: z.number().finite(),
  commitCount: z.number().finite(),
});

export const hotspotMetricsBodySchema = z.object({
  data: z.array(hotspotFileSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type PullRequestMetrics = z.infer<typeof pullRequestMetricsSchema>;
export type ReviewMetrics = z.infer<typeof reviewMetricsSchema>;
export type DeploymentMetrics = z.infer<typeof deploymentMetricsSchema>;
export type HotspotFile = z.infer<typeof hotspotFileSchema>;
