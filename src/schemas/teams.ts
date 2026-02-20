import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema } from "./common.js";

export const ListTeamsSchema = z
  .object({
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type ListTeamsInput = z.infer<typeof ListTeamsSchema>;

export const GetTeamSchema = z
  .object({
    team_id: z.string().describe("The team ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetTeamInput = z.infer<typeof GetTeamSchema>;

export const GetTeamMembersSchema = z
  .object({
    team_id: z.string().describe("The team ID"),
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type GetTeamMembersInput = z.infer<typeof GetTeamMembersSchema>;
