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
  meta: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export const reviewQueueItemSchema = z.object({
  pullRequestId: identifierSchema,
  number: z.number().int(),
  title: z.string(),
  author: z.string(),
  reviewRequestedAt: z.string().nullable().optional().transform((value) => value ?? null),
  waitingMinutes: z.number().finite(),
});

export const reviewQueueResponseSchema = z.object({
  data: z.array(reviewQueueItemSchema),
  meta: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export const contributorDistributionItemSchema = z.object({
  author: z.string(),
  pullRequestCount: z.number().int(),
  share: z.number().finite(),
});

export const reviewerDistributionItemSchema = z.object({
  reviewer: z.string(),
  reviewCount: z.number().int(),
  reviewedPullRequestCount: z.number().int(),
  share: z.number().finite(),
});

export const workloadDistributionSchema = z.object({
  summary: z.object({
    repositoryId: identifierSchema,
    from: z.string(),
    to: z.string(),
    totalPullRequests: z.number().int(),
    totalReviews: z.number().int(),
    topContributorShare: z.number().finite(),
    topReviewerShare: z.number().finite(),
  }),
  contributors: z.array(contributorDistributionItemSchema),
  reviewers: z.array(reviewerDistributionItemSchema),
});

export const workloadDistributionResponseSchema = z.object({
  data: workloadDistributionSchema,
});

export const repositoryMetricsPayloadSchema = z.object({
  metricVersion: z.number().int(),
  repositoryId: identifierSchema,
  from: z.string(),
  to: z.string(),
  interval: z.string(),
  summary: dashboardSummarySchema,
  pullRequests: pullRequestMetricsSchema,
  reviews: reviewMetricsSchema,
  deployments: deploymentMetricsSchema,
  hotspots: z.array(hotspotFileSchema),
});

export const repositoryMetricsResponseSchema = z.object({
  data: repositoryMetricsPayloadSchema,
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type PullRequestMetrics = z.infer<typeof pullRequestMetricsSchema>;
export type ReviewMetrics = z.infer<typeof reviewMetricsSchema>;
export type DeploymentMetrics = z.infer<typeof deploymentMetricsSchema>;
export type HotspotFile = z.infer<typeof hotspotFileSchema>;
export type ReviewQueueItem = z.infer<typeof reviewQueueItemSchema>;
export type ContributorDistributionItem = z.infer<typeof contributorDistributionItemSchema>;
export type ReviewerDistributionItem = z.infer<typeof reviewerDistributionItemSchema>;
export type WorkloadDistribution = z.infer<typeof workloadDistributionSchema>;
export type RepositoryMetricsPayload = z.infer<typeof repositoryMetricsPayloadSchema>;
