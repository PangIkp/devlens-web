import { z } from "zod";

const repositoryRefSchema = z.object({
  id: z.string().min(1),
  fullName: z.string(),
});

const reviewSchema = z.object({
  id: z.string().min(1),
  githubReviewId: z.number().int(),
  reviewer: z.string(),
  state: z.string(),
  reviewRequestedAt: z.string().nullable().optional(),
  firstReviewAt: z.string().nullable().optional(),
  reviewSubmittedAt: z.string().nullable().optional(),
});

const fileChangeSchema = z.object({
  id: z.string().min(1),
  filePath: z.string(),
  additions: z.number().int(),
  deletions: z.number().int(),
  commitCount: z.number().int(),
});

export const pullRequestListItemSchema = z.object({
  id: z.string().min(1),
  repository: repositoryRefSchema,
  githubPrId: z.number().int(),
  number: z.number().int(),
  title: z.string(),
  author: z.string(),
  state: z.string(),
  createdAt: z.string(),
  mergedAt: z.string().nullable().optional(),
  closedAt: z.string().nullable().optional(),
  additions: z.number().int(),
  deletions: z.number().int(),
  filesChanged: z.number().int(),
  isDraft: z.boolean(),
});

export const pullRequestDetailSchema = pullRequestListItemSchema.extend({
  reviews: z.array(reviewSchema),
  fileChanges: z.array(fileChangeSchema),
});

export const pullRequestListResponseSchema = z.object({
  data: z.array(pullRequestListItemSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export const pullRequestResponseSchema = z.object({
  data: pullRequestDetailSchema,
});

export type PullRequestListItem = z.infer<typeof pullRequestListItemSchema>;
export type PullRequestDetail = z.infer<typeof pullRequestDetailSchema>;
