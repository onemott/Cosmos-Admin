"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, UserCheck } from "lucide-react";
import { useClients } from "@/hooks/use-api";

interface Client {
  id: string;
  display_name: string;
  client_type: "individual" | "entity" | "trust";
  kyc_status: "pending" | "in_progress" | "approved" | "rejected" | "expired";
  total_aum?: number;
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const { data: clients, isLoading, error } = useClients({ search: search || undefined });

  const clientList = (clients as Client[]) || [];

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
            View and manage client profiles across tenants
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          <CardTitle>Client Directory</CardTitle>
          <CardDescription>
            {clientList.length} client{clientList.length !== 1 ? 's' : ''} across the platform
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
                  : "No clients found. Clients will appear here once onboarded by EAM firms."}
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
                  <div className="text-right">
                    <div className="font-medium">{formatAum(client.total_aum)}</div>
                    <div className="text-xs text-muted-foreground">Total AUM</div>
                  </div>
                </div>
              ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

