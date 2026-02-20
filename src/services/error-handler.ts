import axios from "axios";

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const message =
        typeof error.response.data === "object" && error.response.data !== null
          ? (error.response.data as Record<string, unknown>).message ??
            (error.response.data as Record<string, unknown>).error ??
            ""
          : "";

      switch (status) {
        case 400:
          return `Error: Bad request. ${message ? String(message) : "Check your parameters and try again."}`;
        case 401:
          return "Error: Authentication failed. Check your CHORUS_API_KEY environment variable. Generate a token from Chorus Personal Settings.";
        case 403:
          return "Error: Access denied. Your API key may lack permissions for this resource, or the recording is marked as private.";
        case 404:
          return "Error: Resource not found. Verify the ID is correct and that you have access to this resource.";
        case 429:
          return "Error: Rate limit exceeded. Wait a moment before making more requests.";
        default:
          if (status >= 500) {
            return `Error: Chorus API server error (${status}). Try again later.`;
          }
          return `Error: API request failed with status ${status}. ${message ? String(message) : ""}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "Error: Request timed out. The Chorus API did not respond within 30 seconds. Try again.";
    } else if (error.code === "ECONNREFUSED") {
      return "Error: Could not connect to the Chorus API. Check your network connection.";
    }
  }

  return `Error: Unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`;
}
