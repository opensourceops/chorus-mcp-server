import { z } from "zod";
import { PaginationSchema, ResponseFormatSchema } from "./common.js";

export const ListSavedSearchesSchema = z
  .object({
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type ListSavedSearchesInput = z.infer<typeof ListSavedSearchesSchema>;

export const GetSavedSearchSchema = z
  .object({
    search_id: z.string().describe("The saved search ID"),
    response_format: ResponseFormatSchema,
  })
  .strict();

export type GetSavedSearchInput = z.infer<typeof GetSavedSearchSchema>;

export const ExecuteSavedSearchSchema = z
  .object({
    search_id: z.string().describe("The saved search ID to execute"),
    response_format: ResponseFormatSchema,
  })
  .merge(PaginationSchema)
  .strict();

export type ExecuteSavedSearchInput = z.infer<typeof ExecuteSavedSearchSchema>;
