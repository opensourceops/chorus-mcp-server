import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema } from "./common.js";

export const ListPlaylistsSchema = z
  .object({
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type ListPlaylistsInput = z.infer<typeof ListPlaylistsSchema>;

export const GetPlaylistSchema = z
  .object({
    playlist_id: z.string().describe("The playlist ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetPlaylistInput = z.infer<typeof GetPlaylistSchema>;

export const ListPlaylistMomentsSchema = z
  .object({
    playlist_id: z.string().describe("The playlist ID"),
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type ListPlaylistMomentsInput = z.infer<typeof ListPlaylistMomentsSchema>;
