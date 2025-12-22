"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Search,
  Globe,
  Users,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useProducts, useMyTenantModules, useToggleProductVisibility, useDefaultProducts } from "@/hooks/use-api";
import { Product, RiskLevel, TenantModuleStatus } from "@/types";
import { ProductDialog, DeleteProductDialog, PlatformProductDialog } from "@/components/products";
import { useTranslation, useLocalizedField } from "@/lib/i18n";

export default function ProductsPage() {
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

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");

  // Build query params
  const queryParams = {
    module_id: moduleFilter !== "all" ? moduleFilter : undefined,
    risk_level: riskFilter !== "all" ? riskFilter : undefined,
    visible_only: visibilityFilter === "visible" ? true : visibilityFilter === "hidden" ? false : undefined,
  };

  // Fetch data
  const { data: products, isLoading, error } = useProducts(queryParams);
  const { data: modulesData } = useMyTenantModules();
  const toggleVisibility = useToggleProductVisibility();

  // Filter to only show enabled modules (core modules + enabled tenant modules)
  const enabledModules = (modulesData as TenantModuleStatus[] | undefined)?.filter(
    (m) => m.is_core || m.is_enabled
  ) || [];

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false);
  const [platformEditDialogOpen, setPlatformEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    // Use platform dialog for platform products (is_default=true, no tenant_id)
    if (product.is_default && !product.tenant_id && isPlatformAdmin) {
      setPlatformEditDialogOpen(true);
    } else {
      setEditDialogOpen(true);
    }
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleToggleVisibility = async (product: Product) => {
    try {
      await toggleVisibility.mutateAsync({
        productId: product.id,
        isVisible: !product.is_visible,
      });
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    }
  };

  // Filter products by search query
  const filteredProducts = (products as Product[])?.filter((product) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.name_zh?.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query) ||
      product.module_name?.toLowerCase().includes(query)
    );
  }) || [];

  // Group products by module
  const productsByModule = filteredProducts.reduce((acc, product) => {
    const moduleKey = product.module_id;
    if (!acc[moduleKey]) {
      acc[moduleKey] = {
        moduleName: product.module_name || "Unknown Module",
        moduleCode: product.module_code || "",
        products: [],
      };
    }
    acc[moduleKey].products.push(product);
    return acc;
  }, {} as Record<string, { moduleName: string; moduleCode: string; products: Product[] }>);

  const getRiskLevelColor = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case "conservative":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "moderate":
        return "bg-green-100 text-green-800 border-green-300";
      case "balanced":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "growth":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "aggressive":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("products.title")}</h2>
          <p className="text-muted-foreground">
            {t("products.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          {isPlatformAdmin && (
            <Button variant="outline" onClick={() => setPlatformDialogOpen(true)}>
              <Globe className="mr-2 h-4 w-4" />
              Add Platform Product
            </Button>
          )}
          {isTenantAdmin && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("products.addProduct")}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search") + " " + t("products.title").toLowerCase() + "..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")} {t("modules.title")}</SelectItem>
                {enabledModules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {getLocalizedName(module as any, "name")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="visible">Visible Only</SelectItem>
                <SelectItem value="hidden">Hidden Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Failed to load products. {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(productsByModule).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              {searchQuery
                ? `No products found matching "${searchQuery}"`
                : "No products found. " + (isTenantAdmin ? 'Click "Add Product" to create one.' : "")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(productsByModule).map(([moduleId, { moduleName, moduleCode, products }]) => (
            <div key={moduleId} className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{moduleName}</h3>
                <code className="text-xs bg-muted px-2 py-1 rounded">{moduleCode}</code>
                <Badge variant="outline">{products.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className={`transition-all ${
                      !product.is_visible
                        ? "opacity-60 border-dashed"
                        : "hover:shadow-md"
                    } ${product.tenant_id ? "border-blue-200" : ""}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base">{product.name}</CardTitle>
                            {product.is_default && (
                              <Badge variant="outline" className="text-xs">
                                Platform
                              </Badge>
                            )}
                            {product.tenant_id && (
                              <Badge variant="default" className="text-xs">
                                Custom
                              </Badge>
                            )}
                            {product.is_default && product.is_unlocked_for_all && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-300">
                                <Globe className="mr-1 h-3 w-3" />
                                All Tenants
                              </Badge>
                            )}
                            {product.is_default && !product.is_unlocked_for_all && isPlatformAdmin && (
                              <Badge variant="secondary" className="text-xs">
                                <Users className="mr-1 h-3 w-3" />
                                {product.synced_tenant_ids?.length || 0} Tenants
                              </Badge>
                            )}
                            {!product.is_visible && (
                              <Badge variant="secondary" className="text-xs">
                                <EyeOff className="mr-1 h-3 w-3" />
                                Hidden
                              </Badge>
                            )}
                          </div>
                          {product.name_zh && (
                            <p className="text-sm text-muted-foreground">{product.name_zh}</p>
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
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleVisibility(product)}>
                                {product.is_visible ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Show
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(product)}
                                className="text-destructive focus:text-destructive"
                                disabled={product.is_default && !isPlatformAdmin}
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
                        {product.description || "No description"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getRiskLevelColor(product.risk_level)} variant="outline">
                          {product.risk_level}
                        </Badge>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Min: {product.currency} {product.min_investment.toLocaleString()}
                        </span>
                        {product.expected_return && (
                          <span className="text-green-600 font-medium">
                            {product.expected_return}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Product Dialog */}
      <ProductDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Product Dialog */}
      <ProductDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      {/* Delete Product Dialog */}
      <DeleteProductDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      {/* Platform Product Dialog (Create) */}
      <PlatformProductDialog
        open={platformDialogOpen}
        onOpenChange={setPlatformDialogOpen}
      />

      {/* Platform Product Dialog (Edit) */}
      <PlatformProductDialog
        open={platformEditDialogOpen}
        onOpenChange={(open) => {
          setPlatformEditDialogOpen(open);
          if (!open) setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </div>
  );
}
