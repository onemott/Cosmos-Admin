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
import { Input } from "@/components/ui/input";
import { useDeleteUser, useDeleteUserPermanent } from "@/hooks/use-api";
import { Loader2, AlertTriangle } from "lucide-react";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
}

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  mode: "deactivate" | "permanent";
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  mode,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const deleteUser = useDeleteUser();
  const deleteUserPermanent = useDeleteUserPermanent();

  const handleDelete = async () => {
    if (!user) return;
    
    // For permanent delete, require confirmation text
    if (mode === "permanent" && confirmText !== user.email) {
      return;
    }
    
    setIsDeleting(true);
    try {
      if (mode === "permanent") {
        await deleteUserPermanent.mutateAsync(user.id);
      } else {
        await deleteUser.mutateAsync(user.id);
      }
      onOpenChange(false);
      setConfirmText("");
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmText("");
    }
    onOpenChange(open);
  };

  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`;

  if (mode === "permanent") {
    // Super admins cannot be permanently deleted
    if (user.is_superuser) {
      return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Cannot Delete Super Admin
              </AlertDialogTitle>
              <AlertDialogDescription>
                Super admin accounts cannot be permanently deleted for security reasons.
                You can deactivate this account instead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete User
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to <strong className="text-destructive">permanently delete</strong>{" "}
                  <strong>{fullName}</strong>.
                </p>
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm">
                  <p className="font-medium text-destructive">⚠️ This action cannot be undone!</p>
                  <p className="mt-1 text-muted-foreground">
                    The user account and all associated data will be permanently removed.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    To confirm, type the user&apos;s email{" "}
                    <strong className="font-mono bg-muted px-1 py-0.5 rounded">{user.email}</strong>{" "}
                    below:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={user.email}
                    className="font-mono"
                    disabled={isDeleting}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== user.email}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Deactivate mode (soft delete)
  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate User</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Are you sure you want to deactivate <strong>{fullName}</strong>?
              </p>
              <p className="text-sm">
                This will:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>Prevent the user from logging in</li>
                <li>Remove their access to the platform</li>
                <li>Preserve their data and activity history</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                You can reactivate this user later from the edit screen.
              </p>
            </div>
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
            Deactivate User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

