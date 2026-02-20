import axios from 'axios';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerUserTools } from '../../../src/tools/users.js';
import { makeUser, wrapJsonApiList, wrapJsonApiSingle } from '../../fixtures/chorus-responses.js';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('User Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerUserTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  describe('chorus_list_users', () => {
    it('returns users list', async () => {
      const users = [makeUser(), makeUser({ id: 'user-002', name: 'Alex Rep', email: 'alex@ourco.com' })];
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList(users, 'user') });

      const tool = getToolHandler('chorus_list_users');
      const result = await tool.handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Jane Smith');
      expect(result.content[0].text).toContain('Alex Rep');
    });

    it('filters by team and role', async () => {
      mockedAxios.mockResolvedValue({ data: { data: [], meta: { page: { total: 0 } } } });

      const tool = getToolHandler('chorus_list_users');
      await tool.handler({ team_id: 'team-001', role: 'manager', limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ "filter[team_id]": 'team-001', "filter[role]": 'manager' }),
        })
      );
    });
  });

  describe('chorus_get_user', () => {
    it('returns user profile', async () => {
      mockedAxios.mockResolvedValue({ data: wrapJsonApiSingle(makeUser(), 'user') });

      const tool = getToolHandler('chorus_get_user');
      const result = await tool.handler({ user_id: 'user-001', response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Jane Smith');
      expect(result.content[0].text).toContain('jane@ourco.com');
    });
  });

  describe('chorus_search_users', () => {
    it('returns matching users', async () => {
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeUser()], 'user') });

      const tool = getToolHandler('chorus_search_users');
      const result = await tool.handler({ query: 'jane', limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Jane Smith');
    });

    it('returns message when no users match', async () => {
      mockedAxios.mockResolvedValue({ data: { data: [], meta: { page: { total: 0 } } } });

      const tool = getToolHandler('chorus_search_users');
      const result = await tool.handler({ query: 'nobody', limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('No users found');
    });
  });
});
