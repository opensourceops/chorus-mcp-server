import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
import type { ListResponse } from "../types.js";
import {
  ListPlaylistsSchema, GetPlaylistSchema, ListPlaylistMomentsSchema,
  type ListPlaylistsInput, type GetPlaylistInput, type ListPlaylistMomentsInput,
} from "../schemas/playlists.js";

export function registerPlaylistTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_playlists",
    {
      title: "List Playlists",
      description: `List coaching playlists in Chorus.

Args:
  - limit/offset: Pagination
  - response_format: Output format

Returns: Paginated list of playlists with names, descriptions, and moment counts.`,
      inputSchema: ListPlaylistsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListPlaylistsInput) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          "playlists", "GET", undefined, { "page[size]": params.limit }
        );
        const playlists = data.items || [];
        const response = buildPaginatedResponse(playlists, data.total || playlists.length, params.offset);

        if (playlists.length === 0) {
          return { content: [{ type: "text" as const, text: "No playlists found." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Playlists", "", formatPaginationInfo(response), ""];
          for (const p of playlists) {
            const name = (p.name as string) || "Untitled";
            const id = p.id as string;
            const childCount = p.child_count as number | undefined;
            const size = p.size as number | undefined;
            lines.push(`- **${name}** (${id})${childCount !== undefined ? ` - ${childCount} items` : ""}${size !== undefined ? ` (${size})` : ""}`);
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
    "chorus_get_playlist",
    {
      title: "Get Playlist",
      description: `Get playlist details including its moments.

Args:
  - playlist_id (string): The playlist ID
  - response_format: Output format

Returns: Playlist with name, description, and list of moments.`,
      inputSchema: GetPlaylistSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetPlaylistInput) => {
      try {
        const playlist = await makeApiRequest<Record<string, unknown>>(`playlists/${params.playlist_id}`);

        const text = formatOutput(playlist, () => {
          const name = (playlist.name as string) || "Untitled";
          const id = playlist.id as string;
          const childCount = playlist.child_count as number | undefined;
          const size = playlist.size as number | undefined;
          const owner = playlist.owner as Record<string, unknown> | undefined;
          const isPrivate = playlist.private as boolean | undefined;
          const lines: string[] = [`# ${name}`, ""];
          lines.push(`- **ID**: ${id}`);
          if (childCount !== undefined) lines.push(`- **Items**: ${childCount}`);
          if (size !== undefined) lines.push(`- **Size**: ${size}`);
          if (owner) lines.push(`- **Owner**: ${(owner.name as string) || (owner.email as string) || "Unknown"}`);
          if (isPrivate !== undefined) lines.push(`- **Private**: ${isPrivate ? "Yes" : "No"}`);
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "chorus_list_playlist_moments",
    {
      title: "List Playlist Moments",
      description: `List all moments in a playlist with timestamps and descriptions.

Args:
  - playlist_id (string): The playlist ID
  - limit/offset: Pagination
  - response_format: Output format

Returns: Paginated list of moments with timestamps, titles, and transcript snippets.`,
      inputSchema: ListPlaylistMomentsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListPlaylistMomentsInput) => {
      try {
        // No separate /playlists/{id}/moments endpoint; fetch playlist metadata instead
        const playlist = await makeApiRequest<Record<string, unknown>>(`playlists/${params.playlist_id}`);
        const name = (playlist.name as string) || "Untitled";
        const childCount = playlist.child_count as number | undefined;
        const size = playlist.size as number | undefined;
        const customSearch = playlist.custom_search as Record<string, unknown> | undefined;

        const text = formatOutput(playlist, () => {
          const lines: string[] = [
            `# Playlist: ${name}`, "",
            `- **ID**: ${params.playlist_id}`,
          ];
          if (childCount !== undefined) lines.push(`- **Items**: ${childCount}`);
          if (size !== undefined) lines.push(`- **Size**: ${size}`);
          if (customSearch) {
            lines.push("", "## Search Criteria", "```json", JSON.stringify(customSearch, null, 2), "```");
          }
          lines.push("", "*Note: The Chorus API does not expose individual playlist moments through a separate endpoint. Use `chorus_list_moments` to browse shared moments by date range.*");
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );
}
