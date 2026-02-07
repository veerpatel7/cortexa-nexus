import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Upload,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  File,
  Download,
  Trash2,
} from "lucide-react";
import { MeetingFile, useMeetingFiles } from "@/hooks/useMeetingFiles";

interface FileSharingProps {
  onClose: () => void;
  className?: string;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return Image;
  if (fileType.startsWith("video/")) return Film;
  if (fileType.startsWith("audio/")) return Music;
  if (fileType.includes("pdf") || fileType.includes("document")) return FileText;
  if (fileType.includes("zip") || fileType.includes("archive")) return Archive;
  return File;
};

const getFileColor = (fileType: string) => {
  if (fileType.startsWith("image/")) return "text-aurora-rose";
  if (fileType.startsWith("video/")) return "text-aurora-violet";
  if (fileType.startsWith("audio/")) return "text-aurora-teal";
  if (fileType.includes("pdf")) return "text-destructive";
  return "text-muted-foreground";
};

export function FileSharing({ onClose, className }: FileSharingProps) {
  const { files, isUploading, uploadProgress, uploadFile, deleteFile, formatFileSize } =
    useMeetingFiles();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      for (const file of droppedFiles) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      for (const file of selectedFiles) {
        await uploadFile(file);
      }
      e.target.value = "";
    },
    [uploadFile]
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={cn("flex flex-col h-full bg-surface-0", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground">Shared Files</h3>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          "m-3 p-6 border-2 border-dashed rounded-xl transition-all duration-200",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border/50 hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              isDragOver ? "bg-primary/20" : "bg-surface-2"
            )}
          >
            <Upload
              className={cn(
                "w-5 h-5 transition-colors",
                isDragOver ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragOver ? "Drop files here" : "Drag & drop files"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              or{" "}
              <label className="text-primary hover:underline cursor-pointer">
                browse
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mx-3 mb-3 p-3 bg-surface-1 rounded-lg fade-in">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-foreground">Uploading...</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {uploadProgress}%
            </span>
          </div>
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {files.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No files shared yet</p>
            </div>
          ) : (
            files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                formatFileSize={formatFileSize}
                formatTime={formatTime}
                onDelete={deleteFile}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface FileItemProps {
  file: MeetingFile;
  formatFileSize: (bytes: number) => string;
  formatTime: (date: Date) => string;
  onDelete: (id: string) => void;
}

function FileItem({ file, formatFileSize, formatTime, onDelete }: FileItemProps) {
  const Icon = getFileIcon(file.fileType);
  const iconColor = getFileColor(file.fileType);

  return (
    <div className="group flex items-center gap-3 p-3 bg-surface-1/50 hover:bg-surface-1 rounded-lg transition-colors">
      <div className={cn("w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center", iconColor)}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {file.fileName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.fileSize)} • {file.uploadedBy} • {formatTime(file.uploadedAt)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="iconSm" asChild>
          <a href={file.url} download={file.fileName}>
            <Download className="w-3.5 h-3.5" />
          </a>
        </Button>
        {file.uploadedBy === "You" && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => onDelete(file.id)}
            className="hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
