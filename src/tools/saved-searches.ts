import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
import type { ListResponse } from "../types.js";
import {
  ListSavedSearchesSchema, GetSavedSearchSchema, ExecuteSavedSearchSchema,
  type ListSavedSearchesInput, type GetSavedSearchInput, type ExecuteSavedSearchInput,
} from "../schemas/saved-searches.js";

export function registerSavedSearchTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_saved_searches",
    {
      title: "List Saved Searches",
      description: `List saved search queries in Chorus.

Args:
  - limit/offset: Pagination
  - response_format: Output format

Returns: Paginated list of saved searches with names and query info.`,
      inputSchema: ListSavedSearchesSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListSavedSearchesInput) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          "saved-searches", "GET", undefined, { "page[size]": params.limit }
        );
        const searches = data.items || [];
        const response = buildPaginatedResponse(searches, data.total || searches.length, params.offset);

        if (searches.length === 0) {
          return { content: [{ type: "text" as const, text: "No saved searches found." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Saved Searches", "", formatPaginationInfo(response), ""];
          for (const s of searches) {
            const name = (s.name as string) || "Untitled";
            const id = s.id as string;
            const query = s.query as string | undefined;
            lines.push(`- **${name}** (${id})${query ? ` - Query: "${query}"` : ""}`);
          }
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "chorus_get_saved_search",
    {
      title: "Get Saved Search",
      description: `Get a saved search definition including its filters and query.

Args:
  - search_id (string): The saved search ID
  - response_format: Output format

Returns: Saved search with name, query, and filter configuration.`,
      inputSchema: GetSavedSearchSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetSavedSearchInput) => {
      try {
        const search = await makeApiRequest<Record<string, unknown>>(`saved-searches/${params.search_id}`);

        const text = formatOutput(search, () => {
          const name = (search.name as string) || "Untitled";
          const id = search.id as string;
          const query = search.query as string | undefined;
          const filters = search.filters as Record<string, unknown> | undefined;
          const lines: string[] = [`# ${name}`, "", `- **ID**: ${id}`];
          if (query) lines.push(`- **Query**: ${query}`);
          if (filters) {
            lines.push("", "## Filters", "```json", JSON.stringify(filters, null, 2), "```");
          }
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "chorus_execute_saved_search",
    {
      title: "Execute Saved Search",
      description: `Execute a saved search and return matching conversations.

Args:
  - search_id (string): The saved search ID to execute
  - limit/offset: Pagination
  - response_format: Output format

Returns: Paginated list of conversations matching the saved search criteria.`,
      inputSchema: ExecuteSavedSearchSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ExecuteSavedSearchInput) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          `saved-searches/${params.search_id}/execute`, "POST", { "page[size]": params.limit }
        );
        const conversations = data.items || [];
        const response = buildPaginatedResponse(conversations, data.total || conversations.length, params.offset);

        if (conversations.length === 0) {
          return { content: [{ type: "text" as const, text: "No conversations matched this saved search." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Saved Search Results", "", formatPaginationInfo(response), ""];
          for (const c of conversations) {
            const title = (c.title as string) || "Untitled";
            const id = c.id as string;
            const date = (c.date as string) || "";
            lines.push(`- **${title}** (${id}) - ${date}`);
          }
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );
}
