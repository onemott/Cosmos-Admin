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
} from "lucide-react";
import { useUsers, useTenants } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";
import {
  UserDialog,
  DeleteUserDialog,
  ChangePasswordDialog,
} from "@/components/users";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
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

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"deactivate" | "permanent">("deactivate");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Collapsible state for tenant groups (all open by default)
  const [openTenants, setOpenTenants] = useState<Record<string, boolean>>({});

  const isSuperAdmin = currentUser?.roles.includes("super_admin") ?? false;
  const isPlatformAdmin = isSuperAdmin || currentUser?.roles.includes("platform_admin");
  const isAdmin = isPlatformAdmin || currentUser?.roles.some(role => 
    ["tenant_admin", "eam_manager"].includes(role)
  );
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
      if (!usersByTenant[user.tenant_id]) {
        usersByTenant[user.tenant_id] = [];
      }
      usersByTenant[user.tenant_id].push(user);
    });
  }

  const getTenantName = (tenantId: string) => {
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
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {user.first_name} {user.last_name}
            </span>
            {isCurrentUser(user.id) && (
              <Badge variant="outline" className="text-xs">You</Badge>
            )}
            {user.is_superuser && (
              <Badge variant="destructive" className="gap-1">
                <Shield className="h-3 w-3" />
                Super Admin
              </Badge>
            )}
            <Badge variant={user.is_active ? "default" : "secondary"}>
              {user.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground text-right">
          <div>Joined</div>
          <div>{new Date(user.created_at).toLocaleDateString()}</div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={() => handleEdit(user)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleChangePassword(user)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  {isCurrentUser(user.id) ? "Change Password" : "Reset Password"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {!isAdmin && isCurrentUser(user.id) && (
              <>
                <DropdownMenuItem onClick={() => handleChangePassword(user)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {isAdmin && !isCurrentUser(user.id) && (
              <>
                <DropdownMenuItem
                  onClick={() => handleDeactivate(user)}
                  className="text-orange-600 focus:text-orange-600"
                >
                  <Power className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeletePermanent(user)}
                  className="text-destructive focus:text-destructive"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Delete Permanently
                </DropdownMenuItem>
              </>
            )}
            {isCurrentUser(user.id) && (
              <DropdownMenuItem disabled className="text-muted-foreground">
                <Power className="mr-2 h-4 w-4" />
                Cannot delete yourself
              </DropdownMenuItem>
            )}
            {!isAdmin && !isCurrentUser(user.id) && (
              <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                Admin access required
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
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? "Manage user accounts across all tenants"
              : "View user accounts in your organization"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
        )}
      </div>

      {isSuperAdmin && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Shield className="h-4 w-4" />
              <span>
                As a super admin, you can view and manage users across all tenants.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Failed to load users. Make sure the backend is running.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isPlatformAdmin ? "All Platform Users" : "Your Team"}</CardTitle>
          <CardDescription>
            {userList.length} user{userList.length !== 1 ? "s" : ""}{" "}
            {isPlatformAdmin ? "across the platform" : "in your organization"}
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
                No users found. Click "Add User" to create your first team member.
              </p>
            </div>
          ) : isPlatformAdmin ? (
            // Platform admin view: grouped by tenant
            <div className="space-y-4">
              {Object.keys(usersByTenant).sort((a, b) => {
                const tenantA = tenantMap[a]?.name || "";
                const tenantB = tenantMap[b]?.name || "";
                return tenantA.localeCompare(tenantB);
              }).map((tenantId) => {
                const tenant = tenantMap[tenantId];
                const tenantUsers = usersByTenant[tenantId];
                const isOpen = isTenantOpen(tenantId);

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
                              {tenant?.name || "Unknown Tenant"}
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
    </div>
  );
}
