import { useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Decision, ActionItem, AIInsight } from "@/types/meeting";
import { toast } from "sonner";

// Generic participant interface for AI analysis
interface AIParticipant {
  id: string;
  userName: string;
  isSpeaking: boolean;
}

interface UseMeetingAIOptions {
  isEnabled: boolean;
  meetingId: string;
  participants: AIParticipant[];
  onDecisionDetected?: (decision: Decision) => void;
  onActionItemDetected?: (actionItem: ActionItem) => void;
  onInsightGenerated?: (insight: AIInsight) => void;
}

export function useMeetingAI({
  isEnabled,
  meetingId,
  participants,
  onDecisionDetected,
  onActionItemDetected,
  onInsightGenerated,
}: UseMeetingAIOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [summary, setSummary] = useState<string>("");

  const transcriptRef = useRef<string[]>([]);
  const lastProcessedRef = useRef<number>(0);

  // Add to transcript
  const addToTranscript = useCallback((speakerName: string, text: string) => {
    const entry = `${speakerName}: ${text}`;
    setTranscript(prev => [...prev, entry]);
    transcriptRef.current = [...transcriptRef.current, entry];
  }, []);

  // Analyze transcript for decisions
  const analyzeForDecisions = useCallback(async () => {
    if (!isEnabled || !meetingId || transcriptRef.current.length === 0) return;
    if (transcriptRef.current.length === lastProcessedRef.current) return;

    setIsProcessing(true);
    try {
      const recentTranscript = transcriptRef.current.slice(lastProcessedRef.current).join("\n");
      lastProcessedRef.current = transcriptRef.current.length;

      const { data, error } = await supabase.functions.invoke("meeting-ai", {
        body: {
          action: "decisions",
          transcript: recentTranscript,
          meetingId,
        },
      });

      if (error) throw error;

      if (data?.result && Array.isArray(data.result)) {
        const newDecisions: Decision[] = data.result.map((d: any) => ({
          id: crypto.randomUUID(),
          content: d.content,
          owner: d.owner,
          status: d.status || "proposed",
          timestamp: new Date(),
        }));

        setDecisions(prev => [...prev, ...newDecisions]);
        newDecisions.forEach(d => onDecisionDetected?.(d));
      }
    } catch (err) {
      console.error("Failed to analyze for decisions:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [isEnabled, meetingId, onDecisionDetected]);

  // Analyze transcript for action items
  const analyzeForActions = useCallback(async () => {
    if (!isEnabled || !meetingId || transcriptRef.current.length === 0) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("meeting-ai", {
        body: {
          action: "actions",
          transcript: transcriptRef.current.join("\n"),
          meetingId,
        },
      });

      if (error) throw error;

      if (data?.result && Array.isArray(data.result)) {
        const newActions: ActionItem[] = data.result.map((a: any) => ({
          id: crypto.randomUUID(),
          task: a.task,
          assignee: a.assignee,
          priority: a.priority || "medium",
          deadline: a.deadline ? new Date(a.deadline) : undefined,
          createdAt: new Date(),
        }));

        setActionItems(prev => [...prev, ...newActions]);
        newActions.forEach(a => onActionItemDetected?.(a));
      }
    } catch (err) {
      console.error("Failed to analyze for actions:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [isEnabled, meetingId, onActionItemDetected]);

  // Generate meeting summary
  const generateSummary = useCallback(async () => {
    if (!meetingId || transcriptRef.current.length === 0) {
      toast.error("No transcript available to summarize");
      return "";
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("meeting-ai", {
        body: {
          action: "summarize",
          transcript: transcriptRef.current.join("\n"),
          meetingId,
        },
      });

      if (error) throw error;

      const summaryText = data?.result || "";
      setSummary(summaryText);
      return summaryText;
    } catch (err) {
      console.error("Failed to generate summary:", err);
      toast.error("Failed to generate summary");
      return "";
    } finally {
      setIsProcessing(false);
    }
  }, [meetingId]);

  // Generate an AI insight
  const generateInsight = useCallback(async (type: AIInsight["type"]) => {
    if (!isEnabled || !meetingId) return;

    setIsProcessing(true);
    try {
      // For now, generate a contextual insight based on the transcript
      const { data, error } = await supabase.functions.invoke("meeting-ai", {
        body: {
          action: "summarize",
          transcript: transcriptRef.current.slice(-10).join("\n"), // Last 10 entries
          meetingId,
          context: `Generate a brief ${type} insight`,
        },
      });

      if (error) throw error;

      const insight: AIInsight = {
        id: crypto.randomUUID(),
        type,
        content: data?.result || "Processing...",
        timestamp: new Date(),
        relevance: 0.8,
      };

      setInsights(prev => [...prev, insight]);
      onInsightGenerated?.(insight);
    } catch (err) {
      console.error("Failed to generate insight:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [isEnabled, meetingId, onInsightGenerated]);

  // Clear all data (for new meeting)
  const reset = useCallback(() => {
    setTranscript([]);
    setDecisions([]);
    setActionItems([]);
    setInsights([]);
    setSummary("");
    transcriptRef.current = [];
    lastProcessedRef.current = 0;
  }, []);

  return {
    // State
    isProcessing,
    decisions,
    actionItems,
    insights,
    transcript,
    summary,

    // Actions
    addToTranscript,
    analyzeForDecisions,
    analyzeForActions,
    generateSummary,
    generateInsight,
    reset,
  };
}
