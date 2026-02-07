import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, Users, GripVertical, Trash2 } from "lucide-react";
import { Participant } from "@/types/meeting";

interface BreakoutRoom {
  id: string;
  name: string;
  participants: Participant[];
}

interface BreakoutRoomsProps {
  rooms: BreakoutRoom[];
  unassignedParticipants: Participant[];
  onCreateRoom: (name: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onAssignParticipant: (participantId: string, roomId: string | null) => void;
  onClose: () => void;
  className?: string;
}

export function BreakoutRooms({
  rooms,
  unassignedParticipants,
  onCreateRoom,
  onDeleteRoom,
  onAssignParticipant,
  onClose,
  className,
}: BreakoutRoomsProps) {
  const [newRoomName, setNewRoomName] = useState("");
  const [draggedParticipant, setDraggedParticipant] = useState<Participant | null>(null);
  const [dragOverRoom, setDragOverRoom] = useState<string | null>(null);

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName.trim());
      setNewRoomName("");
    }
  };

  const handleDragStart = (participant: Participant) => {
    setDraggedParticipant(participant);
  };

  const handleDragEnd = () => {
    setDraggedParticipant(null);
    setDragOverRoom(null);
  };

  const handleDragOver = (e: React.DragEvent, roomId: string | null) => {
    e.preventDefault();
    setDragOverRoom(roomId);
  };

  const handleDrop = (roomId: string | null) => {
    if (draggedParticipant) {
      onAssignParticipant(draggedParticipant.id, roomId);
    }
    handleDragEnd();
  };

  const ParticipantChip = ({ participant, isDraggable = true }: { participant: Participant; isDraggable?: boolean }) => (
    <div
      draggable={isDraggable}
      onDragStart={() => handleDragStart(participant)}
      onDragEnd={handleDragEnd}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-1 transition-all cursor-grab active:cursor-grabbing",
        isDraggable && "hover:bg-surface-2",
        draggedParticipant?.id === participant.id && "opacity-50"
      )}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
      <img
        src={participant.avatar}
        alt={participant.name}
        className="w-6 h-6 rounded-full object-cover"
      />
      <span className="text-sm text-foreground truncate">{participant.name}</span>
    </div>
  );

  return (
    <div className={cn("flex flex-col h-full bg-surface-0", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-aurora-violet" />
          <h3 className="font-medium text-foreground">Breakout Rooms</h3>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* Create Room */}
        <div className="flex gap-2 mb-6">
          <Input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Room name..."
            className="flex-1 bg-surface-1 border-transparent"
            onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
          />
          <Button
            variant="aurora"
            size="icon"
            onClick={handleCreateRoom}
            disabled={!newRoomName.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Unassigned Pool */}
        <div
          onDragOver={(e) => handleDragOver(e, null)}
          onDrop={() => handleDrop(null)}
          className={cn(
            "p-4 rounded-xl border-2 border-dashed transition-colors mb-4",
            dragOverRoom === null && draggedParticipant
              ? "border-primary bg-primary/5"
              : "border-border"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Unassigned ({unassignedParticipants.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassignedParticipants.map((participant) => (
              <ParticipantChip key={participant.id} participant={participant} />
            ))}
            {unassignedParticipants.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">
                Drag participants here to unassign
              </p>
            )}
          </div>
        </div>

        {/* Rooms */}
        <div className="space-y-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              onDragOver={(e) => handleDragOver(e, room.id)}
              onDrop={() => handleDrop(room.id)}
              className={cn(
                "p-4 rounded-xl border-2 transition-colors",
                dragOverRoom === room.id && draggedParticipant
                  ? "border-aurora-teal bg-aurora-teal/5"
                  : "border-surface-2 bg-surface-1"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">
                  {room.name}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground mr-2">
                    {room.participants.length} participants
                  </span>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => onDeleteRoom(room.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {room.participants.map((participant) => (
                  <ParticipantChip key={participant.id} participant={participant} />
                ))}
                {room.participants.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                    Drag participants here
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Create rooms and drag participants to assign them
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Actions */}
      {rooms.length > 0 && (
        <div className="p-4 border-t border-border">
          <Button variant="aurora" className="w-full">
            Open All Rooms
          </Button>
        </div>
      )}
    </div>
  );
}
