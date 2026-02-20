import axios, { type AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../constants.js";

function getApiKey(): string {
  const key = process.env.CHORUS_API_KEY;
  if (!key) {
    throw new Error(
      "CHORUS_API_KEY environment variable is not set. " +
        "Generate an API token from your Chorus Personal Settings page."
    );
  }
  return key;
}

/**
 * JSON:API record returned by the Chorus API.
 */
interface JsonApiRecord {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

interface JsonApiListResponse {
  data: JsonApiRecord[];
  meta?: { page?: { cursor?: string; total?: number } };
}

interface JsonApiSingleResponse {
  data: JsonApiRecord;
}

/**
 * Detect whether a response body is JSON:API format.
 */
function isJsonApiList(body: unknown): body is JsonApiListResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "data" in body &&
    Array.isArray((body as JsonApiListResponse).data) &&
    (body as JsonApiListResponse).data.length > 0 &&
    "attributes" in (body as JsonApiListResponse).data[0]
  );
}

function isJsonApiSingle(body: unknown): body is JsonApiSingleResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "data" in body &&
    !Array.isArray((body as JsonApiSingleResponse).data) &&
    typeof (body as JsonApiSingleResponse).data === "object" &&
    (body as JsonApiSingleResponse).data !== null &&
    "attributes" in (body as JsonApiSingleResponse).data
  );
}

/**
 * Flatten a single JSON:API record into a plain object with id at the top.
 */
function flattenRecord(record: JsonApiRecord): Record<string, unknown> {
  return { id: record.id, ...record.attributes };
}

/**
 * Auto-normalize a Chorus API response:
 * - JSON:API list  -> { items: [...flattened], total, cursor }
 * - JSON:API single -> flattened record
 * - Already plain   -> return as-is
 */
function normalizeResponse(body: unknown): unknown {
  if (isJsonApiList(body)) {
    const items = body.data.map(flattenRecord);
    return {
      items,
      total: body.meta?.page?.total ?? items.length,
      cursor: body.meta?.page?.cursor,
    };
  }

  if (isJsonApiSingle(body)) {
    return flattenRecord(body.data);
  }

  // Handle empty JSON:API response: { data: [] }
  if (
    typeof body === "object" &&
    body !== null &&
    "data" in body &&
    Array.isArray((body as { data: unknown[] }).data) &&
    (body as { data: unknown[] }).data.length === 0
  ) {
    return { items: [], total: 0 };
  }

  return body;
}

export async function makeApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  const apiKey = getApiKey();

  const config: AxiosRequestConfig = {
    method,
    url: `${API_BASE_URL}/${endpoint}`,
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 30000,
  };

  if (data !== undefined) {
    config.data = data;
  }

  if (params !== undefined) {
    config.params = params;
  }

  const response = await axios(config);
  return normalizeResponse(response.data) as T;
}
