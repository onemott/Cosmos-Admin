"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductForm } from "./product-form";
import { ProductDocuments } from "./product-documents";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(product?.id || "");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");

  const isEdit = !!product;

  // Reset mutations and tab when dialog closes
  useEffect(() => {
    if (!open) {
      createMutation.reset();
      updateMutation.reset();
      setActiveTab("details");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (data: any) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
        toast({
          title: "Product updated",
          description: "Product has been updated successfully.",
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: "Product created",
          description: "New product has been created successfully.",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      let errorMessage = "Failed to save product. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
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

  const isLoading = isEdit ? updateMutation.isPending : createMutation.isPending;
  const mutationError = isEdit ? updateMutation.error : createMutation.error;

  // Prepare default values for edit mode
  const defaultValues = product
    ? {
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
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Create New Product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update product information. Code and module cannot be changed."
              : "Add a new investment product. Fill in the required fields below."}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4">
              <ProductForm
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                mode="edit"
              />
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <ProductDocuments productId={product.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <ProductForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            mode="create"
          />
        )}

        {mutationError && (
          <p className="text-sm text-destructive mt-2">
            {(mutationError as any)?.message || "An error occurred"}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
