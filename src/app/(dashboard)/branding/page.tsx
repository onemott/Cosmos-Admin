"use client";

import { useQuery } from "@tanstack/react-query";
import { BrandingForm } from "@/components/tenants/branding-form";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { Loader2, Palette, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { TenantOnly } from "@/components/auth/tenant-only";
import { BrandingResponse } from "@/types";

export default function BrandingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const tenantId = user?.tenantId;

  // Fetch branding (public endpoint) to get tenant name
  const { data: branding, isLoading, error } = useQuery<BrandingResponse>({
    queryKey: ["tenant-branding", tenantId],
    queryFn: () => api.tenants.getBranding(tenantId!) as Promise<BrandingResponse>,
    enabled: !!tenantId,
  });

  // Platform users without a tenant
  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="h-8 w-8" />
            {t("sidebar.branding")}
          </h1>
          <p className="text-muted-foreground">
            {t("tenants.customizeAppearance")}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p>
                {t("tenants.platformUserBrandingNote")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !branding) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="h-8 w-8" />
            {t("sidebar.branding")}
          </h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              {t("tenants.failedToLoadBranding")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TenantOnly>
      <div className="space-y-6">
        {/* Header */}
        <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Palette className="h-8 w-8" />
          {t("sidebar.branding")}
        </h1>
        <p className="text-muted-foreground">
          {t("tenants.customizeYourAppearance", { tenantName: branding.tenant_name })}
        </p>
      </div>

      {/* Branding Form */}
      <BrandingForm tenantId={tenantId} tenantName={branding.tenant_name} />
    </div>
    </TenantOnly>
  );
}

