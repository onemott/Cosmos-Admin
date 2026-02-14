"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Wallet, UserCheck, Loader2, Shield } from "lucide-react";
import { useDashboardStats, useSystemHealth } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";

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

import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { useState } from "react";

export default function DashboardPage() {
  const [helloMessage, setHelloMessage] = useState("");

  const handleHello = async () => {
    try {
      const res = await apiClient.get<{ message: string }>("/hello");
      setHelloMessage(res.message);
    } catch (error) {
      console.error(error);
      setHelloMessage("Error fetching hello");
    }
  };

  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const { t } = useTranslation();

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
      title: t("dashboard.totalTenants"),
      value: platformStats.total_tenants,
      description: t("dashboard.activeTenants", { count: platformStats.active_tenants }),
    icon: Building2,
  },
  {
      title: t("dashboard.platformUsers"),
      value: platformStats.total_users,
      description: t("dashboard.activeAcrossPlatform", { count: platformStats.active_users }),
      icon: Users,
    },
  ] : [];

  // Tenant-level cards (CRM data - your company's clients)
  const tenantCards = [
    {
      title: t("dashboard.myTeam"),
      value: tenantStats.total_users,
      description: t("dashboard.activeUsersInTenant", { count: tenantStats.active_users }),
    icon: Users,
  },
  {
      title: t("dashboard.myClients"),
      value: tenantStats.total_clients,
      description: t("dashboard.clientsInOrg"),
      icon: UserCheck,
    },
    {
      title: t("dashboard.totalAUM"),
      value: tenantStats.formatted_aum,
      description: t("dashboard.assetsUnderManagement"),
    icon: Wallet,
  },
  ];

  const getHealthStatus = (status: string | undefined) => {
    if (!status) return { color: "text-gray-400", label: t("dashboard.unknown") };
    switch (status.toLowerCase()) {
      case "healthy":
        return { color: "text-green-600", label: `● ${t("dashboard.healthy")}` };
      case "unhealthy":
        return { color: "text-red-600", label: `● ${t("dashboard.unhealthy")}` };
      default:
        return { color: "text-yellow-600", label: `● ${t("dashboard.unknown")}` };
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin ? t("dashboard.subtitle") : t("dashboard.subtitleNonAdmin")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {helloMessage && <span className="text-green-600 font-medium">{helloMessage}</span>}
          <Button onClick={handleHello} variant="outline">
            Test Hello API
          </Button>
        </div>
      </div>

      {statsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              {t("dashboard.failedToLoad")}
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
              {t("dashboard.platformOverview")}
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
            {isSuperAdmin ? t("dashboard.yourOrganizationCRM") : t("dashboard.yourOrganization")}
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
            <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
            <CardDescription>{t("dashboard.latestEvents")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("dashboard.noRecentActivity")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.systemStatus")}</CardTitle>
            <CardDescription>{t("dashboard.serviceHealth")}</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <span className="text-sm">{t("dashboard.apiServer")}</span>
                  <span className={`text-sm ${getHealthStatus(health?.api_server).color}`}>
                    {getHealthStatus(health?.api_server).label}
                  </span>
              </div>
              <div className="flex items-center justify-between">
                  <span className="text-sm">{t("dashboard.database")}</span>
                  <span className={`text-sm ${getHealthStatus(health?.database).color}`}>
                    {getHealthStatus(health?.database).label}
                  </span>
              </div>
              <div className="flex items-center justify-between">
                  <span className="text-sm">{t("dashboard.backgroundJobs")}</span>
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
