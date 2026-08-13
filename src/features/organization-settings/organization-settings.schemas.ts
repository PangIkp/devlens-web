import { z } from "zod";

export const largePRRuleSettingsSchema = z.object({
  enabled: z.boolean(),
  filesThreshold: z.number().int(),
  totalChangesThreshold: z.number().int(),
});

export const slowReviewRuleSettingsSchema = z.object({
  enabled: z.boolean(),
  waitHoursThreshold: z.number().finite(),
});

export const hotspotRuleSettingsSchema = z.object({
  enabled: z.boolean(),
  scoreThreshold: z.number().int(),
});

export const deploymentFailureRuleSettingsSchema = z.object({
  enabled: z.boolean(),
  minimumDeployments: z.number().int(),
  failureRateThreshold: z.number().finite().min(0).max(1),
});

export const reviewConcentrationRuleSettingsSchema = z.object({
  enabled: z.boolean(),
  minimumReviewCount: z.number().int(),
  shareThreshold: z.number().finite().min(0).max(1),
});

export const bottleneckRuleSettingsSchema = z.object({
  enabled: z.boolean(),
  minimumMergedCount: z.number().int(),
  averageCycleHoursThreshold: z.number().finite(),
  staleOpenCountThreshold: z.number().int(),
  staleOpenAgeDays: z.number().int(),
});

export const metricRuleSettingsSchema = z.object({
  defaultDayType: z.enum(["calendar", "business"]),
  hotspotCommitWeight: z.number().finite().min(0),
  hotspotAdditionsWeight: z.number().finite().min(0),
  hotspotDeletionsWeight: z.number().finite().min(0),
});

export const organizationRuleSettingsSchema = z.object({
  largePR: largePRRuleSettingsSchema,
  slowReview: slowReviewRuleSettingsSchema,
  hotspot: hotspotRuleSettingsSchema,
  deploymentFailure: deploymentFailureRuleSettingsSchema,
  reviewConcentration: reviewConcentrationRuleSettingsSchema,
  bottleneck: bottleneckRuleSettingsSchema,
  metrics: metricRuleSettingsSchema,
  updatedAt: z.string().nullable().optional(),
});

export const organizationRuleSettingsResponseSchema = z.object({
  data: organizationRuleSettingsSchema,
});

export const organizationRetentionSettingsSchema = z.object({
  analyticsRawRetentionDays: z.number().int(),
  enforced: z.boolean(),
  updatedAt: z.string().nullable().optional(),
});

export const organizationRetentionSettingsResponseSchema = z.object({
  data: organizationRetentionSettingsSchema,
});

export type LargePRRuleSettings = z.infer<typeof largePRRuleSettingsSchema>;
export type SlowReviewRuleSettings = z.infer<typeof slowReviewRuleSettingsSchema>;
export type HotspotRuleSettings = z.infer<typeof hotspotRuleSettingsSchema>;
export type DeploymentFailureRuleSettings = z.infer<typeof deploymentFailureRuleSettingsSchema>;
export type ReviewConcentrationRuleSettings = z.infer<typeof reviewConcentrationRuleSettingsSchema>;
export type BottleneckRuleSettings = z.infer<typeof bottleneckRuleSettingsSchema>;
export type MetricRuleSettings = z.infer<typeof metricRuleSettingsSchema>;
export type OrganizationRuleSettings = z.infer<typeof organizationRuleSettingsSchema>;
export type OrganizationRetentionSettings = z.infer<typeof organizationRetentionSettingsSchema>;
