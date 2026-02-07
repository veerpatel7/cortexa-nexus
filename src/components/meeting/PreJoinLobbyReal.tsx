import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { Participant } from "@/types/meeting";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { motion } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings2, 
  Sparkles,
  Volume2,
  CheckCircle2,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import novaAiLogo from "@/assets/nova-ai-logo.png";

interface PreJoinLobbyProps {
  meetingTitle: string;
  currentUser: Participant;
  onJoinMeeting: (audioEnabled: boolean, videoEnabled: boolean, displayName: string) => void;
  isJoining?: boolean;
  className?: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

const videoPreviewVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
      delay: 0.2,
    },
  },
};

export function PreJoinLobby({
  meetingTitle,
  currentUser,
  onJoinMeeting,
  isJoining = false,
  className,
}: PreJoinLobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser.name);
  
  const {
    hasPermissions,
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    localStream,
    audioLevel,
    isAudioEnabled,
    isVideoEnabled,
    requestPermissions,
    toggleAudio,
    toggleVideo,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
  } = useMediaDevices();

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  // Attach video stream to video element
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleJoin = () => {
    const nameToUse = displayName.trim() || currentUser.name;
    onJoinMeeting(isAudioEnabled, isVideoEnabled, nameToUse);
  };

  const isNameValid = displayName.trim().length >= 2;

  return (
    <div className={cn("min-h-screen bg-background flex relative", className)}>
      {/* Theme Toggle in top right */}
      <motion.div 
        className="absolute top-4 right-4 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ThemeToggle />
      </motion.div>

      {/* Left Side - Video Preview */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          className="w-full max-w-2xl space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Video Preview Container */}
          <motion.div 
            variants={videoPreviewVariants}
            className="relative aspect-video rounded-2xl overflow-hidden bg-surface-1 border border-border/50 shadow-elevation-2"
          >
            {isVideoEnabled && localStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-1 to-surface-2">
                <motion.div 
                  className="w-24 h-24 rounded-full bg-surface-3 flex items-center justify-center"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-3xl font-semibold text-foreground">
                    {displayName.charAt(0).toUpperCase() || currentUser.name.charAt(0)}
                  </span>
                </motion.div>
              </div>
            )}

            {/* Audio Level Indicator */}
            {isAudioEnabled && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute bottom-4 left-4 flex items-center gap-2 glass-panel rounded-lg px-3 py-2"
              >
                <Volume2 className="w-4 h-4 text-primary" />
                <div className="w-20 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                    transition={{ duration: 0.075 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Name Badge */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute bottom-4 right-4 glass-panel rounded-xl px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{displayName || currentUser.name}</span>
                <span className="text-xs text-muted-foreground">{currentUser.role.title}</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Controls */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center gap-3"
          >
            <Button
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="lg"
              className="w-14 h-14 rounded-full"
              onClick={toggleAudio}
            >
              {isAudioEnabled ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="lg"
              className="w-14 h-14 rounded-full"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-14 h-14 rounded-full"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Name Input */}
          <motion.div 
            variants={itemVariants}
            className="glass-panel rounded-xl p-4"
          >
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Your display name
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="bg-surface-2 border-border/50"
                maxLength={30}
              />
              {!isNameValid && displayName.length > 0 && (
                <p className="text-xs text-muted-foreground">Name must be at least 2 characters</p>
              )}
            </div>
          </motion.div>

          {/* Settings Dropdown */}
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-panel rounded-xl p-4 space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Microphone</label>
                <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Camera</label>
                <Select value={selectedVideoDevice} onValueChange={setSelectedVideoDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Right Side - Meeting Info */}
      <motion.div 
        className="w-[400px] bg-surface-0 border-l border-border/50 flex flex-col justify-center p-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Meeting Title */}
          <motion.div variants={itemVariants} className="space-y-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Ready to join
            </span>
            <h1 className="text-2xl font-semibold text-foreground">{meetingTitle}</h1>
          </motion.div>

          {/* Your Role */}
          <motion.div variants={itemVariants} className="space-y-3">
            <span className="text-sm text-muted-foreground">Your role in this meeting</span>
            <div className="glass-panel rounded-xl p-4 hover:border-primary/30 transition-colors duration-200">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aurora-teal to-aurora-cyan flex items-center justify-center shadow-glow-sm">
                  <span className="text-lg font-semibold text-primary-foreground">
                    {currentUser.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{currentUser.name}</p>
                  <p className="text-sm text-muted-foreground">{currentUser.role.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{currentUser.role.department}</p>
                </div>
                {currentUser.isHost && (
                  <span className="px-2 py-0.5 rounded-full bg-aurora-violet/20 text-aurora-violet text-xs">
                    Host
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* AI Presence */}
          <motion.div 
            variants={itemVariants}
            className="glass-panel rounded-xl p-4 border-l-2 border-l-primary hover:shadow-glow-sm transition-shadow duration-300"
          >
            <div className="flex items-start gap-3">
              <motion.div 
                className="w-10 h-10 rounded-xl overflow-hidden"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src={novaAiLogo} alt="Nova AI" className="w-full h-full object-cover" />
              </motion.div>
              <div>
                <p className="font-medium text-foreground">Nova AI</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Will join to assist with notes, decisions, and action items
                </p>
              </div>
            </div>
          </motion.div>

          {/* Checklist */}
          <motion.div variants={itemVariants} className="space-y-2">
            <motion.div 
              className="flex items-center gap-2 text-sm"
              animate={hasPermissions ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle2 className={cn(
                "w-4 h-4 transition-colors duration-200",
                hasPermissions ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={hasPermissions ? "text-foreground" : "text-muted-foreground"}>
                Camera & microphone ready
              </span>
            </motion.div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-foreground">Meeting room available</span>
            </div>
          </motion.div>

          {/* Join Button */}
          <motion.div variants={itemVariants}>
            <Button
              onClick={handleJoin}
              disabled={isJoining || hasPermissions === false || !isNameValid}
              className="w-full h-12 text-base font-medium"
              variant="aurora"
            >
              {isJoining ? (
                <span className="flex items-center gap-2">
                  <motion.div 
                    className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Joining...
                </span>
              ) : (
                "Join Meeting"
              )}
            </Button>
          </motion.div>

          {hasPermissions === false && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive text-center"
            >
              Please allow camera and microphone access to join
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
