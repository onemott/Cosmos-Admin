"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  Users,
  MoreHorizontal,
  KeyRound,
  Power,
  Trash2,
  Search,
  Copy,
  Check,
  Mail,
  UserCircle,
} from "lucide-react";
import {
  useClientUsers,
  useCreateClientUser,
  useUpdateClientUser,
  useResetClientUserPassword,
  useDeleteClientUser,
  useClients,
} from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";
import type { ClientUser, ClientUserListResponse, Client } from "@/types";

interface ClientListResponse {
  clients: Client[];
  total: number;
}

export default function ClientUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: clientUsersData, isLoading } = useClientUsers({ search: searchQuery || undefined });
  const { data: clientsData } = useClients({ limit: 100 });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleActiveDialogOpen, setToggleActiveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);

  // Create dialog state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Mutations
  const createMutation = useCreateClientUser();
  const updateMutation = useUpdateClientUser(selectedUser?.id || "");
  const resetPasswordMutation = useResetClientUserPassword();
  const deleteMutation = useDeleteClientUser();

  const isAdmin = currentUser?.roles.some((role) =>
    ["super_admin", "platform_admin", "tenant_admin"].includes(role)
  );

  const clientUsers = (clientUsersData as ClientUserListResponse)?.client_users || [];
  const clients = (clientsData as ClientListResponse)?.clients || [];

  // Get clients that don't have credentials yet
  const clientUserClientIds = new Set(clientUsers.map((cu) => cu.client_id));
  const clientsWithoutCredentials = clients.filter((c) => !clientUserClientIds.has(c.id));

  const getClientName = (client: Client) => {
    if (client.client_type === "individual") {
      return `${client.first_name} ${client.last_name}`;
    }
    return client.entity_name || "Unknown";
  };

  const handleCreate = async () => {
    if (!selectedClientId || !email) return;

    try {
      const result = await createMutation.mutateAsync({
        client_id: selectedClientId,
        email,
        password: password || undefined,
      });
      
      // Show temp password if generated
      if ((result as { temp_password?: string }).temp_password) {
        setTempPassword((result as { temp_password?: string }).temp_password || null);
      } else {
        setCreateDialogOpen(false);
        resetCreateForm();
      }
    } catch (error) {
      console.error("Failed to create client user:", error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      await updateMutation.mutateAsync({ email });
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to update client user:", error);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      const result = await resetPasswordMutation.mutateAsync({
        id: selectedUser.id,
      });
      if ((result as { temp_password?: string }).temp_password) {
        setTempPassword((result as { temp_password?: string }).temp_password || null);
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteMutation.mutateAsync(selectedUser.id);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to delete client user:", error);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedUser) return;
    try {
      await updateMutation.mutateAsync({ is_active: !selectedUser.is_active });
      setToggleActiveDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  const resetCreateForm = () => {
    setSelectedClientId("");
    setEmail("");
    setPassword("");
    setTempPassword(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Credentials</h1>
          <p className="text-muted-foreground">
            Manage login credentials for your clients to access the mobile app
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Credentials
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {clientUsers.filter((u) => u.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients Without Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {clientsWithoutCredentials.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Client Login Accounts</CardTitle>
          <CardDescription>
            {clientUsers.length} client{clientUsers.length !== 1 ? "s" : ""} with login credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : clientUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No client credentials found. Click &quot;Create Credentials&quot; to give a client access.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientUsers.map((clientUser) => (
                <div
                  key={clientUser.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserCircle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {clientUser.client_name || "Unknown Client"}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {clientUser.client_type}
                        </Badge>
                        <Badge variant={clientUser.is_active ? "default" : "secondary"}>
                          {clientUser.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {clientUser.mfa_enabled && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            MFA Enabled
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {clientUser.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground text-right">
                      <div>Last Login</div>
                      <div>
                        {clientUser.last_login_at
                          ? new Date(clientUser.last_login_at).toLocaleDateString()
                          : "Never"}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(clientUser);
                            setEmail(clientUser.email);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Change Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(clientUser);
                            setTempPassword(null);
                            setPasswordDialogOpen(true);
                          }}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(clientUser);
                            setToggleActiveDialogOpen(true);
                          }}
                          className={clientUser.is_active ? "text-orange-600" : "text-green-600"}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {clientUser.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(clientUser);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Credentials
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Credentials Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Client Credentials</DialogTitle>
            <DialogDescription>
              Create login credentials for a client to access the mobile app.
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Credentials created successfully!
                </p>
                <p className="text-sm text-green-700 mb-3">
                  Share this temporary password with the client. They should change it on first login.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono border">
                    {tempPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(tempPassword)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setCreateDialogOpen(false);
                    resetCreateForm();
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Client</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Choose a client...</option>
                  {clientsWithoutCredentials.map((client) => (
                    <option key={client.id} value={client.id}>
                      {getClientName(client)} ({client.email || "No email"})
                    </option>
                  ))}
                </select>
                {clientsWithoutCredentials.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    All clients already have login credentials.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Login Email</label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Password <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  type="password"
                  placeholder="Leave empty to auto-generate"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  If left empty, a secure temporary password will be generated.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!selectedClientId || !email || createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Credentials
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>
              Update the login email for {selectedUser?.client_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open);
          if (!open) {
            setSelectedUser(null);
            setTempPassword(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Generate a new temporary password for {selectedUser?.client_name}.
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Password reset successfully!
                </p>
                <p className="text-sm text-green-700 mb-3">
                  Share this new temporary password with the client.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono border">
                    {tempPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(tempPassword)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setPasswordDialogOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                This will generate a new temporary password. The client will need to use this
                password to log in.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate New Password
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Credentials</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the login credentials for{" "}
              <strong>{selectedUser?.client_name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm text-orange-800">
              This will remove the client&apos;s ability to log in to the mobile app. The client
              record itself will not be deleted.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate/Deactivate Confirmation Dialog */}
      <Dialog
        open={toggleActiveDialogOpen}
        onOpenChange={(open) => {
          setToggleActiveDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_active ? "Deactivate Account" : "Activate Account"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_active
                ? `Are you sure you want to deactivate ${selectedUser?.client_name}'s account?`
                : `Are you sure you want to activate ${selectedUser?.client_name}'s account?`}
            </DialogDescription>
          </DialogHeader>

          {selectedUser?.is_active ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm text-orange-800 font-medium mb-2">
                What happens when you deactivate:
              </p>
              <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
                <li>The client will be logged out on their next API request</li>
                <li>They will not be able to log in until reactivated</li>
                <li>Their data remains intact and can be accessed by EAM staff</li>
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-800">
                The client will be able to log in to the mobile app again.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleActiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.is_active ? "destructive" : "default"}
              onClick={handleToggleActive}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {selectedUser?.is_active ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

