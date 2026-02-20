import { z } from "zod";
import { ResponseFormat } from "../constants.js";

export const PaginationSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum results to return (1-100, default: 20)"),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of results to skip for pagination (default: 0)"),
});

export const ResponseFormatSchema = z
  .nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe(
    "Output format: 'markdown' for human-readable or 'json' for machine-readable"
  );

export const DateRangeSchema = z.object({
  start_date: z
    .string()
    .optional()
    .describe("Start date in ISO 8601 format (e.g., 2024-01-01)"),
  end_date: z
    .string()
    .optional()
    .describe("End date in ISO 8601 format (e.g., 2024-12-31)"),
});
