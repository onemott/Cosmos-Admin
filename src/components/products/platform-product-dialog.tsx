"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X } from "lucide-react";
import {
  useCreateDefaultProduct,
  useUpdateProduct,
  useUpdateProductSync,
  useAllModules,
  useCategories,
  useTenants,
} from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { Product, ProductCategory, Tenant } from "@/types";
import { ProductDocuments } from "./product-documents";

const riskLevels = ["conservative", "moderate", "balanced", "growth", "aggressive"] as const;
const currencies = ["USD", "HKD", "CNY", "EUR", "GBP", "SGD", "JPY"] as const;

const platformProductSchema = z.object({
  module_id: z.string().min(1, "Module is required"),
  code: z.string()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must be at most 50 characters")
    .regex(/^[a-z0-9_]+$/, "Code must be lowercase letters, numbers, and underscores only"),
  name: z.string().min(1, "Name is required").max(255),
  name_zh: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  description_zh: z.string().max(2000).optional(),
  category: z.string().min(1, "Category is required").max(100),
  category_id: z.string().optional(),
  risk_level: z.enum(riskLevels),
  min_investment: z.coerce.number().min(0, "Must be a positive number"),
  currency: z.enum(currencies),
  expected_return: z.string().max(100).optional(),
  is_unlocked_for_all: z.boolean(),
  tenant_ids: z.array(z.string()).optional(),
});

type PlatformProductFormData = z.infer<typeof platformProductSchema>;

