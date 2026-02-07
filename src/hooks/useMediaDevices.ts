import { useState, useCallback, useRef, useEffect } from "react";

interface UseMediaDevicesOptions {
  onError?: (error: Error) => void;
}

export function useMediaDevices({ onError }: UseMediaDevicesOptions = {}) {
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Enumerate devices
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audio = devices.filter((d) => d.kind === "audioinput");
      const video = devices.filter((d) => d.kind === "videoinput");
      
      setAudioDevices(audio);
      setVideoDevices(video);
      
      if (!selectedAudioDevice && audio.length > 0) {
        setSelectedAudioDevice(audio[0].deviceId);
      }
      if (!selectedVideoDevice && video.length > 0) {
        setSelectedVideoDevice(video[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  }, [selectedAudioDevice, selectedVideoDevice]);

  // Request permissions and get stream
  const requestPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedAudioDevice ? { deviceId: selectedAudioDevice } : true,
        video: selectedVideoDevice 
          ? { deviceId: selectedVideoDevice, width: { ideal: 1280 }, height: { ideal: 720 } } 
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      setLocalStream(stream);
      setHasPermissions(true);
      await enumerateDevices();

      // Set up audio level monitoring
      setupAudioAnalyser(stream);
      
      return stream;
    } catch (err) {
      console.error("Permission denied:", err);
      setHasPermissions(false);
      onError?.(err instanceof Error ? err : new Error("Permission denied"));
      return null;
    }
  }, [selectedAudioDevice, selectedVideoDevice, enumerateDevices, onError]);

  // Set up audio analyser for level monitoring
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);
      
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  }, [localStream]);

  // Stop all tracks
  const stopStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    // State
    hasPermissions,
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    localStream,
    audioLevel,
    isAudioEnabled,
    isVideoEnabled,
    
    // Actions
    requestPermissions,
    toggleAudio,
    toggleVideo,
    stopStream,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
  };
}
