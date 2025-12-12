"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Loader2, 
  Blocks, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Lock,
  Unlock,
  Send,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Shield,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAllModules, useMyTenantModules, useRequestModuleAccess } from "@/hooks/use-api";
import { ModuleDialog, DeleteModuleDialog } from "@/components/modules";
import { Module, TenantModuleStatus, ModuleCategory } from "@/types";

// Category display info
const categoryInfo: Record<ModuleCategory, { label: string; labelZh: string; icon: React.ComponentType<{ className?: string }> }> = {
  basic: { label: "Basic Modules", labelZh: "基础模组", icon: Shield },
  investment: { label: "Investment Products", labelZh: "投资产品模组", icon: TrendingUp },
  analytics: { label: "Analytics", labelZh: "分析模组", icon: BarChart3 },
};

export default function ModulesPage() {
  const { user } = useAuth();
  
  // Determine user's access level
  const isPlatformLevel = user?.roles?.some((role: string) =>
    ["super_admin", "platform_admin", "platform_user"].includes(role)
  );
  const isPlatformAdmin = user?.roles?.some((role: string) =>
    ["super_admin", "platform_admin"].includes(role)
  );
  const isTenantAdmin = user?.roles?.some((role: string) =>
    ["super_admin", "platform_admin", "tenant_admin"].includes(role)
  );

  // Fetch appropriate data based on role
  const { data: allModules, isLoading: isLoadingAll, error: errorAll } = useAllModules();
  const { data: tenantModules, isLoading: isLoadingTenant, error: errorTenant } = useMyTenantModules();
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  // Request access mutation
  const requestAccess = useRequestModuleAccess();
  const [requestingModule, setRequestingModule] = useState<string | null>(null);

  // Use platform catalogue for platform users, tenant modules for tenant users
  const isLoading = isPlatformLevel ? isLoadingAll : isLoadingTenant;
  const error = isPlatformLevel ? errorAll : errorTenant;
  const modules = isPlatformLevel 
    ? (allModules as Module[]) || []
    : (tenantModules as TenantModuleStatus[]) || [];

  // Group modules by category
  const groupedModules = modules.reduce((acc, module) => {
    const category = module.category || "basic";
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<ModuleCategory, (Module | TenantModuleStatus)[]>);

  const handleEdit = (module: Module) => {
    setSelectedModule(module);
    setEditDialogOpen(true);
  };

  const handleDelete = (module: Module) => {
    setSelectedModule(module);
    setDeleteDialogOpen(true);
  };

  const handleRequestAccess = async (moduleCode: string) => {
    setRequestingModule(moduleCode);
    try {
      await requestAccess.mutateAsync({ module_code: moduleCode });
      // Could show a toast here
    } catch (error) {
      console.error("Failed to request access:", error);
    } finally {
      setRequestingModule(null);
    }
  };

  // Render module card for platform catalogue view
  const renderPlatformModuleCard = (module: Module) => (
    <Card key={module.id} className="relative hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{module.name}</CardTitle>
              {module.is_core && (
                <Badge variant="secondary" className="text-xs font-medium">
                  <Lock className="mr-1 h-3 w-3" />
                  Core
                </Badge>
              )}
              {!module.is_active && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
            {module.name_zh && (
              <p className="text-sm text-muted-foreground font-medium">{module.name_zh}</p>
            )}
          </div>
          {isPlatformAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(module)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(module)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 min-h-[40px]">
          {module.description || "No description available"}
        </p>
        <div className="flex items-center gap-2 pt-2 border-t">
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {module.code}
          </code>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground font-medium">v{module.version}</span>
        </div>
      </CardContent>
    </Card>
  );

  // Render module card for tenant view
  const renderTenantModuleCard = (module: TenantModuleStatus) => {
    const isEnabled = module.is_enabled;
    const isCore = module.is_core;
    
    return (
      <Card 
        key={module.id} 
        className={`relative transition-all ${
          !isEnabled 
            ? "opacity-60 border-dashed" 
            : "hover:shadow-md"
        }`}
      >
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <CardTitle className="text-lg leading-tight">{module.name}</CardTitle>
                {module.name_zh && (
                  <p className="text-sm text-muted-foreground font-medium">{module.name_zh}</p>
                )}
              </div>
              {isCore ? (
                <Badge variant="default" className="shrink-0">
                  <Lock className="mr-1.5 h-3.5 w-3.5" />
                  Always On
                </Badge>
              ) : isEnabled ? (
                <Badge variant="default" className="shrink-0 bg-green-600 hover:bg-green-700">
                  <Unlock className="mr-1.5 h-3.5 w-3.5" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0 text-muted-foreground">
                  <Lock className="mr-1.5 h-3.5 w-3.5" />
                  Locked
                </Badge>
              )}
            </div>
            
            {/* Request Access Button - Full Width Below Header */}
            {!isCore && !isEnabled && isTenantAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleRequestAccess(module.code)}
                disabled={requestingModule === module.code}
              >
                {requestingModule === module.code ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Request Access from Platform Admin
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 min-h-[40px]">
              {module.description || "No description available"}
            </p>
            {module.description_zh && (
              <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-2 italic">
                {module.description_zh}
              </p>
            )}
          </div>
          
          {!isEnabled && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-dashed">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                This module is not available to your organization. Contact your platform administrator to request access.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
        <p className="text-muted-foreground">
            {isPlatformLevel
              ? "Manage platform modules and feature configurations"
              : "View your organization's available modules and features"
            }
          </p>
        </div>
        {isPlatformAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Failed to load modules. Make sure the backend is running.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Blocks className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              No modules found. {isPlatformAdmin && "Click \"Add Module\" to create your first module."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {(["basic", "investment", "analytics"] as ModuleCategory[]).map((category) => {
            const categoryModules = groupedModules[category];
            if (!categoryModules || categoryModules.length === 0) return null;
            
            const info = categoryInfo[category];
            const Icon = info.icon;
            
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{info.label}</h2>
                  <span className="text-sm text-muted-foreground">({info.labelZh})</span>
                  <Badge variant="outline" className="ml-2">
                    {categoryModules.length}
                  </Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryModules.map((module) =>
                    isPlatformLevel
                      ? renderPlatformModuleCard(module as Module)
                      : renderTenantModuleCard(module as TenantModuleStatus)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Module Dialog */}
      <ModuleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Module Dialog */}
      <ModuleDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedModule(null);
        }}
        module={selectedModule}
              />

      {/* Delete Module Dialog */}
      <DeleteModuleDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedModule(null);
        }}
        module={selectedModule}
      />
    </div>
  );
}
