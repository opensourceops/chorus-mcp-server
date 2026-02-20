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

/**
 * Fetch a single conversation and return its flattened attributes.
 * Many tools need the same conversation blob so this avoids duplication.
 */
async function fetchConversation(conversationId: string): Promise<Record<string, unknown>> {
  return makeApiRequest<Record<string, unknown>>(`conversations/${conversationId}`);
}

/**
 * Extract common metadata from a conversation record.
 * The Chorus API nests date/duration inside `recording`.
 */
function extractMeta(c: Record<string, unknown>) {
  const recording = (c.recording || {}) as Record<string, unknown>;
  return {
    name: (c.name as string) || "Untitled Conversation",
    id: c.id as string,
    date: (recording.start_time as string) || "",
    duration: (recording.duration as number) || 0,
    participants: (c.participants || []) as unknown as ChorusParticipant[],
    status: c.status as string | undefined,
    summary: c.summary as string | undefined,
    actionItems: c.action_items as string[] | undefined,
    recording,
  };
}

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
              const meta = extractMeta(c);
              lines.push(`## ${meta.name} (${meta.id})`);
              lines.push(`- **Date**: ${formatDate(meta.date)}`);
              lines.push(`- **Duration**: ${formatDuration(meta.duration)}`);
              lines.push(
                `- **Participants**: ${formatParticipants(meta.participants)}`
              );
              if (meta.status) lines.push(`- **Status**: ${meta.status}`);
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
        const conversation = await fetchConversation(params.conversation_id);
        const meta = extractMeta(conversation);

        const text = formatOutput(
          conversation,
          () => {
            const lines: string[] = [
              `# ${meta.name}`,
              "",
              `- **ID**: ${meta.id}`,
              `- **Date**: ${formatDate(meta.date)}`,
              `- **Duration**: ${formatDuration(meta.duration)}`,
              `- **Participants**: ${formatParticipants(meta.participants)}`,
            ];
            if (meta.status)
              lines.push(`- **Status**: ${meta.status}`);
            if (meta.summary) {
              lines.push("", "## Summary", meta.summary);
            }
            if (meta.actionItems && meta.actionItems.length > 0) {
              lines.push("", "## Action Items");
              for (const item of meta.actionItems) {
                lines.push(`- ${item}`);
              }
            }
            if (meta.participants.length > 0) {
              lines.push("", "## Participants");
              for (const p of meta.participants) {
                const pName = (p.name as string) || "Unknown";
                const pEmail = p.email as string | undefined;
                const pRole = p.role as string | undefined;
                const pType = p.type as string | undefined;
                lines.push(
                  `- **${pName}**${pEmail ? ` (${pEmail})` : ""}${pRole ? ` - ${pRole}` : ""}${pType ? ` [${pType}]` : ""}`
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
        // Transcript data is embedded in the conversation response under recording.utterances
        const conversation = await fetchConversation(params.conversation_id);
        const recording = (conversation.recording || {}) as Record<string, unknown>;
        let utterances = (recording.utterances || []) as Array<Record<string, unknown>>;

        if (params.speaker_filter) {
          const filter = params.speaker_filter.toLowerCase();
          utterances = utterances.filter((u) =>
            ((u.speaker_name as string) || "").toLowerCase().includes(filter)
          );
        }

        if (utterances.length === 0) {
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
          { utterances },
          () => {
            const lines: string[] = ["# Transcript", ""];
            if (params.speaker_filter) {
              lines.push(
                `*Filtered to speaker: ${params.speaker_filter}*`,
                ""
              );
            }
            for (const u of utterances) {
              const snippetTime = u.snippet_time as number;
              const speaker = (u.speaker_name as string) || "Unknown";
              const snippet = (u.snippet as string) || "";
              const speakerType = u.speaker_type as string | undefined;
              const time = formatDuration(Math.floor(snippetTime));
              lines.push(`**[${time}] ${speaker}**${speakerType ? ` (${speakerType})` : ""}: ${snippet}`, "");
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
        // Tracker data is embedded in the conversation response under recording.trackers
        const conversation = await fetchConversation(params.conversation_id);
        const recording = (conversation.recording || {}) as Record<string, unknown>;
        const trackers = (recording.trackers || []) as Array<Record<string, unknown>>;

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
              const type = t.type as string | undefined;
              const count = t.count as number;
              const mentions = (t.mentions || []) as Array<Record<string, unknown>>;
              lines.push(
                `## ${name}${type ? ` (${type})` : ""}`
              );
              lines.push(`- **Occurrences**: ${count}`);
              if (mentions.length > 0) {
                lines.push(`- **Mention count**: ${mentions.length}`);
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
              const meta = extractMeta(c);
              lines.push(`## ${meta.name} (${meta.id})`);
              lines.push(`- **Date**: ${formatDate(meta.date)}`);
              lines.push(`- **Duration**: ${formatDuration(meta.duration)}`);
              lines.push(
                `- **Participants**: ${formatParticipants(meta.participants)}`
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
