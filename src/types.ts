export interface ChorusParticipant {
  name: string;
  email?: string;
  role?: string;
  type?: string;
  speakerId?: string;
}

export interface ChorusConversation {
  id: string;
  title: string;
  date: string;
  duration: number;
  participants: ChorusParticipant[];
  status?: string;
  type?: string;
  summary?: string;
  meetingUrl?: string;
  recordingUrl?: string;
}

export interface ChorusTranscriptSegment {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface ChorusTracker {
  id: string;
  name: string;
  category?: string;
  count: number;
  occurrences?: Array<{
    timestamp: number;
    text: string;
  }>;
}

export interface ChorusUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  teamId?: string;
  teamName?: string;
  active?: boolean;
  createdAt?: string;
}

export interface ChorusTeam {
  id: string;
  name: string;
  managerId?: string;
  managerName?: string;
  memberCount?: number;
  members?: ChorusUser[];
}

export interface ChorusScorecardCriteria {
  name: string;
  score: number;
  maxScore: number;
  comments?: string;
}

export interface ChorusScorecard {
  id: string;
  conversationId: string;
  userId: string;
  userName?: string;
  templateId?: string;
  templateName?: string;
  overallScore: number;
  maxScore: number;
  criteria: ChorusScorecardCriteria[];
  createdAt: string;
  evaluatorName?: string;
}

export interface ChorusScorecardTemplateCriteria {
  name: string;
  description?: string;
  maxScore: number;
  weight?: number;
}

export interface ChorusScorecardTemplate {
  id: string;
  name: string;
  description?: string;
  criteria: ChorusScorecardTemplateCriteria[];
}

export interface ChorusMoment {
  id: string;
  conversationId: string;
  timestamp: number;
  duration?: number;
  title: string;
  description?: string;
  type?: string;
  text?: string;
}

export interface ChorusPlaylist {
  id: string;
  name: string;
  description?: string;
  momentCount?: number;
  createdAt?: string;
  moments?: ChorusMoment[];
}

export interface ChorusEmail {
  id: string;
  subject: string;
  date: string;
  sender: string;
  recipients: string[];
  engagement?: {
    opens?: number;
    clicks?: number;
    replies?: number;
  };
}

export interface ChorusEngagement {
  id: string;
  type: string;
  date: string;
  participants: ChorusParticipant[];
  duration?: number;
  outcome?: string;
  conversationId?: string;
}

export interface ChorusReport {
  id: string;
  name: string;
  type: string;
  data?: Record<string, unknown>;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ChorusActivityMetrics {
  userId?: string;
  userName?: string;
  teamId?: string;
  totalCalls: number;
  totalDuration: number;
  avgDuration: number;
  talkRatio?: number;
  longestMonologue?: number;
  interactivity?: number;
  patience?: number;
  questionRate?: number;
}

export interface ChorusSavedSearch {
  id: string;
  name: string;
  query?: string;
  filters?: Record<string, unknown>;
}

export interface ChorusVideoConference {
  id: string;
  title: string;
  date: string;
  participants: ChorusParticipant[];
  recordingUrl?: string;
  status?: string;
  duration?: number;
}

export interface ChorusIntegration {
  id: string;
  type: string;
  name: string;
  status: string;
  config?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  total: number;
  count: number;
  offset: number;
  items: T[];
  has_more: boolean;
  next_offset?: number;
}

/** Normalized response from JSON:API list endpoints (after api-client auto-normalization). */
export interface ListResponse {
  items: Record<string, unknown>[];
  total: number;
  cursor?: string;
}