interface PlatformProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function PlatformProductDialog({
  open,
  onOpenChange,
  product,
}: PlatformProductDialogProps) {
  const createMutation = useCreateDefaultProduct();
  const updateMutation = useUpdateProduct(product?.id || "");
  const updateSyncMutation = useUpdateProductSync();
  const { toast } = useToast();

  const { data: modules } = useAllModules();
  const { data: categories } = useCategories();
  const { data: tenantsData } = useTenants({ limit: 100 });

  const tenants = (tenantsData as Tenant[] | undefined) || [];
  const isEdit = !!product;

  const form = useForm<PlatformProductFormData>({
    resolver: zodResolver(platformProductSchema),
    defaultValues: {
      module_id: "",
      code: "",
      name: "",
      name_zh: "",
      description: "",
      description_zh: "",
      category: "",
      category_id: "",
      risk_level: "balanced",
      min_investment: 0,
      currency: "USD",
      expected_return: "",
      is_unlocked_for_all: false,
      tenant_ids: [],
    },
  });

  // Use local state for UI updates to avoid infinite re-render loops with Radix
  const [isUnlockedForAll, setIsUnlockedForAll] = useState(false);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);

  // Sync form values to local state
  useEffect(() => {
    const subscription = form.watch((value) => {
      setIsUnlockedForAll(value.is_unlocked_for_all ?? false);
      // Ensure all items are strings and filter out undefined/null
      const safeTenantIds = (value.tenant_ids ?? [])
        .filter((id): id is string => typeof id === 'string');
      setSelectedTenantIds(safeTenantIds);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (open && product) {
      const formData = {
        module_id: product.module_id,
        code: product.code,
        name: product.name,
        name_zh: product.name_zh || "",
        description: product.description || "",
        description_zh: product.description_zh || "",
        category: product.category,
        category_id: product.category_id || "",
        risk_level: product.risk_level,
        min_investment: product.min_investment,
        currency: product.currency as any,
        expected_return: product.expected_return || "",
        is_unlocked_for_all: product.is_unlocked_for_all || false,
        tenant_ids: product.synced_tenant_ids || [],
      };
      form.reset(formData);
      // Also update local state
      setIsUnlockedForAll(formData.is_unlocked_for_all);
      setSelectedTenantIds(formData.tenant_ids);
    } else if (open && !product) {
      form.reset({
        module_id: "",
        code: "",
        name: "",
        name_zh: "",
        description: "",
        description_zh: "",
        category: "",
        category_id: "",
        risk_level: "balanced",
        min_investment: 0,
        currency: "USD",
        expected_return: "",
        is_unlocked_for_all: false,
        tenant_ids: [],
      });
      // Also update local state
      setIsUnlockedForAll(false);
      setSelectedTenantIds([]);
    }
  }, [open, product, form]);

  const handleSubmit = async (data: PlatformProductFormData) => {
    // Get tenant_ids directly from form state since it may not be in the validated data
    const currentTenantIds = form.getValues("tenant_ids") || [];
    
    try {
      const submitData: Record<string, any> = {
        module_id: data.module_id,
        code: data.code,
        name: data.name.trim(),
        category: data.category.trim(),
        risk_level: data.risk_level,
        min_investment: data.min_investment,
        currency: data.currency,
        is_unlocked_for_all: data.is_unlocked_for_all,
      };

      if (data.name_zh?.trim()) submitData.name_zh = data.name_zh.trim();
      if (data.description?.trim()) submitData.description = data.description.trim();
      if (data.description_zh?.trim()) submitData.description_zh = data.description_zh.trim();
      if (data.category_id) submitData.category_id = data.category_id;
      if (data.expected_return?.trim()) submitData.expected_return = data.expected_return.trim();

      // Use form.getValues for tenant_ids since it may not be in validated data object
      const tenantIdsToSave = currentTenantIds;
      if (!data.is_unlocked_for_all) {
        submitData.tenant_ids = tenantIdsToSave;
      }

      if (isEdit) {
        // Update product data
        await updateMutation.mutateAsync({
          name: submitData.name,
          name_zh: submitData.name_zh,
          description: submitData.description,
          description_zh: submitData.description_zh,
          category: submitData.category,
          category_id: submitData.category_id,
          risk_level: submitData.risk_level,
          min_investment: submitData.min_investment,
          currency: submitData.currency,
          expected_return: submitData.expected_return,
        });

        // Update sync settings
        await updateSyncMutation.mutateAsync({
          productId: product!.id,
          data: {
            is_unlocked_for_all: data.is_unlocked_for_all,
            tenant_ids: data.is_unlocked_for_all ? undefined : tenantIdsToSave,
          },
        });

        toast({
          title: "Product updated",
          description: "Platform product has been updated successfully.",
        });
      } else {
        await createMutation.mutateAsync(submitData);
        toast({
          title: "Product created",
          description: "New platform product has been created successfully.",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      let errorMessage = "Failed to save product. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.detail) {
        errorMessage = typeof error.detail === "string"
          ? error.detail
          : JSON.stringify(error.detail);
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const toggleTenant = (tenantId: string) => {
    const currentIds = form.getValues("tenant_ids") || [];
    const newIds = currentIds.includes(tenantId)
      ? currentIds.filter((id: string) => id !== tenantId)
      : [...currentIds, tenantId];
    // Must use shouldValidate and shouldDirty for react-hook-form to properly track changes
    form.setValue("tenant_ids", newIds, { shouldValidate: true, shouldDirty: true });
    setSelectedTenantIds(newIds);
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    updateSyncMutation.isPending;

  const [activeTab, setActiveTab] = useState("details");

  // Reset tab when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab("details");
    }
  }, [open]);

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Module Selection */}
            <FormField
              control={form.control}
              name="module_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Module *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a module" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(modules as any[])?.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my_product_code"
                      {...field}
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier (lowercase, underscores allowed)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name EN/ZH */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (English) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Product Name" {...field} />
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
                    <FormLabel>Name (Chinese)</FormLabel>
                    <FormControl>
                      <Input placeholder="Product Name in Chinese" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the product..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Risk Level */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(categories as ProductCategory[])?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="risk_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Level *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Min Investment and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_investment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Investment *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        placeholder="10000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Expected Return */}
            <FormField
              control={form.control}
              name="expected_return"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Return</FormLabel>
                  <FormControl>
                    <Input placeholder="6-8% annually" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tenant Access Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Tenant Access</h4>

              {/* Unlock for All Checkbox */}
              <FormField
                control={form.control}
                name="is_unlocked_for_all"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsUnlockedForAll(!!checked);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Unlock for all tenants</FormLabel>
                      <FormDescription>
                        If checked, this product will be available to all tenants automatically.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Tenant Selection (only shown if not unlocked for all) */}
              {!isUnlockedForAll && (
                <div className="space-y-2">
                  <Label>Select Tenants</Label>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Choose which tenants can see this product.
                  </p>

                  {/* Selected tenants badges */}
                  {selectedTenantIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-md">
                      {selectedTenantIds.map((id) => {
                        const tenant = tenants.find((t) => t.id === id);
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => toggleTenant(id)}
                          >
                            {tenant?.name || id}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Tenant list */}
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    {tenants.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">
                        No tenants available
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {tenants.map((tenant) => {
                          const isSelected = selectedTenantIds.includes(tenant.id);
                          return (
                            <label
                              key={tenant.id}
                              className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted ${
                                isSelected ? "bg-muted" : ""
                              }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked !== isSelected) {
                                    toggleTenant(tenant.id);
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{tenant.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {tenant.slug}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </form>
        </Form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Platform Product" : "Create Platform Product"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update product information and tenant access settings."
              : "Create a new platform product and choose which tenants can access it."}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4">
              {formContent}
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <ProductDocuments productId={product!.id} />
            </TabsContent>
          </Tabs>
        ) : (
          formContent
        )}
      </DialogContent>
    </Dialog>
  );
}
