import { useState, useCallback } from "react";

type Tool = "select" | "pen" | "eraser" | "rectangle" | "circle" | "line" | "text";

interface Point {
  x: number;
  y: number;
}

interface Annotation {
  id: string;
  tool: Tool;
  color: string;
  strokeWidth: number;
  points: Point[];
  text?: string;
}

export function useWhiteboard() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const addAnnotation = useCallback((annotation: Omit<Annotation, "id">) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: `annotation-${Date.now()}`,
    };

    setAnnotations((prev) => {
      const newAnnotations = [...prev, newAnnotation];
      
      // Update history
      setHistory((h) => [...h.slice(0, historyIndex + 1), newAnnotations]);
      setHistoryIndex((i) => i + 1);
      
      return newAnnotations;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((i) => i - 1);
      setAnnotations(history[historyIndex - 1] || []);
    }
  }, [historyIndex, history]);

  const clear = useCallback(() => {
    setAnnotations([]);
    setHistory((h) => [...h.slice(0, historyIndex + 1), []]);
    setHistoryIndex((i) => i + 1);
  }, [historyIndex]);

  return {
    annotations,
    addAnnotation,
    undo,
    clear,
  };
}
