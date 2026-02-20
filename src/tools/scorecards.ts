import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatDate, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
import type { ListResponse } from "../types.js";
import {
  ListScorecardsSchema, GetScorecardSchema, ListScorecardTemplatesSchema, GetScorecardTemplateSchema,
  type ListScorecardsInput, type GetScorecardInput, type ListScorecardTemplatesInput, type GetScorecardTemplateInput,
} from "../schemas/scorecards.js";

export function registerScorecardTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_scorecards",
    {
      title: "List Scorecards",
      description: `List scorecards with optional filters for user, conversation, template, and date range.

Args:
  - user_id (string, optional): Filter by evaluated rep's user ID
  - conversation_id (string, optional): Filter for a specific conversation
  - template_id (string, optional): Filter by scorecard template ID
  - start_date/end_date (string, optional): Date range (ISO 8601)
  - limit/offset: Pagination
  - response_format: Output format

Returns: Paginated list of scorecards with scores and evaluator info.`,
      inputSchema: ListScorecardsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListScorecardsInput) => {
      try {
        const qp: Record<string, unknown> = { "page[size]": params.limit };
        if (params.user_id) qp["filter[user_id]"] = params.user_id;
        if (params.conversation_id) qp["filter[conversation_id]"] = params.conversation_id;
        if (params.template_id) qp["filter[template_id]"] = params.template_id;
        if (params.start_date) qp["filter[start_date]"] = params.start_date;
        if (params.end_date) qp["filter[end_date]"] = params.end_date;

        const data = await makeApiRequest<ListResponse>("scorecards", "GET", undefined, qp);
        const scorecards = data.items || [];
        const response = buildPaginatedResponse(scorecards, data.total || scorecards.length, params.offset);

        if (scorecards.length === 0) {
          return { content: [{ type: "text" as const, text: "No scorecards found matching the specified filters." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Scorecards", "", formatPaginationInfo(response), ""];
          for (const s of scorecards) {
            const userName = (s.userName as string) || (s.userId as string) || "Unknown";
            const overallScore = s.overallScore as number;
            const maxScore = s.maxScore as number;
            const id = s.id as string;
            const conversationId = s.conversationId as string;
            const templateName = s.templateName as string | undefined;
            const evaluatorName = s.evaluatorName as string | undefined;
            const createdAt = s.createdAt as string;
            lines.push(`## ${userName} - ${overallScore}/${maxScore}`);
            lines.push(`- **ID**: ${id}`);
            lines.push(`- **Conversation**: ${conversationId}`);
            if (templateName) lines.push(`- **Template**: ${templateName}`);
            if (evaluatorName) lines.push(`- **Evaluator**: ${evaluatorName}`);
            lines.push(`- **Date**: ${formatDate(createdAt)}`);
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
    "chorus_get_scorecard",
    {
      title: "Get Scorecard",
      description: `Get detailed scorecard with all criteria scores for a specific call evaluation.

Args:
  - scorecard_id (string): The scorecard ID
  - response_format: Output format

Returns: Full scorecard with criteria-level scores, comments, and overall rating.`,
      inputSchema: GetScorecardSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetScorecardInput) => {
      try {
        const sc = await makeApiRequest<Record<string, unknown>>(`scorecards/${params.scorecard_id}`);

        const text = formatOutput(sc, () => {
          const userName = (sc.userName as string) || (sc.userId as string) || "Unknown";
          const overallScore = sc.overallScore as number;
          const maxScore = sc.maxScore as number;
          const conversationId = sc.conversationId as string;
          const createdAt = sc.createdAt as string;
          const evaluatorName = sc.evaluatorName as string | undefined;
          const templateName = sc.templateName as string | undefined;
          const criteria = (sc.criteria || []) as Array<Record<string, unknown>>;
          const lines: string[] = [
            `# Scorecard: ${userName}`,
            "",
            `- **Overall Score**: ${overallScore}/${maxScore} (${Math.round((overallScore / maxScore) * 100)}%)`,
            `- **Conversation**: ${conversationId}`,
            `- **Date**: ${formatDate(createdAt)}`,
          ];
          if (evaluatorName) lines.push(`- **Evaluator**: ${evaluatorName}`);
          if (templateName) lines.push(`- **Template**: ${templateName}`);
          if (criteria.length > 0) {
            lines.push("", "## Criteria Scores", "");
            lines.push("| Criteria | Score | Max |");
            lines.push("|----------|-------|-----|");
            for (const c of criteria) {
              lines.push(`| ${c.name as string} | ${c.score as number} | ${c.maxScore as number} |`);
            }
            const withComments = criteria.filter((c) => c.comments);
            if (withComments.length > 0) {
              lines.push("", "## Comments");
              for (const c of withComments) {
                lines.push(`- **${c.name as string}**: ${c.comments as string}`);
              }
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
    "chorus_list_scorecard_templates",
    {
      title: "List Scorecard Templates",
      description: `List available scorecard evaluation templates/rubrics.

Args:
  - limit/offset: Pagination
  - response_format: Output format

Returns: List of scorecard templates with names and criteria counts.`,
      inputSchema: ListScorecardTemplatesSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListScorecardTemplatesInput) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          "scorecards/templates", "GET", undefined, { "page[size]": params.limit }
        );
        const templates = data.items || [];
        const response = buildPaginatedResponse(templates, data.total || templates.length, params.offset);

        if (templates.length === 0) {
          return { content: [{ type: "text" as const, text: "No scorecard templates found." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Scorecard Templates", "", formatPaginationInfo(response), ""];
          for (const t of templates) {
            const name = (t.name as string) || "Untitled";
            const id = t.id as string;
            const criteria = (t.criteria || []) as Array<Record<string, unknown>>;
            const description = t.description as string | undefined;
            lines.push(`- **${name}** (${id}) - ${criteria.length} criteria${description ? `: ${description}` : ""}`);
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
    "chorus_get_scorecard_template",
    {
      title: "Get Scorecard Template",
      description: `Get a scorecard template with its criteria definitions and scoring rubric.

Args:
  - template_id (string): The scorecard template ID
  - response_format: Output format

Returns: Template with criteria names, descriptions, max scores, and weights.`,
      inputSchema: GetScorecardTemplateSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetScorecardTemplateInput) => {
      try {
        const tmpl = await makeApiRequest<Record<string, unknown>>(`scorecards/templates/${params.template_id}`);

        const text = formatOutput(tmpl, () => {
          const name = (tmpl.name as string) || "Untitled";
          const description = tmpl.description as string | undefined;
          const criteria = (tmpl.criteria || []) as Array<Record<string, unknown>>;
          const lines: string[] = [`# ${name}`, ""];
          if (description) lines.push(description, "");
          lines.push("## Criteria", "");
          lines.push("| Criteria | Max Score | Weight | Description |");
          lines.push("|----------|-----------|--------|-------------|");
          for (const c of criteria) {
            lines.push(`| ${c.name as string} | ${c.maxScore as number} | ${(c.weight as number) ?? "N/A"} | ${(c.description as string) || ""} |`);
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
