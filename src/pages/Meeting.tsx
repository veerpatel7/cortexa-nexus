import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MeetingOrchestrator } from "@/components/meeting/MeetingOrchestrator";
import { mockMeeting } from "@/data/mockMeeting";
import { Participant } from "@/types/meeting";

/**
 * Meeting page for joining via invite link
 * Route: /meeting/:meetingId
 */
const MeetingPage = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  
  // Generate a unique guest user for invited participants
  const [currentUser] = useState<Participant>(() => ({
    id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `Guest ${Math.floor(Math.random() * 1000)}`,
    avatar: "/placeholder.svg",
    role: {
      title: "Guest",
      department: "",
      skills: [],
      authorityLevel: "guest" as const,
      availability: "available" as const,
    },
    isSpeaking: false,
    isMuted: true,
    isVideoOn: true,
    isHost: false, // Guests are not hosts
  }));

  // Create meeting object with the ID from URL
  const meeting = {
    ...mockMeeting,
    id: meetingId || mockMeeting.id,
    title: `Meeting ${meetingId?.slice(0, 8) || ''}`,
  };

  return (
    <MeetingOrchestrator
      meeting={meeting}
      currentUser={currentUser}
    />
  );
};

export default MeetingPage;
