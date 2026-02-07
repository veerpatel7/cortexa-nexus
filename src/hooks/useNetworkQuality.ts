import { useState, useEffect, useCallback, useRef } from "react";

export type NetworkQualityLevel = "excellent" | "good" | "fair" | "poor" | "disconnected";

interface NetworkQualityState {
  level: NetworkQualityLevel;
  rtt: number | null; // Round-trip time in ms
  downlink: number | null; // Mbps
  effectiveType: string | null; // 4g, 3g, etc.
  packetLoss: number; // Percentage 0-100
}

/**
 * Hook to monitor network quality for WebRTC connections
 * Uses Navigator.connection API and synthetic RTT measurements
 */
export function useNetworkQuality() {
  const [quality, setQuality] = useState<NetworkQualityState>({
    level: "good",
    rtt: null,
    downlink: null,
    effectiveType: null,
    packetLoss: 0,
  });

  const measurementRef = useRef<number[]>([]);

  // Calculate quality level from metrics
  const calculateLevel = useCallback((rtt: number | null, downlink: number | null): NetworkQualityLevel => {
    if (rtt === null) return "good"; // Default if no measurement
    
    if (rtt < 50 && (!downlink || downlink > 5)) return "excellent";
    if (rtt < 100 && (!downlink || downlink > 2)) return "good";
    if (rtt < 200 && (!downlink || downlink > 1)) return "fair";
    if (rtt < 500) return "poor";
    return "disconnected";
  }, []);

  // Synthetic RTT measurement using fetch
  const measureRTT = useCallback(async () => {
    const start = performance.now();
    try {
      // Use a tiny resource that won't be cached
      await fetch("/favicon.ico?t=" + Date.now(), { 
        method: "HEAD",
        cache: "no-store" 
      });
      const rtt = performance.now() - start;
      
      // Keep last 5 measurements for smoothing
      measurementRef.current.push(rtt);
      if (measurementRef.current.length > 5) {
        measurementRef.current.shift();
      }
      
      // Average RTT
      const avgRtt = measurementRef.current.reduce((a, b) => a + b, 0) / measurementRef.current.length;
      
      return Math.round(avgRtt);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Use Navigator.connection if available
    const connection = (navigator as unknown as { connection?: {
      rtt?: number;
      downlink?: number;
      effectiveType?: string;
      addEventListener: (type: string, handler: () => void) => void;
      removeEventListener: (type: string, handler: () => void) => void;
    } }).connection;

    const updateFromConnection = async () => {
      const rtt = connection?.rtt ?? await measureRTT();
      const downlink = connection?.downlink ?? null;
      const effectiveType = connection?.effectiveType ?? null;
      
      setQuality((prev) => ({
        ...prev,
        rtt,
        downlink,
        effectiveType,
        level: calculateLevel(rtt, downlink),
      }));
    };

    updateFromConnection();

    // Listen for connection changes
    if (connection) {
      connection.addEventListener("change", updateFromConnection);
    }

    // Periodic measurement
    const interval = setInterval(updateFromConnection, 10000); // Every 10 seconds

    return () => {
      if (connection) {
        connection.removeEventListener("change", updateFromConnection);
      }
      clearInterval(interval);
    };
  }, [calculateLevel, measureRTT]);

  const getLevelColor = useCallback((level: NetworkQualityLevel) => {
    switch (level) {
      case "excellent": return "text-aurora-teal";
      case "good": return "text-green-500";
      case "fair": return "text-amber-500";
      case "poor": return "text-aurora-rose";
      case "disconnected": return "text-destructive";
    }
  }, []);

  const getLevelLabel = useCallback((level: NetworkQualityLevel) => {
    switch (level) {
      case "excellent": return "Excellent";
      case "good": return "Good";
      case "fair": return "Fair";
      case "poor": return "Poor";
      case "disconnected": return "Disconnected";
    }
  }, []);

  return {
    ...quality,
    getLevelColor,
    getLevelLabel,
  };
}
