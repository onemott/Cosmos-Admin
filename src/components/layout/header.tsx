"use client";

import { Bell, Search, User, LogOut, Settings, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslation } from "@/lib/i18n";
import { NotificationsPopover } from "@/components/notifications-popover";

interface CurrentUserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
  is_active: boolean;
  roles: string[];
}

export function Header() {
  const { user: authUser, logout } = useAuth();
  const { data: currentUserData, isLoading } = useCurrentUser();
  const currentUser = currentUserData as CurrentUserData | undefined;
  const { t } = useTranslation();

  // Get initials for avatar from actual user data
  const getInitials = () => {
    if (!currentUser) return "U";
    const first = currentUser.first_name?.[0] || "";
    const last = currentUser.last_name?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  // Get display name
  const displayName = currentUser 
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : t("common.loading");

  // Get user email
  const userEmail = currentUser?.email || t("common.loading");

  // Check if platform admin
  const isPlatformAdmin = authUser?.roles.includes("super_admin") || 
                          authUser?.roles.includes("platform_admin");

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-6">
      {/* Search */}
      <div className="flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("header.search")}
            className="pl-10"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Notifications */}
        <NotificationsPopover />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  {isPlatformAdmin && (
                    <Badge variant="secondary" className="text-xs">
                      {t("sidebar.platformAdmin")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              {t("header.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              {t("header.settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("header.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
