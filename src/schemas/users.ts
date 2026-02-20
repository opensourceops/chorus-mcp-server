import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema } from "./common.js";

export const ListUsersSchema = z
  .object({
    team_id: z.string().optional().describe("Filter users by team ID"),
    role: z
      .string()
      .optional()
      .describe("Filter by role (e.g., 'admin', 'user', 'manager')"),
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type ListUsersInput = z.infer<typeof ListUsersSchema>;

export const GetUserSchema = z
  .object({
    user_id: z.string().describe("The Chorus user ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetUserInput = z.infer<typeof GetUserSchema>;

export const SearchUsersSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .max(200)
      .describe("Search string to match against user names or emails"),
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type SearchUsersInput = z.infer<typeof SearchUsersSchema>;
