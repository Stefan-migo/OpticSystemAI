"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Tag,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useBranch } from "@/hooks/useBranch";
import { BranchSelector } from "@/components/admin/BranchSelector";
import { useProducts } from "./hooks/useProducts";
import { useProductStats } from "./hooks/useProductStats";
import { useCategories } from "./hooks/useCategories";
import { useProductFilters } from "./hooks/useProductFilters";
import ProductStats from "./components/ProductStats";
import ProductFilters from "./components/ProductFilters";
import ProductActions from "./components/ProductActions";
import ProductList from "./components/ProductList";
import ProductPagination from "./components/ProductPagination";
import QuickActions from "./components/QuickActions";

export default function ProductsPage() {
  const { currentBranchId, isSuperAdmin, branches } = useBranch();
  const isGlobalView = !currentBranchId && isSuperAdmin;

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Load view mode from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem("admin-products-view-mode");
    if (savedViewMode === "grid" || savedViewMode === "table") {
      setViewMode(savedViewMode);
    }
    const savedItemsPerPage = localStorage.getItem(
      "admin-products-items-per-page",
    );
    if (savedItemsPerPage) {
      setItemsPerPage(parseInt(savedItemsPerPage));
    }
  }, []);

  // Filters
  const { filters, updateFilter, resetFilters, applyFilters } =
    useProductFilters();

  // Categories
  const { categories, isLoading: categoriesLoading } = useCategories();

  // Product stats
  const { stats, isLoading: statsLoading } = useProductStats({
    currentBranchId,
    isGlobalView,
    isSuperAdmin,
  });

  // Products with React Query
  const {
    products,
    total,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts({
    page: currentPage,
    itemsPerPage,
    categoryFilter: filters.categoryFilter,
    statusFilter: filters.statusFilter,
    searchTerm: filters.searchTerm,
    showLowStockOnly: filters.showLowStockOnly,
    currentBranchId,
    isGlobalView,
    isSuperAdmin,
  });

  // Calculate total pages
  const totalPages = Math.ceil(total / itemsPerPage);

  // Products are already filtered on the server, no need for client-side filtering
  const filteredProducts = products;

  // Selection for bulk operations
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Bulk operation states
  const [bulkOperation, setBulkOperation] = useState("");
  const [bulkUpdates, setBulkUpdates] = useState<any>({});
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [isDeleteDialog, setIsDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);

  // Import/Export states
  const [showJsonImportDialog, setShowJsonImportDialog] = useState(false);
  const [jsonImportResults, setJsonImportResults] = useState<any>(null);
  const [jsonImportMode, setJsonImportMode] = useState("create");

  // Single product delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Categories management state
  const [categoriesTabActive, setCategoriesTabActive] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.categoryFilter,
    filters.statusFilter,
    filters.searchTerm,
    filters.showLowStockOnly,
  ]);

  // Save view mode to localStorage
  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("admin-products-view-mode", mode);
  };

  // Save items per page to localStorage
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    localStorage.setItem("admin-products-items-per-page", items.toString());
    setCurrentPage(1);
  };

  // Selection handlers
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleSelectAll = () => {
    setSelectedProducts(
      selectedProducts.length === filteredProducts.length
        ? []
        : filteredProducts.map((p) => p.id),
    );
  };

  // Bulk operations
  const handleBulkOperation = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Selecciona al menos un producto");
      return;
    }

    if (!bulkOperation) {
      toast.error("Selecciona una operación");
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: bulkOperation,
          product_ids: selectedProducts,
          updates: {
            ...bulkUpdates,
            force_delete: forceDelete,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || "Failed to perform bulk operation";
        toast.error(errorMessage);
        return;
      }

      const result = await response.json();

      toast.success(
        `Operación completada: ${result.affected_count} productos afectados`,
      );
      setShowBulkDialog(false);
      setIsDeleteDialog(false);
      setSelectedProducts([]);
      setBulkOperation("");
      setBulkUpdates({});
      refetchProducts();
    } catch (error) {
      console.error("Error performing bulk operation:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al realizar la operación masiva";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Import/Export functions
  const handleJsonExport = async () => {
    try {
      const params = new URLSearchParams({
        format: "json",
        ...(filters.categoryFilter !== "all" && {
          category_id: filters.categoryFilter,
        }),
        ...(filters.statusFilter !== "all" && { status: filters.statusFilter }),
      });

      const response = await fetch(`/api/admin/products/bulk?${params}`);
      if (!response.ok) {
        throw new Error("Failed to export products");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `productos-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Productos exportados exitosamente");
    } catch (error) {
      console.error("Error exporting products:", error);
      toast.error("Error al exportar productos");
    }
  };

  const handleJsonImport = async (file: File) => {
    if (!file) return;

    try {
      setProcessing(true);

      const text = await file.text();
      const products = JSON.parse(text);

      const response = await fetch("/api/admin/products/import-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products,
          mode: jsonImportMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to import JSON products");
      }

      const result = await response.json();
      setJsonImportResults(result);

      if (result.success) {
        const summary = result.summary || {};
        let message = `Importación JSON completada: `;
        if (summary.created > 0) message += `${summary.created} creados `;
        if (summary.updated > 0) message += `${summary.updated} actualizados `;
        if (summary.skipped > 0) message += `${summary.skipped} omitidos `;
        toast.success(message);
        refetchProducts();
      } else {
        toast.error("Error en la importación JSON");
      }
    } catch (error) {
      console.error("Error importing JSON products:", error);
      toast.error("Error al importar productos JSON");
    } finally {
      setProcessing(false);
    }
  };

  // Single product delete
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setDeleteLoading(true);

      const response = await fetch(
        `/api/admin/products/${productToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      setDeleteDialogOpen(false);
      setProductToDelete(null);

      toast.success("Producto eliminado exitosamente");
      refetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar el producto");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteDialog = (product: any) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // Utility functions
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      active: { variant: "default", label: "Activo" },
      draft: { variant: "secondary", label: "Borrador" },
      archived: { variant: "outline", label: "Archivado" },
    };

    const statusConfig = config[status] || config["draft"];
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  // Bulk operation form renderer
  const renderBulkOperationForm = () => {
    switch (bulkOperation) {
      case "update_status":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Nuevo Estado</Label>
              <Select
                onValueChange={(value) =>
                  setBulkUpdates({ ...bulkUpdates, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="archived">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "update_category":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Nueva Categoría</Label>
              <Select
                onValueChange={(value) =>
                  setBulkUpdates({ ...bulkUpdates, category_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "update_pricing":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="adjustment_type">Tipo de Ajuste</Label>
              <Select
                value={bulkUpdates.adjustment_type || ""}
                onValueChange={(value) =>
                  setBulkUpdates({ ...bulkUpdates, adjustment_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de ajuste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje</SelectItem>
                  <SelectItem value="fixed">Monto Fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price_adjustment">
                Ajuste{" "}
                {bulkUpdates.adjustment_type === "percentage" ? "(%)" : "($)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder={
                  bulkUpdates.adjustment_type === "percentage"
                    ? "ej: 10 para +10%"
                    : "ej: 500 para +$500"
                }
                onChange={(e) =>
                  setBulkUpdates({
                    ...bulkUpdates,
                    price_adjustment: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>
        );

      case "update_inventory":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="inventory_adjustment_type">Tipo de Ajuste</Label>
              <Select
                value={bulkUpdates.adjustment_type || ""}
                onValueChange={(value) =>
                  setBulkUpdates({ ...bulkUpdates, adjustment_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de ajuste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Establecer cantidad</SelectItem>
                  <SelectItem value="add">Agregar/Quitar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inventory_adjustment">
                {bulkUpdates.adjustment_type === "set"
                  ? "Nueva Cantidad"
                  : "Ajuste (+/-)"}
              </Label>
              <Input
                type="number"
                placeholder={
                  bulkUpdates.adjustment_type === "set"
                    ? "ej: 50"
                    : "ej: -10 o +20"
                }
                onChange={(e) =>
                  setBulkUpdates({
                    ...bulkUpdates,
                    inventory_adjustment: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
        );

      case "delete":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  Confirmar eliminación suave
                </p>
                <p className="text-sm text-red-600">
                  Los {selectedProducts.length} productos seleccionados serán
                  archivados (eliminación suave). Esta acción se puede deshacer
                  cambiando el estado a &quot;Activo&quot;.
                </p>
              </div>
            </div>
          </div>
        );

      case "hard_delete":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 bg-red-100 border border-red-300 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-700" />
              <div>
                <p className="font-medium text-red-900">
                  ⚠️ ELIMINACIÓN PERMANENTE
                </p>
                <p className="text-sm text-red-700 font-medium">
                  Los {selectedProducts.length} productos seleccionados serán
                  ELIMINADOS PERMANENTEMENTE de la base de datos.
                </p>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Esta acción NO se puede deshacer. Todos los datos del
                  producto se perderán para siempre.
                </p>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Recomendación:</strong> Considera usar &quot;Eliminación
                suave&quot; (archivar) en su lugar, que permite recuperar los
                productos si es necesario.
              </p>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="force-delete"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className="mt-1"
                />
                <label
                  htmlFor="force-delete"
                  className="text-sm text-orange-900 font-medium cursor-pointer"
                >
                  Confirmo que entiendo que esta acción es irreversible y deseo
                  continuar con la eliminación permanente.
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Category management functions
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleCategoryInputChange = (field: string, value: string) => {
    setCategoryFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "name") {
      setCategoryFormData((prev) => ({
        ...prev,
        name: value,
        slug: generateSlug(value),
      }));
    }
  };

  const openCreateCategoryDialog = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: "", slug: "", description: "" });
    setCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: any) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
    setCategoryDialogOpen(true);
  };

  const { createCategory, updateCategory, deleteCategory } = useCategories();

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryFormData.name.trim()) {
      toast.error("El nombre de la categoría es requerido");
      return;
    }

    try {
      setCategoryFormLoading(true);

      if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          data: categoryFormData,
        });
      } else {
        await createCategory(categoryFormData);
      }

      setCategoryDialogOpen(false);
      setCategoryFormData({ name: "", slug: "", description: "" });
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setCategoryFormLoading(false);
    }
  };

  const handleDeleteCategory = async (category: any) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`,
      )
    ) {
      return;
    }

    try {
      await deleteCategory(category.id);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  // Loading state
  if (productsLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Package className="h-12 w-12 text-tierra-media mx-auto mb-4 animate-pulse" />
          <p className="text-tierra-media">Cargando productos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (productsError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Error al cargar productos
              </h3>
              <p className="text-gray-600 mb-4">
                {productsError instanceof Error
                  ? productsError.message
                  : "Error desconocido"}
              </p>
              <button
                onClick={() => refetchProducts()}
                className="px-4 py-2 bg-azul-profundo text-white rounded hover:bg-azul-profundo/90"
              >
                Reintentar
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats label
  const currentBranch = branches?.find((b) => b.id === currentBranchId);
  const statsLabel = isGlobalView
    ? "Todas las sucursales"
    : currentBranch
      ? `Sucursal: ${currentBranch.name}`
      : "Sucursal seleccionada";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-azul-profundo">
            Gestión de Productos
          </h1>
          <p className="text-tierra-media">
            Administra tu catálogo de productos y categorías
          </p>
        </div>

        <ProductActions
          selectedProducts={selectedProducts}
          onClearSelection={() => setSelectedProducts([])}
          onBulkDelete={() => {
            setBulkOperation("delete");
            setIsDeleteDialog(true);
            setShowBulkDialog(true);
          }}
          onBulkOperation={() => {
            setIsDeleteDialog(false);
            setBulkOperation("");
            setBulkUpdates({});
            setForceDelete(false);
            setShowBulkDialog(true);
          }}
          onJsonExport={handleJsonExport}
          onJsonImport={() => setShowJsonImportDialog(true)}
        />
      </div>

      {/* Branch Selector */}
      {(isSuperAdmin || (branches && branches.length > 1)) && (
        <Card className="bg-admin-bg-tertiary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sucursal de Trabajo</p>
                <p className="text-xs text-tierra-media mt-1">
                  {isSuperAdmin
                    ? "Selecciona la sucursal para ver y gestionar productos"
                    : "Selecciona la sucursal para gestionar productos"}
                </p>
              </div>
              <BranchSelector />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning if no branch selected */}
      {!currentBranchId && !isSuperAdmin && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                Debes seleccionar una sucursal para ver y gestionar productos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Products and Categories */}
      <Tabs
        value={categoriesTabActive ? "categories" : "products"}
        onValueChange={(value) =>
          setCategoriesTabActive(value === "categories")
        }
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="h-4 w-4 mr-2" />
            Categorías
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <ProductStats
            stats={stats}
            statsLabel={statsLabel}
            formatPrice={formatPrice}
          />

          {/* Search and Filters */}
          <ProductFilters
            searchTerm={filters.searchTerm}
            categoryFilter={filters.categoryFilter}
            statusFilter={filters.statusFilter}
            showLowStockOnly={filters.showLowStockOnly}
            viewMode={viewMode}
            categories={categories}
            onSearchChange={(term) => updateFilter("searchTerm", term)}
            onCategoryChange={(category) =>
              updateFilter("categoryFilter", category)
            }
            onStatusChange={(status) => updateFilter("statusFilter", status)}
            onLowStockToggle={() =>
              updateFilter("showLowStockOnly", !filters.showLowStockOnly)
            }
            onViewModeChange={handleViewModeChange}
          />

          {/* Products Display */}
          <ProductList
            products={filteredProducts}
            viewMode={viewMode}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
            onDelete={openDeleteDialog}
            formatPrice={formatPrice}
            getStatusBadge={getStatusBadge}
          />

          {/* Pagination - Show if there are products or if totalPages > 1 */}
          {(total > 0 || totalPages > 1) && (
            <ProductPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalProducts={total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}

          {/* Quick Actions */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-azul-profundo mb-4">
                Acciones Rápidas
              </h3>
              <QuickActions
                onShowLowStock={() => {
                  updateFilter("showLowStockOnly", true);
                  setCurrentPage(1);
                }}
                onJsonExport={handleJsonExport}
                onJsonImport={() => setShowJsonImportDialog(true)}
                onShowCategories={() => setCategoriesTabActive(true)}
                hasLowStock={stats.lowStockCount > 0}
                lowStockCount={stats.lowStockCount}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6 mt-6">
          {/* Categories Management */}
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-azul-profundo">
                  Gestión de Categorías
                </CardTitle>
                <Button onClick={openCreateCategoryDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Categoría
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-tierra-media mx-auto mb-4 animate-pulse" />
                  <p className="text-tierra-media">Cargando categorías...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="h-16 w-16 text-tierra-media mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-azul-profundo mb-2">
                    No hay categorías
                  </h3>
                  <p className="text-tierra-media mb-6">
                    Crea categorías para organizar tus productos
                  </p>
                  <Button onClick={openCreateCategoryDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Categoría
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card
                      key={category.id}
                      className="bg-admin-bg-secondary"
                      style={{ backgroundColor: "var(--admin-border-primary)" }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-azul-profundo">
                              {category.name}
                            </CardTitle>
                            <p className="text-sm text-tierra-media mt-1">
                              {category.slug}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditCategoryDialog(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {category.description && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {category.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Create/Edit Dialog */}
          <Dialog
            open={categoryDialogOpen}
            onOpenChange={setCategoryDialogOpen}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? "Modifica los datos de la categoría"
                    : "Crea una nueva categoría para organizar tus productos"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Nombre *</Label>
                  <Input
                    id="category-name"
                    value={categoryFormData.name}
                    onChange={(e) =>
                      handleCategoryInputChange("name", e.target.value)
                    }
                    placeholder="Ej: Lentes de Sol"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category-slug">Slug</Label>
                  <Input
                    id="category-slug"
                    value={categoryFormData.slug}
                    onChange={(e) =>
                      handleCategoryInputChange("slug", e.target.value)
                    }
                    placeholder="lentes-de-sol"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL amigable (se genera automáticamente)
                  </p>
                </div>

                <div>
                  <Label htmlFor="category-description">Descripción</Label>
                  <Textarea
                    id="category-description"
                    value={categoryFormData.description}
                    onChange={(e) =>
                      handleCategoryInputChange("description", e.target.value)
                    }
                    placeholder="Descripción opcional de la categoría"
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCategoryDialogOpen(false)}
                    disabled={categoryFormLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={categoryFormLoading}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {categoryFormLoading
                      ? "Guardando..."
                      : editingCategory
                        ? "Actualizar"
                        : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Bulk Operations Dialog */}
      {selectedProducts.length > 0 && (
        <Dialog
          open={showBulkDialog}
          onOpenChange={(open) => {
            setShowBulkDialog(open);
            if (!open) {
              setIsDeleteDialog(false);
              setBulkOperation("");
              setBulkUpdates({});
              setForceDelete(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {bulkOperation === "delete"
                  ? "Archivar Productos"
                  : bulkOperation === "hard_delete"
                    ? "⚠️ Eliminar Permanentemente"
                    : "Operación Masiva"}
              </DialogTitle>
              <DialogDescription>
                {bulkOperation === "delete"
                  ? `Archivar ${selectedProducts.length} productos seleccionados`
                  : bulkOperation === "hard_delete"
                    ? `ELIMINAR PERMANENTEMENTE ${selectedProducts.length} productos seleccionados`
                    : `Aplicar cambios a ${selectedProducts.length} productos seleccionados`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!isDeleteDialog && (
                <div>
                  <Label htmlFor="operation">Operación</Label>
                  <Select
                    value={bulkOperation}
                    onValueChange={setBulkOperation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar operación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="update_status">
                        Cambiar Estado
                      </SelectItem>
                      <SelectItem value="update_category">
                        Cambiar Categoría
                      </SelectItem>
                      <SelectItem value="update_pricing">
                        Ajustar Precios
                      </SelectItem>
                      <SelectItem value="update_inventory">
                        Ajustar Inventario
                      </SelectItem>
                      <SelectItem value="duplicate">
                        Duplicar Productos
                      </SelectItem>
                      <SelectItem value="delete">
                        Archivar Productos (Eliminación Suave)
                      </SelectItem>
                      <SelectItem
                        value="hard_delete"
                        className="text-red-600 font-medium"
                      >
                        ⚠️ Eliminar Permanentemente
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {bulkOperation && renderBulkOperationForm()}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkDialog(false);
                  setIsDeleteDialog(false);
                  setBulkOperation("");
                  setBulkUpdates({});
                  setForceDelete(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkOperation}
                disabled={
                  processing ||
                  !bulkOperation ||
                  (bulkOperation === "hard_delete" && !forceDelete)
                }
                variant={
                  bulkOperation === "delete" || bulkOperation === "hard_delete"
                    ? "destructive"
                    : "default"
                }
              >
                {processing && (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                )}
                {bulkOperation === "delete"
                  ? "Archivar Productos"
                  : bulkOperation === "hard_delete"
                    ? "⚠️ ELIMINAR PERMANENTEMENTE"
                    : "Aplicar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
