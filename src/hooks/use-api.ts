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

