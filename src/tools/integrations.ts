import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
import { ResponseFormatSchema, PaginationSchema } from "../schemas/common.js";
import type { ListResponse } from "../types.js";

const ListIntegrationsSchema = z.object({
  response_format: ResponseFormatSchema,
}).merge(PaginationSchema).strict();

const GetIntegrationSchema = z.object({
  integration_id: z.string().describe("The integration ID"),
  response_format: ResponseFormatSchema,
}).strict();

const GetSessionSchema = z.object({
  response_format: ResponseFormatSchema,
}).strict();

export function registerIntegrationTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_integrations",
    {
      title: "List Integrations",
      description: `List configured integrations (Salesforce, HubSpot, etc.) in Chorus.

Args:
  - limit/offset: Pagination
  - response_format: Output format

Returns: List of integrations with type, name, and status.`,
      inputSchema: ListIntegrationsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: z.infer<typeof ListIntegrationsSchema>) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          "integrations", "GET", undefined, { "page[size]": params.limit }
        );
        const integrations = data.items || [];
        const response = buildPaginatedResponse(integrations, data.total || integrations.length, params.offset);

        if (integrations.length === 0) {
          return { content: [{ type: "text" as const, text: "No integrations configured." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Integrations", "", formatPaginationInfo(response), ""];
          for (const i of integrations) {
            const name = (i.name as string) || "Untitled";
            const id = i.id as string;
            const type = (i.type as string) || "Unknown";
            const status = (i.status as string) || "Unknown";
            lines.push(`- **${name}** (${id}) [${type}] - Status: ${status}`);
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
    "chorus_get_integration",
    {
      title: "Get Integration",
      description: `Get details and status of a specific integration.

Args:
  - integration_id (string): The integration ID
  - response_format: Output format

Returns: Integration details with type, name, status, and configuration.`,
      inputSchema: GetIntegrationSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: z.infer<typeof GetIntegrationSchema>) => {
      try {
        const integ = await makeApiRequest<Record<string, unknown>>(`integrations/${params.integration_id}`);

        const text = formatOutput(integ, () => {
          const name = (integ.name as string) || "Untitled";
          const id = integ.id as string;
          const type = (integ.type as string) || "Unknown";
          const status = (integ.status as string) || "Unknown";
          const config = integ.config as Record<string, unknown> | undefined;
          const lines: string[] = [
            `# ${name}`, "",
            `- **ID**: ${id}`,
            `- **Type**: ${type}`,
            `- **Status**: ${status}`,
          ];
          if (config) {
            lines.push("", "## Configuration", "```json", JSON.stringify(config, null, 2), "```");
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
    "chorus_get_session",
    {
      title: "Get Current Session",
      description: `Get current API session details and permissions. Useful for verifying authentication and understanding access scope.

Args:
  - response_format: Output format

Returns: Session info with user details and permission scope.`,
      inputSchema: GetSessionSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: z.infer<typeof GetSessionSchema>) => {
      try {
        const session = await makeApiRequest<Record<string, unknown>>("sessions/current");

        const text = formatOutput(session, () => {
          const lines: string[] = ["# Current Session", "", "```json", JSON.stringify(session, null, 2), "```"];
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );
}
