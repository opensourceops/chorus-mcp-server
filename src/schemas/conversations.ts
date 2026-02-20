import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema, DateRangeSchema } from "./common.js";

export const ListConversationsSchema = z
  .object({
    participant_email: z
      .string()
      .email()
      .optional()
      .describe("Filter by participant email address"),
    team_id: z.string().optional().describe("Filter by team ID"),
    response_format: ResponseFormatSchema,
  })
  .merge(DateRangeSchema)
  .merge(PaginationSchema)
  .strict();

export type ListConversationsInput = z.infer<typeof ListConversationsSchema>;

export const GetConversationSchema = z
  .object({
    conversation_id: z.string().describe("The conversation/call ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetConversationInput = z.infer<typeof GetConversationSchema>;

export const GetTranscriptSchema = z
  .object({
    conversation_id: z.string().describe("The conversation/call ID"),
    speaker_filter: z
      .string()
      .optional()
      .describe("Filter transcript to a specific speaker name"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetTranscriptInput = z.infer<typeof GetTranscriptSchema>;

export const GetConversationTrackersSchema = z
  .object({
    conversation_id: z.string().describe("The conversation/call ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetConversationTrackersInput = z.infer<typeof GetConversationTrackersSchema>;

export const SearchConversationsSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .describe("Search keyword or phrase to match in conversations"),
    participant_email: z
      .string()
      .email()
      .optional()
      .describe("Filter by participant email address"),
    tracker_name: z
      .string()
      .optional()
      .describe("Filter by tracker name (e.g., competitor name)"),
    response_format: ResponseFormatSchema,
  })
  .merge(DateRangeSchema)
  .merge(PaginationSchema)
  .strict();

export type SearchConversationsInput = z.infer<typeof SearchConversationsSchema>;
