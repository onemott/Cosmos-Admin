"use client";

import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDeleteModule } from "@/hooks/use-api";
import { Loader2, AlertTriangle } from "lucide-react";
import { Module } from "@/types";

interface DeleteModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null;
}

export function DeleteModuleDialog({
  open,
  onOpenChange,
  module,
}: DeleteModuleDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteModule = useDeleteModule();

  const handleDelete = async () => {
    if (!module) return;
    
    setIsDeleting(true);
    try {
      await deleteModule.mutateAsync(module.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete module:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!module) return null;

  const isCoreModule = module.is_core;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isCoreModule && <AlertTriangle className="h-5 w-5 text-destructive" />}
            Delete Module
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete the module <strong>"{module.name}"</strong>?
            </p>
            
            {isCoreModule && (
              <Alert variant="destructive" className="border-destructive/50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong className="font-semibold">Warning: This is a core module!</strong>
                  <br />
                  Deleting this module will affect all tenants and clients who depend on it.
                  This action is permanent and cannot be undone.
                </AlertDescription>
              </Alert>
            )}
            
            {!isCoreModule && (
              <p className="text-sm">
                This will remove it from all tenants and clients. This action cannot be undone.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCoreModule ? "Delete Core Module" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

