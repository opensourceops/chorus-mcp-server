import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatDuration, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
import type { ListResponse } from "../types.js";
import {
  ListReportsSchema, GetReportSchema, GetActivityMetricsSchema,
  type ListReportsInput, type GetReportInput, type GetActivityMetricsInput,
} from "../schemas/reports.js";

export function registerReportTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_reports",
    {
      title: "List Reports",
      description: `List available reports in Chorus.

Args:
  - limit/offset: Pagination
  - response_format: Output format

Returns: Paginated list of reports with name and type.`,
      inputSchema: ListReportsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListReportsInput) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          "reports", "GET", undefined, { "page[size]": params.limit }
        );
        const reports = data.items || [];
        const response = buildPaginatedResponse(reports, data.total || reports.length, params.offset);

        if (reports.length === 0) {
          return { content: [{ type: "text" as const, text: "No reports found." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Reports", "", formatPaginationInfo(response), ""];
          for (const r of reports) {
            const name = (r.name as string) || "Untitled";
            const id = r.id as string;
            const type = (r.type as string) || "Unknown";
            lines.push(`- **${name}** (${id}) [${type}]`);
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
    "chorus_get_report",
    {
      title: "Get Report",
      description: `Get report data with analytics results.

Args:
  - report_id (string): The report ID
  - response_format: Output format

Returns: Report data with analytics.`,
      inputSchema: GetReportSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetReportInput) => {
      try {
        const report = await makeApiRequest<Record<string, unknown>>(`reports/${params.report_id}`);

        const text = formatOutput(report, () => {
          const name = (report.name as string) || "Untitled";
          const id = report.id as string;
          const type = (report.type as string) || "Unknown";
          const dateRange = report.dateRange as Record<string, string> | undefined;
          const reportData = report.data as Record<string, unknown> | undefined;
          const lines: string[] = [
            `# ${name}`, "",
            `- **ID**: ${id}`,
            `- **Type**: ${type}`,
          ];
          if (dateRange) {
            lines.push(`- **Period**: ${dateRange.start} to ${dateRange.end}`);
          }
          if (reportData) {
            lines.push("", "## Data", "```json", JSON.stringify(reportData, null, 2), "```");
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
    "chorus_get_activity_metrics",
    {
      title: "Get Activity Metrics",
      description: `Get activity metrics (calls per rep, talk time, ratios) for a date range and team/user.

Args:
  - team_id (string, optional): Filter by team ID
  - user_id (string, optional): Filter for a specific user
  - start_date (string): Start date (ISO 8601)
  - end_date (string): End date (ISO 8601)
  - metrics (string[], optional): Specific metrics to include
  - response_format: Output format

Returns: Activity metrics including total calls, duration, talk ratio, question rate, etc.`,
      inputSchema: GetActivityMetricsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetActivityMetricsInput) => {
      try {
        const qp: Record<string, unknown> = {
          "filter[start_date]": params.start_date,
          "filter[end_date]": params.end_date,
        };
        if (params.team_id) qp["filter[team_id]"] = params.team_id;
        if (params.user_id) qp["filter[user_id]"] = params.user_id;
        if (params.metrics) qp["filter[metrics]"] = params.metrics.join(",");

        const data = await makeApiRequest<Record<string, unknown>>("reports/activity", "GET", undefined, qp);

        const text = formatOutput(data, () => {
          const userName = data.userName as string | undefined;
          const totalCalls = data.totalCalls as number;
          const totalDuration = data.totalDuration as number;
          const avgDuration = data.avgDuration as number;
          const talkRatio = data.talkRatio as number | undefined;
          const longestMonologue = data.longestMonologue as number | undefined;
          const interactivity = data.interactivity as number | undefined;
          const patience = data.patience as number | undefined;
          const questionRate = data.questionRate as number | undefined;
          const lines: string[] = [
            "# Activity Metrics", "",
            `- **Period**: ${params.start_date} to ${params.end_date}`,
          ];
          if (userName) lines.push(`- **User**: ${userName}`);
          lines.push("");
          lines.push("## Metrics");
          lines.push(`- **Total Calls**: ${totalCalls}`);
          lines.push(`- **Total Duration**: ${formatDuration(totalDuration)}`);
          lines.push(`- **Avg Duration**: ${formatDuration(avgDuration)}`);
          if (talkRatio !== undefined) lines.push(`- **Talk Ratio**: ${Math.round(talkRatio * 100)}%`);
          if (longestMonologue !== undefined) lines.push(`- **Longest Monologue**: ${formatDuration(longestMonologue)}`);
          if (interactivity !== undefined) lines.push(`- **Interactivity**: ${interactivity}`);
          if (patience !== undefined) lines.push(`- **Patience**: ${patience}`);
          if (questionRate !== undefined) lines.push(`- **Question Rate**: ${questionRate}`);
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );
}
