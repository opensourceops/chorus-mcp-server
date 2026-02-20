import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerConversationTools } from '../../src/tools/conversations.js';
import { registerUserTools } from '../../src/tools/users.js';
import { registerTeamTools } from '../../src/tools/teams.js';
import { registerScorecardTools } from '../../src/tools/scorecards.js';
import { registerPlaylistTools } from '../../src/tools/playlists.js';
import { registerMomentTools, registerMomentWriteTools } from '../../src/tools/moments.js';
import { registerEmailTools } from '../../src/tools/emails.js';
import { registerEngagementTools } from '../../src/tools/engagements.js';
import { registerReportTools } from '../../src/tools/reports.js';
import { registerSavedSearchTools } from '../../src/tools/saved-searches.js';
import { registerVideoConferenceTools, registerVideoConferenceWriteTools } from '../../src/tools/video-conferences.js';
import { registerIntegrationTools } from '../../src/tools/integrations.js';
import { ANNOTATIONS } from '../../src/constants.js';

function registerReadOnlyTools(server: McpServer): void {
  registerConversationTools(server);
  registerUserTools(server);
  registerTeamTools(server);
  registerScorecardTools(server);
  registerPlaylistTools(server);
  registerMomentTools(server);
  registerEmailTools(server);
  registerEngagementTools(server);
  registerReportTools(server);
  registerSavedSearchTools(server);
  registerVideoConferenceTools(server);
  registerIntegrationTools(server);
}

function registerAllTools(server: McpServer): void {
  registerReadOnlyTools(server);
  registerMomentWriteTools(server);
  registerVideoConferenceWriteTools(server);
}

function getRegisteredTools(server: McpServer): Record<string, any> {
  return (server as any)._registeredTools || {};
}

const READ_ONLY_TOOLS = [
  'chorus_list_conversations',
  'chorus_get_conversation',
  'chorus_get_transcript',
  'chorus_get_conversation_trackers',
  'chorus_search_conversations',
  'chorus_list_users',
  'chorus_get_user',
  'chorus_search_users',
  'chorus_list_teams',
  'chorus_get_team',
  'chorus_get_team_members',
  'chorus_list_scorecards',
  'chorus_get_scorecard',
  'chorus_list_scorecard_templates',
  'chorus_get_scorecard_template',
  'chorus_list_playlists',
  'chorus_get_playlist',
  'chorus_list_playlist_moments',
  'chorus_list_moments',
  'chorus_get_moment',
  'chorus_list_emails',
  'chorus_get_email',
  'chorus_filter_engagements',
  'chorus_get_engagement',
  'chorus_list_reports',
  'chorus_get_report',
  'chorus_get_activity_metrics',
  'chorus_list_video_conferences',
  'chorus_get_video_conference',
  'chorus_list_saved_searches',
  'chorus_get_saved_search',
  'chorus_execute_saved_search',
  'chorus_list_integrations',
  'chorus_get_integration',
  'chorus_get_session',
];

const WRITE_TOOLS = [
  'chorus_create_moment',
  'chorus_delete_moment',
  'chorus_upload_recording',
  'chorus_delete_recording',
];

describe('Tool Registration', () => {
  describe('readonly mode (default)', () => {
    let server: McpServer;

    beforeAll(() => {
      server = new McpServer({ name: 'test', version: '1.0.0' });
      registerReadOnlyTools(server);
    });

    it('registers 35 read-only tools', () => {
      const tools = getRegisteredTools(server);
      expect(Object.keys(tools).length).toBe(35);
    });

    it.each(READ_ONLY_TOOLS)('%s is registered', (toolName) => {
      const tools = getRegisteredTools(server);
      expect(tools[toolName]).toBeDefined();
    });

    it.each(WRITE_TOOLS)('%s is NOT registered', (toolName) => {
      const tools = getRegisteredTools(server);
      expect(tools[toolName]).toBeUndefined();
    });
  });

  describe('all mode', () => {
    let server: McpServer;

    beforeAll(() => {
      server = new McpServer({ name: 'test', version: '1.0.0' });
      registerAllTools(server);
    });

    it('registers all 39 tools', () => {
      const tools = getRegisteredTools(server);
      expect(Object.keys(tools).length).toBe(39);
    });

    it.each(WRITE_TOOLS)('%s is registered', (toolName) => {
      const tools = getRegisteredTools(server);
      expect(tools[toolName]).toBeDefined();
    });
  });

  describe('tool naming conventions', () => {
    let server: McpServer;

    beforeAll(() => {
      server = new McpServer({ name: 'test', version: '1.0.0' });
      registerAllTools(server);
    });

    it('prefixes all tool names with chorus_', () => {
      const tools = getRegisteredTools(server);
      for (const name of Object.keys(tools)) {
        expect(name).toMatch(/^chorus_/);
      }
    });

    it('uses snake_case for all tool names', () => {
      const tools = getRegisteredTools(server);
      for (const name of Object.keys(tools)) {
        expect(name).toMatch(/^[a-z_]+$/);
      }
    });

    it('has no duplicate tool names', () => {
      const tools = getRegisteredTools(server);
      const names = Object.keys(tools);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });
  });

  describe('ANNOTATIONS presets', () => {
    it('READ_ONLY marks tools as read-only and idempotent', () => {
      expect(ANNOTATIONS.READ_ONLY).toEqual({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      });
    });

    it('CREATE marks tools as non-read-only and non-idempotent', () => {
      expect(ANNOTATIONS.CREATE).toEqual({
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      });
    });

    it('DELETE marks tools as destructive', () => {
      expect(ANNOTATIONS.DELETE).toEqual({
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      });
    });
  });
});
