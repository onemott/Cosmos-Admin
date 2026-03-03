"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, X } from "lucide-react";
import { useState, useEffect } from "react";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName: string;
  fileType: string; // mime type
}

export function FilePreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: FilePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen, fileUrl]);

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";
  const isWord = fileType === 'application/msword' || fileType.includes('wordprocessingml');
  const isExcel = fileType === 'application/vnd.ms-excel' || fileType.includes('spreadsheetml');
  const isOffice = isWord || isExcel;

  const renderContent = () => {
    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (isOffice) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 bg-muted/20 rounded-lg">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{isWord ? 'Word' : 'Excel'} document</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {isWord ? 'Word' : 'Excel'} documents cannot be previewed directly.
          </p>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download {isWord ? 'Word' : 'Excel'} File
          </Button>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center min-h-[300px] bg-muted/20 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <img
            src={fileUrl}
            alt={fileName}
            className="max-h-[70vh] w-auto object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-[70vh] bg-muted/20 rounded-lg overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <iframe
            src={fileUrl}
            className="w-full h-full border-none"
            onLoad={() => setIsLoading(false)}
            title={fileName}
          />
        </div>
      );
    }

    // Fallback for unsupported types
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 bg-muted/20 rounded-lg">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Preview not available</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          This file type ({fileType}) cannot be previewed directly in the browser.
        </p>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-background z-20">
          <div className="flex items-center gap-2 overflow-hidden">
            <DialogTitle className="truncate" title={fileName}>
              {fileName}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(fileUrl || "", "_blank")}
              title="Open in new tab"
              disabled={!fileUrl}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-muted/10">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
