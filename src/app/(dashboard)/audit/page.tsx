"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function AuditPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("audit.title")}</h1>
          <p className="text-muted-foreground">
            {t("audit.subtitle")}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("common.search")} className="pl-8" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("audit.title")}</CardTitle>
          <CardDescription>{t("audit.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t("audit.noLogs")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
