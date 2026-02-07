import { useState } from "react";
import { MeetingOrchestrator } from "@/components/meeting/MeetingOrchestrator";
import { 
  mockMeeting, 
  currentUser as initialUser 
} from "@/data/mockMeeting";
import { Participant } from "@/types/meeting";

/**
 * Main index page - Host starts a new meeting
 */
const Index = () => {
  const [currentUser] = useState<Participant>({
    ...initialUser,
    // Host always gets a unique ID for the session
    id: `host-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    isHost: true,
  });

  // Generate a unique meeting ID for each session
  const [meeting] = useState(() => ({
    ...mockMeeting,
    id: `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }));

  return (
    <MeetingOrchestrator
      meeting={meeting}
      currentUser={currentUser}
    />
  );
};

export default Index;
