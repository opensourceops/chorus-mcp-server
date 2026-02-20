import {
  truncateResponse,
  formatDate,
  formatDuration,
  formatParticipants,
  formatPaginationInfo,
  buildPaginatedResponse,
  formatOutput,
} from '../../../src/services/formatters.js';
import { ResponseFormat, CHARACTER_LIMIT } from '../../../src/constants.js';

describe('Formatters', () => {
  describe('truncateResponse', () => {
    it('returns text unchanged when under limit', () => {
      const text = 'Short text';
      expect(truncateResponse(text)).toBe(text);
    });

    it('truncates text exceeding CHARACTER_LIMIT', () => {
      const text = 'x'.repeat(CHARACTER_LIMIT + 1000);
      const result = truncateResponse(text);
      expect(result.length).toBeLessThan(text.length);
      expect(result).toContain('truncated');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string', () => {
      const result = formatDate('2024-06-15T14:30:00Z');
      expect(result).toContain('2024');
      expect(result).toContain('Jun');
    });

    it('returns original string for invalid date', () => {
      expect(formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds only', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1m 30s');
    });

    it('formats minutes without seconds', () => {
      expect(formatDuration(120)).toBe('2m');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(3720)).toBe('1h 2m');
    });

    it('formats hours without minutes', () => {
      expect(formatDuration(3600)).toBe('1h');
    });
  });

  describe('formatParticipants', () => {
    it('returns None for empty array', () => {
      expect(formatParticipants([])).toBe('None');
    });

    it('joins up to 3 names', () => {
      const participants = [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Carol' },
      ];
      expect(formatParticipants(participants)).toBe('Alice, Bob, Carol');
    });

    it('shows count for more than 3', () => {
      const participants = [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Carol' },
        { name: 'Dave' },
        { name: 'Eve' },
      ];
      const result = formatParticipants(participants);
      expect(result).toContain('Alice, Bob, Carol');
      expect(result).toContain('+2 others');
    });
  });

  describe('buildPaginatedResponse', () => {
    it('builds response with has_more when more results exist', () => {
      const result = buildPaginatedResponse(['a', 'b'], 10, 0);
      expect(result).toEqual({
        total: 10,
        count: 2,
        offset: 0,
        items: ['a', 'b'],
        has_more: true,
        next_offset: 2,
      });
    });

    it('builds response without has_more at end', () => {
      const result = buildPaginatedResponse(['a', 'b'], 2, 0);
      expect(result).toEqual({
        total: 2,
        count: 2,
        offset: 0,
        items: ['a', 'b'],
        has_more: false,
      });
    });
  });

  describe('formatPaginationInfo', () => {
    it('includes count and total', () => {
      const response = buildPaginatedResponse(['a'], 10, 0);
      const result = formatPaginationInfo(response);
      expect(result).toContain('1 of 10');
    });

    it('includes next offset when more results exist', () => {
      const response = buildPaginatedResponse(['a'], 10, 0);
      const result = formatPaginationInfo(response);
      expect(result).toContain('offset=1');
    });
  });

  describe('formatOutput', () => {
    it('returns markdown when format is MARKDOWN', () => {
      const result = formatOutput(
        { value: 42 },
        () => '# Title\nContent',
        ResponseFormat.MARKDOWN
      );
      expect(result).toBe('# Title\nContent');
    });

    it('returns JSON when format is JSON', () => {
      const data = { value: 42 };
      const result = formatOutput(data, () => 'ignored', ResponseFormat.JSON);
      expect(JSON.parse(result)).toEqual(data);
    });
  });
});
