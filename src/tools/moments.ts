import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatDate, formatDuration, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
import type { ListResponse } from "../types.js";
import {
  ListMomentsSchema, GetMomentSchema, CreateMomentSchema, DeleteMomentSchema,
  type ListMomentsInput, type GetMomentInput, type CreateMomentInput, type DeleteMomentInput,
} from "../schemas/moments.js";

export function registerMomentTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_moments",
    {
      title: "List External Moments",
      description: `List external moments across conversations.

Args:
  - conversation_id (string, optional): Filter by conversation ID
  - limit/offset: Pagination
  - response_format: Output format

Returns: Paginated list of moments with timestamps and descriptions.`,
      inputSchema: ListMomentsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListMomentsInput) => {
      try {
        const qp: Record<string, unknown> = { "page[size]": params.limit };
        if (params.conversation_id) qp["filter[conversation_id]"] = params.conversation_id;

        // Chorus API requires filter[shared_on] as a date range "start:end"
        const endDate = params.end_date || new Date().toISOString().replace(/Z$/, "").split(".")[0] + ".000Z";
        const startDate = params.start_date || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().replace(/Z$/, "").split(".")[0] + ".000Z";
        qp["filter[shared_on]"] = `${startDate}:${endDate}`;

        const data = await makeApiRequest<ListResponse>("moments", "GET", undefined, qp);
        const moments = data.items || [];
        const response = buildPaginatedResponse(moments, data.total || moments.length, params.offset);

        if (moments.length === 0) {
          return { content: [{ type: "text" as const, text: "No moments found in the specified date range." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Shared Moments", "", formatPaginationInfo(response), ""];
          for (const m of moments) {
            const subject = (m.subject as string) || "Untitled";
            const id = m.id as string;
            const conversation = (m.conversation as string) || "";
            const sharedOn = (m.shared_on as string) || "";
            const duration = m.duration as number | undefined;
            const creator = m.creator as Record<string, unknown> | undefined;
            const creatorName = (creator?.name as string) || "";
            lines.push(`- **${subject}** (${id})`);
            if (sharedOn) lines.push(`  Shared: ${formatDate(sharedOn)}${creatorName ? ` by ${creatorName}` : ""}`);
            if (conversation) lines.push(`  Conversation: ${conversation}`);
            if (duration) lines.push(`  Duration: ${formatDuration(Math.floor(duration))}`);
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

  server.registerTool(
    "chorus_get_moment",
    {
      title: "Get Moment",
      description: `Get details of a specific moment including transcript snippet and context.

Args:
  - moment_id (string): The moment ID
  - response_format: Output format

Returns: Moment with timestamp, title, description, type, and transcript text.`,
      inputSchema: GetMomentSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetMomentInput) => {
      try {
        const moment = await makeApiRequest<Record<string, unknown>>(`moments/${params.moment_id}`);

        const text = formatOutput(moment, () => {
          const timestamp = moment.timestamp as number;
          const title = (moment.title as string) || "Untitled";
          const id = moment.id as string;
          const conversationId = moment.conversationId as string;
          const duration = moment.duration as number | undefined;
          const type = moment.type as string | undefined;
          const description = moment.description as string | undefined;
          const mText = moment.text as string | undefined;
          const time = formatDuration(Math.floor(timestamp / 1000));
          const lines: string[] = [
            `# ${title}`, "",
            `- **ID**: ${id}`,
            `- **Conversation**: ${conversationId}`,
            `- **Timestamp**: ${time}`,
          ];
          if (duration) lines.push(`- **Duration**: ${formatDuration(Math.floor(duration / 1000))}`);
          if (type) lines.push(`- **Type**: ${type}`);
          if (description) lines.push("", "## Description", description);
          if (mText) lines.push("", "## Transcript Snippet", `> ${mText}`);
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "chorus_create_moment",
    {
      title: "Create External Moment",
      description: `Create a new external moment on a conversation at a specific timestamp.

Args:
  - conversation_id (string): The conversation ID
  - timestamp_ms (number): Timestamp in ms from start of call
  - duration_ms (number, optional): Duration in ms
  - title (string): Title/label for the moment
  - description (string, optional): Description
  - type (string, optional): Moment type/category

Returns: The created moment with its ID.`,
      inputSchema: CreateMomentSchema,
      annotations: ANNOTATIONS.CREATE,
    },
    async (params: CreateMomentInput) => {
      try {
        const body: Record<string, unknown> = {
          conversationId: params.conversation_id,
          timestamp: params.timestamp_ms,
          title: params.title,
        };
        if (params.duration_ms !== undefined) body.duration = params.duration_ms;
        if (params.description) body.description = params.description;
        if (params.type) body.type = params.type;

        const moment = await makeApiRequest<Record<string, unknown>>("moments", "POST", body);

        return {
          content: [{ type: "text" as const, text: `Moment created successfully.\n- **ID**: ${moment.id as string}\n- **Title**: ${(moment.title as string) || (moment.subject as string) || "N/A"}\n- **Conversation**: ${(moment.conversation as string) || (moment.conversationId as string) || "N/A"}` }],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "chorus_delete_moment",
    {
      title: "Delete External Moment",
      description: `Delete an external moment. This action is irreversible.

Args:
  - moment_id (string): The moment ID to delete

Returns: Confirmation of deletion.`,
      inputSchema: DeleteMomentSchema,
      annotations: ANNOTATIONS.DELETE,
    },
    async (params: DeleteMomentInput) => {
      try {
        await makeApiRequest<void>(`moments/${params.moment_id}`, "DELETE");
        return {
          content: [{ type: "text" as const, text: `Moment ${params.moment_id} deleted successfully.` }],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );
}
