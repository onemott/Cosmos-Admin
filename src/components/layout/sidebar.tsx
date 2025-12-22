"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  ClipboardList,
  Blocks,
  Link2,
  ScrollText,
  Settings,
  LogOut,
  Shield,
  KeyRound,
  Ticket,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  // Platform-level users can see platform sections (Tenants, etc.)
  // - platform_admin/super_admin: full access
  // - platform_user: read-only access
  const isPlatformLevel = (user?.roles.includes("super_admin") || 
                           user?.roles.includes("platform_admin") ||
                           user?.roles.includes("platform_user")) ?? false;
  
  // Platform admin = can manage (create/edit/delete)
  const isPlatformAdmin = (user?.roles.includes("super_admin") || 
                           user?.roles.includes("platform_admin")) ?? false;

// Platform management (super admin)
const platformNavigation = [
  {
      name: t("sidebar.dashboard"),
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
      name: t("sidebar.tenants"),
    href: "/tenants",
    icon: Building2,
    superAdminOnly: true,
  },
  {
      name: t("sidebar.users"),
    href: "/users",
    icon: Users,
  },
];

// CRM / Tenant-specific
const tenantNavigation = [
  {
      name: t("sidebar.clients"),
    href: "/clients",
    icon: UserCircle,
  },
  {
      name: t("sidebar.invitations"),
    href: "/invitations",
    icon: Ticket,
  },
  {
      name: t("sidebar.clientCredentials"),
    href: "/client-users",
    icon: KeyRound,
  },
  {
      name: t("sidebar.tasks"),
    href: "/tasks",
    icon: ClipboardList,
  },
];

// System
const systemNavigation = [
  {
      name: t("sidebar.modules"),
    href: "/modules",
    icon: Blocks,
  },
  {
      name: t("sidebar.integrations"),
    href: "/integrations",
    icon: Link2,
  },
  {
      name: t("sidebar.auditLogs"),
    href: "/audit",
    icon: ScrollText,
  },
];

const bottomNavigation = [
  {
      name: t("sidebar.settings"),
    href: "/settings",
    icon: Settings,
  },
];

  const NavLink = ({ item }: { item: { name: string; href: string; icon: React.ComponentType<{ className?: string }>; superAdminOnly?: boolean } }) => {
    // Hide platform-only items for non-platform users
    if (item.superAdminOnly && !isPlatformLevel) {
      return null;
    }
    
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          E
        </div>
        <span className="text-lg font-semibold">EAM Admin</span>
      </div>

      <Separator />

      {/* Platform Level Badge */}
      {isPlatformLevel && (
        <div className="px-4 py-2">
          <Badge variant="secondary" className="w-full justify-center gap-1">
            <Shield className="h-3 w-3" />
            {isPlatformAdmin ? t("sidebar.platformAdmin") : t("sidebar.platformUser")}
          </Badge>
        </div>
      )}

      {/* Platform Navigation */}
      <nav className="space-y-1 px-3 py-2">
        <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {isPlatformLevel ? t("sidebar.platform") : t("sidebar.overview")}
        </p>
        {platformNavigation.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Tenant / CRM Navigation */}
      <nav className="space-y-1 px-3 py-2">
        <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("sidebar.crm")}
        </p>
        {tenantNavigation.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* System Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("sidebar.system")}
        </p>
        {systemNavigation.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <Separator />

      {/* Bottom Navigation */}
      <nav className="space-y-1 px-3 py-4">
        {bottomNavigation.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          {t("sidebar.signOut")}
        </button>
      </nav>
    </div>
  );
}
