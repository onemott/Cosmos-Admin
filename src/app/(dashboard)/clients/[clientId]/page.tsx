"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Briefcase,
  User,
  Building2,
  ClipboardList,
  AlertTriangle,
  ExternalLink,
  KeyRound,
  Power,
  Copy,
  Check,
  ShieldCheck,
  MoreHorizontal,
  Plus,
  Link2,
  Pencil,
  Unlink,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  useClient,
  useClientAccounts,
  useClientTasks,
  useClientUserByClient,
  useCreateClientUser,
  useUpdateClientUser,
  useResetClientUserPassword,
  useDeleteClientUser,
  useDeleteAccount,
  useReactivateAccount,
} from "@/hooks/use-api";
import { AccountDialog, LinkAccountDialog } from "@/components/accounts";
import { ClientDocuments } from "@/components/clients";
import { TenantOnly } from "@/components/auth/tenant-only";
import type { TaskSummary, TaskListResponse, ClientUser } from "@/types";

interface ClientData {
  id: string;
  client_type: "individual" | "entity" | "trust";
  first_name?: string;
  last_name?: string;
  entity_name?: string;
  email?: string;
  phone?: string;
  kyc_status: string;
  risk_profile?: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  extra_data?: any;
}

interface Account {
  id: string;
  account_number: string;
  account_name: string;
  account_type: string;
  currency: string;
  total_value: number;
  cash_balance: number;
  is_active: boolean;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  // Dialog states for login access
  const [createCredentialsOpen, setCreateCredentialsOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Account management state
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [linkAccountOpen, setLinkAccountOpen] = useState(false);
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{
    id: string;
    account_number: string;
    account_name: string;
    account_type: string;
    currency: string;
    total_value: number;
    cash_balance: number;
  } | null>(null);

  const { data: client, isLoading, error } = useClient(clientId);
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useClientAccounts(clientId);
  const { data: tasksData, isLoading: tasksLoading } = useClientTasks(clientId);
  const { data: clientUserData, isLoading: clientUserLoading, error: clientUserError } = useClientUserByClient(clientId);

  // Mutations
  const createCredentialsMutation = useCreateClientUser();
  const resetPasswordMutation = useResetClientUserPassword();
  const updateClientUserMutation = useUpdateClientUser((clientUserData as ClientUser)?.id || "");
  const deleteCredentialsMutation = useDeleteClientUser();
  
  // Account management mutations
  const deleteAccountMutation = useDeleteAccount();
  const reactivateAccountMutation = useReactivateAccount();

  const clientData = client as ClientData | undefined;
  const accountsList = (accounts as Account[]) || [];
  const taskListResponse = tasksData as TaskListResponse | undefined;
  const tasksList = taskListResponse?.tasks || [];
  const pendingEamCount = taskListResponse?.pending_eam_count || 0;
  const clientUser = clientUserData as ClientUser | undefined;
  const hasCredentials = !clientUserError && !!clientUser;

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

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateCredentials = async () => {
    if (!email) return;
    try {
      const result = await createCredentialsMutation.mutateAsync({
        client_id: clientId,
        email,
        password: password || undefined,
      });
      if ((result as { temp_password?: string }).temp_password) {
        setTempPassword((result as { temp_password?: string }).temp_password || null);
      } else {
        setCreateCredentialsOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create credentials:", error);
    }
  };

  const handleResetPassword = async () => {
    if (!clientUser) return;
    try {
      const result = await resetPasswordMutation.mutateAsync({ id: clientUser.id });
      if ((result as { temp_password?: string }).temp_password) {
        setTempPassword((result as { temp_password?: string }).temp_password || null);
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
  };

  const handleToggleActive = async () => {
    if (!clientUser) return;
    try {
      await updateClientUserMutation.mutateAsync({ is_active: !clientUser.is_active });
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!clientUser) return;
    if (!confirm("Are you sure you want to delete this client's login credentials?")) return;
    try {
      await deleteCredentialsMutation.mutateAsync(clientUser.id);
    } catch (error) {
      console.error("Failed to delete credentials:", error);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setTempPassword(null);
  };

  const displayName = clientData
    ? clientData.client_type === "individual"
      ? `${clientData.first_name} ${clientData.last_name}`
      : clientData.entity_name || "Unknown"
    : "Loading...";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Failed to load client details. {error ? "Please try again." : "Client not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TenantOnly>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
            <p className="text-muted-foreground capitalize">
              {clientData.client_type} Client
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getKycBadgeVariant(clientData.kyc_status)}>
            KYC: {clientData.kyc_status.replace("_", " ")}
          </Badge>
          {clientData.risk_profile && (
            <Badge variant="outline" className="capitalize">
              {clientData.risk_profile} Risk
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <Briefcase className="mr-2 h-4 w-4" />
            Accounts ({accountsList.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="tasks" className="relative">
            <ClipboardList className="mr-2 h-4 w-4" />
            Tasks ({tasksList.length})
            {pendingEamCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {pendingEamCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="access">
            <KeyRound className="mr-2 h-4 w-4" />
            Login Access
            {hasCredentials && (
              <Badge variant={clientUser?.is_active ? "default" : "secondary"} className="ml-2 text-xs">
                {clientUser?.is_active ? "Active" : "Inactive"}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Basic details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Name/Entity */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {clientData.client_type === "individual" ? "Name" : "Entity Name"}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    {clientData.client_type === "individual" ? (
                      <User className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">{displayName}</span>
                  </div>
                </div>

                {/* Client Type */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="capitalize">
                      {clientData.client_type}
                    </Badge>
                  </div>
                </div>

                {/* Email */}
                {clientData.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${clientData.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {clientData.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {clientData.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${clientData.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {clientData.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* KYC Status */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">KYC Status</label>
                  <div className="mt-1">
                    <Badge variant={getKycBadgeVariant(clientData.kyc_status)}>
                      {clientData.kyc_status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Risk Profile */}
                {clientData.risk_profile && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Risk Profile
                    </label>
                    <div className="mt-1 capitalize text-sm">{clientData.risk_profile}</div>
                  </div>
                )}

                {/* Created At */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Client Since
                  </label>
                  <div className="mt-1 text-sm">
                    {new Date(clientData.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Last Updated */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <div className="mt-1 text-sm">
                    {new Date(clientData.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Extra Data */}
              {clientData.extra_data && Object.keys(clientData.extra_data).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Additional Information
                    </label>
                    <pre className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-auto">
                      {JSON.stringify(clientData.extra_data, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Investment Accounts</CardTitle>
                  <CardDescription>
                    All accounts associated with this client
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinkAccountOpen(true)}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Link Existing
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCreateAccountOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Account
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : accountsList.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No accounts found for this client.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a new account or link an existing one.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accountsList.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{account.account_name}</span>
                          <Badge variant="outline" className="capitalize">
                            {account.account_type.replace("_", " ")}
                          </Badge>
                          {!account.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {account.account_number}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(account.total_value, account.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Cash: {formatCurrency(account.cash_balance, account.currency)}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAccount(account);
                                setEditAccountOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {account.is_active ? (
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (confirm("Are you sure you want to unlink this account? It will be marked as inactive.")) {
                                    await deleteAccountMutation.mutateAsync({ id: account.id });
                                    refetchAccounts();
                                  }
                                }}
                                className="text-destructive"
                              >
                                <Unlink className="mr-2 h-4 w-4" />
                                Unlink Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={async () => {
                                  await reactivateAccountMutation.mutateAsync(account.id);
                                  refetchAccounts();
                                }}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reactivate
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
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                KYC documents, statements, and other client files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientDocuments clientId={clientId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    Active tasks, approvals, and workflow items for this client
                  </CardDescription>
                </div>
                <Link href={`/tasks?client_id=${clientId}`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View All in Tasks
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : tasksList.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No tasks found for this client.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasksList.slice(0, 10).map((task: TaskSummary) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {task.requires_eam_action && (
                            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          )}
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {task.task_type.replace("_", " ")} •{" "}
                              {task.workflow_state
                                ? task.workflow_state.replace("_", " ")
                                : task.status.replace("_", " ")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              task.status === "completed"
                                ? "default"
                                : task.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {task.status.replace("_", " ")}
                          </Badge>
                          {task.due_date && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {tasksList.length > 10 && (
                    <div className="text-center pt-2">
                      <Link
                        href={`/tasks?client_id=${clientId}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View all {tasksList.length} tasks →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Access Tab */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Login Credentials</CardTitle>
                  <CardDescription>
                    Manage this client&apos;s access to the mobile app
                  </CardDescription>
                </div>
                {!hasCredentials && (
                  <Button onClick={() => setCreateCredentialsOpen(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Create Credentials
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {clientUserLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : hasCredentials && clientUser ? (
                <div className="space-y-6">
                  {/* Credentials Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Login Email</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{clientUser.email}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge variant={clientUser.is_active ? "default" : "destructive"}>
                          {clientUser.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                      <div className="mt-1 text-sm">
                        {clientUser.last_login_at
                          ? new Date(clientUser.last_login_at).toLocaleString()
                          : "Never"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">MFA Status</label>
                      <div className="mt-1 flex items-center gap-2">
                        <ShieldCheck className={`h-4 w-4 ${clientUser.mfa_enabled ? "text-green-600" : "text-muted-foreground"}`} />
                        <span className="text-sm">
                          {clientUser.mfa_enabled ? "Enabled" : "Not Enabled"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <div className="mt-1 text-sm">
                        {new Date(clientUser.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setResetPasswordOpen(true)}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Reset Password
                    </Button>
                    <Button
                      variant={clientUser.is_active ? "outline" : "default"}
                      onClick={handleToggleActive}
                      disabled={updateClientUserMutation.isPending}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {clientUser.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteCredentials}
                      disabled={deleteCredentialsMutation.isPending}
                    >
                      Delete Credentials
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <KeyRound className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    This client doesn&apos;t have login credentials yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create credentials to allow them to access the mobile app.
                  </p>
                  <Button className="mt-4" onClick={() => setCreateCredentialsOpen(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Create Credentials
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Credentials Dialog */}
      <Dialog
        open={createCredentialsOpen}
        onOpenChange={(open) => {
          setCreateCredentialsOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Login Credentials</DialogTitle>
            <DialogDescription>
              Create login credentials for {displayName} to access the mobile app.
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Credentials created successfully!
                </p>
                <p className="text-sm text-green-700 mb-3">
                  Share the temporary password with the client. They should change it on first login.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm font-medium">{email}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm text-muted-foreground">Password:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-bold">{tempPassword}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(tempPassword)}
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setCreateCredentialsOpen(false);
                    resetForm();
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This will be the client&apos;s login username.
                </p>
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
                <Button variant="outline" onClick={() => setCreateCredentialsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCredentials}
                  disabled={!email || createCredentialsMutation.isPending}
                >
                  {createCredentialsMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Credentials
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordOpen}
        onOpenChange={(open) => {
          setResetPasswordOpen(open);
          if (!open) setTempPassword(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Generate a new temporary password for {displayName}.
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Password reset successfully!
                </p>
                <p className="text-sm text-green-700 mb-3">
                  Share the new temporary password with the client.
                </p>
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm text-muted-foreground">New Password:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold">{tempPassword}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(tempPassword)}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setResetPasswordOpen(false);
                    setTempPassword(null);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm text-orange-800">
                  This will generate a new temporary password. The client&apos;s current password will no longer work.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Reset Password
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Account Dialogs */}
      <AccountDialog
        open={createAccountOpen}
        onOpenChange={setCreateAccountOpen}
        clientId={clientId}
        mode="create"
        onSuccess={() => refetchAccounts()}
      />

      <AccountDialog
        open={editAccountOpen}
        onOpenChange={(open) => {
          setEditAccountOpen(open);
          if (!open) setSelectedAccount(null);
        }}
        clientId={clientId}
        mode="edit"
        account={selectedAccount || undefined}
        onSuccess={() => refetchAccounts()}
      />

      <LinkAccountDialog
        open={linkAccountOpen}
        onOpenChange={setLinkAccountOpen}
        clientId={clientId}
        onSuccess={() => refetchAccounts()}
      />
      </div>
    </TenantOnly>
  );
}

