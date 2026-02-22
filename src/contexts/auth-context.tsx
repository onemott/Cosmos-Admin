"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { QueryClient } from "@tanstack/react-query";
import {
  AuthTokens,
  TokenPayload,
  setTokens,
  clearTokens,
  getAccessToken,
  decodeToken,
  isAuthenticated as checkIsAuthenticated,
} from "@/lib/auth";

// Platform tenant ID (must match backend)
export const PLATFORM_TENANT_ID = "00000000-0000-0000-0000-000000000000";

const parseRoleList = (value: string | undefined, fallback: string[]) =>
  value ? value.split(",").map((role) => role.trim()).filter(Boolean) : fallback;

export const PLATFORM_ROLES = parseRoleList(
  process.env.NEXT_PUBLIC_PLATFORM_ROLES,
  ["super_admin", "platform_admin", "platform_user"]
);
export const PLATFORM_ADMIN_ROLES = parseRoleList(
  process.env.NEXT_PUBLIC_PLATFORM_ADMIN_ROLES,
  ["super_admin", "platform_admin"]
);
export const TENANT_ADMIN_ROLES = parseRoleList(
  process.env.NEXT_PUBLIC_TENANT_ADMIN_ROLES,
  ["super_admin", "platform_admin", "tenant_admin"]
);
export const SUPERVISOR_ROLES = parseRoleList(
  process.env.NEXT_PUBLIC_SUPERVISOR_ROLES,
  ["super_admin", "platform_admin", "tenant_admin", "eam_supervisor"]
);
export const ALL_STAFF_ROLES = parseRoleList(
  process.env.NEXT_PUBLIC_ALL_STAFF_ROLES,
  ["super_admin", "platform_admin", "tenant_admin", "eam_supervisor", "eam_staff"]
);

interface User {
  id: string;
  tenantId: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function AuthProvider({ 
  children,
  queryClient 
}: { 
  children: ReactNode;
  queryClient: QueryClient;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = getAccessToken();
        if (token && checkIsAuthenticated()) {
          const payload = decodeToken(token);
          if (payload) {
            setUser({
              id: payload.sub,
              tenantId: payload.tenant_id,
              roles: payload.roles,
            });
          }
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Invalid email or password");
      }

      const tokens: AuthTokens = await response.json();
      
      // Store tokens
      setTokens(tokens);

      // Decode user info from token
      const payload = decodeToken(tokens.access_token);
      if (payload) {
        setUser({
          id: payload.sub,
          tenantId: payload.tenant_id,
          roles: payload.roles,
        });
      }

      // Clear all cached queries to ensure fresh data for new user
      queryClient.clear();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router, queryClient]);

  const logout = useCallback(() => {
    // Call logout endpoint (fire and forget)
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }).catch(() => {
      // Ignore errors - we're logging out anyway
    });

    // Clear local state
    clearTokens();
    setUser(null);
    
    // Clear all cached queries to prevent stale data when logging in as different user
    queryClient.clear();
    
    // Redirect to login
    router.push("/login");
  }, [router, queryClient]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook for checking if user has a specific role.
 */
export function useRole(role: string): boolean {
  const { user } = useAuth();
  return user?.roles.includes(role) ?? false;
}

/**
 * Hook for checking if user is a super admin.
 */
export function useIsSuperAdmin(): boolean {
  return useRole("super_admin");
}

/**
 * Hook for checking if user belongs to the platform tenant.
 */
export function useIsPlatformTenant(): boolean {
  const { user } = useAuth();
  return user?.tenantId === PLATFORM_TENANT_ID;
}

/**
 * Hook for checking if user has platform-level access (any platform role).
 */
export function useIsPlatformLevel(): boolean {
  const { user } = useAuth();
  return user?.roles.some(r => PLATFORM_ROLES.includes(r)) ?? false;
}

/**
 * Hook for checking if user has platform admin access.
 */
export function useIsPlatformAdmin(): boolean {
  const { user } = useAuth();
  return user?.roles.some(r => PLATFORM_ADMIN_ROLES.includes(r)) ?? false;
}

/**
 * Hook for checking if user has tenant admin access or higher.
 */
export function useIsTenantAdmin(): boolean {
  const { user } = useAuth();
  return user?.roles.some(r => TENANT_ADMIN_ROLES.includes(r)) ?? false;
}

/**
 * Hook for checking if user has supervisor access or higher.
 */
export function useIsSupervisor(): boolean {
  const { user } = useAuth();
  return user?.roles.some(r => SUPERVISOR_ROLES.includes(r)) ?? false;
}

/**
 * Hook for checking if user is EAM staff (lowest level).
 */
export function useIsEamStaff(): boolean {
  return useRole("eam_staff");
}

/**
 * Get the user's highest role level.
 * Returns: 'platform_admin' | 'platform_user' | 'tenant_admin' | 'eam_supervisor' | 'eam_staff' | 'none'
 */
export function useRoleLevel(): string {
  const { user } = useAuth();
  if (!user) return "none";
  
  const roles = user.roles;
  
  if (roles.some(r => ["super_admin", "platform_admin"].includes(r))) {
    return "platform_admin";
  }
  if (roles.includes("platform_user")) {
    return "platform_user";
  }
  if (roles.includes("tenant_admin")) {
    return "tenant_admin";
  }
  if (roles.includes("eam_supervisor")) {
    return "eam_supervisor";
  }
  if (roles.includes("eam_staff")) {
    return "eam_staff";
  }
  return "none";
}

/**
 * Get role display name for UI.
 */
export function useRoleDisplayName(): string {
  const roleLevel = useRoleLevel();
  
  const displayNames: Record<string, string> = {
    platform_admin: "平台管理员",
    platform_user: "平台用户",
    tenant_admin: "租户管理员",
    eam_supervisor: "部门主管",
    eam_staff: "员工",
    none: "无角色",
  };
  
  return displayNames[roleLevel] || roleLevel;
}

