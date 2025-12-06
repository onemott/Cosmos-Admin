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
import {
  AuthTokens,
  TokenPayload,
  setTokens,
  clearTokens,
  getAccessToken,
  decodeToken,
  isAuthenticated as checkIsAuthenticated,
} from "@/lib/auth";

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

export function AuthProvider({ children }: { children: ReactNode }) {
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

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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
    
    // Redirect to login
    router.push("/login");
  }, [router]);

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

