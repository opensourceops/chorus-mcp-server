import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
import type { ListResponse } from "../types.js";
import {
  ListTeamsSchema, GetTeamSchema, GetTeamMembersSchema,
  type ListTeamsInput, type GetTeamInput, type GetTeamMembersInput,
} from "../schemas/teams.js";

export function registerTeamTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_teams",
    {
      title: "List Chorus Teams",
      description: `List all teams in the Chorus organization.

Args:
  - limit (number): Max results 1-100 (default: 20)
  - offset (number): Pagination offset (default: 0)
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: Paginated list of teams with name, manager, and member count.`,
      inputSchema: ListTeamsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListTeamsInput) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          "teams", "GET", undefined, { "page[size]": params.limit }
        );
        const teams = data.items || [];
        const response = buildPaginatedResponse(teams, data.total || teams.length, params.offset);

        if (teams.length === 0) {
          return { content: [{ type: "text" as const, text: "No teams found." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Teams", "", formatPaginationInfo(response), ""];
          for (const t of teams) {
            const name = (t.name as string) || "Untitled";
            const id = t.id as string;
            const users = (t.users || []) as unknown[];
            lines.push(`- **${name}** (${id}) | ${users.length} members`);
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
    "chorus_get_team",
    {
      title: "Get Chorus Team",
      description: `Get team details including members and manager.

Args:
  - team_id (string): The team ID
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: Team details with name, language, and member user IDs.`,
      inputSchema: GetTeamSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetTeamInput) => {
      try {
        const team = await makeApiRequest<Record<string, unknown>>(`teams/${params.team_id}`);

        const text = formatOutput(team, () => {
          const name = (team.name as string) || "Untitled";
          const id = team.id as string;
          const language = team.language as string | undefined;
          const isDefault = team.default as boolean | undefined;
          const includeDescendants = team.include_descendant_teams as boolean | undefined;
          const users = (team.users || []) as unknown[];
          const lines: string[] = [`# ${name}`, "", `- **ID**: ${id}`];
          if (language) lines.push(`- **Language**: ${language}`);
          if (isDefault !== undefined) lines.push(`- **Default**: ${isDefault ? "Yes" : "No"}`);
          if (includeDescendants !== undefined) lines.push(`- **Include Descendant Teams**: ${includeDescendants ? "Yes" : "No"}`);
          lines.push(`- **Members**: ${users.length} user IDs`);
          if (users.length > 0) {
            lines.push("", "## Member User IDs");
            // Users are numeric IDs, not objects
            for (const uid of users) {
              lines.push(`- ${uid}`);
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
    "chorus_get_team_members",
    {
      title: "Get Team Members",
      description: `List members of a specific Chorus team. Returns user IDs from the team record.

Args:
  - team_id (string): The team ID
  - limit (number): Max results 1-100 (default: 20)
  - offset (number): Pagination offset (default: 0)
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: Paginated list of team member user IDs.`,
      inputSchema: GetTeamMembersSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetTeamMembersInput) => {
      try {
        // No separate /teams/{id}/members endpoint; user IDs are in the team response
        const team = await makeApiRequest<Record<string, unknown>>(`teams/${params.team_id}`);
        const allUsers = (team.users || []) as unknown[];
        const teamName = (team.name as string) || "Unknown";

        // Apply manual pagination over the user ID list
        const start = params.offset;
        const end = start + params.limit;
        const pageUsers = allUsers.slice(start, end);

        const response = buildPaginatedResponse(
          pageUsers.map((uid) => ({ id: String(uid) })),
          allUsers.length,
          params.offset
        );

        if (allUsers.length === 0) {
          return { content: [{ type: "text" as const, text: "No members found for this team." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = [
            `# Team Members: ${teamName}`, "",
            formatPaginationInfo(response), "",
          ];
          for (const uid of pageUsers) {
            lines.push(`- User ID: ${uid}`);
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
