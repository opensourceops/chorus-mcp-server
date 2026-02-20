import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatDate, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
import type { ListResponse } from "../types.js";
import {
  ListEmailsSchema, GetEmailSchema,
  type ListEmailsInput, type GetEmailInput,
} from "../schemas/emails.js";

export function registerEmailTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_emails",
    {
      title: "List Email Engagements",
      description: `List email engagements tracked in Chorus with optional filters.

Args:
  - sender_email (string, optional): Filter by sender email
  - recipient_email (string, optional): Filter by recipient email
  - start_date/end_date (string, optional): Date range (ISO 8601)
  - limit/offset: Pagination
  - response_format: Output format

Returns: Paginated list of email engagements with subject, date, and metrics.`,
      inputSchema: ListEmailsSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListEmailsInput) => {
      try {
        const qp: Record<string, unknown> = { "page[size]": params.limit };
        if (params.sender_email) qp["filter[sender_email]"] = params.sender_email;
        if (params.recipient_email) qp["filter[recipient_email]"] = params.recipient_email;
        if (params.start_date) qp["filter[start_date]"] = params.start_date;
        if (params.end_date) qp["filter[end_date]"] = params.end_date;

        const data = await makeApiRequest<ListResponse>("emails", "GET", undefined, qp);
        const emails = data.items || [];
        const response = buildPaginatedResponse(emails, data.total || emails.length, params.offset);

        if (emails.length === 0) {
          return { content: [{ type: "text" as const, text: "No email engagements found." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Email Engagements", "", formatPaginationInfo(response), ""];
          for (const e of emails) {
            const subject = (e.name as string) || "No Subject";
            const id = e.id as string;
            const emailData = e.email as Record<string, unknown> | undefined;
            const initiator = emailData?.initiator as Record<string, unknown> | undefined;
            const sender = (initiator?.name as string) || (initiator?.email as string) || "Unknown";
            const sentTime = (emailData?.sent_time as string) || "";
            const company = (e.company_name as string) || "";
            lines.push(`- **${subject}** (${id}) - ${sentTime ? formatDate(sentTime) : "N/A"} from ${sender}${company ? ` | ${company}` : ""}`);
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
    "chorus_get_email",
    {
      title: "Get Email Engagement",
      description: `Get details of a specific email engagement including metrics.

Args:
  - email_id (string): The email engagement ID
  - response_format: Output format

Returns: Email details with subject, sender, recipients, date, and engagement metrics.`,
      inputSchema: GetEmailSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetEmailInput) => {
      try {
        const email = await makeApiRequest<Record<string, unknown>>(`emails/${params.email_id}`);

        const text = formatOutput(email, () => {
          const subject = (email.name as string) || "No Subject";
          const id = email.id as string;
          const emailData = email.email as Record<string, unknown> | undefined;
          const initiator = emailData?.initiator as Record<string, unknown> | undefined;
          const sender = (initiator?.name as string) || (initiator?.email as string) || "Unknown";
          const sentTime = (emailData?.sent_time as string) || "";
          const owner = email.owner as Record<string, unknown> | undefined;
          const participants = (email.participants || []) as Array<Record<string, unknown>>;
          const company = (email.company_name as string) || "";
          const lines: string[] = [
            `# ${subject}`, "",
            `- **ID**: ${id}`,
            `- **Date**: ${sentTime ? formatDate(sentTime) : "N/A"}`,
            `- **From**: ${sender}`,
            `- **Company**: ${company}`,
          ];
          if (owner) {
            lines.push(`- **Owner**: ${owner.name} (${owner.email})`);
          }
          if (participants.length > 0) {
            lines.push("", "## Participants");
            for (const p of participants) {
              const role = (p.type as string) || "";
              lines.push(`- **${p.name}** (${p.email})${role ? ` [${role}]` : ""}${p.company_name ? ` | ${p.company_name}` : ""}`);
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
}
