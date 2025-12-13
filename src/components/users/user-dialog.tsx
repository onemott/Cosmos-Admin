"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserForm, UserFormValues } from "./user-form";
import { useCreateUser, useUpdateUser, useTenants, useRoles } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth-context";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
  is_active: boolean;
  is_superuser: boolean;
  roles: string[];  // Array of role names
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null; // If provided, we're in edit mode
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth();
  const { data: tenants } = useTenants();
  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id ?? "");
  
  const isSuperAdmin = currentUser?.roles.includes("super_admin") ?? false;
  const isAdmin = isSuperAdmin || currentUser?.roles.some(role =>
    ["platform_admin", "tenant_admin"].includes(role)
  );
  
  const tenantList = (tenants as Tenant[]) || [];
  const roleList = (roles as Role[]) || [];
  
  const mode = user ? "edit" : "create";
  const title = mode === "create" ? "Add New User" : "Edit User";
  const description =
    mode === "create"
      ? "Create a new user account. They will be able to access the platform based on their role."
      : "Update the user's information.";

  const handleSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createUser.mutateAsync(values);
      } else {
        // Don't send password if empty, don't send tenant_id (immutable)
        const { password, tenant_id, ...updateValues } = values;
        const updateData = password 
          ? { ...updateValues, password } 
          : updateValues;
        await updateUser.mutateAsync(updateData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultValues: Partial<UserFormValues> | undefined = user
    ? {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        tenant_id: user.tenant_id,
        role_ids: roleList
          .filter((role) => user.roles.includes(role.name))
          .map((role) => role.id),
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <UserForm
          mode={mode}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          tenants={tenantList}
          roles={roleList}
          showTenantSelector={isSuperAdmin && mode === "create"}
          showRoleSelector={isAdmin}
          currentTenantId={currentUser?.tenantId}
        />
      </DialogContent>
    </Dialog>
  );
}

