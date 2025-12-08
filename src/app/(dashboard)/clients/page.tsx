"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Loader2, UserCheck, Plus, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { useClients, useClient } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";
import { ClientDialog, DeleteClientDialog } from "@/components/clients";

interface ClientSummary {
  id: string;
  display_name: string;
  client_type: "individual" | "entity" | "trust";
  kyc_status: "pending" | "in_progress" | "approved" | "rejected" | "expired";
  total_aum?: number;
}

interface ClientFull {
  id: string;
  client_type: "individual" | "entity" | "trust";
  first_name?: string;
  last_name?: string;
  entity_name?: string;
  email?: string;
  phone?: string;
  kyc_status: string;
  risk_profile?: string;
  extra_data?: any;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { data: clients, isLoading, error } = useClients({ search: search || undefined });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientForDelete, setSelectedClientForDelete] = useState<ClientSummary | null>(null);

  // Fetch full client details when editing
  const { data: fullClientData } = useClient(selectedClientId || "", {
    enabled: !!selectedClientId && editDialogOpen,
  });

  const clientList = (clients as ClientSummary[]) || [];

  // Check if user can manage clients (tenant_admin or platform roles)
  const canManage = user?.roles?.some((role: string) =>
    ["super_admin", "platform_admin", "tenant_admin"].includes(role)
  );

  const handleEdit = (client: ClientSummary) => {
    setSelectedClientId(client.id);
    setEditDialogOpen(true);
  };

  const handleDelete = (client: ClientSummary) => {
    setSelectedClientForDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setSelectedClientId(null);
  };

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

  const formatAum = (aum?: number) => {
    if (!aum) return "—";
    if (aum >= 1_000_000) return `$${(aum / 1_000_000).toFixed(1)}M`;
    if (aum >= 1_000) return `$${(aum / 1_000).toFixed(1)}K`;
    return `$${aum.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            View and manage your organization's client profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Failed to load clients. Make sure the backend is running.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Clients</CardTitle>
          <CardDescription>
            {clientList.length} client{clientList.length !== 1 ? 's' : ''} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : clientList.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {search
                  ? "No clients match your search."
                  : "No clients found. Add clients to start managing your CRM."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientList.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{client.display_name}</span>
                      <Badge variant="outline" className="capitalize">
                        {client.client_type.replace("_", " ")}
                      </Badge>
                      <Badge variant={getKycBadgeVariant(client.kyc_status)}>
                        KYC: {client.kyc_status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{formatAum(client.total_aum)}</div>
                      <div className="text-xs text-muted-foreground">Total AUM</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(client.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {canManage && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(client)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(client)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
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

      {/* Create Client Dialog */}
      <ClientDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Client Dialog */}
      <ClientDialog
        open={editDialogOpen}
        onOpenChange={handleCloseEdit}
        client={fullClientData as ClientFull}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedClientForDelete(null);
        }}
        client={selectedClientForDelete}
      />
    </div>
  );
}

