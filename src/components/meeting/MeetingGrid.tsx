import { cn } from "@/lib/utils";
import { MeetingParticipant } from "@/hooks/useDailyMeeting";
import { VideoTile } from "./VideoTile";
import { useState } from "react";

interface MeetingGridProps {
  participants: MeetingParticipant[];
  activeSpeakerId: string | null;
  layout?: "grid" | "speaker" | "sidebar";
  className?: string;
}

export function MeetingGrid({
  participants,
  activeSpeakerId,
  layout = "grid",
  className,
}: MeetingGridProps) {
  const activeSpeaker = participants.find(p => p.id === activeSpeakerId) || participants[0];
  const otherParticipants = participants.filter(p => p.id !== activeSpeaker?.id);

  // Auto-select layout based on participant count
  const effectiveLayout = layout === "grid" && participants.length <= 2 ? "speaker" : layout;

  if (effectiveLayout === "speaker" && activeSpeaker) {
    return (
      <div className={cn("flex flex-col gap-3 h-full", className)}>
        {/* Main Speaker */}
        <div className="flex-1 min-h-0">
          <VideoTile
            participant={activeSpeaker}
            isActive
            size="lg"
            showName
            className="h-full"
          />
        </div>

        {/* Filmstrip */}
        {otherParticipants.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {otherParticipants.map((participant) => (
              <VideoTile
                key={participant.id}
                participant={participant}
                size="sm"
                showName
                className="shrink-0"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (effectiveLayout === "sidebar" && activeSpeaker) {
    return (
      <div className={cn("flex gap-3 h-full", className)}>
        {/* Main Speaker */}
        <div className="flex-1 min-h-0">
          <VideoTile
            participant={activeSpeaker}
            isActive
            size="lg"
            showName
            className="h-full"
          />
        </div>

        {/* Sidebar */}
        {otherParticipants.length > 0 && (
          <div className="w-40 flex flex-col gap-2 overflow-y-auto">
            {otherParticipants.map((participant) => (
              <VideoTile
                key={participant.id}
                participant={participant}
                size="md"
                showName
                className="shrink-0"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid layout
  const gridCols = participants.length <= 2 ? 1 : 
                   participants.length <= 4 ? 2 : 
                   participants.length <= 9 ? 3 : 4;

  return (
    <div 
      className={cn("grid gap-2 h-full p-2", className)}
      style={{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridAutoRows: "1fr",
      }}
    >
      {participants.map((participant) => (
        <VideoTile
          key={participant.id}
          participant={participant}
          isActive={participant.id === activeSpeakerId}
          size="lg"
          showName
        />
      ))}
    </div>
  );
}
