"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  MoreHorizontal,
  Copy,
  Check,
  XCircle,
  Mail,
  Clock,
  User,
  Search,
  Ticket,
  Send,
} from "lucide-react";
import { useInvitations, useCreateInvitation, useCancelInvitation, useClients } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";
import type { Invitation, InvitationListResponse, Client } from "@/types";

interface ClientListResponse {
  clients: Client[];
  total: number;
}

export default function InvitationsPage() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: invitationsData, isLoading } = useInvitations({
    search: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: clientsData } = useClients({ limit: 100 });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Create form state
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formExpiresDays, setFormExpiresDays] = useState("7");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  // Mutations
  const createMutation = useCreateInvitation();
  const cancelMutation = useCancelInvitation();

  const isAdmin = currentUser?.roles.some((role) =>
    ["super_admin", "platform_admin", "tenant_admin"].includes(role)
  );

  const invitations = (invitationsData as InvitationListResponse)?.invitations || [];
  const clients = (clientsData as ClientListResponse)?.clients || [];

  // Get clients that don't have invitations
  const invitedClientIds = new Set(
    invitations.filter((i) => i.client_id && i.status === "pending").map((i) => i.client_id)
  );

  const getClientName = (client: Client) => {
    if (client.client_type === "individual") {
      return `${client.first_name} ${client.last_name}`;
    }
    return client.entity_name || "Unknown";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "used":
        return "default";
      case "expired":
        return "destructive";
      case "cancelled":
        return "outline";
      default:
        return "secondary";
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async () => {
    try {
      const result = await createMutation.mutateAsync({
        email: formEmail || undefined,
        invitee_name: formName || undefined,
        message: formMessage || undefined,
        client_id: formClientId || undefined,
        expires_in_days: parseInt(formExpiresDays),
      });
      setCreatedCode((result as Invitation).code);
    } catch (error) {
      console.error("Failed to create invitation:", error);
    }
  };

  const handleCancel = async () => {
    if (!selectedInvitation) return;
    try {
      await cancelMutation.mutateAsync(selectedInvitation.id);
      setCancelDialogOpen(false);
      setSelectedInvitation(null);
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
    }
  };

  const resetCreateForm = () => {
    setFormEmail("");
    setFormName("");
    setFormMessage("");
    setFormClientId("");
    setFormExpiresDays("7");
    setCreatedCode(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats
  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const usedCount = invitations.filter((i) => i.status === "used").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invitations</h1>
          <p className="text-muted-foreground">
            Invite clients to register for the mobile app
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invitation
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{usedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Client Invitations</CardTitle>
          <CardDescription>
            {invitations.length} invitation{invitations.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No invitations found. Click &quot;Create Invitation&quot; to invite a client.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                          {invitation.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(invitation.code)}
                        >
                          {copied === invitation.code ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Badge variant={getStatusBadgeVariant(invitation.status)}>
                          {invitation.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {invitation.invitee_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {invitation.invitee_name}
                          </span>
                        )}
                        {invitation.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {invitation.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires: {formatDate(invitation.expires_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground text-right">
                      <div>Created</div>
                      <div>{formatDate(invitation.created_at)}</div>
                    </div>

                    {invitation.status === "pending" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyToClipboard(invitation.code)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Code
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedInvitation(invitation);
                              setCancelDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Invitation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {invitation.status === "used" && (
                      <div className="text-xs text-green-600">
                        Used on {formatDateTime(invitation.used_at!)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invitation Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invitation</DialogTitle>
            <DialogDescription>
              Generate an invitation code for a client to self-register.
            </DialogDescription>
          </DialogHeader>

          {createdCode ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Invitation created successfully!
                </p>
                <p className="text-sm text-green-700 mb-3">
                  Share this code with the client. They can use it to register on the mobile app.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-white px-4 py-3 text-lg font-mono font-bold text-center border tracking-widest">
                    {createdCode}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdCode)}
                  >
                    {copied === createdCode ? (
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
                <label className="text-sm font-medium">
                  Invitee Name <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  placeholder="John Smith"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Email <span className="text-muted-foreground">(optional, pre-fills form)</span>
                </label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Welcome Message <span className="text-muted-foreground">(optional)</span>
                </label>
                <Textarea
                  placeholder="Welcome! Use this code to register..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Link to Existing Client <span className="text-muted-foreground">(optional)</span>
                </label>
                <Select value={formClientId || "none"} onValueChange={(val) => setFormClientId(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client (create new)</SelectItem>
                    {clients
                      .filter((c) => !invitedClientIds.has(c.id))
                      .map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {getClientName(client)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link to an existing client record or leave empty to create a new client on registration.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expires In</label>
                <Select value={formExpiresDays} onValueChange={setFormExpiresDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Send className="mr-2 h-4 w-4" />
                  Create Invitation
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) setSelectedInvitation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this invitation?
            </DialogDescription>
          </DialogHeader>

          {selectedInvitation && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                  {selectedInvitation.code}
                </code>
              </div>
              {selectedInvitation.invitee_name && (
                <p className="text-sm text-muted-foreground">
                  For: {selectedInvitation.invitee_name}
                </p>
              )}
              {selectedInvitation.email && (
                <p className="text-sm text-muted-foreground">
                  Email: {selectedInvitation.email}
                </p>
              )}
            </div>
          )}

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm text-orange-800">
              The client will no longer be able to use this code to register.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Invitation
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

