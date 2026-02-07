import { useState, useCallback } from "react";

export interface MeetingFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
}

// Mock data for demo
const mockFiles: MeetingFile[] = [
  {
    id: "1",
    fileName: "Q4_Report.pdf",
    fileSize: 2456000,
    fileType: "application/pdf",
    uploadedBy: "Sarah Chen",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 15),
    url: "#",
  },
  {
    id: "2",
    fileName: "Design_Mockups.fig",
    fileSize: 8234000,
    fileType: "application/figma",
    uploadedBy: "Mike Johnson",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 8),
    url: "#",
  },
];

export function useMeetingFiles() {
  const [files, setFiles] = useState<MeetingFile[]>(mockFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    clearInterval(progressInterval);
    setUploadProgress(100);

    const newFile: MeetingFile = {
      id: crypto.randomUUID(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      uploadedBy: "You",
      uploadedAt: new Date(),
      url: URL.createObjectURL(file),
    };

    setFiles((prev) => [newFile, ...prev]);
    
    // Reset state
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
    }, 500);

    return newFile;
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    files,
    isUploading,
    uploadProgress,
    uploadFile,
    deleteFile,
    formatFileSize,
  };
}
