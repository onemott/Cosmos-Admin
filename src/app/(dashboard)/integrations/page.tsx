"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const bankConnectors = [
  {
    code: "bank_a",
    name: "Private Bank A",
    status: "active",
    lastSync: "2024-01-15 10:30",
    accountsLinked: 45,
  },
  {
    code: "bank_b",
    name: "Private Bank B",
    status: "active",
    lastSync: "2024-01-15 09:15",
    accountsLinked: 32,
  },
  {
    code: "custodian_c",
    name: "Custodian C",
    status: "pending",
    lastSync: null,
    accountsLinked: 0,
  },
];

export default function IntegrationsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("integrations.title")}</h1>
          <p className="text-muted-foreground">
            {t("integrations.subtitle")}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("integrations.addIntegration")}
        </Button>
      </div>

      <div className="grid gap-4">
        {bankConnectors.map((connector) => (
          <Card key={connector.code}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {connector.name}
                  <Badge
                    variant={connector.status === "active" ? "default" : "secondary"}
                  >
                    {connector.status === "active" ? t("common.active") : t("common.inactive")}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {connector.accountsLinked} accounts linked
                  {connector.lastSync && ` • Last sync: ${connector.lastSync}`}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("common.refresh")}
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
