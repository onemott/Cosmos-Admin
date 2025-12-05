import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Get auth token from session
    const session = await getSession();
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async delete(endpoint: string): Promise<void> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
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
  },

  // Users
  users: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get(`/users?skip=${params?.skip || 0}&limit=${params?.limit || 20}`),
    get: (id: string) => apiClient.get(`/users/${id}`),
    create: (data: unknown) => apiClient.post("/users", data),
    update: (id: string, data: unknown) => apiClient.patch(`/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
    me: () => apiClient.get("/users/me"),
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
  },

  // Modules
  modules: {
    list: () => apiClient.get("/modules"),
    enable: (moduleId: string, tenantId?: string) =>
      apiClient.post(`/modules/${moduleId}/enable`, { tenant_id: tenantId }),
    disable: (moduleId: string, tenantId?: string) =>
      apiClient.post(`/modules/${moduleId}/disable`, { tenant_id: tenantId }),
  },

  // Audit Logs
  audit: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get(`/audit?skip=${params?.skip || 0}&limit=${params?.limit || 50}`),
  },
};

