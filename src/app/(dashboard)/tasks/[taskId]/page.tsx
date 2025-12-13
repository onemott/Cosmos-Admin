"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { useTask, useRespondToTask, useUpdateTask, useUsers } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Send,
  User,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
} from "lucide-react";
import type { Task, TaskStatus, TaskPriority, WorkflowState } from "@/types";

const TASK_TYPE_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  kyc_review: "KYC Review",
  document_review: "Document Review",
  proposal_approval: "Proposal Approval",
  product_request: "Product Request",
  compliance_check: "Compliance Check",
  risk_review: "Risk Review",
  account_opening: "Account Opening",
  general: "General",
};

const STATUS_VARIANTS: Record<TaskStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  in_progress: "secondary",
  completed: "default",
  cancelled: "destructive",
  on_hold: "outline",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const WORKFLOW_LABELS: Record<WorkflowState, string> = {
  draft: "Draft",
  pending_eam: "Needs Action",
  pending_client: "Awaiting Client",
  approved: "Client Approved",
  declined: "Client Declined",
  expired: "Expired",
};

const WORKFLOW_VARIANTS: Record<WorkflowState, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending_eam: "destructive",
  pending_client: "secondary",
  approved: "default",
  declined: "destructive",
  expired: "outline",
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  const { data: task, isLoading, refetch } = useTask(taskId);
  const respondMutation = useRespondToTask();
  const updateMutation = useUpdateTask();

  const [responseComment, setResponseComment] = useState("");
  const [showSendDialog, setShowSendDialog] = useState(false);

  const taskData = task as Task | undefined;

  const handleAction = async (action: string, comment?: string) => {
    try {
      await respondMutation.mutateAsync({
        id: taskId,
        action,
        comment,
      });
      setResponseComment("");
      setShowSendDialog(false);
      refetch();
    } catch (error) {
      console.error("Failed to respond to task:", error);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: taskId,
        data: { status: newStatus },
      });
      refetch();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!taskData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium">Task not found</h2>
        <p className="text-muted-foreground mt-2">
          The task you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/tasks" className="hover:text-foreground">
              Tasks
            </Link>
            <span>/</span>
            <span>{taskId.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{taskData.title}</h1>
            {taskData.requires_eam_action && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Action Required
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {taskData.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {taskData.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Task Type</h4>
                  <p className="text-sm">
                    {TASK_TYPE_LABELS[taskData.task_type] || taskData.task_type}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Priority</h4>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[taskData.priority]}`}
                    />
                    <span className="text-sm">
                      {PRIORITY_LABELS[taskData.priority]}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <Select
                    value={taskData.status}
                    onValueChange={(v) => handleStatusChange(v as TaskStatus)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Created</h4>
                  <p className="text-sm">
                    {format(new Date(taskData.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposal Data (if exists) */}
          {taskData.proposal_data && Object.keys(taskData.proposal_data).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Proposal / Request Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {taskData.task_type === "product_request" && taskData.proposal_data ? (
                  <ProductRequestDisplay proposalData={taskData.proposal_data} />
                ) : (
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-64">
                    {JSON.stringify(taskData.proposal_data, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}

          {/* Client Approval Info (if applicable) */}
          {taskData.approval_action && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Client Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {taskData.approval_action === "approved" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      Client{" "}
                      {taskData.approval_action === "approved"
                        ? "Approved"
                        : "Declined"}
                    </p>
                    {taskData.approval_acted_at && (
                      <p className="text-sm text-muted-foreground">
                        {format(
                          new Date(taskData.approval_acted_at),
                          "MMM d, yyyy HH:mm"
                        )}
                      </p>
                    )}
                  </div>
                </div>
                {taskData.approval_comment && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Client Comment</h4>
                    <p className="text-sm text-muted-foreground">
                      {taskData.approval_comment}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Show different actions based on workflow state */}
              {taskData.workflow_state === "pending_eam" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleAction("acknowledge")}
                    disabled={respondMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Acknowledge & Start Work
                  </Button>
                  <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Send Proposal to Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Proposal to Client</DialogTitle>
                        <DialogDescription>
                          This will send a proposal to the client for their approval.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea
                          placeholder="Add a message for the client (optional)"
                          value={responseComment}
                          onChange={(e) => setResponseComment(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowSendDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() =>
                            handleAction("send_to_client", responseComment)
                          }
                          disabled={respondMutation.isPending}
                        >
                          Send to Client
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {taskData.workflow_state === "declined" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAction("revise")}
                  disabled={respondMutation.isPending}
                >
                  Revise & Resend
                </Button>
              )}

              {taskData.status !== "completed" && taskData.status !== "cancelled" && (
                <>
                  <Separator />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAction("complete")}
                    disabled={respondMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleAction("cancel")}
                    disabled={respondMutation.isPending}
                  >
                    Cancel Task
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Workflow State */}
              {taskData.workflow_state && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Workflow State</h4>
                  <Badge variant={WORKFLOW_VARIANTS[taskData.workflow_state]}>
                    {WORKFLOW_LABELS[taskData.workflow_state]}
                  </Badge>
                </div>
              )}

              {/* Client */}
              {taskData.client && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Client</h4>
                  <Link
                    href={`/clients/${taskData.client_id}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <User className="h-4 w-4" />
                    {taskData.client.display_name}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Assigned To */}
              <div>
                <h4 className="text-sm font-medium mb-1">Assigned To</h4>
                <p className="text-sm">
                  {taskData.assigned_to?.display_name ||
                    taskData.assigned_to?.email ||
                    "Unassigned"}
                </p>
              </div>

              {/* Created By */}
              {taskData.created_by && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Created By</h4>
                  <p className="text-sm">
                    {taskData.created_by.display_name || taskData.created_by.email}
                  </p>
                </div>
              )}

              {/* Due Date */}
              {taskData.due_date && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Due Date</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(taskData.due_date), "MMM d, yyyy")}
                  </div>
                </div>
              )}

              {/* Approval Deadline */}
              {taskData.approval_required_by && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Approval Deadline</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(taskData.approval_required_by), "MMM d, yyyy")}
                  </div>
                </div>
              )}

              {/* Completed At */}
              {taskData.completed_at && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Completed At</h4>
                  <p className="text-sm">
                    {format(new Date(taskData.completed_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper component for product request display
interface ProductRequestProduct {
  product_id: string;
  product_name: string;
  module_name: string;
  min_investment: number;
  currency: string;
}

function ProductRequestDisplay({ proposalData }: { proposalData: Record<string, unknown> }) {
  const products = (proposalData.products || []) as ProductRequestProduct[];
  const totalMinInvestment = proposalData.total_min_investment as number | undefined;
  const clientNotes = proposalData.client_notes as string | undefined;

  if (products.length === 0) {
    return (
      <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-64">
        {JSON.stringify(proposalData, null, 2)}
      </pre>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Requested Products</h4>
        <div className="space-y-2">
          {products.map((product, index) => (
            <div
              key={product.product_id || index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div>
                <p className="font-medium">{product.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.module_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  Min: {product.currency} {product.min_investment?.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalMinInvestment !== undefined && (
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-medium">Total Minimum Investment</span>
          <span className="text-lg font-bold">
            USD {totalMinInvestment.toLocaleString()}
          </span>
        </div>
      )}

      {clientNotes && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-medium mb-1">Client Notes</h4>
          <p className="text-sm text-muted-foreground">{clientNotes}</p>
        </div>
      )}
    </div>
  );
}

