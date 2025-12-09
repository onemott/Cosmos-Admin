export interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  contact_email?: string;
  contact_phone?: string;
  branding?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  roles?: string[];
}

export interface Client {
  id: string;
  tenant_id: string;
  client_type: "individual" | "entity" | "trust";
  first_name?: string;
  last_name?: string;
  entity_name?: string;
  email?: string;
  phone?: string;
  kyc_status: "pending" | "in_progress" | "approved" | "rejected" | "expired";
  risk_profile?: "conservative" | "moderate" | "balanced" | "growth" | "aggressive";
  created_at: string;
  updated_at: string;
}

export type ModuleCategory = "basic" | "investment" | "analytics";

export interface Module {
  id: string;
  code: string;
  name: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  category: ModuleCategory;
  version: string;
  is_active: boolean;
  is_core: boolean;
  config_schema?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Module with tenant-specific enabled status
export interface TenantModuleStatus {
  id: string;
  code: string;
  name: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  category: ModuleCategory;
  version: string;
  is_core: boolean;
  is_active: boolean;
  is_enabled: boolean; // Tenant-specific: true for core modules, or per TenantModule record
  created_at: string;
  updated_at: string;
}

export interface TenantModule {
  id: string;
  tenant_id: string;
  module_id: string;
  is_enabled: boolean;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ModuleCreate {
  code: string;
  name: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  category: ModuleCategory;
  is_core?: boolean;
  is_active?: boolean;
}

export interface ModuleUpdate {
  name?: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  category?: ModuleCategory;
  is_active?: boolean;
}

export interface ModuleAccessRequest {
  module_code: string;
  message?: string;
}

export interface ModuleAccessRequestResponse {
  status: string;
  message: string;
}

// Client module status (includes tenant and client enable flags)
export interface ClientModuleStatus {
  id: string;
  code: string;
  name: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  category: ModuleCategory;
  version: string;
  is_core: boolean;
  is_active: boolean;
  is_tenant_enabled: boolean; // Whether tenant has this module
  is_client_enabled: boolean; // Client-specific enabled status
  created_at: string;
  updated_at: string;
}

export interface BankConnection {
  id: string;
  tenant_id: string;
  client_id: string;
  bank_code: string;
  bank_name: string;
  status: "active" | "pending" | "error" | "disconnected";
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  tenant_id: string;
  client_id: string;
  bank_connection_id?: string;
  account_number: string;
  account_name: string;
  account_type: "investment" | "custody" | "cash" | "margin";
  currency: string;
  is_active: boolean;
  total_value: number;
  cash_balance: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  event_type: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface ApiError {
  detail: string;
  code?: string;
  errors?: Record<string, unknown>[];
}

