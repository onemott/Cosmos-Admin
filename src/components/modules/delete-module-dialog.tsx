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
import { useDeleteModule } from "@/hooks/use-api";
import { Loader2 } from "lucide-react";
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Module</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the module "{module.name}"?
            This will remove it from all tenants and cannot be undone.
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
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

