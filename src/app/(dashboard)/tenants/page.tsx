"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Loader2, Building2, MoreHorizontal, Pencil, Trash2, Settings, Power, AlertTriangle, Eye, Blocks } from "lucide-react";
import { useTenants } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";
import { TenantDialog, DeleteTenantDialog, TenantModulesDialog, TenantModuleBadges } from "@/components/tenants";
import { useTranslation } from "@/lib/i18n";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export default function TenantsPage() {
  const { data: tenants, isLoading, error } = useTenants();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Platform admin can manage (create/edit/delete), platform user is read-only
  const canManage = (user?.roles.includes("super_admin") || 
                     user?.roles.includes("platform_admin")) ?? false;
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"deactivate" | "permanent">("deactivate");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const tenantList = (tenants as Tenant[]) || [];

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditDialogOpen(true);
  };

  const handleManageModules = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setModulesDialogOpen(true);
  };

  const handleDeactivate = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDeleteMode("deactivate");
    setDeleteDialogOpen(true);
  };

  const handleDeletePermanent = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDeleteMode("permanent");
    setDeleteDialogOpen(true);
  };

  const handleSettings = (tenant: Tenant) => {
    // TODO: Navigate to tenant settings page
    console.log("Settings for:", tenant.slug);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("tenants.title")}</h1>
          <p className="text-muted-foreground">
            {canManage 
              ? t("tenants.subtitle")
              : t("tenants.subtitleReadOnly")}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
            {t("tenants.addTenant")}
        </Button>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              {t("tenants.failedToLoad")}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("tenants.allTenants")}</CardTitle>
          <CardDescription>
            {tenantList.length === 1 
              ? t("tenants.registeredFirms", { count: tenantList.length })
              : t("tenants.registeredFirmsPlural", { count: tenantList.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tenantList.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {t("tenants.noTenants")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tenantList.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tenant.name}</span>
                        <Badge variant={tenant.is_active ? "default" : "secondary"}>
                          {tenant.is_active ? t("common.active") : t("common.inactive")}
                        </Badge>
                      </div>
          <div className="text-sm text-muted-foreground">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {tenant.slug}
                        </span>
                        {tenant.contact_email && (
                          <span className="ml-2">• {tenant.contact_email}</span>
                        )}
                      </div>
                      {/* Module badges */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">{t("tenants.modules")}:</span>
                        <TenantModuleBadges tenantId={tenant.id} maxVisible={3} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground text-right">
                      <div>{t("common.created")}</div>
                      <div>{new Date(tenant.created_at).toLocaleDateString()}</div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t("common.actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canManage ? (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageModules(tenant)}>
                              <Blocks className="mr-2 h-4 w-4" />
                              {t("tenants.manageModules")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSettings(tenant)}>
                              <Settings className="mr-2 h-4 w-4" />
                              {t("header.settings")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeactivate(tenant)}
                              className="text-orange-600 focus:text-orange-600"
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {t("tenants.deactivate")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeletePermanent(tenant)}
                              className="text-destructive focus:text-destructive"
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              {t("tenants.deletePermanently")}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem disabled className="text-muted-foreground">
                            <Eye className="mr-2 h-4 w-4" />
                            {t("tenants.viewOnly")}
                          </DropdownMenuItem>
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

      {/* Create Tenant Dialog */}
      <TenantDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Tenant Dialog */}
      <TenantDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedTenant(null);
        }}
        tenant={selectedTenant}
      />

      {/* Manage Modules Dialog */}
      <TenantModulesDialog
        open={modulesDialogOpen}
        onOpenChange={(open) => {
          setModulesDialogOpen(open);
          if (!open) setSelectedTenant(null);
        }}
        tenant={selectedTenant}
        canManage={canManage}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTenantDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedTenant(null);
        }}
        tenant={selectedTenant}
        mode={deleteMode}
      />
    </div>
  );
}
