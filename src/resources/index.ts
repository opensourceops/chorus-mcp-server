import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest } from "../services/api-client.js";
import { handleApiError } from "../services/error-handler.js";
import type {
  ChorusUser,
  ChorusTeam,
  ChorusScorecardTemplate,
  ChorusSavedSearch,
  ChorusConversation,
  ChorusPlaylist,
} from "../types.js";

function extractParam(uri: URL, pattern: RegExp): string | null {
  const match = uri.pathname.match(pattern);
  return match ? match[1] : null;
}

export function registerResources(server: McpServer): void {
  // User Profile Resource
  server.registerResource(
    "chorus_user_profile",
    "chorus://users/{user_id}",
    {
      description:
        "Access a Chorus user profile by user ID. Returns name, email, role, team membership, and activity summary.",
      mimeType: "application/json",
    },
    async (uri: URL) => {
      const userId = extractParam(uri, /\/users\/([^/]+)/);
      if (!userId) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: "Error: Could not extract user_id from URI.",
            },
          ],
        };
      }
      try {
        const user = await makeApiRequest<ChorusUser>(`users/${userId}`);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(user, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: handleApiError(error),
            },
          ],
        };
      }
    }
  );

  // Team Structure Resource
  server.registerResource(
    "chorus_team",
    "chorus://teams/{team_id}",
    {
      description:
        "Access team structure including members, manager, and team hierarchy.",
      mimeType: "application/json",
    },
    async (uri: URL) => {
      const teamId = extractParam(uri, /\/teams\/([^/]+)/);
      if (!teamId) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: "Error: Could not extract team_id from URI.",
            },
          ],
        };
      }
      try {
        const team = await makeApiRequest<ChorusTeam>(`teams/${teamId}`);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(team, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: handleApiError(error),
            },
          ],
        };
      }
    }
  );

  // Scorecard Template Resource
  server.registerResource(
    "chorus_scorecard_template",
    "chorus://scorecard-templates/{template_id}",
    {
      description:
        "Access a scorecard evaluation template with criteria definitions, scoring rubric, and expected behaviors.",
      mimeType: "application/json",
    },
    async (uri: URL) => {
      const templateId = extractParam(
        uri,
        /\/scorecard-templates\/([^/]+)/
      );
      if (!templateId) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: "Error: Could not extract template_id from URI.",
            },
          ],
        };
      }
      try {
        const template =
          await makeApiRequest<ChorusScorecardTemplate>(
            `scorecards/templates/${templateId}`
          );
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(template, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: handleApiError(error),
            },
          ],
        };
      }
    }
  );

  // Saved Search Resource
  server.registerResource(
    "chorus_saved_search",
    "chorus://saved-searches/{search_id}",
    {
      description:
        "Access a saved search query definition including filters, criteria, and configuration.",
      mimeType: "application/json",
    },
    async (uri: URL) => {
      const searchId = extractParam(uri, /\/saved-searches\/([^/]+)/);
      if (!searchId) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: "Error: Could not extract search_id from URI.",
            },
          ],
        };
      }
      try {
        const search = await makeApiRequest<ChorusSavedSearch>(
          `saved-searches/${searchId}`
        );
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(search, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: handleApiError(error),
            },
          ],
        };
      }
    }
  );

  // Conversation Summary Resource
  server.registerResource(
    "chorus_conversation_summary",
    "chorus://conversations/{conversation_id}/summary",
    {
      description:
        "Quick summary of a conversation including participants, duration, date, and key topics. Lighter weight than the full conversation tool.",
      mimeType: "application/json",
    },
    async (uri: URL) => {
      const conversationId = extractParam(
        uri,
        /\/conversations\/([^/]+)\/summary/
      );
      if (!conversationId) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: "Error: Could not extract conversation_id from URI.",
            },
          ],
        };
      }
      try {
        const conversation = await makeApiRequest<ChorusConversation>(
          `conversations/${conversationId}`
        );
        const summary = {
          id: conversation.id,
          title: conversation.title,
          date: conversation.date,
          duration: conversation.duration,
          participantCount: conversation.participants.length,
          participants: conversation.participants.map((p) => p.name),
          type: conversation.type,
          status: conversation.status,
        };
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: handleApiError(error),
            },
          ],
        };
      }
    }
  );

  // Playlist Resource
  server.registerResource(
    "chorus_playlist",
    "chorus://playlists/{playlist_id}",
    {
      description:
        "Access a coaching playlist with its moments list, descriptions, and associated calls.",
      mimeType: "application/json",
    },
    async (uri: URL) => {
      const playlistId = extractParam(uri, /\/playlists\/([^/]+)/);
      if (!playlistId) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: "Error: Could not extract playlist_id from URI.",
            },
          ],
        };
      }
      try {
        const playlist = await makeApiRequest<ChorusPlaylist>(
          `playlists/${playlistId}`
        );
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(playlist, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: handleApiError(error),
            },
          ],
        };
      }
    }
  );
}
