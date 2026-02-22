"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, UserX, Users } from "lucide-react";
import { useAssignSupervisor, useUsers } from "@/hooks/use-api";
import { SUPERVISOR_ROLES } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
  is_active: boolean;
  roles?: string[];
  supervisor_id?: string;
}

interface AssignSupervisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function AssignSupervisorDialog({
  open,
  onOpenChange,
  user,
}: AssignSupervisorDialogProps) {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const assignSupervisor = useAssignSupervisor();
  const { data: users } = useUsers({ limit: 100 });
  const { toast } = useToast();
  const { t } = useTranslation();

  // Filter potential supervisors (same tenant, not the user themselves, active, and has supervisor-level role)
  const potentialSupervisors = useMemo(() => {
    if (!users || !user) return [];
    const userList = users as User[];
    return userList.filter((u) => {
      if (u.id === user.id) return false;
      if (u.tenant_id !== user.tenant_id) return false;
      if (!u.is_active) return false;
      // Only show users with supervisor-level roles
      return u.roles?.some((role) => SUPERVISOR_ROLES.includes(role));
    });
  }, [users, user]);

  // Reset selection when dialog opens
  useState(() => {
    if (open && user) {
      setSelectedSupervisorId(user.supervisor_id || null);
    }
  });

  const handleSubmit = async () => {
    if (!user) return;

    try {
      await assignSupervisor.mutateAsync({
        userId: user.id,
        supervisorId: selectedSupervisorId,
      });
      toast({
        title: t("users.supervisorAssigned"),
        description: selectedSupervisorId
          ? t("users.supervisorAssignedDesc")
          : t("users.supervisorRemovedDesc"),
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("users.supervisorAssignFailed"),
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("users.assignSupervisor")}</DialogTitle>
          <DialogDescription>
            {t("users.assignSupervisorDesc", {
              name: `${user.first_name} ${user.last_name}`,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("users.selectSupervisor")}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedSupervisorId || ""}
              onChange={(e) => setSelectedSupervisorId(e.target.value || null)}
            >
              <option value="">{t("users.noSupervisor")}</option>
              {potentialSupervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.first_name} {supervisor.last_name} ({supervisor.email})
                </option>
              ))}
            </select>
          </div>

          {potentialSupervisors.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{t("users.noSupervisorsAvailable")}</span>
            </div>
          )}

          {user.supervisor_id && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedSupervisorId(null)}
            >
              <UserX className="mr-2 h-4 w-4" />
              {t("users.removeSupervisor")}
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={assignSupervisor.isPending}
          >
            {assignSupervisor.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
