"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";

// Validation schema
const moduleFormSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must be less than 50 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Code can only contain lowercase letters, numbers, and underscores"
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be less than 255 characters"),
  name_zh: z
    .string()
    .max(255, "Chinese name must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  description_zh: z
    .string()
    .max(1000, "Chinese description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  category: z.enum(["basic", "investment", "analytics"]),
  is_core: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export type ModuleFormValues = z.infer<typeof moduleFormSchema>;

interface ModuleFormProps {
  defaultValues?: Partial<ModuleFormValues>;
  onSubmit: (values: ModuleFormValues) => Promise<void>;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function ModuleForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  mode,
}: ModuleFormProps) {
  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      code: "",
      name: "",
      name_zh: "",
      description: "",
      description_zh: "",
      category: "investment",
      is_core: false,
      is_active: true,
      ...defaultValues,
    },
  });

  const handleSubmit = async (values: ModuleFormValues) => {
    // Clean up empty strings to undefined for optional fields
    const cleanedValues = {
      ...values,
      name_zh: values.name_zh || undefined,
      description: values.description || undefined,
      description_zh: values.description_zh || undefined,
    };
    await onSubmit(cleanedValues as ModuleFormValues);
  };

  const isCore = form.watch("is_core");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Module Code *</FormLabel>
              <FormControl>
                <Input
                  placeholder="custom_portfolio"
                  {...field}
                  disabled={isLoading || mode === "edit"}
                />
              </FormControl>
              <FormDescription>
                {mode === "edit"
                  ? "Code cannot be changed after creation"
                  : "Unique identifier (lowercase letters, numbers, underscores)"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (English) *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Custom Portfolio"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name_zh"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (中文)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="私人定制投资组合"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (English)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this module provides..."
                  className="resize-none"
                  rows={2}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description_zh"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (中文)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="描述此模块的功能..."
                  className="resize-none"
                  rows={2}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                  disabled={isLoading}
                >
                  <option value="basic">Basic (Core)</option>
                  <option value="investment">Investment (投资产品模组)</option>
                  <option value="analytics">Analytics (分析模组)</option>
                </select>
              </FormControl>
              <FormDescription>
                Basic modules are typically always-on; investment and analytics modules are unlock-needed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-6">
          {mode === "create" && (
            <FormField
              control={form.control}
              name="is_core"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Core Module</FormLabel>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading || isCore}
                  />
                </FormControl>
                <FormLabel className="font-normal">Active</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {isCore && (
          <p className="text-sm text-muted-foreground">
            Core modules are always active and enabled for all tenants.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Module" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

