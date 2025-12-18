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

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const accessToken = getAccessToken();
    
    const headers: HeadersInit = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    // Don't set Content-Type - browser will set it with boundary for multipart/form-data

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API Error: ${response.statusText}`);
    }

    return response.json();
  }

  getDownloadUrl(endpoint: string): string {
    const accessToken = getAccessToken();
    const url = `${this.baseUrl}${endpoint}`;
    // For direct downloads, we return the URL with token as query param
    // Note: In production, you might want to use a different auth mechanism
    return accessToken ? `${url}?token=${accessToken}` : url;
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
    list: (params?: { skip?: number; limit?: number; search?: string; kyc_status?: string }) => {
      const searchParams = new URLSearchParams({
        skip: String(params?.skip || 0),
        limit: String(params?.limit || 20),
        ...(params?.search && { search: params.search }),
        ...(params?.kyc_status && { kyc_status: params.kyc_status }),
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

  // Accounts
  accounts: {
    list: (params?: { client_id?: string; is_active?: boolean; skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
      if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
      if (params?.client_id) searchParams.set("client_id", params.client_id);
      if (params?.is_active !== undefined) searchParams.set("is_active", String(params.is_active));
      return apiClient.get(`/accounts?${searchParams}`);
    },
    get: (id: string) => apiClient.get(`/accounts/${id}`),
    create: (data: {
      client_id: string;
      account_number: string;
      account_name: string;
      account_type?: string;
      currency?: string;
      total_value?: number;
      cash_balance?: number;
    }) => apiClient.post("/accounts", data),
    update: (id: string, data: {
      account_name?: string;
      account_type?: string;
      currency?: string;
      total_value?: number;
      cash_balance?: number;
      is_active?: boolean;
    }) => apiClient.patch(`/accounts/${id}`, data),
    reassign: (id: string, clientId: string) =>
      apiClient.patch(`/accounts/${id}/client`, { client_id: clientId }),
    delete: (id: string, hardDelete?: boolean) =>
      apiClient.delete(`/accounts/${id}?hard_delete=${hardDelete || false}`),
    reactivate: (id: string) => apiClient.post(`/accounts/${id}/reactivate`),
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

  // Tasks
  tasks: {
    list: (params?: {
      skip?: number;
      limit?: number;
      client_id?: string;
      status?: string;
      task_type?: string;
      workflow_state?: string;
      assigned_to_me?: boolean;
      pending_eam_only?: boolean;
    }) => {
      const searchParams = new URLSearchParams({
        skip: String(params?.skip || 0),
        limit: String(params?.limit || 20),
      });
      if (params?.client_id) searchParams.set("client_id", params.client_id);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.task_type) searchParams.set("task_type", params.task_type);
      if (params?.workflow_state) searchParams.set("workflow_state", params.workflow_state);
      if (params?.assigned_to_me) searchParams.set("assigned_to_me", "true");
      if (params?.pending_eam_only) searchParams.set("pending_eam_only", "true");
      return apiClient.get(`/tasks?${searchParams}`);
    },
    get: (id: string) => apiClient.get(`/tasks/${id}`),
    create: (data: unknown) => apiClient.post("/tasks", data),
    update: (id: string, data: unknown) => apiClient.patch(`/tasks/${id}`, data),
    respond: (id: string, data: { action: string; comment?: string; proposal_data?: unknown }) =>
      apiClient.post(`/tasks/${id}/respond`, data),
    assign: (id: string, userId: string) =>
      apiClient.post(`/tasks/${id}/assign?user_id=${userId}`),
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

  // Product Categories
  categories: {
    // List categories for current tenant (includes platform defaults)
    list: (params?: { include_inactive?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.include_inactive) searchParams.set("include_inactive", "true");
      const query = searchParams.toString();
      return apiClient.get(`/categories${query ? `?${query}` : ""}`);
    },
    // List platform default categories (platform admin)
    listDefaults: (params?: { include_inactive?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.include_inactive) searchParams.set("include_inactive", "true");
      const query = searchParams.toString();
      return apiClient.get(`/categories/defaults${query ? `?${query}` : ""}`);
    },
    // Get a specific category
    get: (categoryId: string) => apiClient.get(`/categories/${categoryId}`),
    // Create tenant-specific category
    create: (data: unknown) => apiClient.post("/categories", data),
    // Create platform default category (platform admin)
    createDefault: (data: unknown) => apiClient.post("/categories/defaults", data),
    // Update a category
    update: (categoryId: string, data: unknown) =>
      apiClient.patch(`/categories/${categoryId}`, data),
    // Delete a category
    delete: (categoryId: string) => apiClient.delete(`/categories/${categoryId}`),
  },

  // Products
  products: {
    // List products for current tenant (includes platform defaults)
    list: (params?: {
      module_id?: string;
      module_code?: string;
      category_id?: string;
      risk_level?: string;
      visible_only?: boolean;
      skip?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams({
        skip: String(params?.skip || 0),
        limit: String(params?.limit || 100),
      });
      if (params?.module_id) searchParams.set("module_id", params.module_id);
      if (params?.module_code) searchParams.set("module_code", params.module_code);
      if (params?.category_id) searchParams.set("category_id", params.category_id);
      if (params?.risk_level) searchParams.set("risk_level", params.risk_level);
      if (params?.visible_only !== undefined)
        searchParams.set("visible_only", String(params.visible_only));
      return apiClient.get(`/products?${searchParams}`);
    },
    // List platform default products (platform admin)
    listDefaults: (params?: { module_id?: string; visible_only?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.module_id) searchParams.set("module_id", params.module_id);
      if (params?.visible_only !== undefined)
        searchParams.set("visible_only", String(params.visible_only));
      const query = searchParams.toString();
      return apiClient.get(`/products/defaults${query ? `?${query}` : ""}`);
    },
    // Get a specific product
    get: (productId: string) => apiClient.get(`/products/${productId}`),
    // Create tenant-specific product
    create: (data: unknown) => apiClient.post("/products", data),
    // Create platform default product (platform admin)
    createDefault: (data: unknown) => apiClient.post("/products/defaults", data),
    // Update a product
    update: (productId: string, data: unknown) =>
      apiClient.patch(`/products/${productId}`, data),
    // Toggle product visibility
    toggleVisibility: (productId: string, isVisible: boolean) =>
      apiClient.patch(`/products/${productId}/visibility`, { is_visible: isVisible }),
    // Update product sync settings (platform admin)
    updateSync: (productId: string, data: { is_unlocked_for_all?: boolean; tenant_ids?: string[] }) =>
      apiClient.patch(`/products/${productId}/sync`, data),
    // Delete a product
    delete: (productId: string) => apiClient.delete(`/products/${productId}`),
    // Product documents
    documents: {
      list: (productId: string) => apiClient.get(`/products/${productId}/documents`),
      get: (productId: string, documentId: string) =>
        apiClient.get(`/products/${productId}/documents/${documentId}`),
      upload: (productId: string, file: File, name?: string, description?: string) => {
        const formData = new FormData();
        formData.append("file", file);
        if (name) formData.append("name", name);
        if (description) formData.append("description", description);
        return apiClient.upload(`/products/${productId}/documents/upload`, formData);
      },
      delete: (productId: string, documentId: string) =>
        apiClient.delete(`/products/${productId}/documents/${documentId}`),
      downloadUrl: (productId: string, documentId: string) =>
        `${API_BASE_URL}/products/${productId}/documents/${documentId}/download`,
    },
  },

  // Documents (Client Documents)
  documents: {
    list: (params?: { client_id?: string; document_type?: string; skip?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
      if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
      if (params?.client_id) searchParams.set("client_id", params.client_id);
      if (params?.document_type) searchParams.set("document_type", params.document_type);
      return apiClient.get(`/documents?${searchParams}`);
    },
    get: (documentId: string) => apiClient.get(`/documents/${documentId}`),
    upload: (
      clientId: string,
      file: File,
      documentType: string,
      name?: string,
      description?: string
    ) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", clientId);
      formData.append("document_type", documentType);
      if (name) formData.append("name", name);
      if (description) formData.append("description", description);
      return apiClient.upload("/documents/upload", formData);
    },
    delete: (documentId: string) => apiClient.delete(`/documents/${documentId}`),
    downloadUrl: (documentId: string) => `${API_BASE_URL}/documents/${documentId}/download`,
  },

  // Client Users (Client Login Credentials)
  clientUsers: {
    list: (params?: { skip?: number; limit?: number; search?: string; is_active?: boolean }) => {
      const searchParams = new URLSearchParams({
        skip: String(params?.skip || 0),
        limit: String(params?.limit || 20),
      });
      if (params?.search) searchParams.set("search", params.search);
      if (params?.is_active !== undefined) searchParams.set("is_active", String(params.is_active));
      return apiClient.get(`/client-users?${searchParams}`);
    },
    get: (id: string) => apiClient.get(`/client-users/${id}`),
    getByClient: (clientId: string) => apiClient.get(`/client-users/by-client/${clientId}`),
    create: (data: { client_id: string; email: string; password?: string; send_welcome_email?: boolean }) =>
      apiClient.post("/client-users", data),
    update: (id: string, data: { email?: string; is_active?: boolean }) =>
      apiClient.patch(`/client-users/${id}`, data),
    resetPassword: (id: string, data?: { new_password?: string; send_email?: boolean }) =>
      apiClient.post(`/client-users/${id}/reset-password`, data || {}),
    delete: (id: string) => apiClient.delete(`/client-users/${id}`),
  },

  // Invitations (Client Self-Registration)
  invitations: {
    list: (params?: { skip?: number; limit?: number; status?: string; search?: string }) => {
      const searchParams = new URLSearchParams({
        skip: String(params?.skip || 0),
        limit: String(params?.limit || 20),
      });
      if (params?.status) searchParams.set("status", params.status);
      if (params?.search) searchParams.set("search", params.search);
      return apiClient.get(`/invitations?${searchParams}`);
    },
    get: (id: string) => apiClient.get(`/invitations/${id}`),
    create: (data: {
      email?: string;
      invitee_name?: string;
      message?: string;
      client_id?: string;
      expires_in_days?: number;
    }) => apiClient.post("/invitations", data),
    cancel: (id: string) => apiClient.delete(`/invitations/${id}`),
  },
};

