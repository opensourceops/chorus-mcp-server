import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema } from "./common.js";

export const ListMomentsSchema = z
  .object({
    conversation_id: z
      .string()
      .optional()
      .describe("Filter moments by conversation ID"),
    start_date: z
      .string()
      .optional()
      .describe("Start date for shared_on filter (ISO 8601, e.g. 2024-01-01T00:00:00.000Z). Defaults to 90 days ago."),
    end_date: z
      .string()
      .optional()
      .describe("End date for shared_on filter (ISO 8601, e.g. 2024-12-31T23:59:59.000Z). Defaults to now."),
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type ListMomentsInput = z.infer<typeof ListMomentsSchema>;

export const GetMomentSchema = z
  .object({
    moment_id: z.string().describe("The moment ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetMomentInput = z.infer<typeof GetMomentSchema>;

export const CreateMomentSchema = z
  .object({
    conversation_id: z
      .string()
      .describe("The conversation ID to add the moment to"),
    timestamp_ms: z
      .number()
      .int()
      .min(0)
      .describe("Timestamp in milliseconds from the start of the call"),
    duration_ms: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Duration of the moment in milliseconds"),
    title: z.string().max(200).describe("Title/label for the moment"),
    description: z
      .string()
      .max(2000)
      .optional()
      .describe("Description of the moment"),
    type: z.string().optional().describe("Moment type/category"),
  })
  .strict();

export type CreateMomentInput = z.infer<typeof CreateMomentSchema>;

export const DeleteMomentSchema = z
  .object({
    moment_id: z.string().describe("The moment ID to delete"),
  })
  .strict();

export type DeleteMomentInput = z.infer<typeof DeleteMomentSchema>;
