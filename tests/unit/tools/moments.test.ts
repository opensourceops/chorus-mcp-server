import axios from 'axios';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMomentTools } from '../../../src/tools/moments.js';
import { makeMoment, wrapJsonApiList, wrapJsonApiSingle } from '../../fixtures/chorus-responses.js';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('Moment Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerMomentTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  describe('chorus_list_moments', () => {
    it('returns moments list', async () => {
      // Moments use `subject` not `title` in Chorus API, and have `shared_on`
      const moment = { ...makeMoment(), subject: 'Great objection handling', shared_on: '2025-06-13T00:00:18Z' };
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList([moment], 'moment') });

      const tool = getToolHandler('chorus_list_moments');
      const result = await tool.handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Great objection handling');
    });

    it('filters by conversation_id', async () => {
      mockedAxios.mockResolvedValue({ data: { data: [], meta: { page: { total: 0 } } } });

      const tool = getToolHandler('chorus_list_moments');
      await tool.handler({ conversation_id: 'conv-001', limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ "filter[conversation_id]": 'conv-001' }),
        })
      );
    });
  });

  describe('chorus_get_moment', () => {
    it('returns moment details with transcript snippet', async () => {
      mockedAxios.mockResolvedValue({ data: wrapJsonApiSingle(makeMoment(), 'moment') });

      const tool = getToolHandler('chorus_get_moment');
      const result = await tool.handler({ moment_id: 'mom-001', response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Great objection handling');
      expect(result.content[0].text).toContain('ROI');
    });
  });

  describe('chorus_create_moment', () => {
    it('creates a moment and returns confirmation', async () => {
      mockedAxios.mockResolvedValue({ data: wrapJsonApiSingle({ ...makeMoment(), id: 'mom-new' }, 'moment') });

      const tool = getToolHandler('chorus_create_moment');
      const result = await tool.handler({
        conversation_id: 'conv-001',
        timestamp_ms: 120000,
        title: 'Key insight',
        description: 'Customer revealed budget',
      }, {} as any);

      expect(result.content[0].text).toContain('created successfully');
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('chorus_delete_moment', () => {
    it('deletes a moment and returns confirmation', async () => {
      mockedAxios.mockResolvedValue({ data: undefined });

      const tool = getToolHandler('chorus_delete_moment');
      const result = await tool.handler({ moment_id: 'mom-001' }, {} as any);

      expect(result.content[0].text).toContain('deleted successfully');
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
