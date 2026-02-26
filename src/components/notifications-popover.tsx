"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/use-api";
import { NotificationItem } from "@/components/notifications/notification-item";
import { NotificationSkeleton } from "@/components/notifications/notification-skeleton";
import { NotificationEmptyState } from "@/components/notifications/notification-empty-state";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

export function NotificationsPopover() {
  const router = useRouter();
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useMyNotifications({ limit: 20 });
  
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Flatten the pages to get all notifications
  const notifications = data?.pages.flatMap((page: any) => page.items) || [];
  // Use unread_count from the first page (latest data)
  const unreadCount = data?.pages[0]?.unread_count || 0;

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.preventDefault();
    markAllRead();
  };

  const handleRead = (id: string) => {
    markRead(id);
  };

  const handleNavigate = (link: string) => {
    router.push(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end" forceMount>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold">通知</p>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
              onClick={handleMarkAllRead}
            >
              全部已读
            </Button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-2">
              <NotificationSkeleton />
            </div>
          ) : notifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            <div className="flex flex-col p-2 space-y-1">
              {notifications.map((notification: any) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleRead}
                  onNavigate={handleNavigate}
                />
              ))}
              
              {/* Infinite scroll trigger */}
              <div ref={ref} className="py-2 text-center">
                {isFetchingNextPage && (
                  <span className="text-xs text-muted-foreground">加载更多...</span>
                )}
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
