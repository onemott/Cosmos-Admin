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
import { useReassignClient, useUsers } from "@/hooks/use-api";
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
}

interface Client {
  id: string;
  display_name: string;
  assigned_to_user_id?: string;
}

interface ReassignClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  currentTenantId?: string;
}

export function ReassignClientDialog({
  open,
  onOpenChange,
  client,
  currentTenantId,
}: ReassignClientDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const reassignClient = useReassignClient();
  const { data: users } = useUsers({ limit: 100 });
  const { toast } = useToast();
  const { t } = useTranslation();

  // Filter potential assignees (same tenant, active)
  const potentialAssignees = useMemo(() => {
    if (!users || !currentTenantId) return [];
    const userList = users as User[];
    return userList.filter((u) => {
      if (u.tenant_id !== currentTenantId) return false;
      if (!u.is_active) return false;
      return true;
    });
  }, [users, currentTenantId]);

  // Reset selection when dialog opens
  useState(() => {
    if (open && client) {
      setSelectedUserId(client.assigned_to_user_id || null);
    }
  });

  const handleSubmit = async () => {
    if (!client) return;

    try {
      await reassignClient.mutateAsync({
        clientId: client.id,
        userId: selectedUserId,
      });
      toast({
        title: t("clients.reassigned"),
        description: t("clients.reassignedDesc"),
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("clients.reassignFailed"),
        variant: "destructive",
      });
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("clients.reassignClient")}</DialogTitle>
          <DialogDescription>
            {t("clients.reassignClientDesc", { name: client.display_name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("clients.selectAssignee")}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedUserId || ""}
              onChange={(e) => setSelectedUserId(e.target.value || null)}
            >
              <option value="">{t("clients.noAssignee")}</option>
              {potentialAssignees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {potentialAssignees.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{t("users.noSupervisorsAvailable")}</span>
            </div>
          )}

          {client.assigned_to_user_id && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedUserId(null)}
            >
              <UserX className="mr-2 h-4 w-4" />
              {t("clients.unassigned")}
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reassignClient.isPending}
          >
            {reassignClient.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
