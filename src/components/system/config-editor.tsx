"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "@/lib/i18n";

interface SystemConfigEditorProps {
  configKey: string;
  title: string;
  description: string;
}

export function SystemConfigEditor({ configKey, title, description }: SystemConfigEditorProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [version, setVersion] = useState("1.0");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, [configKey]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.system.getConfig(configKey);
      setContent(data.value || "");
      setVersion(data.version || "1.0");
      setIsPublic(data.is_public);
    } catch (error) {
      // Config might not exist yet, which is fine
      console.log("Config not found, starting fresh");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.system.updateConfig(configKey, {
        value: content,
        version: version,
        is_public: isPublic,
        description: description,
      });
      toast({
        title: "Success",
        description: "Configuration updated successfully",
      });
    } catch (error: any) {
      console.error("Failed to update config:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update configuration",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="version">{t("common.version")}</Label>
            <Input
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 1.0"
            />
          </div>
          <div className="flex items-center space-x-2 pt-8">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public">{t("settings.publiclyAvailable")}</Label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>{t("settings.contentMarkdown")}</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreview(!preview)}
            >
              {preview ? t("common.edit") : t("settings.preview")}
            </Button>
          </div>
          
          {preview ? (
            <div className="min-h-[300px] w-full rounded-md border p-4 prose dark:prose-invert overflow-auto bg-muted/50">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <Textarea
              className="min-h-[300px] font-mono"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Privacy Policy..."
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? t("common.loading") : t("common.saveChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
