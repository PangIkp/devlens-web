import { z } from "zod";

export const repositoryStatusSchema = z.enum(["active", "inactive", "archived"]);

const repositoryIdentifierSchema = z.string().min(1);
const githubIdSchema = z.union([z.string().min(1), z.number().finite()]).transform(String);

export const repositorySchema = z.object({
  id: repositoryIdentifierSchema,
  organizationId: repositoryIdentifierSchema,
  githubId: githubIdSchema,
  name: z.string(),
  fullName: z.string(),
  defaultBranch: z.string().nullable(),
  isActive: z.boolean(),
  archivedAt: z.string().datetime().nullable(),
  lastSyncedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().nullable(),
});

export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const repositoryResponseSchema = z.object({
  data: repositorySchema,
});

export const repositoryListBodySchema = z.object({
  data: z.array(repositorySchema),
  meta: paginationMetaSchema.optional(),
});

export type Repository = z.infer<typeof repositorySchema>;
export type RepositoryStatus = z.infer<typeof repositoryStatusSchema>;
export type RepositoryListResponse = z.infer<typeof repositoryListBodySchema> & {
  meta: z.infer<typeof paginationMetaSchema>;
};
export type RepositoryResponse = z.infer<typeof repositoryResponseSchema>;
