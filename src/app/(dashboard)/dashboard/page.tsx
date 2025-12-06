"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Wallet, UserCheck, Loader2 } from "lucide-react";
import { useDashboardStats, useSystemHealth } from "@/hooks/use-api";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: health, isLoading: healthLoading } = useSystemHealth();

  const statCards = [
  {
    title: "Total Tenants",
      value: stats?.total_tenants ?? 0,
      description: `${stats?.active_tenants ?? 0} active EAM firms`,
    icon: Building2,
  },
  {
    title: "Total Users",
      value: stats?.total_users ?? 0,
      description: `${stats?.active_users ?? 0} active users`,
    icon: Users,
  },
    {
      title: "Total Clients",
      value: stats?.total_clients ?? 0,
      description: "Across all tenants",
      icon: UserCheck,
    },
  {
    title: "Total AUM",
      value: stats?.formatted_aum ?? "$0",
    description: "Assets under management",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and key metrics
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
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
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
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

