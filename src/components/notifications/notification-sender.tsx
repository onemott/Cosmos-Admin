"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

export function NotificationSender() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState<"user" | "tenant" | "all">("user");
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSend = async () => {
    if (!title || !content) {
      toast({
        variant: "destructive",
        title: t("notifications.form.validationError"),
        description: t("notifications.form.validationMessage"),
      });
      return;
    }

    if (targetType !== "all" && !targetId) {
      toast({
        variant: "destructive",
        title: t("notifications.form.validationError"),
        description: t("notifications.form.targetIdRequired"),
      });
      return;
    }

    try {
      setLoading(true);
      await api.notifications.send({
        title,
        content,
        content_format: "text", // Can be extended to markdown
        type: "system",
        target_type: targetType,
        target_id: targetId,
      });
      toast({
        title: t("notifications.form.successTitle"),
        description: t("notifications.form.successMessage"),
      });
      // Reset form
      setTitle("");
      setContent("");
      setTargetId("");
    } catch (error: any) {
      console.error("Failed to send notification:", error);
      toast({
        variant: "destructive",
        title: t("notifications.form.errorTitle") || "Error",
        description: error.message || t("notifications.form.errorMessage") || "Failed to send notification",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("notifications.sendNotification")}</CardTitle>
        <CardDescription>{t("notifications.sendDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">{t("notifications.form.title")}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("notifications.form.titlePlaceholder")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("notifications.form.targetType")}</Label>
            <Select
              value={targetType}
              onValueChange={(v: "user" | "tenant" | "all") => {
                setTargetType(v);
                setTargetId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("notifications.form.targetTypePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t("notifications.types.user")}</SelectItem>
                <SelectItem value="tenant">{t("notifications.types.tenant")}</SelectItem>
                <SelectItem value="all">{t("notifications.types.all")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType !== "all" && (
            <div className="space-y-2">
              <Label htmlFor="targetId">
                {targetType === "user" ? t("notifications.form.userId") : t("notifications.form.tenantId")}
              </Label>
              <Input
                id="targetId"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder={targetType === "user" ? t("notifications.form.userIdPlaceholder") : t("notifications.form.tenantIdPlaceholder")}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">{t("notifications.form.content")}</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("notifications.form.contentPlaceholder")}
            className="min-h-[150px]"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSend} disabled={loading}>
            {loading ? t("notifications.form.sending") : t("notifications.form.send")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
