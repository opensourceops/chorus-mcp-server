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
            const managerName = t.managerName as string | undefined;
            const memberCount = t.memberCount as number | undefined;
            lines.push(`- **${name}** (${id})${managerName ? ` | Manager: ${managerName}` : ""}${memberCount !== undefined ? ` | ${memberCount} members` : ""}`);
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

Returns: Team details with name, manager, and member list.`,
      inputSchema: GetTeamSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetTeamInput) => {
      try {
        const team = await makeApiRequest<Record<string, unknown>>(`teams/${params.team_id}`);

        const text = formatOutput(team, () => {
          const name = (team.name as string) || "Untitled";
          const id = team.id as string;
          const managerName = team.managerName as string | undefined;
          const memberCount = team.memberCount as number | undefined;
          const members = team.members as Array<Record<string, unknown>> | undefined;
          const lines: string[] = [`# ${name}`, "", `- **ID**: ${id}`];
          if (managerName) lines.push(`- **Manager**: ${managerName}`);
          if (memberCount !== undefined) lines.push(`- **Members**: ${memberCount}`);
          if (members && members.length > 0) {
            lines.push("", "## Team Members");
            for (const m of members) {
              const mName = (m.name as string) || "Unknown";
              const mEmail = (m.email as string) || "";
              const mRole = m.role as string | undefined;
              lines.push(`- **${mName}** (${mEmail})${mRole ? ` [${mRole}]` : ""}`);
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
      description: `List members of a specific Chorus team.

Args:
  - team_id (string): The team ID
  - limit (number): Max results 1-100 (default: 20)
  - offset (number): Pagination offset (default: 0)
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: Paginated list of team members with profile details.`,
      inputSchema: GetTeamMembersSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetTeamMembersInput) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          `teams/${params.team_id}/members`, "GET", undefined, { "page[size]": params.limit }
        );
        const members = data.items || [];
        const response = buildPaginatedResponse(members, data.total || members.length, params.offset);

        if (members.length === 0) {
          return { content: [{ type: "text" as const, text: "No members found for this team." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Team Members", "", formatPaginationInfo(response), ""];
          for (const m of members) {
            const name = (m.name as string) || "Unknown";
            const id = m.id as string;
            const email = (m.email as string) || "";
            const role = m.role as string | undefined;
            lines.push(`- **${name}** (${id}) - ${email}${role ? ` [${role}]` : ""}`);
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
