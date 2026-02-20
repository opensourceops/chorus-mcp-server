import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerConversationTools } from '../../src/tools/conversations.js';
import { registerUserTools } from '../../src/tools/users.js';
import { registerTeamTools } from '../../src/tools/teams.js';
import { registerScorecardTools } from '../../src/tools/scorecards.js';
import { registerPlaylistTools } from '../../src/tools/playlists.js';
import { registerMomentTools } from '../../src/tools/moments.js';
import { registerEmailTools } from '../../src/tools/emails.js';
import { registerEngagementTools } from '../../src/tools/engagements.js';
import { registerReportTools } from '../../src/tools/reports.js';
import { registerSavedSearchTools } from '../../src/tools/saved-searches.js';
import { registerVideoConferenceTools } from '../../src/tools/video-conferences.js';
import { registerIntegrationTools } from '../../src/tools/integrations.js';
import { ANNOTATIONS } from '../../src/constants.js';

describe('Tool Registration', () => {
  let server: McpServer;

  beforeAll(() => {
    server = new McpServer({ name: 'test', version: '1.0.0' });
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
  });

  function getRegisteredTools(): Record<string, any> {
    return (server as any)._registeredTools || {};
  }

  it('registers all 38 expected tools', () => {
    const tools = getRegisteredTools();
    const toolNames = Object.keys(tools);
    expect(toolNames.length).toBe(39);
  });

  it('prefixes all tool names with chorus_', () => {
    const tools = getRegisteredTools();
    for (const name of Object.keys(tools)) {
      expect(name).toMatch(/^chorus_/);
    }
  });

  it('uses snake_case for all tool names', () => {
    const tools = getRegisteredTools();
    for (const name of Object.keys(tools)) {
      expect(name).toMatch(/^[a-z_]+$/);
    }
  });

  it('has no duplicate tool names', () => {
    const tools = getRegisteredTools();
    const names = Object.keys(tools);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  describe('read-only tools', () => {
    const readOnlyTools = [
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

    it.each(readOnlyTools)('%s is registered', (toolName) => {
      const tools = getRegisteredTools();
      expect(tools[toolName]).toBeDefined();
    });
  });

  describe('write tools', () => {
    const createTools = ['chorus_create_moment', 'chorus_upload_recording'];
    const deleteTools = ['chorus_delete_moment', 'chorus_delete_recording'];

    it.each(createTools)('%s is registered', (toolName) => {
      const tools = getRegisteredTools();
      expect(tools[toolName]).toBeDefined();
    });

    it.each(deleteTools)('%s is registered', (toolName) => {
      const tools = getRegisteredTools();
      expect(tools[toolName]).toBeDefined();
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
