import { Bell, AlertTriangle, Gift, Info, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    content: string;
    type: string;
    is_read: boolean;
    created_at: string;
    metadata_json?: any;
  };
  onRead: (id: string) => void;
  onNavigate?: (link: string) => void;
}

export function NotificationItem({ notification, onRead, onNavigate }: NotificationItemProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "promotion":
        return <Gift className="h-4 w-4 text-purple-500" />;
      case "system":
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    
    if (notification.metadata_json?.link && onNavigate) {
      onNavigate(notification.metadata_json.link);
    }
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRead(notification.id);
  };

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50",
        !notification.is_read ? "bg-muted/20" : "opacity-75"
      )}
      onClick={handleClick}
    >
      <div className="mt-1 flex-shrink-0">
        {getIcon(notification.type)}
      </div>
      
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium leading-none", !notification.is_read && "font-semibold")}>
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: zhCN,
            })}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground prose prose-sm max-w-none prose-p:my-0 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {notification.content}
          </ReactMarkdown>
        </div>
      </div>

      {!notification.is_read && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-background shadow-sm border"
            onClick={handleMarkRead}
            title="标记为已读"
          >
            <Check className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {!notification.is_read && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500 group-hover:opacity-0 transition-opacity" />
      )}
    </div>
  );
}
