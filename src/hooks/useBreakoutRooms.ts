import { useState, useCallback } from "react";
import { Participant } from "@/types/meeting";
import { mockParticipants } from "@/data/mockMeeting";

interface BreakoutRoom {
  id: string;
  name: string;
  participants: Participant[];
}

export function useBreakoutRooms() {
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [assignedParticipantIds, setAssignedParticipantIds] = useState<Set<string>>(new Set());

  // Filter out AI participant for breakout rooms
  const availableParticipants = mockParticipants.filter((p) => !p.isAI);

  const unassignedParticipants = availableParticipants.filter(
    (p) => !assignedParticipantIds.has(p.id)
  );

  const createRoom = useCallback((name: string) => {
    const newRoom: BreakoutRoom = {
      id: `room-${Date.now()}`,
      name,
      participants: [],
    };
    setRooms((prev) => [...prev, newRoom]);
  }, []);

  const deleteRoom = useCallback((roomId: string) => {
    setRooms((prev) => {
      const room = prev.find((r) => r.id === roomId);
      if (room) {
        // Unassign all participants from this room
        setAssignedParticipantIds((ids) => {
          const newIds = new Set(ids);
          room.participants.forEach((p) => newIds.delete(p.id));
          return newIds;
        });
      }
      return prev.filter((r) => r.id !== roomId);
    });
  }, []);

  const assignParticipant = useCallback(
    (participantId: string, roomId: string | null) => {
      const participant = availableParticipants.find((p) => p.id === participantId);
      if (!participant) return;

      // Remove from current room
      setRooms((prev) =>
        prev.map((room) => ({
          ...room,
          participants: room.participants.filter((p) => p.id !== participantId),
        }))
      );

      if (roomId === null) {
        // Unassign
        setAssignedParticipantIds((ids) => {
          const newIds = new Set(ids);
          newIds.delete(participantId);
          return newIds;
        });
      } else {
        // Assign to new room
        setRooms((prev) =>
          prev.map((room) =>
            room.id === roomId
              ? { ...room, participants: [...room.participants, participant] }
              : room
          )
        );
        setAssignedParticipantIds((ids) => new Set(ids).add(participantId));
      }
    },
    [availableParticipants]
  );

  return {
    rooms,
    unassignedParticipants,
    createRoom,
    deleteRoom,
    assignParticipant,
  };
}
