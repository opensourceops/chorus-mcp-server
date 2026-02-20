import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatDuration, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
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
            const momentCount = p.momentCount as number | undefined;
            const description = p.description as string | undefined;
            lines.push(`- **${name}** (${id})${momentCount !== undefined ? ` - ${momentCount} moments` : ""}${description ? `: ${description}` : ""}`);
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
          const description = playlist.description as string | undefined;
          const momentCount = playlist.momentCount as number | undefined;
          const moments = (playlist.moments || []) as Array<Record<string, unknown>>;
          const lines: string[] = [`# ${name}`, ""];
          if (description) lines.push(description, "");
          lines.push(`- **ID**: ${id}`);
          if (momentCount !== undefined) lines.push(`- **Moments**: ${momentCount}`);
          if (moments.length > 0) {
            lines.push("", "## Moments");
            for (const m of moments) {
              const timestamp = m.timestamp as number;
              const mTitle = (m.title as string) || "Untitled";
              const mDesc = m.description as string | undefined;
              const time = formatDuration(Math.floor(timestamp / 1000));
              lines.push(`- [${time}] **${mTitle}**${mDesc ? `: ${mDesc}` : ""}`);
            }
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
        const data = await makeApiRequest<ListResponse>(
          `playlists/${params.playlist_id}/moments`, "GET", undefined, { "page[size]": params.limit }
        );
        const moments = data.items || [];
        const response = buildPaginatedResponse(moments, data.total || moments.length, params.offset);

        if (moments.length === 0) {
          return { content: [{ type: "text" as const, text: "No moments found in this playlist." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Playlist Moments", "", formatPaginationInfo(response), ""];
          for (const m of moments) {
            const timestamp = m.timestamp as number;
            const title = (m.title as string) || "Untitled";
            const id = m.id as string;
            const conversationId = m.conversationId as string;
            const type = m.type as string | undefined;
            const mText = m.text as string | undefined;
            const time = formatDuration(Math.floor(timestamp / 1000));
            lines.push(`## ${title} (${id})`);
            lines.push(`- **Timestamp**: ${time}`);
            lines.push(`- **Conversation**: ${conversationId}`);
            if (type) lines.push(`- **Type**: ${type}`);
            if (mText) lines.push(`- **Snippet**: "${mText}"`);
            lines.push("");
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
