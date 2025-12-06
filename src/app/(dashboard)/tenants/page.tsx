"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Building2 } from "lucide-react";
import { useTenants } from "@/hooks/use-api";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export default function TenantsPage() {
  const { data: tenants, isLoading, error } = useTenants();

  const tenantList = (tenants as Tenant[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage EAM firms and their configurations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Failed to load tenants. Make sure the backend is running.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>
            {tenantList.length} registered EAM firm{tenantList.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tenantList.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No tenants registered yet. Click "Add Tenant" to create your first EAM firm.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tenantList.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tenant.name}</span>
                      <Badge variant={tenant.is_active ? "default" : "secondary"}>
                        {tenant.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Slug: {tenant.slug}
                      {tenant.contact_email && ` • ${tenant.contact_email}`}
                    </div>
                  </div>
          <div className="text-sm text-muted-foreground">
                    Created: {new Date(tenant.created_at).toLocaleDateString()}
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

