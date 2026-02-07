import { cn } from "@/lib/utils";
import { Meeting, Participant } from "@/types/meeting";
import { Button } from "@/components/ui/button";
import { ParticipantAvatar } from "./ParticipantAvatar";
import { RoleCard } from "./RoleCard";
import { 
  Calendar, 
  Clock, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Settings,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

interface PreMeetingLobbyProps {
  meeting: Meeting;
  currentUser: Participant;
  onJoin: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  className?: string;
}

export function PreMeetingLobby({
  meeting,
  currentUser,
  onJoin,
  onToggleMute,
  onToggleVideo,
  className,
}: PreMeetingLobbyProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  return (
    <div className={cn("min-h-screen bg-background flex items-center justify-center p-6", className)}>
      <div className="w-full max-w-4xl">
        {/* Main Card */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left - Video Preview */}
            <div className="flex-1 p-6 lg:p-8">
              {/* Self Preview */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-1 mb-6">
                {currentUser.isVideoOn ? (
                  <img
                    src={currentUser.avatar}
                    alt="Your preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
                    <div className="w-20 h-20 rounded-full bg-surface-3 flex items-center justify-center">
                      <span className="text-3xl font-semibold text-foreground">
                        {currentUser.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <Button
                    variant={currentUser.isMuted ? "controlActive" : "control"}
                    size="icon"
                    onClick={onToggleMute}
                  >
                    {currentUser.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant={!currentUser.isVideoOn ? "controlActive" : "control"}
                    size="icon"
                    onClick={onToggleVideo}
                  >
                    {currentUser.isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  <Button variant="control" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Meeting Info */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-semibold text-foreground mb-2">
                  {meeting.title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(meeting.scheduledStart).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(meeting.scheduledStart).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Join Button */}
              <Button variant="aurora" size="lg" onClick={onJoin} className="w-full">
                Join Meeting
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Right - Context Panel */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border/50 bg-surface-0/50 p-6">
              {/* AI Agenda */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Agenda</span>
                </div>
                <div className="space-y-2">
                  {meeting.agenda.slice(0, 4).map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center text-xs text-muted-foreground shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.duration}m</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Participants */}
              <div>
                <span className="text-sm font-medium text-foreground mb-3 block">
                  Participants ({meeting.participants.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {meeting.participants.map((participant) => (
                    <ParticipantAvatar
                      key={participant.id}
                      participant={participant}
                      size="sm"
                      showControls={false}
                      onClick={() => setSelectedParticipant(
                        selectedParticipant?.id === participant.id ? null : participant
                      )}
                    />
                  ))}
                </div>

                {/* Selected Role Card */}
                {selectedParticipant && (
                  <div className="mt-4 fade-in">
                    <RoleCard participant={selectedParticipant} expanded />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
