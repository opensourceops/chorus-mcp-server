import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatDate, formatDuration, formatParticipants, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
import type { ListResponse, ChorusParticipant } from "../types.js";
import {
  FilterEngagementsSchema, GetEngagementSchema,
  type FilterEngagementsInput, type GetEngagementInput,
} from "../schemas/engagements.js";

export function registerEngagementTools(server: McpServer): void {
  server.registerTool(
    "chorus_filter_engagements",
    {
      title: "Filter Engagements",
      description: `Filter and search engagements (meetings and dialer calls) using advanced criteria.

Args:
  - engagement_type ('meeting'|'dialer'|'all'): Type filter (default: 'all')
  - participant_emails (string[], optional): Filter by participant emails
  - outcome (string, optional): Filter by outcome
  - start_date/end_date (string, optional): Date range (ISO 8601)
  - limit/offset: Pagination
  - response_format: Output format

Returns: Paginated list of matching engagements with type, date, participants, and outcome.`,
      inputSchema: FilterEngagementsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: FilterEngagementsInput) => {
      try {
        const body: Record<string, unknown> = { "page[size]": params.limit };
        if (params.engagement_type !== "all") body["filter[type]"] = params.engagement_type;
        if (params.participant_emails) body["filter[participant_emails]"] = params.participant_emails;
        if (params.outcome) body["filter[outcome]"] = params.outcome;
        if (params.start_date) body["filter[start_date]"] = params.start_date;
        if (params.end_date) body["filter[end_date]"] = params.end_date;

        const data = await makeApiRequest<ListResponse>("engagements/filter", "POST", body);
        const engagements = data.items || [];
        const response = buildPaginatedResponse(engagements, data.total || engagements.length, params.offset);

        if (engagements.length === 0) {
          return { content: [{ type: "text" as const, text: "No engagements found matching the specified filters." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Engagements", "", formatPaginationInfo(response), ""];
          for (const e of engagements) {
            const type = (e.type as string) || "Unknown";
            const date = e.date as string;
            const id = e.id as string;
            const participants = (e.participants || []) as unknown as ChorusParticipant[];
            const duration = e.duration as number | undefined;
            const outcome = e.outcome as string | undefined;
            lines.push(`## ${type} - ${formatDate(date)} (${id})`);
            lines.push(`- **Participants**: ${formatParticipants(participants)}`);
            if (duration) lines.push(`- **Duration**: ${formatDuration(duration)}`);
            if (outcome) lines.push(`- **Outcome**: ${outcome}`);
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
    "chorus_get_engagement",
    {
      title: "Get Engagement",
      description: `Get details of a specific engagement.

Args:
  - engagement_id (string): The engagement ID
  - response_format: Output format

Returns: Engagement details with type, date, participants, duration, and outcome.`,
      inputSchema: GetEngagementSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetEngagementInput) => {
      try {
        const eng = await makeApiRequest<Record<string, unknown>>(`engagements/${params.engagement_id}`);

        const text = formatOutput(eng, () => {
          const type = (eng.type as string) || "Unknown";
          const id = eng.id as string;
          const date = eng.date as string;
          const participants = (eng.participants || []) as unknown as ChorusParticipant[];
          const duration = eng.duration as number | undefined;
          const outcome = eng.outcome as string | undefined;
          const conversationId = eng.conversationId as string | undefined;
          const lines: string[] = [
            `# ${type} Engagement`, "",
            `- **ID**: ${id}`,
            `- **Date**: ${formatDate(date)}`,
            `- **Participants**: ${formatParticipants(participants)}`,
          ];
          if (duration) lines.push(`- **Duration**: ${formatDuration(duration)}`);
          if (outcome) lines.push(`- **Outcome**: ${outcome}`);
          if (conversationId) lines.push(`- **Conversation ID**: ${conversationId}`);
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );
}
