import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Tenants
export function useTenants(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () => api.tenants.list(params),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ["tenants", id],
    queryFn: () => api.tenants.get(id),
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.tenants.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.tenants.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenants", id] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.tenants.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useDeleteTenantPermanent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.tenants.deletePermanent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

// Users
export function useUsers(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => api.users.list(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => api.users.get(id),
    enabled: !!id,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: () => api.users.me(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUserPermanent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.users.deletePermanent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useChangePassword(id: string) {
  return useMutation({
    mutationFn: (data: { current_password?: string; new_password: string }) =>
      api.users.changePassword(id, data),
  });
}

// Roles
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => api.roles.list(),
  });
}

// Clients
export function useClients(params?: {
  skip?: number;
  limit?: number;
  search?: string;
  kyc_status?: string;
}) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () => api.clients.list(params),
  });
}

export function useClient(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => api.clients.get(id),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.clients.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.clients.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.clients.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useClientAccounts(id: string) {
  return useQuery({
    queryKey: ["clients", id, "accounts"],
    queryFn: () => api.clients.accounts(id),
    enabled: !!id,
  });
}

export function useClientDocuments(id: string) {
  return useQuery({
    queryKey: ["clients", id, "documents"],
    queryFn: () => api.clients.documents(id),
    enabled: !!id,
  });
}

// Client Modules
export function useClientModules(clientId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["clients", clientId, "modules"],
    queryFn: () => api.clients.modules(clientId),
    enabled: options?.enabled !== undefined ? options.enabled : !!clientId,
  });
}

export function useEnableClientModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      moduleId,
    }: {
      clientId: string;
      moduleId: string;
    }) => api.clients.enableModule(clientId, moduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients", variables.clientId, "modules"] });
    },
  });
}

export function useDisableClientModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      moduleId,
    }: {
      clientId: string;
      moduleId: string;
    }) => api.clients.disableModule(clientId, moduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients", variables.clientId, "modules"] });
    },
  });
}

// Modules

// List modules for current user's tenant (with is_enabled status)
export function useMyTenantModules() {
  return useQuery({
    queryKey: ["modules", "my-tenant"],
    queryFn: () => api.modules.list(),
  });
}

// List all modules in platform catalogue (platform users)
export function useAllModules() {
  return useQuery({
    queryKey: ["modules", "all"],
    queryFn: () => api.modules.listAll(),
  });
}

// List modules for a specific tenant (platform users)
export function useTenantModules(tenantId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["modules", "tenant", tenantId],
    queryFn: () => api.modules.listForTenant(tenantId),
    enabled: options?.enabled !== undefined ? options.enabled : !!tenantId,
  });
}

// Get a specific module
export function useModule(moduleId: string) {
  return useQuery({
    queryKey: ["modules", moduleId],
    queryFn: () => api.modules.get(moduleId),
    enabled: !!moduleId,
  });
}

// Create a new module (platform admin)
export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.modules.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
}

// Update a module (platform admin)
export function useUpdateModule(moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.modules.update(moduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
}

// Delete a module (platform admin)
export function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => api.modules.delete(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
  });
}

// Enable module for a tenant (platform admin)
export function useEnableTenantModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      tenantId,
    }: {
      moduleId: string;
      tenantId: string;
    }) => api.modules.enable(moduleId, tenantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["modules", "tenant", variables.tenantId] });
    },
  });
}

// Disable module for a tenant (platform admin)
export function useDisableTenantModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      tenantId,
    }: {
      moduleId: string;
      tenantId: string;
    }) => api.modules.disable(moduleId, tenantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["modules", "tenant", variables.tenantId] });
    },
  });
}

// Request access to a module (tenant admin)
export function useRequestModuleAccess() {
  return useMutation({
    mutationFn: (data: { module_code: string; message?: string }) =>
      api.modules.requestAccess(data),
  });
}

// Tasks
export interface TaskFilters {
  skip?: number;
  limit?: number;
  client_id?: string;
  status?: string;
  task_type?: string;
  workflow_state?: string;
  assigned_to_me?: boolean;
  pending_eam_only?: boolean;
}

export function useTasks(params?: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => api.tasks.list(params),
  });
}

export function useTask(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => api.tasks.get(id),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.tasks.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      api.tasks.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.id] });
    },
  });
}

export function useRespondToTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      comment,
      proposal_data,
    }: {
      id: string;
      action: string;
      comment?: string;
      proposal_data?: unknown;
    }) => api.tasks.respond(id, { action, comment, proposal_data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.id] });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      api.tasks.assign(taskId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.taskId] });
    },
  });
}

// Client Tasks (for client detail page)
export function useClientTasks(clientId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["tasks", { client_id: clientId }],
    queryFn: () => api.tasks.list({ client_id: clientId }),
    enabled: options?.enabled !== undefined ? options.enabled : !!clientId,
  });
}

