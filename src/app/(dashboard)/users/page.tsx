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
import {
  Plus,
  Loader2,
  Users,
  Shield,
  Building2,
  MoreHorizontal,
  Pencil,
  KeyRound,
  Power,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  UserCog,
  UsersRound,
} from "lucide-react";
import { useUsers, useTenants } from "@/hooks/use-api";
import { useAuth, useIsTenantAdmin } from "@/contexts/auth-context";
import {
  UserDialog,
  DeleteUserDialog,
  ChangePasswordDialog,
  AssignSupervisorDialog,
} from "@/components/users";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  roles: string[];
  supervisor_id?: string;
  supervisor_name?: string;
  department?: string;
  subordinate_count?: number;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, error } = useUsers();
  const { data: tenants } = useTenants();
  const { t } = useTranslation();
  const isTenantAdmin = useIsTenantAdmin();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"deactivate" | "permanent">("deactivate");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [supervisorDialogOpen, setSupervisorDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Collapsible state for tenant groups (all open by default)
  const [openTenants, setOpenTenants] = useState<Record<string, boolean>>({});

  const isSuperAdmin = currentUser?.roles.includes("super_admin") ?? false;
  const isPlatformAdmin = isSuperAdmin || currentUser?.roles.includes("platform_admin");
  const isAdmin = isPlatformAdmin || isTenantAdmin;
  const userList = (users as User[]) || [];
  const tenantList = (tenants as Tenant[]) || [];

  // Create tenant lookup map
  const tenantMap = tenantList.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {} as Record<string, Tenant>);

  // Group users by tenant (for platform admins)
  const usersByTenant: Record<string, User[]> = {};
  if (isPlatformAdmin) {
    userList.forEach(user => {
      const key = user.tenant_id || "platform";
      if (!usersByTenant[key]) {
        usersByTenant[key] = [];
      }
      usersByTenant[key].push(user);
    });
  }

  const getTenantName = (tenantId: string) => {
    if (tenantId === "platform") return "Platform Users";
    return tenantMap[tenantId]?.name ?? "Unknown Tenant";
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setPasswordDialogOpen(true);
  };

  const handleDeactivate = (user: User) => {
    setSelectedUser(user);
    setDeleteMode("deactivate");
    setDeleteDialogOpen(true);
  };

  const handleDeletePermanent = (user: User) => {
    setSelectedUser(user);
    setDeleteMode("permanent");
    setDeleteDialogOpen(true);
  };

  const handleAssignSupervisor = (user: User) => {
    setSelectedUser(user);
    setSupervisorDialogOpen(true);
  };
  
  const toggleTenant = (tenantId: string) => {
    setOpenTenants(prev => ({
      ...prev,
      [tenantId]: prev[tenantId] === undefined ? false : !prev[tenantId]
    }));
  };
  
  const isTenantOpen = (tenantId: string) => {
    return openTenants[tenantId] !== false; // default to true (open)
  };

  const isCurrentUser = (userId: string) => userId === currentUser?.id;

  // Render a single user row
  const renderUserRow = (user: User) => (
    <div
      key={user.id}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
          {user.first_name.charAt(0).toUpperCase()}
          {user.last_name.charAt(0).toUpperCase()}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">
              {user.first_name} {user.last_name}
            </span>
            {isCurrentUser(user.id) && (
              <Badge variant="outline" className="text-xs">{t("common.you")}</Badge>
            )}
            {user.is_superuser && (
              <Badge variant="destructive" className="gap-1 flex-shrink-0">
                <Shield className="h-3 w-3" />
                {t("users.superAdmin")}
              </Badge>
            )}
            <Badge variant={user.is_active ? "default" : "secondary"} className="flex-shrink-0">
              {user.is_active ? t("common.active") : t("common.inactive")}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          {/* Organization info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {user.department && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {user.department}
              </span>
            )}
            {user.supervisor_name && (
              <span className="flex items-center gap-1">
                <UserCog className="h-3 w-3" />
                {t("users.supervisor")}: {user.supervisor_name}
              </span>
            )}
            {(user.subordinate_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <UsersRound className="h-3 w-3" />
                {user.subordinate_count} {t("users.subordinates")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground text-right">
          <div>{t("common.joined")}</div>
          <div>{new Date(user.created_at).toLocaleDateString()}</div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t("common.actions")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={() => handleEdit(user)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleChangePassword(user)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {isCurrentUser(user.id) ? t("users.changePassword") : t("users.resetPassword")}
                </DropdownMenuItem>
                {isTenantAdmin && !isCurrentUser(user.id) && (
                  <DropdownMenuItem onClick={() => handleAssignSupervisor(user)}>
                    <UserCog className="mr-2 h-4 w-4" />
                    {t("users.assignSupervisor")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            {!isAdmin && isCurrentUser(user.id) && (
              <>
                <DropdownMenuItem onClick={() => handleChangePassword(user)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {t("users.changePassword")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {(user.subordinate_count ?? 0) > 0 && (
              <DropdownMenuItem asChild>
                <Link href="/team">
                  <UsersRound className="mr-2 h-4 w-4" />
                  {t("users.viewTeam")}
                </Link>
              </DropdownMenuItem>
            )}
            {isAdmin && !isCurrentUser(user.id) && (
              <>
                <DropdownMenuItem
                  onClick={() => handleDeactivate(user)}
                  className="text-orange-600 focus:text-orange-600"
                >
                  <Power className="mr-2 h-4 w-4" />
                  {t("tenants.deactivate")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeletePermanent(user)}
                  className="text-destructive focus:text-destructive"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {t("tenants.deletePermanently")}
                </DropdownMenuItem>
              </>
            )}
            {isCurrentUser(user.id) && (
              <DropdownMenuItem disabled className="text-muted-foreground">
                <Power className="mr-2 h-4 w-4" />
                {t("users.cannotDeleteSelf")}
              </DropdownMenuItem>
            )}
            {!isAdmin && !isCurrentUser(user.id) && (
              <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                {t("users.adminRequired")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("users.title")}</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? t("users.subtitle")
              : t("users.subtitleTenant")}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
            {t("users.addUser")}
        </Button>
        )}
      </div>

      {isSuperAdmin && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Shield className="h-4 w-4" />
              <span>
                {t("users.superAdminNote")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              {t("users.failedToLoad")}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isPlatformAdmin ? t("users.allPlatformUsers") : t("users.yourTeam")}</CardTitle>
          <CardDescription>
            {isPlatformAdmin 
              ? t("users.usersAcrossPlatform", { count: userList.length })
              : t("users.usersInOrg", { count: userList.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userList.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {t("users.noUsers")}
              </p>
            </div>
          ) : isPlatformAdmin ? (
            // Platform admin view: grouped by tenant
            <div className="space-y-4">
              {Object.keys(usersByTenant).sort((a, b) => {
                if (a === "platform") return -1;
                if (b === "platform") return 1;
                const tenantA = tenantMap[a]?.name || "";
                const tenantB = tenantMap[b]?.name || "";
                return tenantA.localeCompare(tenantB);
              }).map((tenantId) => {
                const tenant = tenantMap[tenantId];
                const tenantUsers = usersByTenant[tenantId];
                const isOpen = isTenantOpen(tenantId);
                const isPlatformGroup = tenantId === "platform";

                return (
                  <Card key={tenantId}>
                    <CardHeader 
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => toggleTenant(tenantId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isOpen ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <Building2 className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <CardTitle className="text-lg">
                              {isPlatformGroup ? t("sidebar.platform") || "Platform Users" : (tenant?.name || "Unknown Tenant")}
                            </CardTitle>
                            <CardDescription>
                              {tenantUsers.length} user{tenantUsers.length !== 1 ? "s" : ""}
                              {tenant?.slug && ` • ${tenant.slug}`}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {tenantUsers.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    {isOpen && (
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {tenantUsers.map((user) => renderUserRow(user))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            // Tenant admin/user view: flat list
            <div className="space-y-3">
              {userList.map((user) => renderUserRow(user))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <UserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit User Dialog */}
      <UserDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
        mode={deleteMode}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
      />

      {/* Assign Supervisor Dialog */}
      <AssignSupervisorDialog
        open={supervisorDialogOpen}
        onOpenChange={(open) => {
          setSupervisorDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
}
