import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import { ANNOTATIONS } from "../constants.js";
import { formatOutput, formatDate, formatDuration, formatParticipants, formatPaginationInfo, buildPaginatedResponse } from "../services/formatters.js";
import type { ListResponse, ChorusParticipant } from "../types.js";
import {
  ListVideoConferencesSchema, GetVideoConferenceSchema, UploadRecordingSchema, DeleteRecordingSchema,
  type ListVideoConferencesInput, type GetVideoConferenceInput, type UploadRecordingInput, type DeleteRecordingInput,
} from "../schemas/video-conferences.js";

export function registerVideoConferenceTools(server: McpServer): void {
  server.registerTool(
    "chorus_list_video_conferences",
    {
      title: "List Video Conferences",
      description: `List video conference recordings in Chorus.

Args:
  - start_date/end_date (string, optional): Date range (ISO 8601)
  - limit/offset: Pagination
  - response_format: Output format

Returns: Paginated list of video conferences with title, date, and status.`,
      inputSchema: ListVideoConferencesSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: ListVideoConferencesInput) => {
      try {
        const qp: Record<string, unknown> = { "page[size]": params.limit };
        if (params.start_date) qp["filter[start_date]"] = params.start_date;
        if (params.end_date) qp["filter[end_date]"] = params.end_date;

        const data = await makeApiRequest<ListResponse>("video-conferences", "GET", undefined, qp);
        const conferences = data.items || [];
        const response = buildPaginatedResponse(conferences, data.total || conferences.length, params.offset);

        if (conferences.length === 0) {
          return { content: [{ type: "text" as const, text: "No video conferences found." }] };
        }

        const text = formatOutput(response, () => {
          const lines: string[] = ["# Video Conferences", "", formatPaginationInfo(response), ""];
          for (const c of conferences) {
            const title = (c.title as string) || "Untitled";
            const id = c.id as string;
            const date = c.date as string;
            const status = c.status as string | undefined;
            lines.push(`- **${title}** (${id}) - ${formatDate(date)}${status ? ` [${status}]` : ""}`);
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
    "chorus_get_video_conference",
    {
      title: "Get Video Conference",
      description: `Get details and recording URL for a video conference.

Args:
  - conference_id (string): The video conference ID
  - response_format: Output format

Returns: Conference details with title, date, participants, recording URL, and duration.`,
      inputSchema: GetVideoConferenceSchema,
      annotations: ANNOTATIONS.READ_ONLY,
    },
    async (params: GetVideoConferenceInput) => {
      try {
        const conf = await makeApiRequest<Record<string, unknown>>(`video-conferences/${params.conference_id}`);

        const text = formatOutput(conf, () => {
          const title = (conf.title as string) || "Untitled";
          const id = conf.id as string;
          const date = conf.date as string;
          const participants = (conf.participants || []) as unknown as ChorusParticipant[];
          const duration = conf.duration as number | undefined;
          const status = conf.status as string | undefined;
          const recordingUrl = conf.recordingUrl as string | undefined;
          const lines: string[] = [
            `# ${title}`, "",
            `- **ID**: ${id}`,
            `- **Date**: ${formatDate(date)}`,
            `- **Participants**: ${formatParticipants(participants)}`,
          ];
          if (duration) lines.push(`- **Duration**: ${formatDuration(duration)}`);
          if (status) lines.push(`- **Status**: ${status}`);
          if (recordingUrl) lines.push(`- **Recording**: ${recordingUrl}`);
          return lines.join("\n");
        }, params.response_format);

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "chorus_upload_recording",
    {
      title: "Upload Recording",
      description: `Upload a new recording to Chorus from an external dialer or source.

Args:
  - title (string): Title for the recording
  - recording_url (string): URL of the recording file
  - participants (array): List of {name, email?} objects
  - date (string): Recording date (ISO 8601)
  - duration_seconds (number, optional): Duration in seconds
  - external_id (string, optional): External reference ID

Returns: The created video conference record with its Chorus ID.`,
      inputSchema: UploadRecordingSchema,
      annotations: ANNOTATIONS.CREATE,
    },
    async (params: UploadRecordingInput) => {
      try {
        const body: Record<string, unknown> = {
          title: params.title,
          recordingUrl: params.recording_url,
          participants: params.participants,
          date: params.date,
        };
        if (params.duration_seconds !== undefined) body.durationSeconds = params.duration_seconds;
        if (params.external_id) body.externalId = params.external_id;

        const conf = await makeApiRequest<Record<string, unknown>>("video-conferences", "POST", body);

        return {
          content: [{
            type: "text" as const,
            text: `Recording uploaded successfully.\n- **ID**: ${conf.id as string}\n- **Title**: ${conf.title as string}\n- **Date**: ${formatDate(conf.date as string)}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "chorus_delete_recording",
    {
      title: "Delete Recording",
      description: `Delete a recording from Chorus. This action is irreversible. Use for GDPR compliance or data retention policies.

Args:
  - conference_id (string): The video conference/recording ID to delete

Returns: Confirmation of deletion.`,
      inputSchema: DeleteRecordingSchema,
      annotations: ANNOTATIONS.DELETE,
    },
    async (params: DeleteRecordingInput) => {
      try {
        await makeApiRequest<void>(`video-conferences/${params.conference_id}`, "DELETE");
        return {
          content: [{ type: "text" as const, text: `Recording ${params.conference_id} deleted successfully.` }],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );
}
