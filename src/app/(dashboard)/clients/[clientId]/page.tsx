"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Briefcase,
  User,
  Building2,
  DollarSign,
  Upload,
  ClipboardList,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useClient, useClientAccounts, useClientDocuments, useClientTasks } from "@/hooks/use-api";
import type { TaskSummary, TaskListResponse } from "@/types";

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

interface Document {
  id: string;
  name: string;
  document_type: string;
  file_path: string;
  created_at: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const { data: client, isLoading, error } = useClient(clientId);
  const { data: accounts, isLoading: accountsLoading } = useClientAccounts(clientId);
  const { data: documents, isLoading: documentsLoading } = useClientDocuments(clientId);
  const { data: tasksData, isLoading: tasksLoading } = useClientTasks(clientId);

  const clientData = client as ClientData | undefined;
  const accountsList = (accounts as Account[]) || [];
  const documentsList = (documents as Document[]) || [];
  const taskListResponse = tasksData as TaskListResponse | undefined;
  const tasksList = taskListResponse?.tasks || [];
  const pendingEamCount = taskListResponse?.pending_eam_count || 0;

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
    <div className="space-y-6">
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
            Documents ({documentsList.length})
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
              <CardTitle>Investment Accounts</CardTitle>
              <CardDescription>
                All accounts associated with this client
              </CardDescription>
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
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(account.total_value, account.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Cash: {formatCurrency(account.cash_balance, account.currency)}
                        </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    KYC documents, statements, and other files
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : documentsList.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No documents uploaded yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Document upload will be available soon.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documentsList.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{doc.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {doc.document_type.replace("_", " ")}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
      </Tabs>
    </div>
  );
}

