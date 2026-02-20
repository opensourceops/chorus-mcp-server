import type {
  ChorusConversation,
  ChorusUser,
  ChorusTeam,
  ChorusScorecard,
  ChorusScorecardTemplate,
  ChorusPlaylist,
  ChorusMoment,
  ChorusEmail,
  ChorusEngagement,
  ChorusReport,
  ChorusSavedSearch,
  ChorusVideoConference,
  ChorusIntegration,
  ChorusTranscriptSegment,
  ChorusTracker,
  ChorusActivityMetrics,
} from '../../src/types.js';

export function makeConversation(overrides: Partial<ChorusConversation> & Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'conv-001',
    name: 'Discovery Call with Acme Corp',
    participants: [
      { name: 'Jane Smith', email: 'jane@ourco.com', role: 'AE', type: 'rep' },
      { name: 'Bob Johnson', email: 'bob@acme.com', role: 'Buyer', type: 'customer' },
    ],
    status: 'completed',
    summary: 'Discussed product fit and pricing. Competitor X mentioned twice.',
    action_items: ['Follow up on pricing', 'Send case study'],
    recording: {
      start_time: '2024-06-15T14:00:00Z',
      duration: 1800,
      utterances: [],
      trackers: [],
    },
    ...overrides,
  };
}

export function makeUser(overrides: Partial<ChorusUser> = {}): ChorusUser {
  return {
    id: 'user-001',
    name: 'Jane Smith',
    email: 'jane@ourco.com',
    role: 'manager',
    teamId: 'team-001',
    teamName: 'Enterprise Sales',
    active: true,
    createdAt: '2023-01-15T00:00:00Z',
    ...overrides,
  };
}

export function makeTeam(overrides: Partial<ChorusTeam> = {}): ChorusTeam {
  return {
    id: 'team-001',
    name: 'Enterprise Sales',
    managerId: 'user-001',
    managerName: 'Jane Smith',
    memberCount: 8,
    ...overrides,
  };
}

export function makeScorecard(overrides: Partial<ChorusScorecard> = {}): ChorusScorecard {
  return {
    id: 'sc-001',
    conversationId: 'conv-001',
    userId: 'user-002',
    userName: 'Alex Rep',
    templateId: 'tmpl-001',
    templateName: 'MEDDIC Scorecard',
    overallScore: 35,
    maxScore: 50,
    criteria: [
      { name: 'Metrics', score: 8, maxScore: 10 },
      { name: 'Economic Buyer', score: 7, maxScore: 10 },
      { name: 'Decision Criteria', score: 6, maxScore: 10 },
      { name: 'Decision Process', score: 7, maxScore: 10 },
      { name: 'Identify Pain', score: 7, maxScore: 10, comments: 'Good probing questions' },
    ],
    createdAt: '2024-06-16T09:00:00Z',
    evaluatorName: 'Jane Smith',
    ...overrides,
  };
}

export function makeScorecardTemplate(overrides: Partial<ChorusScorecardTemplate> = {}): ChorusScorecardTemplate {
  return {
    id: 'tmpl-001',
    name: 'MEDDIC Scorecard',
    description: 'Standard MEDDIC evaluation framework',
    criteria: [
      { name: 'Metrics', maxScore: 10, weight: 1, description: 'Quantifiable measures of value' },
      { name: 'Economic Buyer', maxScore: 10, weight: 1, description: 'Access to decision maker' },
      { name: 'Decision Criteria', maxScore: 10, weight: 1 },
      { name: 'Decision Process', maxScore: 10, weight: 1 },
      { name: 'Identify Pain', maxScore: 10, weight: 1 },
    ],
    ...overrides,
  };
}

export function makePlaylist(overrides: Partial<ChorusPlaylist> = {}): ChorusPlaylist {
  return {
    id: 'pl-001',
    name: 'Best Discovery Calls Q2',
    description: 'Top-rated discovery calls for new hire onboarding',
    momentCount: 5,
    createdAt: '2024-04-01T00:00:00Z',
    ...overrides,
  };
}

export function makeMoment(overrides: Partial<ChorusMoment> = {}): ChorusMoment {
  return {
    id: 'mom-001',
    conversationId: 'conv-001',
    timestamp: 120000,
    duration: 30000,
    title: 'Great objection handling',
    description: 'Rep addressed pricing concern effectively',
    type: 'highlight',
    text: 'I understand budget is a concern. Let me walk you through the ROI...',
    ...overrides,
  };
}

export function makeEmail(overrides: Partial<ChorusEmail> = {}): ChorusEmail {
  return {
    id: 'email-001',
    subject: 'Follow-up: Discovery Call',
    date: '2024-06-15T16:00:00Z',
    sender: 'jane@ourco.com',
    recipients: ['bob@acme.com'],
    engagement: { opens: 3, clicks: 1, replies: 1 },
    ...overrides,
  };
}

export function makeEngagement(overrides: Partial<ChorusEngagement> = {}): ChorusEngagement {
  return {
    id: 'eng-001',
    type: 'meeting',
    date: '2024-06-15T14:00:00Z',
    participants: [
      { name: 'Jane Smith', email: 'jane@ourco.com' },
      { name: 'Bob Johnson', email: 'bob@acme.com' },
    ],
    duration: 1800,
    outcome: 'completed',
    conversationId: 'conv-001',
    ...overrides,
  };
}

