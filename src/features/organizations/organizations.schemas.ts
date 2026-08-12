import { z } from "zod";

export const organizationSchema = z.object({
  id: z.string().min(1),
  githubId: z.union([z.string().min(1), z.number().finite()]).transform(String),
  name: z.string(),
  role: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const organizationsPaginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const organizationListResponseSchema = z.object({
  data: z.array(organizationSchema),
  pagination: organizationsPaginationSchema,
});
