import axios from 'axios';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerConversationTools } from '../../../src/tools/conversations.js';
import { makeConversation, makeTranscriptSegments, makeTrackers, wrapJsonApiList, wrapJsonApiSingle } from '../../fixtures/chorus-responses.js';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('Conversation Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerConversationTools(server);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function getToolHandler(toolName: string) {
    const tools = (server as any)._registeredTools;
    if (!tools || !tools[toolName]) {
      throw new Error(`Tool ${toolName} not registered`);
    }
    return tools[toolName];
  }

  describe('chorus_list_conversations', () => {
    it('registers the tool', () => {
      const tool = getToolHandler('chorus_list_conversations');
      expect(tool).toBeDefined();
    });

    it('returns conversations in markdown format', async () => {
      const conversations = [makeConversation(), makeConversation({ id: 'conv-002', title: 'Demo Call' })];
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList(conversations, 'conversation') });

      const tool = getToolHandler('chorus_list_conversations');
      const result = await tool.handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Discovery Call');
      expect(result.content[0].text).toContain('Demo Call');
    });

    it('returns conversations in JSON format', async () => {
      const conversations = [makeConversation()];
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList(conversations, 'conversation') });

      const tool = getToolHandler('chorus_list_conversations');
      const result = await tool.handler({ limit: 20, offset: 0, response_format: 'json' }, {} as any);

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].id).toBe('conv-001');
    });

    it('returns empty message when no conversations found', async () => {
      mockedAxios.mockResolvedValue({ data: { data: [], meta: { page: { total: 0 } } } });

      const tool = getToolHandler('chorus_list_conversations');
      const result = await tool.handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('No conversations found');
    });

    it('passes filter parameters to API', async () => {
      mockedAxios.mockResolvedValue({ data: { data: [], meta: { page: { total: 0 } } } });

      const tool = getToolHandler('chorus_list_conversations');
      await tool.handler({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        participant_email: 'bob@acme.com',
        team_id: 'team-001',
        limit: 10,
        offset: 5,
        response_format: 'markdown',
      }, {} as any);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            "filter[start_date]": '2024-01-01',
            "filter[end_date]": '2024-12-31',
            "filter[participant_email]": 'bob@acme.com',
            "filter[team_id]": 'team-001',
            "page[size]": 10,
          }),
        })
      );
    });

    it('handles API errors gracefully', async () => {
      mockedAxios.mockRejectedValue(new Error('Network error'));

      const tool = getToolHandler('chorus_list_conversations');
      const result = await tool.handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Error');
    });
  });

  describe('chorus_get_conversation', () => {
    it('returns conversation details', async () => {
      mockedAxios.mockResolvedValue({ data: wrapJsonApiSingle(makeConversation(), 'conversation') });

      const tool = getToolHandler('chorus_get_conversation');
      const result = await tool.handler({ conversation_id: 'conv-001', response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Discovery Call');
      expect(result.content[0].text).toContain('Jane Smith');
    });
  });

  describe('chorus_get_transcript', () => {
    it('returns full transcript', async () => {
      // Transcript segments use JSON:API format too
      const segments = makeTranscriptSegments().map((s, i) => ({
        id: `seg-${i}`,
        ...s,
      }));
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList(segments, 'transcript_segment') });

      const tool = getToolHandler('chorus_get_transcript');
      const result = await tool.handler({ conversation_id: 'conv-001', response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Jane Smith');
      expect(result.content[0].text).toContain('Bob Johnson');
      expect(result.content[0].text).toContain('manual reporting');
    });

    it('filters transcript by speaker', async () => {
      const segments = makeTranscriptSegments().map((s, i) => ({
        id: `seg-${i}`,
        ...s,
      }));
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList(segments, 'transcript_segment') });

      const tool = getToolHandler('chorus_get_transcript');
      const result = await tool.handler({
        conversation_id: 'conv-001',
        speaker_filter: 'Bob',
        response_format: 'markdown',
      }, {} as any);

      expect(result.content[0].text).toContain('Bob Johnson');
      expect(result.content[0].text).not.toContain('[0s] Jane Smith');
    });

    it('returns message when no segments match speaker filter', async () => {
      const segments = makeTranscriptSegments().map((s, i) => ({
        id: `seg-${i}`,
        ...s,
      }));
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList(segments, 'transcript_segment') });

      const tool = getToolHandler('chorus_get_transcript');
      const result = await tool.handler({
        conversation_id: 'conv-001',
        speaker_filter: 'Nobody',
        response_format: 'markdown',
      }, {} as any);

      expect(result.content[0].text).toContain('No transcript segments found');
    });
  });

  describe('chorus_get_conversation_trackers', () => {
    it('returns tracker data', async () => {
      const trackers = makeTrackers();
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList(trackers, 'tracker') });

      const tool = getToolHandler('chorus_get_conversation_trackers');
      const result = await tool.handler({ conversation_id: 'conv-001', response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Competitor X');
      expect(result.content[0].text).toContain('Pricing Discussion');
    });

    it('returns message when no trackers found', async () => {
      mockedAxios.mockResolvedValue({ data: { data: [], meta: { page: { total: 0 } } } });

      const tool = getToolHandler('chorus_get_conversation_trackers');
      const result = await tool.handler({ conversation_id: 'conv-001', response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('No trackers detected');
    });
  });

  describe('chorus_search_conversations', () => {
    it('searches with query and returns results', async () => {
      const conversations = [makeConversation()];
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList(conversations, 'conversation') });

      const tool = getToolHandler('chorus_search_conversations');
      const result = await tool.handler({
        query: 'pricing',
        limit: 20,
        offset: 0,
        response_format: 'markdown',
      }, {} as any);

      expect(result.content[0].text).toContain('pricing');
      expect(result.content[0].text).toContain('Discovery Call');
    });
  });
});
