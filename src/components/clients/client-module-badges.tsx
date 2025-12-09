"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useClientModules } from "@/hooks/use-api";
import { ClientModuleStatus } from "@/types";

interface ClientModuleBadgesProps {
  clientId: string;
  maxVisible?: number;
}

export function ClientModuleBadges({ clientId, maxVisible = 3 }: ClientModuleBadgesProps) {
  const { data: modules, isLoading } = useClientModules(clientId);

  if (isLoading) {
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  }

  const moduleList = (modules as ClientModuleStatus[]) || [];
  
  // Only show enabled non-core modules as badges
  const enabledModules = moduleList.filter(m => m.is_client_enabled && !m.is_core);
  const visibleModules = enabledModules.slice(0, maxVisible);
  const remainingCount = enabledModules.length - visibleModules.length;

  if (enabledModules.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Core modules only
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleModules.map((module) => (
        <Badge 
          key={module.id} 
          variant="outline" 
          className="text-xs px-1.5 py-0"
        >
          {module.name_zh || module.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

