import { Meeting, Participant, MeetingState, AIInsight, Decision, ActionItem, AgendaItem } from "@/types/meeting";

export const mockParticipants: Participant[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=200&h=200&fit=crop&crop=face",
    role: {
      title: "Engineering Lead",
      department: "Product Engineering",
      skills: ["System Design", "React", "Node.js", "Team Leadership"],
      authorityLevel: "lead",
      availability: "available",
    },
    isSpeaking: true,
    isMuted: false,
    isVideoOn: true,
    isHost: true,
  },
  {
    id: "2",
    name: "Marcus Johnson",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    role: {
      title: "Product Manager",
      department: "Product",
      skills: ["Strategy", "Roadmapping", "User Research", "Analytics"],
      authorityLevel: "senior",
      availability: "available",
    },
    isSpeaking: false,
    isMuted: false,
    isVideoOn: true,
    isHost: false,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    role: {
      title: "Senior Designer",
      department: "Design",
      skills: ["UI/UX", "Design Systems", "Figma", "User Testing"],
      authorityLevel: "senior",
      availability: "busy",
    },
    isSpeaking: false,
    isMuted: true,
    isVideoOn: false,
    isHost: false,
  },
  {
    id: "4",
    name: "David Kim",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    role: {
      title: "Backend Engineer",
      department: "Platform",
      skills: ["Go", "PostgreSQL", "Kubernetes", "API Design"],
      authorityLevel: "member",
      availability: "available",
    },
    isSpeaking: false,
    isMuted: false,
    isVideoOn: true,
    isHost: false,
  },
  {
    id: "ai",
    name: "Nova AI",
    avatar: "/placeholder.svg",
    role: {
      title: "AI Assistant",
      department: "Meeting Intelligence",
      skills: ["Meeting Intelligence", "Decision Capture", "Context Analysis"],
      authorityLevel: "member",
      availability: "available",
    },
    isSpeaking: false,
    isMuted: true,
    isVideoOn: false,
    isHost: false,
    isAI: true,
  },
];

export const mockAgenda: AgendaItem[] = [
  {
    id: "a1",
    title: "Q1 Priority Review",
    duration: 10,
    owner: "Sarah Chen",
    status: "completed",
    aiSuggested: false,
  },
  {
    id: "a2",
    title: "API Integration Timeline",
    duration: 15,
    owner: "David Kim",
    status: "active",
    aiSuggested: false,
  },
  {
    id: "a3",
    title: "Design System Updates",
    duration: 10,
    owner: "Emily Rodriguez",
    status: "pending",
    aiSuggested: true,
  },
  {
    id: "a4",
    title: "Resource Allocation",
    duration: 10,
    owner: "Marcus Johnson",
    status: "pending",
    aiSuggested: false,
  },
  {
    id: "a5",
    title: "Open Discussion",
    duration: 5,
    owner: "All",
    status: "pending",
    aiSuggested: true,
  },
];

export const mockDecisions: Decision[] = [
  {
    id: "d1",
    content: "Prioritize API v2 integration for February release",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    owner: "Sarah Chen",
    status: "confirmed",
  },
  {
    id: "d2",
    content: "Allocate 2 engineers to Platform team support",
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    owner: "Marcus Johnson",
    status: "proposed",
  },
];

export const mockActionItems: ActionItem[] = [
  {
    id: "t1",
    task: "Create API v2 specification document",
    assignee: "David Kim",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    priority: "high",
    createdAt: new Date(),
  },
  {
    id: "t2",
    task: "Schedule design review session",
    assignee: "Emily Rodriguez",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    priority: "medium",
    createdAt: new Date(),
  },
  {
    id: "t3",
    task: "Update product roadmap with new priorities",
    assignee: "Marcus Johnson",
    priority: "low",
    createdAt: new Date(),
  },
];

export const mockAIInsights: AIInsight[] = [
  {
    id: "i1",
    type: "suggestion",
    content: "Consider discussing the design system handoff process given the UI changes mentioned.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    relevance: 0.85,
  },
  {
    id: "i2",
    type: "risk",
    content: "Timeline may be at risk if vendor delivery is delayed. Consider contingency planning.",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    relevance: 0.92,
  },
  {
    id: "i3",
    type: "decision",
    content: "Captured: API v2 prioritization confirmed for February.",
    timestamp: new Date(Date.now() - 1000 * 60 * 1),
    relevance: 1.0,
  },
];

export const mockMeeting: Meeting = {
  id: "m1",
  title: "Q1 Sprint Planning",
  description: "Define sprint priorities and assign ownership for Q1 initiatives. Review dependencies and timeline risks.",
  scheduledStart: new Date(Date.now() - 1000 * 60 * 25),
  scheduledEnd: new Date(Date.now() + 1000 * 60 * 25),
  participants: mockParticipants,
  agenda: mockAgenda,
  decisions: mockDecisions,
  actionItems: mockActionItems,
  aiInsights: mockAIInsights,
  status: "live",
  recordingEnabled: true,
  transcriptionEnabled: true,
};

export const mockMeetingState: MeetingState = {
  meeting: mockMeeting,
  currentAgendaIndex: 1,
  elapsedTime: 0, // Start at 0 for progressive reveal demo
  aiMode: "semi-auto",
  isCaptionsEnabled: false,
  isRecording: true,
  uiMode: "focus", // Start in focus mode
};

export const currentUser: Participant = mockParticipants[0];
