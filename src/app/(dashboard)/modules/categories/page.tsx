"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Loader2, MoreHorizontal, Pencil, Trash2, Tag } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCategories } from "@/hooks/use-api";
import { ProductCategory } from "@/types";
import { useTranslation, useLocalizedField } from "@/lib/i18n";

export default function CategoriesPage() {
  const { t } = useTranslation();
  const getLocalizedName = useLocalizedField();
  const { user } = useAuth();

  // Check permissions
  const isPlatformAdmin = user?.roles?.some((role: string) =>
    ["super_admin", "platform_admin"].includes(role)
  );
  const isTenantAdmin = user?.roles?.some((role: string) =>
    ["super_admin", "platform_admin", "tenant_admin"].includes(role)
  );

  // Fetch categories
  const { data: categories, isLoading, error } = useCategories();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  const handleEdit = (category: ProductCategory) => {
    setSelectedCategory(category);
    setEditDialogOpen(true);
  };

  const handleDelete = (category: ProductCategory) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  // Group categories by platform/tenant
  const platformCategories = (categories as ProductCategory[])?.filter((c) => c.tenant_id === null) || [];
  const tenantCategories = (categories as ProductCategory[])?.filter((c) => c.tenant_id !== null) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("categories.title")}</h2>
          <p className="text-muted-foreground">
            {t("categories.subtitle")}
          </p>
        </div>
        {isTenantAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("categories.addCategory")}
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Failed to load categories. {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Platform Default Categories */}
          {platformCategories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Platform Defaults</h3>
                <Badge variant="outline">{platformCategories.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {platformCategories
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((category) => (
                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{category.name}</CardTitle>
                              {!category.is_active && (
                                <Badge variant="outline" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            {category.name_zh && (
                              <p className="text-sm text-muted-foreground">{category.name_zh}</p>
                            )}
                          </div>
                          {isPlatformAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(category)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(category)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                          {category.description || "No description"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <code className="bg-muted px-2 py-1 rounded">{category.code}</code>
                          {category.icon && (
                            <>
                              <span>•</span>
                              <span>Icon: {category.icon}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Order: {category.sort_order}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Tenant-Specific Categories */}
          {tenantCategories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Custom Categories</h3>
                <Badge variant="default">{tenantCategories.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tenantCategories
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((category) => (
                    <Card
                      key={category.id}
                      className="hover:shadow-md transition-shadow border-blue-200"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{category.name}</CardTitle>
                              <Badge variant="default" className="text-xs">
                                Custom
                              </Badge>
                              {!category.is_active && (
                                <Badge variant="outline" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            {category.name_zh && (
                              <p className="text-sm text-muted-foreground">{category.name_zh}</p>
                            )}
                          </div>
                          {isTenantAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(category)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(category)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                          {category.description || "No description"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <code className="bg-muted px-2 py-1 rounded">{category.code}</code>
                          {category.icon && (
                            <>
                              <span>•</span>
                              <span>Icon: {category.icon}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Order: {category.sort_order}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && platformCategories.length === 0 && tenantCategories.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Tag className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No categories found. {isTenantAdmin && 'Click "Add Category" to create one.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TODO: Add dialogs for create/edit/delete */}
      {/* <CategoryDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} /> */}
      {/* <CategoryDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} category={selectedCategory} /> */}
      {/* <DeleteCategoryDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} category={selectedCategory} /> */}
    </div>
  );
}
