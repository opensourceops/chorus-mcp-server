import axios from 'axios';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerScorecardTools } from '../../../src/tools/scorecards.js';
import { makeScorecard, makeScorecardTemplate, wrapJsonApiList, wrapJsonApiSingle } from '../../fixtures/chorus-responses.js';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('Scorecard Tools', () => {
  let server: McpServer;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-key' };
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerScorecardTools(server);
  });

  afterAll(() => { process.env = originalEnv; });

  function getToolHandler(name: string) {
    return (server as any)._registeredTools[name];
  }

  describe('chorus_list_scorecards', () => {
    it('returns scorecards list', async () => {
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeScorecard()], 'scorecard') });

      const tool = getToolHandler('chorus_list_scorecards');
      const result = await tool.handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Alex Rep');
      expect(result.content[0].text).toContain('35/50');
    });

    it('passes all filters to API', async () => {
      mockedAxios.mockResolvedValue({ data: { data: [], meta: { page: { total: 0 } } } });

      const tool = getToolHandler('chorus_list_scorecards');
      await tool.handler({
        user_id: 'user-002',
        conversation_id: 'conv-001',
        template_id: 'tmpl-001',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        limit: 20,
        offset: 0,
        response_format: 'markdown',
      }, {} as any);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            "filter[user_id]": 'user-002',
            "filter[conversation_id]": 'conv-001',
            "filter[template_id]": 'tmpl-001',
          }),
        })
      );
    });
  });

  describe('chorus_get_scorecard', () => {
    it('returns scorecard with criteria table', async () => {
      mockedAxios.mockResolvedValue({ data: wrapJsonApiSingle(makeScorecard(), 'scorecard') });

      const tool = getToolHandler('chorus_get_scorecard');
      const result = await tool.handler({ scorecard_id: 'sc-001', response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('Metrics');
      expect(result.content[0].text).toContain('Economic Buyer');
      expect(result.content[0].text).toContain('70%');
      expect(result.content[0].text).toContain('Good probing questions');
    });
  });

  describe('chorus_list_scorecard_templates', () => {
    it('returns template list', async () => {
      mockedAxios.mockResolvedValue({ data: wrapJsonApiList([makeScorecardTemplate()], 'scorecard_template') });

      const tool = getToolHandler('chorus_list_scorecard_templates');
      const result = await tool.handler({ limit: 20, offset: 0, response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('MEDDIC');
      expect(result.content[0].text).toContain('5 criteria');
    });
  });

  describe('chorus_get_scorecard_template', () => {
    it('returns template with criteria details', async () => {
      mockedAxios.mockResolvedValue({ data: wrapJsonApiSingle(makeScorecardTemplate(), 'scorecard_template') });

      const tool = getToolHandler('chorus_get_scorecard_template');
      const result = await tool.handler({ template_id: 'tmpl-001', response_format: 'markdown' }, {} as any);

      expect(result.content[0].text).toContain('MEDDIC');
      expect(result.content[0].text).toContain('Quantifiable measures of value');
    });
  });
});
