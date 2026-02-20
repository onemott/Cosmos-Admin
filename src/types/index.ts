// ============================================================================
// Branding Types
// ============================================================================

export interface TenantBranding {
  app_name?: string;
  primary_color?: string;
  logo_url?: string;
  has_logo?: boolean;
}

export interface BrandingResponse {
  tenant_id: string;
  tenant_name: string;
  app_name?: string;
  primary_color?: string;
  logo_url?: string;
  has_logo: boolean;
}

export interface BrandingUpdate {
  app_name?: string;
  primary_color?: string;
}

// ============================================================================
// Tenant Types
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  contact_email?: string;
  contact_phone?: string;
  branding?: TenantBranding;
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
  // Hierarchy fields
  supervisor_id?: string;
  supervisor_name?: string;
  department?: string;
  employee_code?: string;
  subordinate_count?: number;
}

export interface UserWithHierarchy extends User {
  supervisor?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  subordinates?: User[];
}

export interface TeamTreeNode {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
  employee_code?: string;
  subordinate_count: number;
  children: TeamTreeNode[];
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

// Task Types
export type TaskType =
  | "onboarding"
  | "kyc_review"
  | "document_review"
  | "proposal_approval"
  | "product_request"
  | "compliance_check"
  | "risk_review"
  | "account_opening"
  | "general";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled" | "on_hold";

export type WorkflowState =
  | "draft"
  | "pending_eam"
  | "pending_client"
  | "approved"
  | "declined"
  | "expired";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskClientSummary {
  id: string;
  display_name: string;
  email?: string;
  client_type: string;
}

export interface TaskUserSummary {
  id: string;
  email: string;
  display_name?: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  client_id?: string;
  client?: TaskClientSummary;
  title: string;
  description?: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to_id?: string;
  assigned_to?: TaskUserSummary;
  created_by_id?: string;
  created_by?: TaskUserSummary;
  due_date?: string;
  completed_at?: string;
  workflow_state?: WorkflowState;
  approval_required_by?: string;
  approval_action?: "approved" | "declined";
  approval_comment?: string;
  approval_acted_at?: string;
  proposal_data?: Record<string, unknown>;
  requires_eam_action: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskSummary {
  id: string;
  client_id?: string;
  client_name?: string;
  title: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  workflow_state?: WorkflowState;
  assigned_to_id?: string;
  assigned_to_name?: string;
  due_date?: string;
  requires_eam_action: boolean;
  created_at: string;
}

export interface TaskListResponse {
  tasks: TaskSummary[];
  total_count: number;
  pending_eam_count: number;
  skip: number;
  limit: number;
}

export interface TaskCreate {
  client_id: string;
  title: string;
  description?: string;
  task_type?: TaskType;
  priority?: TaskPriority;
  assigned_to_id?: string;
  due_date?: string;
  workflow_state?: WorkflowState;
  approval_required_by?: string;
  proposal_data?: Record<string, unknown>;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to_id?: string;
  due_date?: string;
  workflow_state?: WorkflowState;
  approval_required_by?: string;
  proposal_data?: Record<string, unknown>;
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

// ============================================================================
// Product Category Types
// ============================================================================

export interface ProductCategory {
  id: string;
  tenant_id: string | null;
  code: string;
  name: string;
  name_zh?: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategoryCreate {
  code: string;
  name: string;
  name_zh?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}

export interface ProductCategoryUpdate {
  name?: string;
  name_zh?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

// ============================================================================
// Product Types
// ============================================================================

export type RiskLevel =
  | "conservative"
  | "moderate"
  | "balanced"
  | "growth"
  | "aggressive";

export interface Product {
  id: string;
  module_id: string;
  tenant_id: string | null;
  category_id: string | null;
  code: string;
  name: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  category: string; // Denormalized display name
  risk_level: RiskLevel;
  min_investment: number;
  currency: string;
  expected_return?: string;
  is_visible: boolean;
  is_default: boolean;
  is_unlocked_for_all: boolean; // If true, available to all tenants
  extra_data?: Record<string, unknown>;
  // Joined fields from API
  module_code?: string;
  module_name?: string;
  category_name?: string;
  synced_tenant_ids?: string[]; // List of tenant IDs this product is synced to (platform admin view)
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  module_id: string;
  code: string;
  name: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  category: string;
  category_id?: string;
  risk_level: RiskLevel;
  min_investment?: number;
  currency?: string;
  expected_return?: string;
  extra_data?: Record<string, unknown>;
}

export interface ProductUpdate {
  name?: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  category?: string;
  category_id?: string;
  risk_level?: RiskLevel;
  min_investment?: number;
  currency?: string;
  expected_return?: string;
  is_visible?: boolean;
  extra_data?: Record<string, unknown>;
}

export interface ProductVisibilityUpdate {
  is_visible: boolean;
}

// For platform admin creating products with tenant sync options
export interface PlatformProductCreate {
  module_id: string;
  code: string;
  name: string;
  name_zh?: string;
  description?: string;
  description_zh?: string;
  category: string;
  category_id?: string;
  risk_level: RiskLevel;
  min_investment?: number;
  currency?: string;
  expected_return?: string;
  extra_data?: Record<string, unknown>;
  is_unlocked_for_all: boolean;
  tenant_ids?: string[];
}

export interface ProductSyncUpdate {
  is_unlocked_for_all?: boolean;
  tenant_ids?: string[];
}

// ============================================================================
// Client User Types (Login Credentials for Clients)
// ============================================================================

export interface ClientUser {
  id: string;
  client_id: string;
  tenant_id: string;
  email: string;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  // Joined client info
  client_name?: string;
  client_type?: string;
}

export interface ClientUserCreate {
  client_id: string;
  email: string;
  password?: string;
  send_welcome_email?: boolean;
}

export interface ClientUserUpdate {
  email?: string;
  is_active?: boolean;
}

export interface ClientUserPasswordReset {
  new_password?: string;
  send_email?: boolean;
}

export interface ClientUserCreateResponse {
  id: string;
  client_id: string;
  email: string;
  is_active: boolean;
  temp_password?: string;
  message: string;
}

export interface ClientUserListResponse {
  client_users: ClientUser[];
  total_count: number;
  skip: number;
  limit: number;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  temp_password?: string;
}

// ============================================================================
// Invitation Types (Client Self-Registration)
// ============================================================================

export type InvitationStatus = "pending" | "used" | "expired" | "cancelled";

export interface Invitation {
  id: string;
  code: string;
  tenant_id: string;
  tenant_name?: string;
  email?: string;
  invitee_name?: string;
  message?: string;
  client_id?: string;
  client_name?: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  created_by_user_id?: string;
  created_by_name?: string;
  used_at?: string;
  used_by_client_user_id?: string;
  is_valid: boolean;
  is_expired: boolean;
}

export interface InvitationCreate {
  email?: string;
  invitee_name?: string;
  message?: string;
  client_id?: string;
  expires_in_days?: number;
}

export interface InvitationListResponse {
  invitations: Invitation[];
  total_count: number;
  skip: number;
  limit: number;
}

// ============================================================================
// Document Types
// ============================================================================

export type DocumentType = "kyc" | "statement" | "report" | "contract" | "tax" | "compliance" | "other";

export type DocumentStatus = "pending" | "approved" | "rejected" | "expired";

export interface ProductDocument {
  id: string;
  name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  description?: string;
  created_at: string;
  uploaded_by_id?: string;
}

export interface ProductDocumentList {
  documents: ProductDocument[];
  total_count: number;
}

export interface ClientDocument {
  id: string;
  name: string;
  document_type: DocumentType;
  status: DocumentStatus;
  file_name: string;
  file_size: number;
  mime_type: string;
  description?: string;
  created_at: string;
  uploaded_by_id?: string;
  client_id?: string;
  product_id?: string;
}

export interface ClientDocumentList {
  documents: ClientDocument[];
  total_count: number;
}

export interface DocumentUploadResponse {
  id: string;
  name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: string;
  description?: string;
  created_at: string;
  uploaded_by_id?: string;
}

