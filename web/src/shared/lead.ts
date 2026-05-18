import { z } from "zod";

export const leadStatusEnum = z.enum(["NEW", "CONTACTED", "CONVERTED"]);
export type LeadStatus = z.infer<typeof leadStatusEnum>;

export const LEAD_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "CONVERTED"];

const phoneRegex = /^[+\d][\d\s\-()]{5,30}$/;

export const leadCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Invalid phone number"),
  status: leadStatusEnum.optional().default("NEW"),
  assignedToId: z.string().trim().min(1).nullish(),
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional(),
  status: leadStatusEnum.optional(),
});

export const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  status: leadStatusEnum,
  assignedToId: z.string().nullable(),
  assignedTo: z
    .object({ id: z.string(), name: z.string(), email: z.string() })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const leadListResponseSchema = z.object({
  data: z.array(leadSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const analyticsSummarySchema = z.object({
  total: z.number(),
  byStatus: z.object({
    NEW: z.number(),
    CONTACTED: z.number(),
    CONVERTED: z.number(),
  }),
  last7Days: z.number(),
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
export type Lead = z.infer<typeof leadSchema>;
export type LeadListResponse = z.infer<typeof leadListResponseSchema>;
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
