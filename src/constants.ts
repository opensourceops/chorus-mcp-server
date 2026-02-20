export const API_BASE_URL = "https://chorus.ai/api/v1";
export const CHARACTER_LIMIT = 25000;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

/**
 * Reusable tool annotation presets.
 *
 * The MCP spec defines exactly 4 annotation hints per tool:
 *   readOnlyHint, destructiveHint, idempotentHint, openWorldHint
 *
 * These presets avoid repeating identical objects across 35+ tools.
 */
export const ANNOTATIONS = {
  /** Read-only, safe to call repeatedly (most tools). */
  READ_ONLY: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  /** Creates a new resource (not idempotent, not destructive). */
  CREATE: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  /** Permanently deletes a resource (destructive, not idempotent). */
  DELETE: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
  },
} as const;
