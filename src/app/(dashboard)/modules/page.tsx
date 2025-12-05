import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const modules = [
  {
    code: "core",
    name: "Core Platform",
    description: "Multi-tenant setup, users, roles, permissions",
    isCore: true,
    isActive: true,
  },
  {
    code: "onboarding",
    name: "Client Onboarding & KYC",
    description: "Digital onboarding flows, KYC forms, risk profiling",
    isCore: false,
    isActive: true,
  },
  {
    code: "portfolio",
    name: "Portfolio Overview & Analytics",
    description: "Asset allocation, returns, performance charts",
    isCore: false,
    isActive: true,
  },
  {
    code: "reporting",
    name: "Reporting & Documents",
    description: "Statement generation, on-demand reports",
    isCore: false,
    isActive: false,
  },
  {
    code: "workflow",
    name: "Tasks & Workflow",
    description: "Approvals, onboarding steps, compliance reviews",
    isCore: false,
    isActive: false,
  },
  {
    code: "messaging",
    name: "Communications",
    description: "Secure messaging, notifications",
    isCore: false,
    isActive: false,
  },
];

export default function ModulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
        <p className="text-muted-foreground">
          Configure platform modules and feature flags
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <Card key={module.code}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {module.name}
                  {module.isCore && (
                    <Badge variant="secondary">Core</Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1.5">
                  {module.description}
                </CardDescription>
              </div>
              <Switch
                checked={module.isActive}
                disabled={module.isCore}
              />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

