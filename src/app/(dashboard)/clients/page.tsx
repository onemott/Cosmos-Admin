"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserDataTooltip } from "@/components/ui/user-data-tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, UserCheck, Plus, MoreHorizontal, Pencil, Trash2, Eye, Blocks, Clock, UserCog, Users } from "lucide-react";
import { useClients, useClient, useUsers } from "@/hooks/use-api";
import { useAuth, useIsTenantAdmin, useIsSupervisor } from "@/contexts/auth-context";
import { ClientDialog, DeleteClientDialog, ClientModulesDialog, ClientModuleBadges, ReassignClientDialog } from "@/components/clients";
import { useTranslation } from "@/lib/i18n";

interface ClientSummary {
  id: string;
  display_name: string;
  client_type: "individual" | "entity" | "trust";
  kyc_status: "pending" | "in_progress" | "approved" | "rejected" | "expired";
  total_aum?: number;
  assigned_to_user_id?: string;
  assigned_to_name?: string;
}

interface ClientFull {
  id: string;
  client_type: "individual" | "entity" | "trust";
  first_name?: string;
  last_name?: string;
  entity_name?: string;
  email?: string;
  phone?: string;
  kyc_status: string;
  risk_profile?: string;
  extra_data?: any;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  assigned_to_user_id?: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  tenant_id: string;
  is_active: boolean;
}

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isTenantAdmin = useIsTenantAdmin();
  const isSupervisor = useIsSupervisor();
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  
  // Get users for assignee filter dropdown
  const { data: usersData } = useUsers({ limit: 100 });
  const userList = (usersData as User[]) || [];
  const tenantUsers = userList.filter(u => u.tenant_id === user?.tenantId && u.is_active);
  
  const { data: clients, isLoading, error } = useClients({ 
    search: search || undefined,
    kyc_status: kycFilter === "all" ? undefined : kycFilter,
    assigned_to: assigneeFilter === "all" ? undefined : assigneeFilter === "unassigned" ? "null" : assigneeFilter,
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientForDelete, setSelectedClientForDelete] = useState<ClientSummary | null>(null);
  const [selectedClientForModules, setSelectedClientForModules] = useState<ClientSummary | null>(null);
  const [selectedClientForReassign, setSelectedClientForReassign] = useState<ClientSummary | null>(null);

  // Fetch full client details when editing
  const { data: fullClientData } = useClient(selectedClientId || "", {
    enabled: !!selectedClientId && editDialogOpen,
  });

  const clientList = (clients as ClientSummary[]) || [];

  // Check if user can manage clients (tenant_admin or platform roles)
  const canManage = user?.roles?.some((role: string) =>
    ["super_admin", "platform_admin", "tenant_admin"].includes(role)
  );

  const handleEdit = (client: ClientSummary) => {
    setSelectedClientId(client.id);
    setEditDialogOpen(true);
  };

  const handleManageModules = (client: ClientSummary) => {
    setSelectedClientForModules(client);
    setModulesDialogOpen(true);
  };

  const handleReassign = (client: ClientSummary) => {
    setSelectedClientForReassign(client);
    setReassignDialogOpen(true);
  };

  const handleDelete = (client: ClientSummary) => {
    setSelectedClientForDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setSelectedClientId(null);
  };

  const getKycBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "in_progress":
        return "outline";
      case "rejected":
      case "expired":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getKycStatusLabel = (status: string) => {
    const key = `clients.kycStatus.${status.replace("-", "_")}` as const;
    return t(key);
  };

  const getClientTypeLabel = (type: string) => {
    const key = `clients.clientType.${type}` as const;
    return t(key);
  };

  const formatAum = (aum?: number) => {
    if (!aum) return "—";
    if (aum >= 1_000_000) return `$${(aum / 1_000_000).toFixed(1)}M`;
    if (aum >= 1_000) return `$${(aum / 1_000).toFixed(1)}K`;
    return `$${aum.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("clients.title")}</h1>
          <p className="text-muted-foreground">
            {t("clients.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("clients.searchClients")}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("clients.addClient")}
            </Button>
          )}
        </div>
      </div>

      {/* KYC Status Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <Tabs value={kycFilter} onValueChange={setKycFilter} className="flex-1">
          <TabsList>
            <TabsTrigger value="all">{t("clients.allClients")}</TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-3 w-3" />
              {t("clients.pendingKYC")}
            </TabsTrigger>
            <TabsTrigger value="in_progress">{t("clients.inProgress")}</TabsTrigger>
            <TabsTrigger value="approved">{t("clients.approved")}</TabsTrigger>
            <TabsTrigger value="rejected">{t("clients.rejected")}</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Assignee Filter */}
        {(isTenantAdmin || isSupervisor) && (
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[200px]">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t("clients.filterByAssignee")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("clients.allAssignees")}</SelectItem>
              <SelectItem value={user?.id || "me"}>{t("clients.myClients")}</SelectItem>
              <SelectItem value="unassigned">{t("clients.unassigned")}</SelectItem>
              {tenantUsers.filter(u => u.id !== user?.id).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.first_name} {u.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              {t("clients.failedToLoad")}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("clients.yourClients")}</CardTitle>
          <CardDescription>
            {t("clients.clientsInOrg", { count: clientList.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : clientList.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {search ? t("clients.noSearchResults") : t("clients.noClients")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientList.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <UserDataTooltip>
                      <span className="font-medium">{client.display_name}</span>
                      </UserDataTooltip>
                      <Badge variant="outline" className="capitalize">
                        {getClientTypeLabel(client.client_type)}
                      </Badge>
                      <Badge variant={getKycBadgeVariant(client.kyc_status)}>
                        {t("clients.kyc")}: {getKycStatusLabel(client.kyc_status)}
                      </Badge>
                    </div>
                    {/* Module badges and assignee info */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">{t("clients.modules")}:</span>
                        <ClientModuleBadges clientId={client.id} maxVisible={3} />
                      </div>
                      {client.assigned_to_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <UserCog className="h-3 w-3" />
                          <span>{t("clients.assignee")}: {client.assigned_to_name}</span>
                        </div>
                      )}
                      {!client.assigned_to_user_id && (
                        <Badge variant="outline" className="text-xs">
                          {t("clients.unassigned")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{formatAum(client.total_aum)}</div>
                      <div className="text-xs text-muted-foreground">{t("clients.totalAUM")}</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t("common.actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(client.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t("common.viewDetails")}
                        </DropdownMenuItem>
                        {canManage && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(client)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageModules(client)}>
                              <Blocks className="mr-2 h-4 w-4" />
                              {t("clients.manageModules")}
                            </DropdownMenuItem>
                            {isTenantAdmin && (
                              <DropdownMenuItem onClick={() => handleReassign(client)}>
                                <UserCog className="mr-2 h-4 w-4" />
                                {t("clients.reassign")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(client)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Create Client Dialog */}
      <ClientDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Client Dialog */}
      <ClientDialog
        open={editDialogOpen}
        onOpenChange={handleCloseEdit}
        client={fullClientData as ClientFull}
      />

      {/* Manage Modules Dialog */}
      <ClientModulesDialog
        open={modulesDialogOpen}
        onOpenChange={(open) => {
          setModulesDialogOpen(open);
          if (!open) setSelectedClientForModules(null);
        }}
        client={selectedClientForModules}
        canManage={canManage}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedClientForDelete(null);
        }}
        client={selectedClientForDelete}
      />

      {/* Reassign Client Dialog */}
      <ReassignClientDialog
        open={reassignDialogOpen}
        onOpenChange={(open) => {
          setReassignDialogOpen(open);
          if (!open) setSelectedClientForReassign(null);
        }}
        client={selectedClientForReassign}
        currentTenantId={user?.tenantId}
      />
    </div>
  );
}
