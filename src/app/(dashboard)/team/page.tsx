"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  UserCircle, 
  DollarSign, 
  TrendingUp,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { PLATFORM_TENANT_ID, useAuth, useIsSupervisor, useIsTenantAdmin } from "@/contexts/auth-context";
import { useTranslation } from "@/lib/i18n";
import { TenantOnly } from "@/components/auth/tenant-only";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SubordinateBreakdown {
  user_id: string;
  name: string;
  email: string;
  department: string | null;
  clients_count: number;
  total_aum: number;
  formatted_aum: string;
}

interface TeamSummary {
  direct_subordinates: number;
  total_team_size: number;
  own_clients_count: number;
  own_aum: number;
  team_clients_count: number;
  team_total_aum: number;
  formatted_team_aum: string;
  subordinate_breakdown: SubordinateBreakdown[];
}

interface TreeNode {
  id: string;
  name: string;
  email: string;
  department: string | null;
  roles: string[];
  subordinates: TreeNode[];
}

export default function TeamPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isSupervisor = useIsSupervisor();
  const isTenantAdmin = useIsTenantAdmin();
  const hasTenantAccess = !!user?.tenantId && user.tenantId !== PLATFORM_TENANT_ID;
  const canViewTeam = !!user && (isSupervisor || isTenantAdmin) && hasTenantAccess;
  
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);
  const [teamTree, setTeamTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      if (!canViewTeam) {
        setTeamSummary(null);
        setTeamTree(null);
        setError(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const summaryRes = (await api.stats.teamSummary()) as TeamSummary;
        setTeamSummary(summaryRes);
        
        const treeRes = (await api.users.getTeamTree(user.id)) as TreeNode;
        setTeamTree(treeRes);
      } catch (err: any) {
        const message = err instanceof Error ? err.message : "Failed to load team data";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [user, canViewTeam]);

  if (user && !canViewTeam) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              You don&apos;t have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TenantOnly>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">团队管理</h1>
        <p className="text-muted-foreground">
          查看和管理您的团队成员及业绩
        </p>
      </div>

      {/* Summary Cards */}
      {teamSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">直接下属</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamSummary.direct_subordinates}</div>
              <p className="text-xs text-muted-foreground">
                团队总人数: {teamSummary.total_team_size}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">我的客户</CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamSummary.own_clients_count}</div>
              <p className="text-xs text-muted-foreground">
                个人负责的客户
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">团队客户</CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamSummary.team_clients_count}</div>
              <p className="text-xs text-muted-foreground">
                团队管理的所有客户
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">团队 AUM</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamSummary.formatted_team_aum}</div>
              <p className="text-xs text-muted-foreground">
                资产管理总额
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Tree */}
        {teamTree && (
          <Card>
            <CardHeader>
              <CardTitle>组织架构</CardTitle>
              <CardDescription>团队层级结构</CardDescription>
            </CardHeader>
            <CardContent>
              <TreeView node={teamTree} />
            </CardContent>
          </Card>
        )}

        {/* Subordinate Performance */}
        {teamSummary && teamSummary.subordinate_breakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>下属业绩</CardTitle>
              <CardDescription>直接下属的客户和 AUM 情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamSummary.subordinate_breakdown.map((sub) => (
                  <div
                    key={sub.user_id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {sub.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{sub.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sub.department || sub.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{sub.formatted_aum}</p>
                      <p className="text-sm text-muted-foreground">
                        {sub.clients_count} 个客户
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function TreeView({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.subordinates && node.subordinates.length > 0;

  return (
    <div className={cn("pl-4", level === 0 && "pl-0")}>
      <div
        className={cn(
          "flex items-center gap-2 py-2 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2",
          !hasChildren && "cursor-default"
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          <div className="w-4" />
        )}
        
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
          {node.name.charAt(0)}
        </div>
        
        <div className="flex-1">
          <p className="font-medium text-sm">{node.name}</p>
          <p className="text-xs text-muted-foreground">{node.email}</p>
        </div>
        
        {node.roles.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {node.roles[0]}
          </Badge>
        )}
      </div>
      
      {expanded && hasChildren && (
        <div className="border-l ml-4 mt-1">
          {node.subordinates.map((child) => (
            <TreeView key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
