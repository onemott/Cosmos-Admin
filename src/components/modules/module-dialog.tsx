"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModuleForm, ModuleFormValues } from "./module-form";
import { useCreateModule, useUpdateModule } from "@/hooks/use-api";
import { Module } from "@/types";

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: Module | null; // If provided, we're in edit mode
}

export function ModuleDialog({ open, onOpenChange, module }: ModuleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createModule = useCreateModule();
  const updateModule = useUpdateModule(module?.id ?? "");
  
  const mode = module ? "edit" : "create";
  const title = mode === "create" ? "Add New Module" : "Edit Module";
  const description =
    mode === "create"
      ? "Create a new module for the platform. Modules can be enabled per tenant."
      : "Update the module's information. Code and core status cannot be changed.";

  const handleSubmit = async (values: ModuleFormValues) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createModule.mutateAsync(values);
      } else {
        // Don't send code or is_core in update (they're immutable)
        const { code, is_core, ...updateValues } = values;
        await updateModule.mutateAsync(updateValues);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save module:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultValues: Partial<ModuleFormValues> | undefined = module
    ? {
        code: module.code,
        name: module.name,
        name_zh: module.name_zh ?? "",
        description: module.description ?? "",
        description_zh: module.description_zh ?? "",
        category: module.category,
        is_core: module.is_core,
        is_active: module.is_active,
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ModuleForm
          mode={mode}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

