import { CHARACTER_LIMIT, ResponseFormat } from "../constants.js";
import type { ChorusParticipant, PaginatedResponse } from "../types.js";

export function truncateResponse(text: string): string {
  if (text.length <= CHARACTER_LIMIT) {
    return text;
  }
  const truncated = text.slice(0, CHARACTER_LIMIT);
  return (
    truncated +
    "\n\n---\n*Response truncated. Use `limit` and `offset` parameters or add filters to see more results.*"
  );
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return isoString;
    }
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes < 60) {
    return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

export function formatParticipants(participants: ChorusParticipant[]): string {
  if (participants.length === 0) return "None";
  if (participants.length <= 3) {
    return participants.map((p) => p.name).join(", ");
  }
  const shown = participants.slice(0, 3).map((p) => p.name);
  return `${shown.join(", ")} (+${participants.length - 3} others)`;
}

export function formatPaginationInfo<T>(
  response: PaginatedResponse<T>
): string {
  const lines: string[] = [];
  lines.push(
    `Showing ${response.count} of ${response.total} results (offset: ${response.offset})`
  );
  if (response.has_more && response.next_offset !== undefined) {
    lines.push(`More results available. Use offset=${response.next_offset}`);
  }
  return lines.join("\n");
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  offset: number
): PaginatedResponse<T> {
  return {
    total,
    count: items.length,
    offset,
    items,
    has_more: total > offset + items.length,
    ...(total > offset + items.length
      ? { next_offset: offset + items.length }
      : {}),
  };
}

export function formatOutput(
  data: unknown,
  markdownFormatter: () => string,
  responseFormat: ResponseFormat
): string {
  let text: string;
  if (responseFormat === ResponseFormat.MARKDOWN) {
    text = markdownFormatter();
  } else {
    text = JSON.stringify(data, null, 2);
  }
  return truncateResponse(text);
}
