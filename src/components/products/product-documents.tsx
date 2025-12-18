"use client";

import { useCallback, useState } from "react";
import {
  Upload,
  FileText,
  FileImage,
  File,
  Trash2,
  Download,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useProductDocuments,
  useUploadProductDocument,
  useDeleteProductDocument,
} from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { ProductDocument, ProductDocumentList } from "@/types";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".gif", ".webp"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

interface ProductDocumentsProps {
  productId: string;
}

export function ProductDocuments({ productId }: ProductDocumentsProps) {
  const { toast } = useToast();
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { data: documents, isLoading, error } = useProductDocuments(productId);
  const uploadMutation = useUploadProductDocument(productId);
  const deleteMutation = useDeleteProductDocument(productId);

  const validateFile = useCallback((file: File): string | null => {
    // Check empty file
    if (file.size === 0) {
      return "File is empty";
    }
    // Check size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit (${formatFileSize(file.size)})`;
    }
    // Check extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type "${ext}" not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.type}`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast({
          variant: "destructive",
          title: "Invalid file",
          description: error,
        });
        return;
      }
      setSelectedFile(file);
      setDocumentName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension for display name
      setIsUploadMode(true);
    },
    [validateFile, toast]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        name: documentName || undefined,
        description: description || undefined,
      });
      toast({
        title: "Document uploaded",
        description: "Document has been uploaded successfully.",
      });
      resetUploadForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error?.message || "Failed to upload document",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDocId) return;
    try {
      await deleteMutation.mutateAsync(deleteDocId);
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully.",
      });
      setDeleteDocId(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error?.message || "Failed to delete document",
      });
    }
  };

  const handleDownload = async (doc: ProductDocument) => {
    try {
      const url = api.products.documents.downloadUrl(productId, doc.id);
      const token = getAccessToken();
      
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error("Download failed");
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to download the document. Please try again.",
      });
    }
  };

  const resetUploadForm = () => {
    setIsUploadMode(false);
    setSelectedFile(null);
    setDocumentName("");
    setDescription("");
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return FileImage;
    if (mimeType === "application/pdf") return FileText;
    if (mimeType === "application/msword" || mimeType.includes("wordprocessingml")) return FileText;
    return File;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-destructive">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>Failed to load documents</span>
      </div>
    );
  }

  const documentList = (documents as ProductDocumentList)?.documents || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Product Documents ({documentList.length})
        </h3>
        {!isUploadMode ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsUploadMode(true);
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              resetUploadForm();
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {isUploadMode && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            {!selectedFile ? (
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors min-h-[150px] ${
                  dragActive
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept={ALLOWED_EXTENSIONS.join(",")}
                  onChange={handleInputChange}
                />
                <Upload className="h-8 w-8 mx-auto text-primary/70 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Word, or Images up to 50MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = getFileIcon(selectedFile.type);
                      return <Icon className="h-8 w-8 text-muted-foreground" />;
                    })()}
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="doc-name">Display Name</Label>
                    <Input
                      id="doc-name"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Document name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-desc">Description (optional)</Label>
                    <Textarea
                      id="doc-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the document"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetUploadForm}
                    disabled={uploadMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      {documentList.length === 0 && !isUploadMode ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No documents uploaded yet</p>
          <p className="text-xs mt-1">
            Upload product information sheets, brochures, or other materials
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documentList.map((doc) => {
            const Icon = getFileIcon(doc.mime_type);
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Icon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.file_name} • {formatFileSize(doc.file_size)} •{" "}
                      {formatDate(doc.created_at)}
                    </p>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteDocId(doc.id)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

