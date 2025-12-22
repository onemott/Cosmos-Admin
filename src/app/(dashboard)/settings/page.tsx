"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage, LANGUAGES } from "@/contexts/language-context";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  const currentLanguageInfo = LANGUAGES.find(l => l.code === language);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">{t("settings.general")}</TabsTrigger>
          <TabsTrigger value="language">{t("settings.language")}</TabsTrigger>
          <TabsTrigger value="security">{t("settings.security")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("settings.notifications")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.platformSettings")}</CardTitle>
              <CardDescription>{t("settings.configurePlatform")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">{t("settings.platformName")}</Label>
                <Input id="platformName" defaultValue="EAM Wealth Platform" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">{t("settings.supportEmail")}</Label>
                <Input id="supportEmail" defaultValue="support@example.com" />
              </div>
              <Button>{t("common.saveChanges")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.languageSettings")}</CardTitle>
              <CardDescription>{t("settings.languageDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t("settings.currentLanguage")}</Label>
                <div className="text-sm text-muted-foreground">
                  {currentLanguageInfo?.nativeName} ({currentLanguageInfo?.name})
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.selectLanguage")}</Label>
                <LanguageSelector variant="full" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.securitySettings")}</CardTitle>
              <CardDescription>{t("settings.configureSecurityPolicies")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">{t("settings.sessionTimeout")}</Label>
                <Input id="sessionTimeout" type="number" defaultValue="30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">{t("settings.maxLoginAttempts")}</Label>
                <Input id="maxLoginAttempts" type="number" defaultValue="5" />
              </div>
              <Button>{t("common.saveChanges")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notificationSettings")}</CardTitle>
              <CardDescription>{t("settings.configureNotifications")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("settings.notificationSettingsPlaceholder")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
