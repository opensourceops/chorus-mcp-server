import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema, DateRangeSchema } from "./common.js";

export const ListVideoConferencesSchema = z
  .object({
    response_format: ResponseFormatSchema,
  })
  .merge(DateRangeSchema)
  .merge(PaginationSchema)
  .strict();

export type ListVideoConferencesInput = z.infer<typeof ListVideoConferencesSchema>;

export const GetVideoConferenceSchema = z
  .object({
    conference_id: z.string().describe("The video conference ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetVideoConferenceInput = z.infer<typeof GetVideoConferenceSchema>;

export const UploadRecordingSchema = z
  .object({
    title: z.string().max(500).describe("Title for the recording"),
    recording_url: z
      .string()
      .url()
      .describe("URL of the recording file to upload"),
    participants: z
      .array(
        z.object({
          name: z.string().describe("Participant name"),
          email: z
            .string()
            .email()
            .optional()
            .describe("Participant email"),
        })
      )
      .min(1)
      .describe("List of participants in the recording"),
    date: z.string().describe("Date of the recording (ISO 8601)"),
    duration_seconds: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Duration in seconds"),
    external_id: z
      .string()
      .optional()
      .describe("External reference ID from your system"),
  })
  .strict();

export type UploadRecordingInput = z.infer<typeof UploadRecordingSchema>;

export const DeleteRecordingSchema = z
  .object({
    conference_id: z
      .string()
      .describe("The video conference/recording ID to delete"),
  })
  .strict();

export type DeleteRecordingInput = z.infer<typeof DeleteRecordingSchema>;
