"use client";

import { NotificationSender } from "@/components/notifications/notification-sender";
import { useTranslation } from "@/lib/i18n";

export default function NotificationSendPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("notifications.title")}</h2>
        <p className="text-muted-foreground">
          {t("notifications.subtitle")}
        </p>
      </div>

      <div className="max-w-4xl">
        <NotificationSender />
      </div>
    </div>
  );
}
