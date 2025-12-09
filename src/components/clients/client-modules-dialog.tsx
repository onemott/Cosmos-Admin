"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Shield, TrendingUp, BarChart3, Lock, AlertCircle } from "lucide-react";
import { useClientModules, useEnableClientModule, useDisableClientModule } from "@/hooks/use-api";
import { ClientModuleStatus, ModuleCategory } from "@/types";

interface ClientModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: { id: string; display_name: string } | null;
  canManage?: boolean;
}

// Category display info
const categoryInfo: Record<ModuleCategory, { label: string; labelZh: string; icon: React.ComponentType<{ className?: string }> }> = {
  basic: { label: "Basic Modules", labelZh: "基础模组", icon: Shield },
  investment: { label: "Investment Products", labelZh: "投资产品模组", icon: TrendingUp },
  analytics: { label: "Analytics", labelZh: "分析模组", icon: BarChart3 },
};

export function ClientModulesDialog({ 
  open, 
  onOpenChange, 
  client,
  canManage = true,
}: ClientModulesDialogProps) {
  const { data: modules, isLoading } = useClientModules(client?.id ?? "", { 
    enabled: !!client?.id && open 
  });
  
  const enableModule = useEnableClientModule();
  const disableModule = useDisableClientModule();
  
  const [togglingModule, setTogglingModule] = useState<string | null>(null);

  const handleToggle = async (module: ClientModuleStatus, enabled: boolean) => {
    if (!client) return;
    
    setTogglingModule(module.id);
    try {
      if (enabled) {
        await enableModule.mutateAsync({ clientId: client.id, moduleId: module.id });
      } else {
        await disableModule.mutateAsync({ clientId: client.id, moduleId: module.id });
      }
    } catch (error) {
      console.error("Failed to toggle module:", error);
    } finally {
      setTogglingModule(null);
    }
  };

  const moduleList = (modules as ClientModuleStatus[]) || [];
  
  // Group modules by category
  const groupedModules = moduleList.reduce((acc, module) => {
    const category = module.category || "basic";
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<ModuleCategory, ClientModuleStatus[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Client Modules</DialogTitle>
          <DialogDescription>
            Configure module access for <strong>{client?.display_name}</strong>. 
            Only modules enabled for your tenant can be enabled for clients.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : moduleList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No modules available.
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {(["basic", "investment", "analytics"] as ModuleCategory[]).map((category, idx) => {
              const categoryModules = groupedModules[category];
              if (!categoryModules || categoryModules.length === 0) return null;
              
              const info = categoryInfo[category];
              const Icon = info.icon;
              
              return (
                <div key={category}>
                  {idx > 0 && <Separator className="mb-6" />}
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">{info.label}</h3>
                    <span className="text-xs text-muted-foreground">({info.labelZh})</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {categoryModules.map((module) => {
                      const isTenantDisabled = !module.is_tenant_enabled;
                      const isCore = module.is_core;
                      
                      return (
                        <div
                          key={module.id}
                          className={`flex items-start gap-3 p-4 rounded-lg border bg-card transition-colors ${
                            isTenantDisabled 
                              ? "opacity-50 border-dashed" 
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{module.name}</span>
                              {isCore && (
                                <Badge variant="default" className="text-xs">
                                  <Lock className="mr-1 h-3 w-3" />
                                  Always On
                                </Badge>
                              )}
                              {isTenantDisabled && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Not Available
                                </Badge>
                              )}
                            </div>
                            {module.name_zh && (
                              <p className="text-xs text-muted-foreground font-medium">
                                {module.name_zh}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
                              {module.description}
                            </p>
                            {isTenantDisabled && (
                              <p className="text-xs text-orange-600/80 mt-2 italic">
                                Contact your tenant admin to enable this module first
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center shrink-0 pt-1">
                            {togglingModule === module.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : isCore ? (
                              <div className="flex items-center gap-2">
                                <Switch checked disabled />
                                <span className="text-xs text-muted-foreground">Required</span>
                              </div>
                            ) : isTenantDisabled ? (
                              <Switch checked={false} disabled />
                            ) : (
                              <Switch
                                checked={module.is_client_enabled}
                                onCheckedChange={(checked) => handleToggle(module, checked)}
                                disabled={!canManage}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

