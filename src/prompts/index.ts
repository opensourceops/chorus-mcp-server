import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "chorus_call_analysis",
    {
      title: "Sales Call Analysis",
      description:
        "Analyze a recorded sales call for coaching feedback. Examines transcript, talk-to-listen ratio, trackers, and provides actionable coaching recommendations.",
      argsSchema: {
        conversation_id: z
          .string()
          .describe("The conversation/call ID to analyze"),
        focus_areas: z
          .string()
          .default("overall")
          .describe(
            "Comma-separated coaching areas: discovery, objection_handling, closing, rapport, product_knowledge, next_steps, overall"
          ),
      },
    },
    async ({ conversation_id, focus_areas }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Analyze the sales call with conversation ID "${conversation_id}".

Use the following tools in sequence:
1. chorus_get_conversation to get call metadata (participants, duration, date)
2. chorus_get_transcript to get the full transcript
3. chorus_get_conversation_trackers to identify tracker hits (competitors, objections, topics)

Then provide a coaching analysis covering these focus areas: ${focus_areas}

Structure your analysis as:
## Call Overview
- Date, duration, participants, call type

## Talk-to-Listen Ratio Analysis
- Estimate from transcript who spoke more, identify longest monologues

## Key Moments
- Important points in the conversation (objections raised, competitors mentioned, pricing discussed)

## Coaching Feedback
For each focus area, provide:
- What went well (with transcript quotes)
- Areas for improvement (with specific suggestions)
- Recommended techniques or frameworks

## Action Items
- Specific next steps for the rep based on this call`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "chorus_deal_risk_assessment",
    {
      title: "Deal Risk Assessment",
      description:
        "Assess deal risk by analyzing recent conversations with a prospect. Examines sentiment, competitor mentions, objections, and engagement patterns.",
      argsSchema: {
        participant_email: z
          .string()
          .describe("The prospect/buyer email to analyze conversations for"),
        lookback_days: z
          .string()
          .default("30")
          .describe("Number of days back to analyze (default: 30)"),
      },
    },
    async ({ participant_email, lookback_days }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Assess deal risk for the prospect with email "${participant_email}" over the last ${lookback_days} days.

Use these tools:
1. chorus_list_conversations filtered by participant_email and date range
2. For each recent conversation, use chorus_get_conversation_trackers to find competitor mentions and objections
3. Use chorus_get_transcript for the most recent 2-3 calls to analyze sentiment and tone

Provide a risk assessment structured as:

## Deal Summary
- Number of conversations in period, total engagement time
- Key participants from buyer side

## Risk Signals
Rate each as Low/Medium/High:
- **Competitor Activity**: Are competitors being mentioned? How frequently?
- **Objection Patterns**: Are the same objections recurring without resolution?
- **Engagement Trend**: Is meeting frequency increasing or decreasing?
- **Stakeholder Breadth**: Are we talking to decision-makers or only champions?
- **Sentiment**: Is the buyer tone positive, neutral, or negative?
- **Next Steps Clarity**: Are clear next steps being set and followed through?

## Overall Risk Score
Low / Medium / High with justification

## Recommended Actions
Specific steps to de-risk the deal`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "chorus_competitive_intelligence",
    {
      title: "Competitive Intelligence Report",
      description:
        "Generate a competitive intelligence report by analyzing competitor mentions across recent conversations.",
      argsSchema: {
        competitor_name: z
          .string()
          .describe("The competitor name to track across conversations"),
        start_date: z
          .string()
          .describe("Start date for analysis (ISO 8601, e.g. 2024-01-01)"),
        end_date: z
          .string()
          .describe("End date for analysis (ISO 8601, e.g. 2024-12-31)"),
      },
    },
    async ({ competitor_name, start_date, end_date }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Generate a competitive intelligence report for "${competitor_name}" from ${start_date} to ${end_date}.

Steps:
1. Use chorus_search_conversations to find calls mentioning "${competitor_name}"
2. For each relevant call, use chorus_get_conversation_trackers to get context
3. Use chorus_get_transcript for the top 5-10 most relevant calls to extract exact quotes

Report structure:

## Executive Summary
- Total mentions, trend over time, most common contexts

## How Prospects Describe ${competitor_name}
- Common praise points (with quotes from transcripts)
- Common complaints (with quotes)

## Competitive Positioning
- Where ${competitor_name} is perceived as stronger
- Where we are perceived as stronger
- Common switching triggers

## Objections Related to ${competitor_name}
- Most frequent objections when ${competitor_name} is in the deal
- Successful rebuttals used by our reps (with examples)

## Win/Loss Patterns
- Patterns in deals where ${competitor_name} was mentioned

## Recommendations
- Messaging adjustments
- Battlecard suggestions
- Training priorities`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "chorus_meeting_summary",
    {
      title: "Meeting Summary & Action Items",
      description:
        "Generate a structured meeting summary with key discussion points, decisions, and action items from a conversation transcript.",
      argsSchema: {
        conversation_id: z
          .string()
          .describe("The conversation/call ID to summarize"),
      },
    },
    async ({ conversation_id }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Create a comprehensive meeting summary for conversation "${conversation_id}".

Use:
1. chorus_get_conversation for metadata
2. chorus_get_transcript for the full transcript
3. chorus_get_conversation_trackers for topic/keyword detection

Structure the summary as:

## Meeting Details
- Date, time, duration
- Participants (with roles if identifiable)
- Meeting type (discovery, demo, negotiation, check-in, etc.)

## Executive Summary
2-3 sentence overview of the meeting

## Key Discussion Points
Numbered list of main topics discussed with brief descriptions

## Decisions Made
Bullet list of any decisions reached during the meeting

## Action Items
For each action item:
- [ ] Description of the task
- **Owner**: Who is responsible (from transcript context)
- **Due**: Any mentioned deadline

## Open Questions
Items that were raised but not resolved

## Follow-Up
Suggested next steps based on the conversation`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "chorus_rep_performance_review",
    {
      title: "Rep Performance Review",
      description:
        "Generate a performance review for a sales rep by analyzing their scorecards, call activity metrics, and conversation patterns.",
      argsSchema: {
        user_id: z.string().describe("The rep's Chorus user ID"),
        start_date: z
          .string()
          .describe("Review period start (ISO 8601, e.g. 2024-01-01)"),
        end_date: z
          .string()
          .describe("Review period end (ISO 8601, e.g. 2024-12-31)"),
      },
    },
    async ({ user_id, start_date, end_date }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Create a performance review for rep with user ID "${user_id}" from ${start_date} to ${end_date}.

Steps:
1. chorus_get_user to get rep profile and team
2. chorus_list_scorecards filtered by user_id and date range
3. chorus_get_activity_metrics for the rep over the period
4. chorus_list_conversations filtered by the rep and date range
5. For the 2-3 lowest-scored calls, use chorus_get_scorecard for details

Report:

## Rep Profile
- Name, team, role, tenure

## Activity Summary
- Total calls, total duration, average call length
- Week-over-week trends

## Scorecard Analysis
- Average score across all scorecards
- Scores by criteria category
- Trend over time (improving, declining, stable)

## Strengths
- Top-scoring criteria with examples from calls

## Areas for Improvement
- Lowest-scoring criteria with specific examples
- Suggested training resources or playlist moments

## Recommendations
- Specific coaching actions
- Suggested playlists or calls to review
- Goals for next review period`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "chorus_customer_feedback_synthesis",
    {
      title: "Customer Feedback Synthesis",
      description:
        "Aggregate and synthesize customer feedback from conversations for product teams. Identifies feature requests, pain points, and trending topics.",
      argsSchema: {
        topic: z
          .string()
          .describe(
            "Product area or topic to focus on (e.g., 'reporting', 'integrations', 'onboarding')"
          ),
        start_date: z.string().describe("Start date (ISO 8601)"),
        end_date: z.string().describe("End date (ISO 8601)"),
      },
    },
    async ({ topic, start_date, end_date }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Synthesize customer feedback about "${topic}" from conversations between ${start_date} and ${end_date}.

Steps:
1. chorus_search_conversations with keyword "${topic}" and date filters
2. For the top 10-15 most relevant conversations, use chorus_get_transcript to extract customer quotes
3. Use chorus_get_conversation_trackers to identify related topics

Report:

## Overview
- Number of conversations mentioning "${topic}"
- Types of customers raising this topic

## Feature Requests
Ranked by frequency:
1. Request description - mentioned N times
   - Representative quotes from customers

## Pain Points
Current frustrations related to ${topic}:
1. Pain point - mentioned N times
   - Customer quotes showing impact

## Positive Feedback
What customers appreciate about current ${topic} capabilities

## Competitive Context
How customers compare our ${topic} to competitors

## Recommendations for Product Team
- Priority 1 items (high frequency, high impact)
- Priority 2 items (moderate frequency or impact)
- Quick wins vs. larger investments`,
          },
        },
      ],
    })
  );
}
