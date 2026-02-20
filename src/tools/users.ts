import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import {
  formatOutput,
  formatPaginationInfo,
  buildPaginatedResponse,
} from "../services/formatters.js";
import type { ListResponse } from "../types.js";
import {
  ListUsersSchema,
  GetUserSchema,
  SearchUsersSchema,
  type ListUsersInput,
  type GetUserInput,
  type SearchUsersInput,
} from "../schemas/users.js";

export function registerUserTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_users",
    {
      title: "List Chorus Users",
      description: `List all users in the Chorus organization with optional filters.

Args:
  - team_id (string, optional): Filter users by team ID
  - role (string, optional): Filter by role (e.g., 'admin', 'user', 'manager')
  - limit (number): Max results 1-100 (default: 20)
  - offset (number): Pagination offset (default: 0)
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: Paginated list of users with name, email, role, and team.`,
      inputSchema: ListUsersSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListUsersInput) => {
      try {
        const queryParams: Record<string, unknown> = { "page[size]": params.limit };
        if (params.team_id) queryParams["filter[team_id]"] = params.team_id;
        if (params.role) queryParams["filter[role]"] = params.role;

        const data = await makeApiRequest<ListResponse>("users", "GET", undefined, queryParams);
        const users = data.items || [];
        const response = buildPaginatedResponse(users, data.total || users.length, params.offset);

        if (users.length === 0) {
          return { content: [{ type: "text" as const, text: "No users found matching the specified filters." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Chorus Users", "", formatPaginationInfo(response), ""];
          for (const u of users) {
            const name = (u.name as string) || "Unknown";
            const id = u.id as string;
            const email = (u.email as string) || "";
            const role = u.role as string | undefined;
            const teamName = u.teamName as string | undefined;
            lines.push(`- **${name}** (${id}) - ${email}${role ? ` [${role}]` : ""}${teamName ? ` | Team: ${teamName}` : ""}`);
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
    "chorus_get_user",
    {
      title: "Get Chorus User",
      description: `Get detailed profile for a specific Chorus user.

Args:
  - user_id (string): The Chorus user ID
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: User profile with name, email, role, team membership, and activity stats.`,
      inputSchema: GetUserSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetUserInput) => {
      try {
        const user = await makeApiRequest<Record<string, unknown>>(`users/${params.user_id}`);

        const text = formatOutput(user, () => {
          const name = (user.name as string) || "Unknown";
          const id = user.id as string;
          const email = (user.email as string) || "";
          const role = user.role as string | undefined;
          const teamName = user.teamName as string | undefined;
          const active = user.active as boolean | undefined;
          const lines: string[] = [
            `# ${name}`,
            "",
            `- **ID**: ${id}`,
            `- **Email**: ${email}`,
          ];
          if (role) lines.push(`- **Role**: ${role}`);
          if (teamName) lines.push(`- **Team**: ${teamName}`);
          if (active !== undefined) lines.push(`- **Active**: ${active ? "Yes" : "No"}`);
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "chorus_search_users",
    {
      title: "Search Chorus Users",
      description: `Search users by name or email.

Args:
  - query (string): Search string to match against names/emails
  - limit (number): Max results 1-100 (default: 20)
  - offset (number): Pagination offset (default: 0)
  - response_format ('markdown'|'json'): Output format (default: 'markdown')

Returns: Paginated list of matching users.`,
      inputSchema: SearchUsersSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: SearchUsersInput) => {
      try {
        const data = await makeApiRequest<ListResponse>(
          "users/search", "GET", undefined, { q: params.query, "page[size]": params.limit }
        );
        const users = data.items || [];
        const response = buildPaginatedResponse(users, data.total || users.length, params.offset);

        if (users.length === 0) {
          return { content: [{ type: "text" as const, text: `No users found matching "${params.query}".` }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = [`# User Search: "${params.query}"`, "", formatPaginationInfo(response), ""];
          for (const u of users) {
            const name = (u.name as string) || "Unknown";
            const id = u.id as string;
            const email = (u.email as string) || "";
            const role = u.role as string | undefined;
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
