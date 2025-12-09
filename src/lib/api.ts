import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn("NEXT_PUBLIC_API_URL is missing in production environment variables!");
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Get auth token from localStorage if not provided
    const accessToken = token || getAccessToken();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let headers = this.getHeaders();
    
    // Merge headers
    if (options.headers) {
      headers = { ...headers, ...options.headers };
    }

    let response = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized (Token Expiration)
    if (response.status === 401) {
      if (this.isRefreshing) {
        // If already refreshing, wait for new token
        try {
          const newToken = await new Promise<string>((resolve) => {
            this.subscribeTokenRefresh(resolve);
          });
          
          // Retry with new token
          headers = this.getHeaders(newToken);
          if (options.headers) {
             headers = { ...headers, ...options.headers };
          }
          response = await fetch(url, { ...options, headers });
        } catch (e) {
           // Queue failed
           throw e;
        }
      } else {
        // Start refresh process
        this.isRefreshing = true;
        const refreshToken = getRefreshToken();

        if (refreshToken) {
          try {
            // Call refresh endpoint directly to avoid recursion
            const refreshResponse = await fetch(`${this.baseUrl}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (refreshResponse.ok) {
              const tokens = await refreshResponse.json();
              setTokens(tokens);
              this.onRefreshed(tokens.access_token);
              
              // Retry original request
              headers = this.getHeaders(tokens.access_token);
              if (options.headers) {
                 headers = { ...headers, ...options.headers };
              }
              response = await fetch(url, { ...options, headers });
            } else {
              // Refresh failed
              clearTokens();
              this.onRefreshed(""); // Notify queue to fail/proceed
              window.location.href = "/login";
              throw new Error("Session expired. Please login again.");
            }
          } catch (err) {
            clearTokens();
            this.onRefreshed("");
            window.location.href = "/login";
            throw err;
          } finally {
            this.isRefreshing = false;
          }
        } else {
          // No refresh token available
          clearTokens();
          window.location.href = "/login";
        }
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API Error: ${response.statusText}`);
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T, D = unknown>(endpoint: string, data: D): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string): Promise<void> {
    return this.request<void>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// API endpoint helpers
export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post("/auth/login", credentials),
    refresh: (refreshToken: string) =>
      apiClient.post("/auth/refresh", { refresh_token: refreshToken }),
    logout: () => apiClient.post("/auth/logout"),
  },

  // Tenants
  tenants: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get(`/tenants?skip=${params?.skip || 0}&limit=${params?.limit || 20}`),
    get: (id: string) => apiClient.get(`/tenants/${id}`),
    create: (data: unknown) => apiClient.post("/tenants", data),
    update: (id: string, data: unknown) => apiClient.patch(`/tenants/${id}`, data),
    delete: (id: string) => apiClient.delete(`/tenants/${id}`),
    deletePermanent: (id: string) => apiClient.delete(`/tenants/${id}/permanent`),
  },

  // Users
  users: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get(`/users?skip=${params?.skip || 0}&limit=${params?.limit || 20}`),
    get: (id: string) => apiClient.get(`/users/${id}`),
    create: (data: unknown) => apiClient.post("/users", data),
    update: (id: string, data: unknown) => apiClient.patch(`/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
    deletePermanent: (id: string) => apiClient.delete(`/users/${id}/permanent`),
    changePassword: (id: string, data: { current_password?: string; new_password: string }) =>
      apiClient.post(`/users/${id}/change-password`, data),
    me: () => apiClient.get("/users/me"),
  },

  // Roles
  roles: {
    list: () => apiClient.get("/roles"),
  },

  // Clients
  clients: {
    list: (params?: { skip?: number; limit?: number; search?: string }) => {
      const searchParams = new URLSearchParams({
        skip: String(params?.skip || 0),
        limit: String(params?.limit || 20),
        ...(params?.search && { search: params.search }),
      });
      return apiClient.get(`/clients?${searchParams}`);
    },
    get: (id: string) => apiClient.get(`/clients/${id}`),
    create: (data: unknown) => apiClient.post("/clients", data),
    update: (id: string, data: unknown) => apiClient.patch(`/clients/${id}`, data),
    delete: (id: string) => apiClient.delete(`/clients/${id}`),
    accounts: (id: string) => apiClient.get(`/clients/${id}/accounts`),
    documents: (id: string) => apiClient.get(`/clients/${id}/documents`),
    // Client modules
    modules: (clientId: string) => apiClient.get(`/clients/${clientId}/modules`),
    enableModule: (clientId: string, moduleId: string) =>
      apiClient.post(`/clients/${clientId}/modules/${moduleId}/enable`),
    disableModule: (clientId: string, moduleId: string) =>
      apiClient.post(`/clients/${clientId}/modules/${moduleId}/disable`),
  },

  // Modules
  modules: {
    // List modules for current tenant (with is_enabled status)
    list: () => apiClient.get("/modules"),
    // List all modules in platform catalogue (platform users)
    listAll: () => apiClient.get("/modules/all"),
    // List modules for a specific tenant (platform users)
    listForTenant: (tenantId: string) => apiClient.get(`/modules/tenant/${tenantId}`),
    // Get a specific module
    get: (moduleId: string) => apiClient.get(`/modules/${moduleId}`),
    // Create a new module (platform admin)
    create: (data: unknown) => apiClient.post("/modules", data),
    // Update a module (platform admin)
    update: (moduleId: string, data: unknown) => apiClient.patch(`/modules/${moduleId}`, data),
    // Delete a module (platform admin)
    delete: (moduleId: string) => apiClient.delete(`/modules/${moduleId}`),
    // Enable module for a tenant (platform admin)
    enable: (moduleId: string, tenantId: string) =>
      apiClient.post(`/modules/${moduleId}/enable?tenant_id=${tenantId}`),
    // Disable module for a tenant (platform admin)
    disable: (moduleId: string, tenantId: string) =>
      apiClient.post(`/modules/${moduleId}/disable?tenant_id=${tenantId}`),
    // Request access to a module (tenant admin)
    requestAccess: (data: { module_code: string; message?: string }) =>
      apiClient.post("/modules/requests", data),
  },

  // Audit Logs
  audit: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get(`/audit?skip=${params?.skip || 0}&limit=${params?.limit || 50}`),
  },

  // Statistics
  stats: {
    dashboard: () => apiClient.get<{
      total_tenants: number;
      active_tenants: number;
      total_users: number;
      active_users: number;
      total_clients: number;
      total_aum: number;
      formatted_aum: string;
    }>("/stats/dashboard"),
    tenant: () => apiClient.get<{
      total_users: number;
      active_users: number;
      total_clients: number;
      total_aum: number;
      formatted_aum: string;
    }>("/stats/tenant"),
    health: () => apiClient.get<{
      api_server: string;
      database: string;
      background_jobs: string;
    }>("/stats/health"),
  },
};

