import axios from 'axios';
import { makeApiRequest } from '../../../src/services/api-client.js';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('API Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CHORUS_API_KEY: 'test-api-key-123' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('makeApiRequest', () => {
    it('sends GET request with correct headers', async () => {
      mockedAxios.mockResolvedValue({ data: { users: [] } });

      await makeApiRequest('users');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('/users'),
          headers: expect.objectContaining({
            Authorization: 'test-api-key-123',
            'Content-Type': 'application/json',
          }),
          timeout: 30000,
        })
      );
    });

    it('sends POST request with body', async () => {
      const body = { title: 'test', conversationId: 'conv-001' };
      mockedAxios.mockResolvedValue({ data: { id: 'mom-001' } });

      await makeApiRequest('moments', 'POST', body);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: body,
        })
      );
    });

    it('sends GET request with query params', async () => {
      mockedAxios.mockResolvedValue({ data: { conversations: [] } });

      await makeApiRequest('conversations', 'GET', undefined, {
        limit: 10,
        offset: 0,
        startDate: '2024-01-01',
      });

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { limit: 10, offset: 0, startDate: '2024-01-01' },
        })
      );
    });

    it('returns response data', async () => {
      const mockData = { users: [{ id: 'u1', name: 'Jane' }] };
      mockedAxios.mockResolvedValue({ data: mockData });

      const result = await makeApiRequest('users');

      expect(result).toEqual(mockData);
    });

    it('throws when CHORUS_API_KEY is not set', async () => {
      delete process.env.CHORUS_API_KEY;

      await expect(makeApiRequest('users')).rejects.toThrow('CHORUS_API_KEY');
    });

    it('sends DELETE request', async () => {
      mockedAxios.mockResolvedValue({ data: undefined });

      await makeApiRequest('moments/mom-001', 'DELETE');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
