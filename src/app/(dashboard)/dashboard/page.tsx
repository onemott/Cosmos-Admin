"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Wallet, UserCheck, Loader2, Shield } from "lucide-react";
import { useDashboardStats, useSystemHealth } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";

// Types for the new stats format
interface PlatformStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  active_users: number;
}

interface TenantStats {
  total_users: number;
  active_users: number;
  total_clients: number;
  total_aum: number;
  formatted_aum: string;
}

interface CombinedStats {
  platform?: PlatformStats;
  my_tenant?: TenantStats;
  // For non-super admin, these are at root level
  total_users?: number;
  active_users?: number;
  total_clients?: number;
  total_aum?: number;
  formatted_aum?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: health, isLoading: healthLoading } = useSystemHealth();

  const isSuperAdmin = user?.roles.includes("super_admin") ?? false;
  
  // Parse stats based on user role
  const typedStats = stats as CombinedStats | undefined;
  const platformStats = typedStats?.platform;
  const tenantStats = typedStats?.my_tenant ?? {
    total_users: typedStats?.total_users ?? 0,
    active_users: typedStats?.active_users ?? 0,
    total_clients: typedStats?.total_clients ?? 0,
    total_aum: typedStats?.total_aum ?? 0,
    formatted_aum: typedStats?.formatted_aum ?? "$0",
  };

  // Platform-level cards (super admin only)
  const platformCards = isSuperAdmin && platformStats ? [
  {
    title: "Total Tenants",
      value: platformStats.total_tenants,
      description: `${platformStats.active_tenants} active EAM firms`,
    icon: Building2,
  },
  {
      title: "Platform Users",
      value: platformStats.total_users,
      description: `${platformStats.active_users} active across platform`,
      icon: Users,
    },
  ] : [];

  // Tenant-level cards (CRM data - your company's clients)
  const tenantCards = [
    {
      title: "My Team",
      value: tenantStats.total_users,
      description: `${tenantStats.active_users} active users in your tenant`,
    icon: Users,
  },
  {
      title: "My Clients",
      value: tenantStats.total_clients,
      description: "Clients in your organization",
      icon: UserCheck,
    },
    {
    title: "Total AUM",
      value: tenantStats.formatted_aum,
      description: "Your assets under management",
    icon: Wallet,
  },
  ];

  const getHealthStatus = (status: string | undefined) => {
    if (!status) return { color: "text-gray-400", label: "Unknown" };
    switch (status.toLowerCase()) {
      case "healthy":
        return { color: "text-green-600", label: "● Healthy" };
      case "unhealthy":
        return { color: "text-red-600", label: "● Unhealthy" };
      default:
        return { color: "text-yellow-600", label: "● Unknown" };
    }
  };

  const StatCard = ({ stat }: { stat: { title: string; value: string | number; description: string; icon: React.ComponentType<{ className?: string }> } }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
        <stat.icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {isSuperAdmin ? "Platform administration and your CRM overview" : "Your organization's overview"}
        </p>
      </div>

      {statsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Failed to load dashboard stats. Make sure the backend is running at http://localhost:8000
            </p>
            </CardContent>
          </Card>
      )}

      {/* Platform Stats - Super Admin Only */}
      {isSuperAdmin && platformCards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Platform Overview
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {platformCards.map((stat) => (
              <StatCard key={stat.title} stat={stat} />
            ))}
          </div>
        </div>
      )}

      {/* Tenant Stats - Your CRM Data */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {isSuperAdmin ? "Your Organization (CRM)" : "Your Organization"}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {tenantCards.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Service health overview</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Server</span>
                  <span className={`text-sm ${getHealthStatus(health?.api_server).color}`}>
                    {getHealthStatus(health?.api_server).label}
                  </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                  <span className={`text-sm ${getHealthStatus(health?.database).color}`}>
                    {getHealthStatus(health?.database).label}
                  </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Background Jobs</span>
                  <span className={`text-sm ${getHealthStatus(health?.background_jobs).color}`}>
                    {getHealthStatus(health?.background_jobs).label}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

