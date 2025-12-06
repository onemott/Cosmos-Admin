/**
 * Authentication utilities for token management.
 * 
 * This module handles:
 * - Token storage in localStorage
 * - Token retrieval
 * - Token expiration checking
 * - Logout (clearing tokens)
 */

const ACCESS_TOKEN_KEY = "eam_access_token";
const REFRESH_TOKEN_KEY = "eam_refresh_token";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface TokenPayload {
  sub: string;
  tenant_id: string;
  roles: string[];
  exp: number;
  iat: number;
}

/**
 * Store authentication tokens in localStorage.
 */
export function setTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

/**
 * Get the access token from localStorage.
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get the refresh token from localStorage.
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Clear all tokens from localStorage (logout).
 */
export function clearTokens(): void {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if user has valid tokens stored.
 */
export function hasTokens(): boolean {
  return !!getAccessToken();
}

/**
 * Decode a JWT token payload (without verification).
 * Note: This is for reading token data only, not for security validation.
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if the access token is expired.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  
  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  const now = Date.now();
  
  // Consider token expired 30 seconds before actual expiration
  // to account for network latency
  return now >= expirationTime - 30000;
}

/**
 * Check if user is authenticated (has valid, non-expired token).
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Get current user info from token.
 */
export function getCurrentUser(): TokenPayload | null {
  const token = getAccessToken();
  if (!token) return null;
  return decodeToken(token);
}

/**
 * Check if current user has a specific role.
 */
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.roles.includes(role);
}

/**
 * Check if current user is a super admin.
 */
export function isSuperAdmin(): boolean {
  return hasRole("super_admin");
}

