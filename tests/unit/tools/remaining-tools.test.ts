import axios from 'axios';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTeamTools } from '../../../src/tools/teams.js';
import { registerPlaylistTools } from '../../../src/tools/playlists.js';
import { registerEmailTools } from '../../../src/tools/emails.js';
import { registerEngagementTools } from '../../../src/tools/engagements.js';
import { registerReportTools } from '../../../src/tools/reports.js';
import { registerSavedSearchTools } from '../../../src/tools/saved-searches.js';
import { registerVideoConferenceTools, registerVideoConferenceWriteTools } from '../../../src/tools/video-conferences.js';
import { registerIntegrationTools } from '../../../src/tools/integrations.js';
import {
  makeTeam, makeUser, makePlaylist, makeMoment,
  makeEmail, makeEngagement, makeReport, makeActivityMetrics,
  makeSavedSearch, makeConversation, makeVideoConference, makeIntegration,
  wrapJsonApiList, wrapJsonApiSingle,
} from '../../fixtures/chorus-responses.js';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('Team Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerTeamTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  it('chorus_list_teams returns teams', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeTeam()], 'team') });
    const result = await getToolHandler('chorus_list_teams').handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Enterprise Sales');
  });

  it('chorus_get_team returns team details', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiSingle(makeTeam({ members: [makeUser()] } as any), 'team') });
    const result = await getToolHandler('chorus_get_team').handler({ team_id: 'team-001', response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Enterprise Sales');
  });

  it('chorus_get_team_members returns members', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeUser()], 'user') });
    const result = await getToolHandler('chorus_get_team_members').handler({ team_id: 'team-001', limit: 20, offset: 0, response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Jane Smith');
  });
});

describe('Playlist Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerPlaylistTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  it('chorus_list_playlists returns playlists', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makePlaylist()], 'playlist') });
    const result = await getToolHandler('chorus_list_playlists').handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Best Discovery Calls');
  });

  it('chorus_get_playlist returns playlist details', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiSingle(makePlaylist(), 'playlist') });
    const result = await getToolHandler('chorus_get_playlist').handler({ playlist_id: 'pl-001', response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Best Discovery Calls');
  });
});

describe('Email Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerEmailTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  it('chorus_list_emails returns emails', async () => {
    // Email fixture uses `name` for subject and nested `email.initiator` for sender
    const emailFixture = {
      ...makeEmail(),
      name: 'Follow-up: Discovery Call',
      email: { initiator: { name: 'Jane Smith', email: 'jane@ourco.com' }, sent_time: '2024-06-15T16:00:00Z' },
    };
    mockedAxios.mockResolvedValue({ data: wrapJsonApiList([emailFixture], 'email') });
    const result = await getToolHandler('chorus_list_emails').handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Follow-up: Discovery Call');
    expect(result.content[0].text).toContain('Jane Smith');
  });

  it('chorus_get_email returns email details', async () => {
    const emailFixture = {
      ...makeEmail(),
      name: 'Follow-up: Discovery Call',
      email: { initiator: { name: 'Jane Smith', email: 'jane@ourco.com' }, sent_time: '2024-06-15T16:00:00Z' },
      owner: { name: 'Jane Smith', email: 'jane@ourco.com' },
      participants: [
        { name: 'Jane Smith', email: 'jane@ourco.com', type: 'rep' },
        { name: 'Bob Johnson', email: 'bob@acme.com', type: 'prospect' },
      ],
    };
    mockedAxios.mockResolvedValue({ data: wrapJsonApiSingle(emailFixture, 'email') });
    const result = await getToolHandler('chorus_get_email').handler({ email_id: 'email-001', response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('jane@ourco.com');
    expect(result.content[0].text).toContain('bob@acme.com');
  });
});

describe('Engagement Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerEngagementTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  it('chorus_filter_engagements returns engagements', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeEngagement()], 'engagement') });
    const result = await getToolHandler('chorus_filter_engagements').handler({
      engagement_type: 'all', limit: 20, offset: 0, response_format: 'markdown',
    }, {} as any);
    expect(result.content[0].text).toContain('meeting');
  });
});

describe('Report Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerReportTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  it('chorus_list_reports returns reports', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeReport()], 'report') });
    const result = await getToolHandler('chorus_list_reports').handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Weekly Activity Report');
  });

  it('chorus_get_activity_metrics returns metrics', async () => {
    // Activity metrics is not JSON:API, it returns a plain object
    mockedAxios.mockResolvedValue({ data: makeActivityMetrics() });
    const result = await getToolHandler('chorus_get_activity_metrics').handler({
      start_date: '2024-06-01', end_date: '2024-06-30', response_format: 'markdown',
    }, {} as any);
    expect(result.content[0].text).toContain('24');
    expect(result.content[0].text).toContain('45%');
  });
});

describe('Saved Search Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerSavedSearchTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  it('chorus_list_saved_searches returns searches', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeSavedSearch()], 'saved_search') });
    const result = await getToolHandler('chorus_list_saved_searches').handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Competitor X Mentions');
  });

  it('chorus_execute_saved_search returns results', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeConversation()], 'conversation') });
    const result = await getToolHandler('chorus_execute_saved_search').handler({ search_id: 'ss-001', limit: 20, offset: 0, response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Discovery Call');
  });
});

describe('Video Conference Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerVideoConferenceTools(server);
    registerVideoConferenceWriteTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  it('chorus_list_video_conferences returns conferences', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeVideoConference()], 'video_conference') });
    const result = await getToolHandler('chorus_list_video_conferences').handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Weekly Pipeline Review');
  });

  it('chorus_upload_recording creates a recording', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiSingle(makeVideoConference({ id: 'vc-new' }), 'video_conference') });
    const result = await getToolHandler('chorus_upload_recording').handler({
      title: 'External Call',
      recording_url: 'https://example.com/recording.mp4',
      participants: [{ name: 'Jane', email: 'jane@ourco.com' }],
      date: '2024-06-15T14:00:00Z',
    }, {} as any);
    expect(result.content[0].text).toContain('uploaded successfully');
  });

  it('chorus_delete_recording deletes a recording', async () => {
    mockedAxios.mockResolvedValue({ data: undefined });
    const result = await getToolHandler('chorus_delete_recording').handler({ conference_id: 'vc-001' }, {} as any);
    expect(result.content[0].text).toContain('deleted successfully');
  });
});

describe('Integration Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerIntegrationTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  it('chorus_list_integrations returns integrations', async () => {
    mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeIntegration()], 'integration') });
    const result = await getToolHandler('chorus_list_integrations').handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('Salesforce CRM');
  });

  it('chorus_get_session returns session info', async () => {
    // Session endpoint returns plain JSON, not JSON:API
    mockedAxios.mockResolvedValue({ data: { userId: 'user-001', role: 'admin' } });
    const result = await getToolHandler('chorus_get_session').handler({ response_format: 'markdown' }, {} as any);
    expect(result.content[0].text).toContain('user-001');
  });
});