export function makeReport(overrides: Partial<ChorusReport> = {}): ChorusReport {
  return {
    id: 'rpt-001',
    name: 'Weekly Activity Report',
    type: 'activity',
    dateRange: { start: '2024-06-10', end: '2024-06-16' },
    ...overrides,
  };
}

export function makeActivityMetrics(overrides: Partial<ChorusActivityMetrics> = {}): ChorusActivityMetrics {
  return {
    userId: 'user-002',
    userName: 'Alex Rep',
    totalCalls: 24,
    totalDuration: 43200,
    avgDuration: 1800,
    talkRatio: 0.45,
    longestMonologue: 120,
    interactivity: 0.72,
    patience: 0.8,
    questionRate: 12,
    ...overrides,
  };
}

export function makeSavedSearch(overrides: Partial<ChorusSavedSearch> = {}): ChorusSavedSearch {
  return {
    id: 'ss-001',
    name: 'Competitor X Mentions',
    query: 'competitor x',
    filters: { dateRange: { start: '2024-01-01', end: '2024-12-31' } },
    ...overrides,
  };
}

export function makeVideoConference(overrides: Partial<ChorusVideoConference> = {}): ChorusVideoConference {
  return {
    id: 'vc-001',
    title: 'Weekly Pipeline Review',
    date: '2024-06-14T10:00:00Z',
    participants: [
      { name: 'Jane Smith', email: 'jane@ourco.com' },
      { name: 'Alex Rep', email: 'alex@ourco.com' },
    ],
    recordingUrl: 'https://chorus.ai/recordings/vc-001',
    status: 'processed',
    duration: 3600,
    ...overrides,
  };
}

export function makeIntegration(overrides: Partial<ChorusIntegration> = {}): ChorusIntegration {
  return {
    id: 'int-001',
    type: 'salesforce',
    name: 'Salesforce CRM',
    status: 'active',
    ...overrides,
  };
}

/**
 * Wrap a fixture record into JSON:API format as the Chorus API returns it.
 * The API client's normalizeResponse will flatten this back.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapJsonApi(record: any, typeName: string = 'record') {
  const { id, ...attributes } = record;
  return { id: id as string, type: typeName, attributes };
}

/**
 * Wrap an array of records into a JSON:API list response.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapJsonApiList(records: any[], typeName: string = 'record') {
  return {
    data: records.map((r: any) => wrapJsonApi(r, typeName)),
    meta: { page: { total: records.length } },
  };
}

/**
 * Wrap a single record into a JSON:API single response.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapJsonApiSingle(record: any, typeName: string = 'record') {
  return {
    data: wrapJsonApi(record, typeName),
  };
}

export function makeTranscriptSegments(): ChorusTranscriptSegment[] {
  return [
    { speaker: 'Jane Smith', text: 'Thanks for joining today, Bob.', startTime: 0, endTime: 3000 },
    { speaker: 'Bob Johnson', text: 'Happy to be here. We\'re excited about this.', startTime: 3000, endTime: 6000 },
    { speaker: 'Jane Smith', text: 'Let me start by understanding your current challenges.', startTime: 6000, endTime: 10000 },
    { speaker: 'Bob Johnson', text: 'Our biggest pain point is manual reporting.', startTime: 10000, endTime: 14000 },
    { speaker: 'Jane Smith', text: 'How much time does your team spend on that weekly?', startTime: 14000, endTime: 18000 },
  ];
}

/**
 * Build utterances in the real Chorus API format (recording.utterances).
 */
export function makeUtterances() {
  return [
    { id: 'u0', snippet_time: 0, speaker_name: 'Jane Smith', speaker_type: 'rep', snippet: 'Thanks for joining today, Bob.' },
    { id: 'u1', snippet_time: 3, speaker_name: 'Bob Johnson', speaker_type: 'customer', snippet: 'Happy to be here. We\'re excited about this.' },
    { id: 'u2', snippet_time: 6, speaker_name: 'Jane Smith', speaker_type: 'rep', snippet: 'Let me start by understanding your current challenges.' },
    { id: 'u3', snippet_time: 10, speaker_name: 'Bob Johnson', speaker_type: 'customer', snippet: 'Our biggest pain point is manual reporting.' },
    { id: 'u4', snippet_time: 14, speaker_name: 'Jane Smith', speaker_type: 'rep', snippet: 'How much time does your team spend on that weekly?' },
  ];
}

/**
 * Build trackers in the real Chorus API format (recording.trackers).
 */
export function makeRealTrackers() {
  return [
    {
      id: 'competitor-x',
      name: 'Competitor X',
      type: 'competitor',
      count: 2,
      mentions: [
        { offset: 0, utterance: 3 },
        { offset: 0, utterance: 5 },
      ],
    },
    {
      id: 'pricing',
      name: 'Pricing Discussion',
      type: 'topic',
      count: 1,
      mentions: [
        { offset: 0, utterance: 4 },
      ],
    },
  ];
}

export function makeTrackers(): ChorusTracker[] {
  return [
    {
      id: 'trk-001',
      name: 'Competitor X',
      category: 'competitor',
      count: 2,
      occurrences: [
        { timestamp: 300000, text: 'We looked at Competitor X but their pricing...' },
        { timestamp: 900000, text: 'Competitor X doesn\'t have this feature.' },
      ],
    },
    {
      id: 'trk-002',
      name: 'Pricing Discussion',
      category: 'topic',
      count: 1,
      occurrences: [
        { timestamp: 600000, text: 'What does your pricing look like?' },
      ],
    },
  ];
}
