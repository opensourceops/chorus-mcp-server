import { AxiosError, AxiosHeaders } from 'axios';
import { handleApiError } from '../../../src/services/error-handler.js';

function makeAxiosError(status: number, data?: unknown): AxiosError {
  const headers = new AxiosHeaders();
  const error = new AxiosError(
    `Request failed with status code ${status}`,
    String(status),
    undefined,
    undefined,
    {
      status,
      statusText: 'Error',
      headers,
      config: { headers } as any,
      data: data ?? {},
    }
  );
  return error;
}

describe('Error Handler', () => {
  describe('handleApiError', () => {
    it('maps 401 to authentication error', () => {
      const error = makeAxiosError(401);
      const message = handleApiError(error);
      expect(message).toContain('Authentication failed');
      expect(message).toContain('CHORUS_API_KEY');
    });

    it('maps 403 to access denied error', () => {
      const error = makeAxiosError(403);
      const message = handleApiError(error);
      expect(message).toContain('Access denied');
    });

    it('maps 404 to not found error', () => {
      const error = makeAxiosError(404);
      const message = handleApiError(error);
      expect(message).toContain('not found');
    });

    it('maps 429 to rate limit error', () => {
      const error = makeAxiosError(429);
      const message = handleApiError(error);
      expect(message).toContain('Rate limit');
    });

    it('maps 400 to bad request with API message', () => {
      const error = makeAxiosError(400, { message: 'Invalid date format' });
      const message = handleApiError(error);
      expect(message).toContain('Bad request');
      expect(message).toContain('Invalid date format');
    });

    it('maps 500+ to server error', () => {
      const error = makeAxiosError(503);
      const message = handleApiError(error);
      expect(message).toContain('server error');
    });

    it('handles connection timeout', () => {
      const error = new AxiosError('timeout', 'ECONNABORTED');
      error.code = 'ECONNABORTED';
      const message = handleApiError(error);
      expect(message).toContain('timed out');
    });

    it('handles connection refused', () => {
      const error = new AxiosError('refused', 'ECONNREFUSED');
      error.code = 'ECONNREFUSED';
      const message = handleApiError(error);
      expect(message).toContain('Could not connect');
    });

    it('handles non-Axios errors', () => {
      const error = new Error('Something unexpected');
      const message = handleApiError(error);
      expect(message).toContain('Unexpected error');
      expect(message).toContain('Something unexpected');
    });

    it('handles non-Error objects', () => {
      const message = handleApiError('string error');
      expect(message).toContain('string error');
    });
  });
});
