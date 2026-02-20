import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema, DateRangeSchema } from "./common.js";

export const ListScorecardsSchema = z
  .object({
    user_id: z
      .string()
      .optional()
      .describe("Filter scorecards by the evaluated rep's user ID"),
    conversation_id: z
      .string()
      .optional()
      .describe("Filter scorecards for a specific conversation"),
    template_id: z
      .string()
      .optional()
      .describe("Filter by scorecard template ID"),
    response_format: ResponseFormatSchema,
  })
  .merge(DateRangeSchema)
  .merge(PaginationSchema)
  .strict();

export type ListScorecardsInput = z.infer<typeof ListScorecardsSchema>;

export const GetScorecardSchema = z
  .object({
    scorecard_id: z.string().describe("The scorecard ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetScorecardInput = z.infer<typeof GetScorecardSchema>;

export const ListScorecardTemplatesSchema = z
  .object({
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type ListScorecardTemplatesInput = z.infer<typeof ListScorecardTemplatesSchema>;

export const GetScorecardTemplateSchema = z
  .object({
    template_id: z.string().describe("The scorecard template ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetScorecardTemplateInput = z.infer<typeof GetScorecardTemplateSchema>;
