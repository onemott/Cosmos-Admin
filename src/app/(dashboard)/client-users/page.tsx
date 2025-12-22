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
import { useTranslation, useLocalizedDate } from "@/lib/i18n";
import { UserDataTooltip } from "@/components/ui/user-data-tooltip";
import type { ClientUser, ClientUserListResponse, Client } from "@/types";

interface ClientListResponse {
  clients: Client[];
  total: number;
}

export default function ClientUsersPage() {
  const { t } = useTranslation();
  const { formatDate } = useLocalizedDate();
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
          <h1 className="text-3xl font-bold tracking-tight">{t("clientUsers.title")}</h1>
          <p className="text-muted-foreground">
            {t("clientUsers.subtitle")}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("clientUsers.addCredentials")}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("clientUsers.searchPlaceholder")}
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
              {t("common.total")} {t("clientUsers.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("common.active")}
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
              {t("clients.title")} Without Access
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
          <CardTitle>{t("clientUsers.clientCredentials")}</CardTitle>
          <CardDescription>
            {clientUsers.length} {t("common.client").toLowerCase()}{clientUsers.length !== 1 ? "s" : ""} with login credentials
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
                {t("clientUsers.noCredentials")}
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
                        <UserDataTooltip>
                          <span className="font-medium">
                            {clientUser.client_name || "Unknown Client"}
                          </span>
                        </UserDataTooltip>
                        <Badge variant="outline" className="text-xs capitalize">
                          {clientUser.client_type}
                        </Badge>
                        <Badge variant={clientUser.is_active ? "default" : "secondary"}>
                          {clientUser.is_active ? t("common.active") : t("common.inactive")}
                        </Badge>
                        {clientUser.mfa_enabled && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {t("clientUsers.mfaEnabled")}
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
                      <div>{t("clientUsers.lastLogin")}</div>
                      <div>
                        {clientUser.last_login_at
                          ? formatDate(clientUser.last_login_at)
                          : "Never"}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t("common.actions")}</span>
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
                          {t("common.edit")} {t("common.email")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(clientUser);
                            setTempPassword(null);
                            setPasswordDialogOpen(true);
                          }}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          {t("clientUsers.resetPassword")}
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
                          {clientUser.is_active ? t("tenants.deactivate") : t("common.active")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(clientUser);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("clientUsers.deleteCredentials")}
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
            <DialogTitle>{t("clientUsers.createDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("clientUsers.createDialog.description")}
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  {t("clientUsers.tempPassword.title")}
                </p>
                <p className="text-sm text-green-700 mb-3">
                  {t("clientUsers.tempPassword.message")}
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
                  {t("common.done")}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("clientUsers.createDialog.selectClient")}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">{t("clientUsers.createDialog.selectClientPlaceholder")}</option>
                  {clientsWithoutCredentials.map((client) => (
                    <option key={client.id} value={client.id}>
                      {getClientName(client)} ({client.email || "No email"})
                    </option>
                  ))}
                </select>
                {clientsWithoutCredentials.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("clientUsers.createDialog.noClientsAvailable")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("clientUsers.createDialog.email")}</label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("clientUsers.createDialog.password")} <span className="text-muted-foreground">({t("common.optional")})</span>
                </label>
                <Input
                  type="password"
                  placeholder={t("clientUsers.createDialog.passwordHint")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("clientUsers.createDialog.passwordHint")}
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!selectedClientId || !email || createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("clientUsers.addCredentials")}
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
            <DialogTitle>{t("common.edit")} {t("common.email")}</DialogTitle>
            <DialogDescription>
              Update the login email for {selectedUser?.client_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("common.email")}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("common.saveChanges")}
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
            <DialogTitle>{t("clientUsers.passwordDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("clientUsers.passwordDialog.description")}
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  {t("common.success")}!
                </p>
                <p className="text-sm text-green-700 mb-3">
                  {t("clientUsers.passwordDialog.copyHint")}
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
                <Button onClick={() => setPasswordDialogOpen(false)}>{t("common.done")}</Button>
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
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("clientUsers.passwordDialog.generateNew")}
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
            <DialogTitle>{t("clientUsers.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("clientUsers.deleteDialog.description")}{" "}
              <strong>{selectedUser?.client_name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm text-orange-800">
              {t("clientUsers.deleteDialog.warning")}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("clientUsers.deleteCredentials")}
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
              {selectedUser?.is_active ? t("tenants.deactivate") : t("common.active")}
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
              {t("common.cancel")}
            </Button>
            <Button
              variant={selectedUser?.is_active ? "destructive" : "default"}
              onClick={handleToggleActive}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {selectedUser?.is_active ? t("tenants.deactivate") : t("common.active")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
