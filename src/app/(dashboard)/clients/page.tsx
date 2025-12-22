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
import { Search, Loader2, UserCheck, Plus, MoreHorizontal, Pencil, Trash2, Eye, Blocks, Clock } from "lucide-react";
import { useClients, useClient } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";
import { ClientDialog, DeleteClientDialog, ClientModulesDialog, ClientModuleBadges } from "@/components/clients";
import { useTranslation } from "@/lib/i18n";

interface ClientSummary {
  id: string;
  display_name: string;
  client_type: "individual" | "entity" | "trust";
  kyc_status: "pending" | "in_progress" | "approved" | "rejected" | "expired";
  total_aum?: number;
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
}

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const { data: clients, isLoading, error } = useClients({ 
    search: search || undefined,
    kyc_status: kycFilter === "all" ? undefined : kycFilter,
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientForDelete, setSelectedClientForDelete] = useState<ClientSummary | null>(null);
  const [selectedClientForModules, setSelectedClientForModules] = useState<ClientSummary | null>(null);

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
      <Tabs value={kycFilter} onValueChange={setKycFilter} className="w-full">
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
                    {/* Module badges */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{t("clients.modules")}:</span>
                      <ClientModuleBadges clientId={client.id} maxVisible={3} />
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
    </div>
  );
}
