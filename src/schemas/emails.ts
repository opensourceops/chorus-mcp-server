import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema, DateRangeSchema } from "./common.js";

export const ListEmailsSchema = z
  .object({
    sender_email: z
      .string()
      .email()
      .optional()
      .describe("Filter by sender email address"),
    recipient_email: z
      .string()
      .email()
      .optional()
      .describe("Filter by recipient email address"),
    response_format: ResponseFormatSchema,
  })
  .merge(DateRangeSchema)
  .merge(PaginationSchema)
  .strict();

export type ListEmailsInput = z.infer<typeof ListEmailsSchema>;

export const GetEmailSchema = z
  .object({
    email_id: z.string().describe("The email engagement ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetEmailInput = z.infer<typeof GetEmailSchema>;