// Audit Logs
export function useAuditLogs(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: () => api.audit.list(params),
  });
}

// Statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ["stats", "dashboard"],
    queryFn: () => api.stats.dashboard(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTenantStats() {
  return useQuery({
    queryKey: ["stats", "tenant"],
    queryFn: () => api.stats.tenant(),
    refetchInterval: 30000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ["stats", "health"],
    queryFn: () => api.stats.health(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

// ============================================================================
// Product Categories
// ============================================================================

export interface CategoryFilters {
  include_inactive?: boolean;
}

// List categories for current tenant (includes platform defaults)
export function useCategories(params?: CategoryFilters) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => api.categories.list(params),
  });
}

// List platform default categories (platform admin)
export function useDefaultCategories(params?: CategoryFilters) {
  return useQuery({
    queryKey: ["categories", "defaults", params],
    queryFn: () => api.categories.listDefaults(params),
  });
}

// Get a specific category
export function useCategory(categoryId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["categories", categoryId],
    queryFn: () => api.categories.get(categoryId),
    enabled: options?.enabled !== undefined ? options.enabled : !!categoryId,
  });
}

// Create tenant-specific category
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// Create platform default category (platform admin)
export function useCreateDefaultCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.categories.createDefault(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// Update a category
export function useUpdateCategory(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.categories.update(categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", categoryId] });
    },
  });
}

// Delete a category
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => api.categories.delete(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// ============================================================================
// Products
// ============================================================================

export interface ProductFilters {
  module_id?: string;
  module_code?: string;
  category_id?: string;
  risk_level?: string;
  visible_only?: boolean;
  skip?: number;
  limit?: number;
}

// List products for current tenant (includes platform defaults)
export function useProducts(params?: ProductFilters) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => api.products.list(params),
  });
}

// List platform default products (platform admin)
export function useDefaultProducts(params?: { module_id?: string; visible_only?: boolean }) {
  return useQuery({
    queryKey: ["products", "defaults", params],
    queryFn: () => api.products.listDefaults(params),
  });
}

// Get a specific product
export function useProduct(productId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["products", productId],
    queryFn: () => api.products.get(productId),
    enabled: options?.enabled !== undefined ? options.enabled : !!productId,
  });
}

// Create tenant-specific product
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.products.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Create platform default product (platform admin)
export function useCreateDefaultProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.products.createDefault(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Update a product
export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.products.update(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", productId] });
    },
  });
}

// Toggle product visibility
export function useToggleProductVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, isVisible }: { productId: string; isVisible: boolean }) =>
      api.products.toggleVisibility(productId, isVisible),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
    },
  });
}

// Delete a product
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => api.products.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// Update product sync settings (platform admin)
export function useUpdateProductSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: { is_unlocked_for_all?: boolean; tenant_ids?: string[] };
    }) => api.products.updateSync(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
    },
  });
}

// ============================================================================
// Client Users (Login Credentials)
// ============================================================================

export interface ClientUserFilters {
  skip?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export function useClientUsers(params?: ClientUserFilters) {
  return useQuery({
    queryKey: ["clientUsers", params],
    queryFn: () => api.clientUsers.list(params),
  });
}

export function useClientUser(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["clientUsers", id],
    queryFn: () => api.clientUsers.get(id),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

export function useClientUserByClient(clientId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["clientUsers", "by-client", clientId],
    queryFn: () => api.clientUsers.getByClient(clientId),
    enabled: options?.enabled !== undefined ? options.enabled : !!clientId,
    retry: false, // Don't retry on 404 - client may not have credentials yet
  });
}

export function useCreateClientUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { client_id: string; email: string; password?: string; send_welcome_email?: boolean }) =>
      api.clientUsers.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientUsers"] });
      queryClient.invalidateQueries({ queryKey: ["clientUsers", "by-client", variables.client_id] });
    },
  });
}

export function useUpdateClientUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email?: string; is_active?: boolean }) =>
      api.clientUsers.update(id, data),
    onSuccess: () => {
      // Invalidate all clientUsers queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["clientUsers"] });
    },
  });
}

export function useResetClientUserPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { new_password?: string; send_email?: boolean } }) =>
      api.clientUsers.resetPassword(id, data),
  });
}

export function useDeleteClientUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.clientUsers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientUsers"] });
    },
  });
}

// ============================================================================
// Invitations (Client Self-Registration)
// ============================================================================

export interface InvitationFilters {
  skip?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export function useInvitations(params?: InvitationFilters) {
  return useQuery({
    queryKey: ["invitations", params],
    queryFn: () => api.invitations.list(params),
  });
}

export function useInvitation(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["invitations", id],
    queryFn: () => api.invitations.get(id),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email?: string;
      invitee_name?: string;
      message?: string;
      client_id?: string;
      expires_in_days?: number;
    }) => api.invitations.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.invitations.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

