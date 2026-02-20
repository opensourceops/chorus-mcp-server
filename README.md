# Chorus MCP Server

A Model Context Protocol (MCP) server for the Chorus.ai conversation intelligence platform. Connect Chorus to any MCP-compatible AI client to access sales call recordings, transcripts, scorecards, and analytics through natural language.

## Features

- **39 Tools** -- Full Chorus API coverage: conversations, transcripts, scorecards, playlists, moments, emails, engagements, reports, and video conferences
- **6 Resources** -- URI-based data access for users, teams, templates, searches, conversations, and playlists
- **6 Workflow Prompts** -- Call analysis, deal risk scoring, competitive intel, meeting summaries, rep reviews, and customer feedback synthesis
- **Token-Optimized** -- Compact markdown and JSON responses reduce token consumption
- **Smart Pagination** -- Automatic handling on all list endpoints
- **Annotation Presets** -- READ_ONLY, CREATE, and DELETE access levels

## Prerequisites

- **Node.js** v20.9+, v22+, or v24+ (LTS versions)
- **npm** v9+
- **MCP Client** -- Claude Code, Continue.dev, or any MCP-compatible client
- **Chorus API Key** -- Generate one in your Chorus Personal Settings ([API docs](https://api-docs.chorus.ai/))

## Quick Start with Claude Code

Run `npx` directly through Claude Code. No clone, no build.

### Step 1: Get Your Chorus API Key

1. Log in to Chorus.ai
2. Navigate to **Personal Settings**
3. Generate an API token

### Step 2: Add the MCP Server

```bash
claude mcp add --transport stdio chorus \
  --scope user \
  -e CHORUS_API_KEY=<YOUR_API_KEY> \
  -e CHORUS_TOOL_MODE=readonly \
  -- npx -y @opensourceops/chorus-mcp
```

Replace `<YOUR_API_KEY>` with your Chorus API token. Set `CHORUS_TOOL_MODE` to `all` if you need write and delete tools.

### Step 3: Restart Claude Code

Quit and reopen Claude Code for the new server to load.

### Step 4: Verify

Ask Claude:

```
List the available Chorus tools.
```

You should see 39 tools, including `chorus_list_conversations`, `chorus_get_transcript`, and `chorus_search_conversations`.

## Global Install

Install the package globally:

```bash
npm install -g @opensourceops/chorus-mcp
```

Then configure your MCP client to run `chorus-mcp-server` instead of `npx`:

```json
{
  "mcpServers": {
    "chorus": {
      "command": "chorus-mcp-server",
      "env": {
        "CHORUS_API_KEY": "your_api_key",
        "CHORUS_TOOL_MODE": "readonly"
      }
    }
  }
}
```

## Available Tools

### Conversations (5 read-only)
- `chorus_list_conversations` -- List calls and meetings with filters
- `chorus_get_conversation` -- Get conversation metadata
- `chorus_get_transcript` -- Get speaker-attributed transcript
- `chorus_get_conversation_trackers` -- Get tracker hits (competitors, keywords)
- `chorus_search_conversations` -- Search by keyword, participant, or date

### Users (3 read-only)
- `chorus_list_users` -- List all users
- `chorus_get_user` -- Get user details
- `chorus_search_users` -- Search users by name or email

### Teams (3 read-only)
- `chorus_list_teams` -- List all teams
- `chorus_get_team` -- Get team details
- `chorus_get_team_members` -- List members of a team

### Scorecards (4 read-only)
- `chorus_list_scorecards` -- List scorecards
- `chorus_get_scorecard` -- Get scorecard details
- `chorus_list_scorecard_templates` -- List scoring templates
- `chorus_get_scorecard_template` -- Get template details

### Playlists & Moments (7 tools: 5 read-only, 2 write)
- `chorus_list_playlists` -- List playlists
- `chorus_get_playlist` -- Get playlist details
- `chorus_list_playlist_moments` -- List moments in a playlist
- `chorus_list_moments` -- List all moments
- `chorus_get_moment` -- Get moment details
- `chorus_create_moment` -- Create a moment (write)
- `chorus_delete_moment` -- Delete a moment (write, destructive)

### Emails (2 read-only)
- `chorus_list_emails` -- List tracked emails
- `chorus_get_email` -- Get email details

### Engagements (2 read-only)
- `chorus_filter_engagements` -- Filter engagements with criteria
- `chorus_get_engagement` -- Get engagement details

### Reports (3 read-only)
- `chorus_list_reports` -- List available reports
- `chorus_get_report` -- Get report data
- `chorus_get_activity_metrics` -- Get activity metrics

### Saved Searches (3 read-only)
- `chorus_list_saved_searches` -- List saved searches
- `chorus_get_saved_search` -- Get saved search details
- `chorus_execute_saved_search` -- Run a saved search and return results

### Video Conferences (4 tools: 2 read-only, 2 write)
- `chorus_list_video_conferences` -- List video conferences
- `chorus_get_video_conference` -- Get video conference details
- `chorus_upload_recording` -- Upload a recording (write)
- `chorus_delete_recording` -- Delete a recording (write, destructive)

### Integrations & Session (3 read-only)
- `chorus_list_integrations` -- List connected integrations
- `chorus_get_integration` -- Get integration details
- `chorus_get_session` -- Get current session info

## Resources

Access data through MCP resource URIs:

| URI | Description |
|-----|-------------|
| `chorus://users/{user_id}` | User profile |
| `chorus://teams/{team_id}` | Team details |
| `chorus://scorecard-templates/{template_id}` | Scorecard template |
| `chorus://saved-searches/{search_id}` | Saved search definition |
| `chorus://conversations/{conversation_id}/summary` | Conversation summary |
| `chorus://playlists/{playlist_id}` | Playlist with moments |

## Prompts

Built-in workflow prompts for common sales intelligence tasks:

| Prompt | Purpose |
|--------|---------|
| `chorus_call_analysis` | Generate coaching feedback from a sales call |
| `chorus_deal_risk_assessment` | Score deal risk for a prospect |
| `chorus_competitive_intelligence` | Report competitor mentions across calls |
| `chorus_meeting_summary` | Produce structured meeting summary with action items |
| `chorus_rep_performance_review` | Evaluate rep performance from scorecards and metrics |
| `chorus_customer_feedback_synthesis` | Synthesize product feedback from conversations |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CHORUS_API_KEY` | -- | Chorus API token (required) |
| `CHORUS_TOOL_MODE` | `readonly` | Tool access level: `readonly` (read-only tools) or `all` (includes write and delete tools) |
| `TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `PORT` | `3000` | HTTP server port (when `TRANSPORT=http`) |

### Transport Modes

The server supports two transport modes:

**stdio (default)** -- Standard input/output. Use with Claude Code and most MCP clients.

**Streamable HTTP** -- HTTP-based transport for network deployments:

```bash
TRANSPORT=http PORT=3000 CHORUS_API_KEY=your_key CHORUS_TOOL_MODE=readonly npx @opensourceops/chorus-mcp
```

## Local Development

Clone the repository to modify the server, run tests, or contribute.

### Step 1: Clone and Build

```bash
git clone https://github.com/opensourceops/chorus-mcp-server.git
cd chorus-mcp-server
npm install
npm run build
```

### Step 2: Configure Your MCP Client

#### Option A: Claude Code (via CLI)

```bash
claude mcp add --transport stdio chorus \
  -e CHORUS_API_KEY=your_api_key \
  -e CHORUS_TOOL_MODE=readonly \
  -- $(which node) $(pwd)/dist/index.js
```

#### Option B: Manual JSON Configuration

Add to your MCP client's config file:

```json
{
  "mcpServers": {
    "chorus": {
      "command": "node",
      "args": ["/absolute/path/to/chorus-mcp-server/dist/index.js"],
      "env": {
        "CHORUS_API_KEY": "your_api_key",
        "CHORUS_TOOL_MODE": "readonly"
      }
    }
  }
}
```

### Step 3: Restart and Verify

Restart your MCP client, then ask:

```
Show me recent sales calls from Chorus.
```

## Project Structure

```
chorus-mcp-server/
├── src/
│   ├── index.ts         # Entry point
│   ├── constants.ts     # Shared constants
│   ├── types.ts         # Type definitions
│   ├── services/        # API client, error handler, formatters
│   ├── schemas/         # Zod validation schemas
│   ├── tools/           # 12 tool domain files
│   ├── resources/       # MCP resource handlers
│   └── prompts/         # Workflow prompts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── dist/                # Compiled output (generated)
├── package.json
└── tsconfig.json
```

## Troubleshooting

### API Key Issues

Test your key directly:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.chorus.ai/v1/conversations
```

A valid key returns conversation data.

### Tools Not Appearing

1. Rebuild after code changes: `npm run build`
2. Restart your MCP client (quit and reopen)
3. Use absolute paths in manual JSON configuration

### Node.js Version Warnings

Use Node.js LTS versions (20.9+, 22+, or 24+). Odd-numbered releases (23, 25) are non-LTS and unsupported. Switch with `nvm use 22`.

## Security

- Never commit `.env` files or API keys
- Store `CHORUS_API_KEY` in environment variables, not in code
- Destructive tools (`chorus_delete_moment`, `chorus_delete_recording`) require explicit confirmation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

Apache 2.0 -- See [LICENSE](LICENSE).

## Support

- **Issues** -- [GitHub Issues](https://github.com/opensourceops/chorus-mcp-server/issues)
- **API Reference** -- [Chorus API Documentation](https://api-docs.chorus.ai/)
