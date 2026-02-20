#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { registerConversationTools } from "./tools/conversations.js";
import { registerUserTools } from "./tools/users.js";
import { registerTeamTools } from "./tools/teams.js";
import { registerScorecardTools } from "./tools/scorecards.js";
import { registerPlaylistTools } from "./tools/playlists.js";
import { registerMomentTools } from "./tools/moments.js";
import { registerEmailTools } from "./tools/emails.js";
import { registerEngagementTools } from "./tools/engagements.js";
import { registerReportTools } from "./tools/reports.js";
import { registerSavedSearchTools } from "./tools/saved-searches.js";
import { registerVideoConferenceTools } from "./tools/video-conferences.js";
import { registerIntegrationTools } from "./tools/integrations.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

const server = new McpServer({
  name: "chorus-mcp-server",
  version: "1.0.0",
});

// Register all tools
registerConversationTools(server);
registerUserTools(server);
registerTeamTools(server);
registerScorecardTools(server);
registerPlaylistTools(server);
registerMomentTools(server);
registerEmailTools(server);
registerEngagementTools(server);
registerReportTools(server);
registerSavedSearchTools(server);
registerVideoConferenceTools(server);
registerIntegrationTools(server);

// Register resources and prompts
registerResources(server);
registerPrompts(server);

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Chorus MCP server running via stdio");
}

async function runHTTP(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      transport.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3000");
  app.listen(port, () => {
    console.error(`Chorus MCP server running on http://localhost:${port}/mcp`);
  });
}

// Validate API key
if (!process.env.CHORUS_API_KEY) {
  console.error(
    "WARNING: CHORUS_API_KEY environment variable is not set. " +
      "API calls will fail until a valid token is provided. " +
      "Generate one from your Chorus Personal Settings page."
  );
}

// Select transport
const transportMode = process.env.TRANSPORT || "stdio";
if (transportMode === "http") {
  runHTTP().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
