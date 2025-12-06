"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Users } from "lucide-react";
import { useUsers } from "@/hooks/use-api";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const { data: users, isLoading, error } = useUsers();

  const userList = (users as User[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Failed to load users. Make sure the backend is running.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {userList.length} user{userList.length !== 1 ? 's' : ''} across all tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userList.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No users found. Users will appear here once created.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userList.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {user.first_name} {user.last_name}
                      </span>
                      {user.is_superuser && (
                        <Badge variant="destructive">Super Admin</Badge>
                      )}
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
          <div className="text-sm text-muted-foreground">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
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

