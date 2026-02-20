import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema, DateRangeSchema } from "./common.js";

export const FilterEngagementsSchema = z
  .object({
    engagement_type: z
      .enum(["meeting", "dialer", "all"])
      .default("all")
      .describe("Type of engagement to filter"),
    participant_emails: z
      .array(z.string().email())
      .optional()
      .describe("Filter by participant email addresses"),
    outcome: z
      .string()
      .optional()
      .describe("Filter by engagement outcome"),
    response_format: ResponseFormatSchema,
  })
  .merge(DateRangeSchema)
  .merge(PaginationSchema)
  .strict();

export type FilterEngagementsInput = z.infer<typeof FilterEngagementsSchema>;

export const GetEngagementSchema = z
  .object({
    engagement_id: z.string().describe("The engagement ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetEngagementInput = z.infer<typeof GetEngagementSchema>;
