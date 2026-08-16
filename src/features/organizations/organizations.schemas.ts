import { z } from "zod";

export const organizationSchema = z.object({
  id: z.string().min(1),
  githubId: z.union([z.string().min(1), z.number().finite()]).transform(String),
  slug: z.string().min(1).optional(),
  name: z.string(),
  role: z.string().optional(),
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

export const organizationResponseSchema = z.object({
  data: organizationSchema,
});

export const createOrganizationRequestSchema = z.object({
  githubId: z.coerce.number().int().nonnegative(),
  slug: z.string().min(1),
  name: z.string().min(1),
});

export const updateOrganizationRequestSchema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
});

export const organizationMemberRoleSchema = z.enum(["owner", "admin", "member"]);

export const organizationMemberSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  role: organizationMemberRoleSchema,
});

export const organizationMemberListResponseSchema = z.object({
  data: z.array(organizationMemberSchema),
});

export const organizationMemberResponseSchema = z.object({
  data: organizationMemberSchema,
});

export const createOrganizationMemberRequestSchema = z.object({
  userId: z.string().min(1),
  role: organizationMemberRoleSchema,
});

export const updateOrganizationMemberRequestSchema = z.object({
  role: organizationMemberRoleSchema,
});

export type Organization = z.infer<typeof organizationSchema>;
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;
export type OrganizationMemberRole = z.infer<typeof organizationMemberRoleSchema>;
