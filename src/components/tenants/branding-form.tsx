"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Loader2, Upload, Trash2, ImageIcon, Palette } from "lucide-react";
import { BrandingResponse } from "@/types";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/branding";
import { useTranslation } from "@/lib/i18n";

// Validation schema
const brandingFormSchema = z.object({
  app_name: z
    .string()
    .min(2, "App name must be at least 2 characters")
    .max(50, "App name must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #1E40AF)")
    .optional()
    .or(z.literal("")),
});

type BrandingFormValues = z.infer<typeof brandingFormSchema>;

interface BrandingFormProps {
  tenantId: string;
  tenantName: string;
}

// Preview color swatches
const colorPresets = [
  { name: "Blue", color: "#1E40AF" },
  { name: "Cyan", color: "#06B6D4" },
  { name: "Emerald", color: "#059669" },
  { name: "Violet", color: "#7C3AED" },
  { name: "Rose", color: "#E11D48" },
  { name: "Amber", color: "#D97706" },
  { name: "Slate", color: "#475569" },
  { name: "Indigo", color: "#4F46E5" },
];

export function BrandingForm({ tenantId, tenantName }: BrandingFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Fetch current branding
  const { data: branding, isLoading: loadingBranding } = useQuery<BrandingResponse>({
    queryKey: ["tenant-branding", tenantId],
    queryFn: () => api.tenants.getBranding(tenantId) as Promise<BrandingResponse>,
  });

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: {
      app_name: "",
      primary_color: "",
    },
  });

  // Update form when branding data loads
  useEffect(() => {
    if (branding) {
      form.reset({
        app_name: branding.app_name || "",
        primary_color: branding.primary_color || "",
      });
      if (branding.has_logo && branding.logo_url) {
        setLogoPreview(api.tenants.getLogoUrl(tenantId));
      }
    }
  }, [branding, form, tenantId]);

  // Update branding mutation
  const updateMutation = useMutation({
    mutationFn: (data: BrandingFormValues) =>
      api.tenants.updateBranding(tenantId, {
        app_name: data.app_name || undefined,
        primary_color: data.primary_color || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", tenantId] });
      toast({
        title: t("branding.brandingUpdated"),
        description: t("branding.brandingUpdatedDescription"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("branding.brandingUpdateFailed"),
        variant: "destructive",
      });
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => api.tenants.uploadLogo(tenantId, file) as Promise<BrandingResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", tenantId] });
      toast({
        title: t("branding.logoUploaded"),
        description: t("branding.logoUploadedDescription"),
      });
      setUploadingLogo(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("branding.logoUploadFailed"),
        description: error.message || t("branding.logoUploadFailedDescription"),
        variant: "destructive",
      });
      setUploadingLogo(false);
    },
  });

  // Delete logo mutation
  const deleteLogoMutation = useMutation({
    mutationFn: () => api.tenants.deleteLogo(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding", tenantId] });
      setLogoPreview(null);
      toast({
        title: t("branding.logoRemoved"),
        description: t("branding.logoRemovedDescription"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("branding.logoRemoveFailed"),
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast({
        title: t("branding.invalidFileType"),
        description: t("branding.invalidFileTypeDescription"),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("branding.fileTooLarge"),
        description: t("branding.fileTooLargeDescription"),
        variant: "destructive",
      });
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploadingLogo(true);
    uploadLogoMutation.mutate(file);
  };

  const handleSubmit = (values: BrandingFormValues) => {
    updateMutation.mutate(values);
  };

  const handleColorPreset = (color: string) => {
    form.setValue("primary_color", color, { shouldValidate: true });
  };

  if (loadingBranding) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentColor = form.watch("primary_color") || DEFAULT_PRIMARY_COLOR;

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {t("branding.logo")}
          </CardTitle>
          <CardDescription>
            {t("branding.logoDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Logo preview */}
            <div
              className="relative flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 overflow-hidden"
              style={{ backgroundColor: logoPreview ? "transparent" : currentColor + "20" }}
            >
              {logoPreview ? (
                <div className="relative h-full w-full p-2">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    className="object-contain"
                    unoptimized // Since we're dealing with dynamic blobs or external URLs
                  />
                </div>
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-lg text-3xl font-bold text-white"
                  style={{ backgroundColor: currentColor }}
                >
                  {tenantName.charAt(0).toUpperCase()}
                </div>
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                <Upload className="mr-2 h-4 w-4" />
                {t("branding.uploadLogo")}
              </Button>
              {branding?.has_logo && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteLogoMutation.mutate()}
                  disabled={deleteLogoMutation.isPending}
                >
                  {deleteLogoMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {t("branding.removeLogo")}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {t("branding.fileHint")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("branding.brandingSettings")}
          </CardTitle>
          <CardDescription>
            {t("branding.brandingSettingsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="app_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("branding.appDisplayName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tenantName}
                        {...field}
                        disabled={updateMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("branding.appDisplayNameDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("branding.primaryColor")}</FormLabel>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg border shadow-sm cursor-pointer"
                          style={{ backgroundColor: field.value || DEFAULT_PRIMARY_COLOR }}
                          onClick={() => {
                            const input = document.getElementById("color-picker");
                            if (input) input.click();
                          }}
                        />
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="#1E40AF"
                            className="w-32 font-mono"
                            disabled={updateMutation.isPending}
                          />
                        </FormControl>
                        <input
                          id="color-picker"
                          type="color"
                          value={field.value || DEFAULT_PRIMARY_COLOR}
                          onChange={(e) => form.setValue("primary_color", e.target.value.toUpperCase(), { shouldValidate: true })}
                          className="sr-only"
                        />
                      </div>
                      
                      {/* Color presets */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">{t("branding.quickSelect")}</Label>
                        <div className="flex flex-wrap gap-2">
                          {colorPresets.map((preset) => (
                            <button
                              key={preset.color}
                              type="button"
                              className="h-8 w-8 rounded-lg border shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2"
                              style={{ backgroundColor: preset.color }}
                              title={preset.name}
                              onClick={() => handleColorPreset(preset.color)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <FormDescription>
                      {t("branding.primaryColorDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preview */}
              <div className="rounded-lg border p-4 space-y-3">
                <Label className="text-sm font-medium">{t("branding.preview")}</Label>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold relative overflow-hidden"
                    style={{ backgroundColor: currentColor }}
                  >
                    {logoPreview ? (
                      <div className="relative h-10 w-10">
                        <Image 
                          src={logoPreview} 
                          alt="Logo" 
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      (form.watch("app_name") || tenantName).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {form.watch("app_name") || tenantName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("branding.previewSubtitle")}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    style={{ backgroundColor: currentColor, borderColor: currentColor }}
                  >
                    {t("branding.primaryButton")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    style={{ color: currentColor, borderColor: currentColor }}
                  >
                    {t("branding.secondaryButton")}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("common.saveChanges")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

