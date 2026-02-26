import { Bell, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationEmptyState({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="rounded-full bg-muted p-3">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-muted-foreground">暂无通知</h3>
      <p className="mt-2 text-xs text-muted-foreground max-w-xs">
        当您收到新通知时，它们将显示在这里。
      </p>
    </div>
  );
}
