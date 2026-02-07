export interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: RoleCard;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isHost: boolean;
  isAI?: boolean;
}

export interface RoleCard {
  title: string;
  department: string;
  skills: string[];
  authorityLevel: 'executive' | 'lead' | 'senior' | 'member' | 'guest';
  availability: 'available' | 'busy' | 'away';
}

export interface AgendaItem {
  id: string;
  title: string;
  duration: number; // in minutes
  owner: string;
  status: 'pending' | 'active' | 'completed';
  aiSuggested?: boolean;
}

export interface Decision {
  id: string;
  content: string;
  timestamp: Date;
  owner: string;
  status: 'proposed' | 'confirmed' | 'deferred';
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface AIInsight {
  id: string;
  type: 'summary' | 'suggestion' | 'question' | 'risk' | 'decision' | 'warning' | 'action';
  content: string;
  timestamp: Date;
  relevance: number; // 0-1
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  participants: Participant[];
  agenda: AgendaItem[];
  decisions: Decision[];
  actionItems: ActionItem[];
  aiInsights: AIInsight[];
  status: 'scheduled' | 'lobby' | 'live' | 'ended';
  recordingEnabled: boolean;
  transcriptionEnabled: boolean;
}

export type AIMode = 'assist' | 'semi-auto' | 'auto';

// Progressive Intelligence Panel Modes
export type MeetingUIMode = 'focus' | 'guided' | 'decision' | 'review';

export interface MeetingState {
  meeting: Meeting;
  currentAgendaIndex: number;
  elapsedTime: number;
  aiMode: AIMode;
  isCaptionsEnabled: boolean;
  isRecording: boolean;
  uiMode: MeetingUIMode;
}
