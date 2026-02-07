import { cn } from "@/lib/utils";
import { Participant, MeetingUIMode, AgendaItem } from "@/types/meeting";
import { Sparkles } from "lucide-react";
import { MeetingContextLayer } from "./MeetingContextLayer";
import { ParticipantFilmstrip } from "./ParticipantFilmstrip";

interface SpeakerViewProps {
  activeSpeaker: Participant | null;
  participants: Participant[];
  mode?: MeetingUIMode;
  currentAgendaItem?: AgendaItem;
  elapsedTime?: number;
  className?: string;
}

export function SpeakerView({ 
  activeSpeaker, 
  participants, 
  mode = "focus",
  currentAgendaItem,
  elapsedTime = 0,
  className 
}: SpeakerViewProps) {
  return (
    <div className={cn("relative flex-1 flex flex-col", className)}>
      {/* Main Speaker */}
      <div className="flex-1 relative rounded-2xl overflow-hidden bg-surface-1 min-h-0">
        {activeSpeaker ? (
          <>
            {activeSpeaker.isVideoOn ? (
              <div className="absolute inset-0">
                <img
                  src={activeSpeaker.avatar}
                  alt={activeSpeaker.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-1 to-surface-2">
                <div className={cn(
                  "w-28 h-28 rounded-full bg-surface-3 flex items-center justify-center",
                  activeSpeaker.isSpeaking && "speaker-ring"
                )}>
                  <span className="text-4xl font-semibold text-foreground">
                    {activeSpeaker.name.charAt(0)}
                  </span>
                </div>
              </div>
            )}

            {/* Context Layer - Living Intelligence Surface */}
            <MeetingContextLayer
              mode={mode}
              currentAgendaItem={currentAgendaItem}
              elapsedTime={elapsedTime}
            />

            {/* Speaker Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                <div className="glass-panel rounded-xl px-4 py-2 flex items-center gap-3">
                  {activeSpeaker.isAI && (
                    <Sparkles className="w-4 h-4 text-primary" />
                  )}
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {activeSpeaker.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeSpeaker.role.title}
                    </p>
                  </div>
                  {activeSpeaker.isSpeaking && !activeSpeaker.isMuted && (
                    <div className="audio-wave ml-2">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No active speaker</p>
          </div>
        )}
      </div>

      {/* Filmstrip with Role Signals */}
      <div className="mt-3">
        <ParticipantFilmstrip
          participants={participants}
          activeSpeakerId={activeSpeaker?.id}
        />
      </div>
    </div>
  );
}
