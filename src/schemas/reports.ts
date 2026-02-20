import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema, DateRangeSchema } from "./common.js";

export const ListReportsSchema = z
  .object({
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type ListReportsInput = z.infer<typeof ListReportsSchema>;

export const GetReportSchema = z
  .object({
    report_id: z.string().describe("The report ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetReportInput = z.infer<typeof GetReportSchema>;

export const GetActivityMetricsSchema = z
  .object({
    team_id: z.string().optional().describe("Filter metrics by team ID"),
    user_id: z
      .string()
      .optional()
      .describe("Filter metrics for a specific user"),
    start_date: z
      .string()
      .describe("Start date for the metrics period (ISO 8601)"),
    end_date: z
      .string()
      .describe("End date for the metrics period (ISO 8601)"),
    metrics: z
      .array(
        z.enum([
          "total_calls",
          "total_duration",
          "avg_duration",
          "talk_ratio",
          "longest_monologue",
          "interactivity",
          "patience",
          "question_rate",
        ])
      )
      .optional()
      .describe("Specific metrics to include; omit for all"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetActivityMetricsInput = z.infer<typeof GetActivityMetricsSchema>;
