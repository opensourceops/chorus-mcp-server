import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import {
  formatOutput,
  formatDate,
  formatDuration,
  formatParticipants,
  formatPaginationInfo,
  buildPaginatedResponse,
} from "../services/formatters.js";
import type { ListResponse, ChorusParticipant } from "../types.js";
import {
  ListConversationsSchema,
  GetConversationSchema,
  GetTranscriptSchema,
  GetConversationTrackersSchema,
  SearchConversationsSchema,
  type ListConversationsInput,
  type GetConversationInput,
  type GetTranscriptInput,
  type GetConversationTrackersInput,
  type SearchConversationsInput,
} from "../schemas/conversations.js";

export function registerConversationTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_conversations",
    {
      title: "List Chorus Conversations",
      description: `List conversations (calls and meetings) in Chorus with optional filters.

Args:
  - start_date (string, optional): Filter conversations after this date (ISO 8601)
  - end_date (string, optional): Filter conversations before this date (ISO 8601)
  - participant_email (string, optional): Filter by participant email
  - team_id (string, optional): Filter by team ID
  - limit (number): Max results 1-100 (default: 20)
  - offset (number): Pagination offset (default: 0)
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: Paginated list of conversations with title, date, duration, and participants.`,
      inputSchema: ListConversationsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListConversationsInput) => {
      try {
        const queryParams: Record<string, unknown> = {
          "page[size]": params.limit,
        };
        if (params.start_date) queryParams["filter[start_date]"] = params.start_date;
        if (params.end_date) queryParams["filter[end_date]"] = params.end_date;
        if (params.participant_email)
          queryParams["filter[participant_email]"] = params.participant_email;
        if (params.team_id) queryParams["filter[team_id]"] = params.team_id;

        const data = await makeApiRequest<ListResponse>("conversations", "GET", undefined, queryParams);

        const conversations = data.items || [];
        const total = data.total || conversations.length;
        const response = buildPaginatedResponse(
          conversations,
          total,
          params.offset
        );

        if (conversations.length === 0) {
          return {
            content: [
              { type: "text" as const, text: "No conversations found matching the specified filters." },
            ],
          };
        }

        const text = formatOutput(
          response,
          () => {
            const lines: string[] = ["# Conversations", ""];
            lines.push(formatPaginationInfo(response));
            lines.push("");
            for (const c of conversations) {
              const title = (c.title as string) || "Untitled";
              const id = c.id as string;
              const date = c.date as string;
              const duration = c.duration as number;
              const participants = (c.participants || []) as unknown as ChorusParticipant[];
              const status = c.status as string | undefined;
              lines.push(`## ${title} (${id})`);
              lines.push(`- **Date**: ${formatDate(date)}`);
              lines.push(`- **Duration**: ${formatDuration(duration)}`);
              lines.push(
                `- **Participants**: ${formatParticipants(participants)}`
              );
              if (status) lines.push(`- **Status**: ${status}`);
              lines.push("");
            }
            return lines.join("\n");
          },
          params.response_format
        );

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
        };
      }
    }
  );

  server.registerTool(
    "chorus_get_conversation",
    {
      title: "Get Chorus Conversation",
      description: `Get full details of a single conversation including metadata, participants, duration, and summary.

Args:
  - conversation_id (string): The conversation/call ID
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: Conversation details with title, date, duration, participants, summary, and recording info.`,
      inputSchema: GetConversationSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetConversationInput) => {
      try {
        const conversation = await makeApiRequest<Record<string, unknown>>(
          `conversations/${params.conversation_id}`
        );

        const text = formatOutput(
          conversation,
          () => {
            const title = (conversation.title as string) || "Untitled Conversation";
            const id = conversation.id as string;
            const date = conversation.date as string;
            const duration = conversation.duration as number;
            const participants = (conversation.participants || []) as unknown as ChorusParticipant[];
            const type = conversation.type as string | undefined;
            const status = conversation.status as string | undefined;
            const summary = conversation.summary as string | undefined;
            const lines: string[] = [
              `# ${title}`,
              "",
              `- **ID**: ${id}`,
              `- **Date**: ${formatDate(date)}`,
              `- **Duration**: ${formatDuration(duration)}`,
              `- **Participants**: ${formatParticipants(participants)}`,
            ];
            if (type) lines.push(`- **Type**: ${type}`);
            if (status)
              lines.push(`- **Status**: ${status}`);
            if (summary) {
              lines.push("", "## Summary", summary);
            }
            if (participants.length > 0) {
              lines.push("", "## Participants");
              for (const p of participants) {
                const pName = (p.name as string) || "Unknown";
                const pEmail = p.email as string | undefined;
                const pRole = p.role as string | undefined;
                lines.push(
                  `- **${pName}**${pEmail ? ` (${pEmail})` : ""}${pRole ? ` - ${pRole}` : ""}`
                );
              }
            }
            return lines.join("\n");
          },
          params.response_format
        );

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
        };
      }
    }
  );

  server.registerTool(
    "chorus_get_transcript",
    {
      title: "Get Conversation Transcript",
      description: `Retrieve the full transcript of a conversation with speaker attribution and timestamps.

Args:
  - conversation_id (string): The conversation/call ID
  - speaker_filter (string, optional): Filter transcript to a specific speaker name
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: Speaker-attributed transcript with timestamps. If speaker_filter is set, only that speaker's segments are returned.`,
      inputSchema: GetTranscriptSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetTranscriptInput) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          `conversations/${params.conversation_id}/transcript`
        );

        let segments = data.items || [];

        if (params.speaker_filter) {
          const filter = params.speaker_filter.toLowerCase();
          segments = segments.filter((s) =>
            ((s.speaker as string) || "").toLowerCase().includes(filter)
          );
        }

        if (segments.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: params.speaker_filter
                  ? `No transcript segments found for speaker "${params.speaker_filter}".`
                  : "No transcript available for this conversation.",
              },
            ],
          };
        }

        const text = formatOutput(
          { segments },
          () => {
            const lines: string[] = ["# Transcript", ""];
            if (params.speaker_filter) {
              lines.push(
                `*Filtered to speaker: ${params.speaker_filter}*`,
                ""
              );
            }
            for (const seg of segments) {
              const startTime = seg.startTime as number;
              const speaker = (seg.speaker as string) || "Unknown";
              const segText = (seg.text as string) || "";
              const time = formatDuration(Math.floor(startTime / 1000));
              lines.push(`**[${time}] ${speaker}**: ${segText}`, "");
            }
            return lines.join("\n");
          },
          params.response_format
        );

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
        };
      }
    }
  );

  server.registerTool(
    "chorus_get_conversation_trackers",
    {
      title: "Get Conversation Trackers",
      description: `Get tracker hits (competitor mentions, keywords, topics) detected in a conversation.

Args:
  - conversation_id (string): The conversation/call ID
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: List of trackers with name, category, hit count, and occurrences with timestamps and text.`,
      inputSchema: GetConversationTrackersSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetConversationTrackersInput) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          `conversations/${params.conversation_id}/trackers`
        );

        const trackers = data.items || [];

        if (trackers.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No trackers detected in this conversation.",
              },
            ],
          };
        }

        const text = formatOutput(
          { trackers },
          () => {
            const lines: string[] = ["# Conversation Trackers", ""];
            for (const t of trackers) {
              const name = (t.name as string) || "Unknown";
              const category = t.category as string | undefined;
              const count = t.count as number;
              const occurrences = (t.occurrences || []) as Array<Record<string, unknown>>;
              lines.push(
                `## ${name}${category ? ` (${category})` : ""}`
              );
              lines.push(`- **Occurrences**: ${count}`);
              if (occurrences.length > 0) {
                lines.push("- **Instances**:");
                for (const occ of occurrences) {
                  const timestamp = occ.timestamp as number;
                  const occText = (occ.text as string) || "";
                  const time = formatDuration(
                    Math.floor(timestamp / 1000)
                  );
                  lines.push(`  - [${time}]: "${occText}"`);
                }
              }
              lines.push("");
            }
            return lines.join("\n");
          },
          params.response_format
        );

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
        };
      }
    }
  );

  server.registerTool(
    "chorus_search_conversations",
    {
      title: "Search Chorus Conversations",
      description: `Search conversations by keyword, tracker, participant, or date range.

Args:
  - query (string): Search keyword or phrase
  - participant_email (string, optional): Filter by participant email
  - tracker_name (string, optional): Filter by tracker name
  - start_date (string, optional): Filter after this date (ISO 8601)
  - end_date (string, optional): Filter before this date (ISO 8601)
  - limit (number): Max results 1-100 (default: 20)
  - offset (number): Pagination offset (default: 0)
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: Paginated list of matching conversations with relevance ranking.`,
      inputSchema: SearchConversationsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: SearchConversationsInput) => {
      try {
        const queryParams: Record<string, unknown> = {
          q: params.query,
          "page[size]": params.limit,
        };
        if (params.start_date) queryParams["filter[start_date]"] = params.start_date;
        if (params.end_date) queryParams["filter[end_date]"] = params.end_date;
        if (params.participant_email)
          queryParams["filter[participant_email]"] = params.participant_email;
        if (params.tracker_name) queryParams["filter[tracker_name]"] = params.tracker_name;

        const data = await makeApiRequest<ListResponse>("conversations/search", "GET", undefined, queryParams);

        const conversations = data.items || [];
        const total = data.total || conversations.length;
        const response = buildPaginatedResponse(
          conversations,
          total,
          params.offset
        );

        if (conversations.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No conversations found matching "${params.query}".`,
              },
            ],
          };
        }

        const text = formatOutput(
          response,
          () => {
            const lines: string[] = [
              `# Search Results: "${params.query}"`,
              "",
            ];
            lines.push(formatPaginationInfo(response));
            lines.push("");
            for (const c of conversations) {
              const title = (c.title as string) || "Untitled";
              const id = c.id as string;
              const date = c.date as string;
              const duration = c.duration as number;
              const participants = (c.participants || []) as unknown as ChorusParticipant[];
              lines.push(`## ${title} (${id})`);
              lines.push(`- **Date**: ${formatDate(date)}`);
              lines.push(`- **Duration**: ${formatDuration(duration)}`);
              lines.push(
                `- **Participants**: ${formatParticipants(participants)}`
              );
              lines.push("");
            }
            return lines.join("\n");
          },
          params.response_format
        );

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
        };
      }
    }
  );
}
