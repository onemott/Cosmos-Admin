"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, RefreshCw, Download } from "lucide-react";
import { useTranslation, useLocalizedDate } from "@/lib/i18n";
import type { AuditLog } from "@/types";

export default function AuditPage() {
  const { t } = useTranslation();
  const { formatDateTime } = useLocalizedDate();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const limit = 50;

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useAuditLogs({
    skip: page * limit,
    limit,
    search: search || undefined,
  });

  const logs = useMemo(() => (data?.items || []) as AuditLog[], [data]);
  const total = data?.total || 0;
  const hasNext = (page + 1) * limit < total;
  const hasPrevious = page > 0;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const url = api.audit.exportUrl({ search: search || undefined });
      const token = getAccessToken();
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const filename =
        response.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        "audit_logs.csv";
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("audit.failedToLoad"),
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("audit.title")}</h1>
          <p className="text-muted-foreground">
            {t("audit.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("common.refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {t("common.export")}
          </Button>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              className="pl-8"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("audit.title")}</CardTitle>
          <CardDescription>{t("audit.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.loading")}
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive">{t("audit.failedToLoad")}</div>
          ) : logs.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("audit.noLogs")}</div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("audit.timestamp")}</TableHead>
                    <TableHead>{t("audit.user")}</TableHead>
                    <TableHead>{t("audit.eventType")}</TableHead>
                    <TableHead>{t("audit.resourceType")}</TableHead>
                    <TableHead>{t("audit.action")}</TableHead>
                    <TableHead>{t("audit.ipAddress")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDateTime(log.created_at)}</TableCell>
                      <TableCell>{log.user_email || "-"}</TableCell>
                      <TableCell>{log.event_type}</TableCell>
                      <TableCell>{log.resource_type}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.ip_address || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  {t("common.total")}: {total}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={!hasPrevious} onClick={() => setPage((prev) => Math.max(0, prev - 1))}>
                    {t("common.previous")}
                  </Button>
                  <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage((prev) => prev + 1)}>
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
