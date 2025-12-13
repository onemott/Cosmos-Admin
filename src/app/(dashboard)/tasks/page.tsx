"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  useTasks,
  useRespondToTask,
  useUsers,
  useAssignTask,
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  MoreHorizontal,
  RefreshCw,
  User,
  AlertTriangle,
} from "lucide-react";
import type {
  TaskSummary,
  TaskListResponse,
  TaskStatus,
  TaskType,
  WorkflowState,
  TaskPriority,
} from "@/types";

const TASK_TYPE_LABELS: Record<TaskType, string> = {
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
  approved: "Approved",
  declined: "Declined",
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

export default function TasksPage() {
  const [filters, setFilters] = useState<{
    status?: string;
    task_type?: string;
    workflow_state?: string;
    assigned_to_me?: boolean;
    pending_eam_only?: boolean;
  }>({});
  const [activeTab, setActiveTab] = useState<string>("all");

  // Build query params based on filters and tab
  const queryParams = {
    ...filters,
    pending_eam_only: activeTab === "action-needed" ? true : undefined,
  };

  const { data, isLoading, refetch } = useTasks(queryParams);
  const respondMutation = useRespondToTask();

  const taskData = data as TaskListResponse | undefined;
  const tasks = taskData?.tasks || [];
  const pendingCount = taskData?.pending_eam_count || 0;

  const handleQuickAction = async (taskId: string, action: string) => {
    try {
      await respondMutation.mutateAsync({ id: taskId, action });
    } catch (error) {
      console.error("Failed to respond to task:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            Manage client tasks and workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Action Needed Banner */}
      {pendingCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">
                {pendingCount} task{pendingCount !== 1 ? "s" : ""} require your
                attention
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setActiveTab("action-needed")}
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="action-needed" className="relative">
            Action Needed
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <Select
              value={filters.status || "all"}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, status: v === "all" ? undefined : v }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.task_type || "all"}
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  task_type: v === "all" ? undefined : v,
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Task Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.workflow_state || "all"}
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  workflow_state: v === "all" ? undefined : v,
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Workflow State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {Object.entries(WORKFLOW_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({})}
              className="text-muted-foreground"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "action-needed" ? "Tasks Requiring Action" : "All Tasks"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="min-w-[200px]">Task</TableHead>
                  <TableHead className="min-w-[150px]">Client</TableHead>
                  <TableHead className="min-w-[140px]">Type</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[140px]">Workflow</TableHead>
                  <TableHead className="min-w-[120px]">Assigned To</TableHead>
                  <TableHead className="min-w-[120px]">Due Date</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    {/* Priority Indicator */}
                    <TableCell>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          PRIORITY_COLORS[task.priority]
                        }`}
                        title={`Priority: ${task.priority}`}
                      />
                    </TableCell>

                    {/* Task Title */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-medium hover:underline"
                        >
                          {task.title}
                        </Link>
                        {task.requires_eam_action && (
                          <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                    </TableCell>

                    {/* Client */}
                    <TableCell>
                      {task.client_id ? (
                        <Link
                          href={`/clients/${task.client_id}`}
                          className="text-sm text-muted-foreground hover:text-foreground hover:underline whitespace-nowrap"
                        >
                          {task.client_name || "Unknown Client"}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Task Type */}
                    <TableCell>
                      <span className="text-sm whitespace-nowrap">
                        {TASK_TYPE_LABELS[task.task_type] || task.task_type}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[task.status]} className="whitespace-nowrap">
                        {task.status.replace("_", " ")}
                      </Badge>
                    </TableCell>

                    {/* Workflow State */}
                    <TableCell>
                      {task.workflow_state ? (
                        <Badge variant={WORKFLOW_VARIANTS[task.workflow_state]} className="whitespace-nowrap">
                          {WORKFLOW_LABELS[task.workflow_state]}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Assigned To */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {task.assigned_to_name || "Unassigned"}
                      </span>
                    </TableCell>

                    {/* Due Date */}
                    <TableCell>
                      {task.due_date ? (
                        <span className="text-sm whitespace-nowrap">
                          {format(new Date(task.due_date), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/tasks/${task.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {task.workflow_state === "pending_eam" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleQuickAction(task.id, "acknowledge")
                              }
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Acknowledge
                            </DropdownMenuItem>
                          )}
                          {task.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleQuickAction(task.id, "complete")
                              }
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          {task.status !== "cancelled" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleQuickAction(task.id, "cancel")
                              }
                              className="text-red-600"
                            >
                              Cancel Task
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

