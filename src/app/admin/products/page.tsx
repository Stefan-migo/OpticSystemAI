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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Search,
  Eye,
  EyeOff,
  Upload,
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
import { formatCurrency } from "@/lib/utils";

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

  // Tabs management state
  const [activeTab, setActiveTab] = useState<
    "products" | "categories" | "lens-families" | "lens-matrices"
  >("products");
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

      // Prepare headers with branch context
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (currentBranchId) {
        headers["x-branch-id"] = currentBranchId;
      } else if (isSuperAdmin) {
        headers["x-branch-id"] = "global";
      }

      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers,
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
      setIsDeleteDialog(false);
      setSelectedProducts([]);
      setBulkOperation("");
      setBulkUpdates({});
      setForceDelete(false);
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

  // Format price helper function
  const formatPrice = (price: number | null | undefined): string => {
    return formatCurrency(price || 0);
  };

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
          <div className="space-y-2">
            <div>
              <Label htmlFor="status" className="text-xs">
                Nuevo Estado
              </Label>
              <Select
                onValueChange={(value) =>
                  setBulkUpdates({ ...bulkUpdates, status: value })
                }
              >
                <SelectTrigger className="h-9 mt-1">
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
          <div className="space-y-2">
            <div>
              <Label htmlFor="category" className="text-xs">
                Nueva Categoría
              </Label>
              <Select
                onValueChange={(value) =>
                  setBulkUpdates({ ...bulkUpdates, category_id: value })
                }
              >
                <SelectTrigger className="h-9 mt-1">
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
          <div className="space-y-2">
            <div>
              <Label htmlFor="adjustment_type" className="text-xs">
                Tipo de Ajuste
              </Label>
              <Select
                value={bulkUpdates.adjustment_type || ""}
                onValueChange={(value) =>
                  setBulkUpdates({ ...bulkUpdates, adjustment_type: value })
                }
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Tipo de ajuste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje</SelectItem>
                  <SelectItem value="fixed">Monto Fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price_adjustment" className="text-xs">
                Ajuste{" "}
                {bulkUpdates.adjustment_type === "percentage" ? "(%)" : "($)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                className="h-9 mt-1"
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
          <div className="space-y-2">
            <div>
              <Label htmlFor="inventory_adjustment_type" className="text-xs">
                Tipo de Ajuste
              </Label>
              <Select
                value={bulkUpdates.adjustment_type || ""}
                onValueChange={(value) =>
                  setBulkUpdates({ ...bulkUpdates, adjustment_type: value })
                }
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Tipo de ajuste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Establecer cantidad</SelectItem>
                  <SelectItem value="add">Agregar/Quitar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inventory_adjustment" className="text-xs">
                {bulkUpdates.adjustment_type === "set"
                  ? "Nueva Cantidad"
                  : "Ajuste (+/-)"}
              </Label>
              <Input
                type="number"
                className="h-9 mt-1"
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
          <div className="space-y-2">
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800 text-sm">
                  Confirmar eliminación suave
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Los {selectedProducts.length} productos serán archivados. Esta
                  acción se puede deshacer.
                </p>
              </div>
            </div>
          </div>
        );

      case "hard_delete":
        return (
          <div className="space-y-2">
            <div className="flex items-start space-x-2 p-3 bg-red-100 border border-red-300 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900 text-sm">
                  ⚠️ ELIMINACIÓN PERMANENTE
                </p>
                <p className="text-xs text-red-700 font-medium mt-0.5">
                  Los {selectedProducts.length} productos serán ELIMINADOS
                  PERMANENTEMENTE.
                </p>
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Esta acción NO se puede deshacer.
                </p>
              </div>
            </div>
            <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Recomendación:</strong> Considera usar &quot;Eliminación
                suave&quot; (archivar) en su lugar.
              </p>
            </div>
            <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="force-delete"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="force-delete"
                  className="text-xs text-orange-900 font-medium cursor-pointer leading-tight"
                >
                  Confirmo que entiendo que esta acción es irreversible y deseo
                  continuar.
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
          }}
          onBulkOperation={() => {
            setIsDeleteDialog(false);
            setBulkOperation("");
            setBulkUpdates({});
            setForceDelete(false);
            // Scroll to panel when opened
            setTimeout(() => {
              const panel = document.querySelector("[data-bulk-panel]");
              panel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 100);
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

      {/* Tabs for Products, Categories, Lens Families, and Lens Matrices */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(
            value as
              | "products"
              | "categories"
              | "lens-families"
              | "lens-matrices",
          )
        }
        className="w-full"
      >
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="h-4 w-4 mr-2" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="lens-families">
            <Tag className="h-4 w-4 mr-2" />
            Familias de Lentes
          </TabsTrigger>
          <TabsTrigger value="lens-matrices">
            <Tag className="h-4 w-4 mr-2" />
            Matrices de Precios
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

          {/* Bulk Operations Panel - Shows when products are selected */}
          {selectedProducts.length > 0 && (
            <Card
              data-bulk-panel
              className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800 shadow-lg animate-in slide-in-from-top-2 duration-300"
              style={{ position: "relative", zIndex: 1 }}
            >
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-blue-900 dark:text-blue-100">
                        Operaciones Masivas
                      </CardTitle>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {selectedProducts.length} producto
                        {selectedProducts.length > 1 ? "s" : ""} seleccionado
                        {selectedProducts.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsDeleteDialog(false);
                      setBulkOperation("");
                      setBulkUpdates({});
                      setForceDelete(false);
                      setSelectedProducts([]);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {!isDeleteDialog && (
                  <div>
                    <Label
                      htmlFor="operation"
                      className="text-xs font-semibold"
                    >
                      Seleccionar Operación
                    </Label>
                    <Select
                      value={bulkOperation}
                      onValueChange={setBulkOperation}
                    >
                      <SelectTrigger className="mt-1.5 h-9">
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

                {bulkOperation && (
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                    {renderBulkOperationForm()}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialog(false);
                      setBulkOperation("");
                      setBulkUpdates({});
                      setForceDelete(false);
                      setSelectedProducts([]);
                    }}
                    disabled={processing}
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
                      bulkOperation === "delete" ||
                      bulkOperation === "hard_delete"
                        ? "destructive"
                        : "default"
                    }
                    className="min-w-[140px]"
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : bulkOperation === "delete" ? (
                      "Archivar Productos"
                    ) : bulkOperation === "hard_delete" ? (
                      "⚠️ ELIMINAR PERMANENTEMENTE"
                    ) : (
                      "Aplicar Cambios"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                onShowCategories={() => setActiveTab("categories")}
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

        {/* Lens Families Tab */}
        <TabsContent value="lens-families" className="space-y-6 mt-6">
          <LensFamiliesTabContent />
        </TabsContent>

        {/* Lens Matrices Tab */}
        <TabsContent value="lens-matrices" className="space-y-6 mt-6">
          <LensMatricesTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Lens Families Tab Content Component
function LensFamiliesTabContent() {
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingFamily, setEditingFamily] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    lens_type: "single_vision",
    lens_material: "cr39",
    description: "",
    is_active: true,
  });
  const [includeInactive, setIncludeInactive] = useState(false);

  const LENS_TYPES = [
    { value: "single_vision", label: "Monofocal" },
    { value: "bifocal", label: "Bifocal" },
    { value: "trifocal", label: "Trifocal" },
    { value: "progressive", label: "Progresivo" },
    { value: "reading", label: "Lectura" },
    { value: "computer", label: "Computadora" },
    { value: "sports", label: "Deportivo" },
  ];

  const LENS_MATERIALS = [
    { value: "cr39", label: "CR-39" },
    { value: "polycarbonate", label: "Policarbonato" },
    { value: "high_index_1_67", label: "Alto Índice 1.67" },
    { value: "high_index_1_74", label: "Alto Índice 1.74" },
    { value: "trivex", label: "Trivex" },
    { value: "glass", label: "Vidrio" },
  ];

  useEffect(() => {
    fetchFamilies();
  }, [includeInactive]);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (includeInactive) {
        params.append("include_inactive", "true");
      }
      const response = await fetch(
        `/api/admin/lens-families?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Error al cargar familias");
      }
      const data = await response.json();
      setFamilies(data.families || []);
    } catch (error) {
      console.error("Error fetching families:", error);
      toast.error("Error al cargar familias de lentes");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (family?: any) => {
    if (family) {
      setEditingFamily(family);
      setFormData({
        name: family.name,
        brand: family.brand || "",
        lens_type: family.lens_type || "single_vision",
        lens_material: family.lens_material || "cr39",
        description: family.description || "",
        is_active: family.is_active,
      });
    } else {
      setEditingFamily(null);
      setFormData({
        name: "",
        brand: "",
        lens_type: "single_vision",
        lens_material: "cr39",
        description: "",
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingFamily(null);
    setFormData({
      name: "",
      brand: "",
      lens_type: "single_vision",
      lens_material: "cr39",
      description: "",
      is_active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFamily
        ? `/api/admin/lens-families/${editingFamily.id}`
        : "/api/admin/lens-families";
      const method = editingFamily ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          brand: formData.brand || null,
          lens_type: formData.lens_type,
          lens_material: formData.lens_material,
          description: formData.description || null,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar familia");
      }

      toast.success(
        editingFamily
          ? "Familia actualizada exitosamente"
          : "Familia creada exitosamente",
      );
      handleCloseDialog();
      fetchFamilies();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar familia");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas desactivar esta familia?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/lens-families/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al desactivar familia");
      }

      toast.success("Familia desactivada exitosamente");
      fetchFamilies();
    } catch (error) {
      toast.error("Error al desactivar familia");
    }
  };

  const filteredFamilies = families.filter((family) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      family.name.toLowerCase().includes(searchLower) ||
      (family.brand && family.brand.toLowerCase().includes(searchLower)) ||
      (family.description &&
        family.description.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Familias de Lentes</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona las familias comerciales de lentes
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Familia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Familias</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIncludeInactive(!includeInactive)}
              >
                {includeInactive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar Inactivas
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Mostrar Inactivas
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchFamilies}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, marca o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : filteredFamilies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron familias de lentes
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFamilies.map((family) => (
                  <TableRow key={family.id}>
                    <TableCell className="font-medium">{family.name}</TableCell>
                    <TableCell>{family.brand || "-"}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {family.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={family.is_active ? "default" : "secondary"}
                      >
                        {family.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(family)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {family.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(family.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFamily ? "Editar Familia" : "Nueva Familia"}
            </DialogTitle>
            <DialogDescription>
              {editingFamily
                ? "Modifica los datos de la familia de lentes"
                : "Crea una nueva familia comercial de lentes"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Poly Blue Defense"
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  placeholder="Ej: Essilor, Zeiss, Rodenstock"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Lente *</Label>
                  <Select
                    value={formData.lens_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, lens_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {LENS_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Material *</Label>
                  <Select
                    value={formData.lens_material}
                    onValueChange={(value) =>
                      setFormData({ ...formData, lens_material: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona material" />
                    </SelectTrigger>
                    <SelectContent>
                      {LENS_MATERIALS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción de la familia de lentes"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Activa
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingFamily ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Lens Matrices Tab Content Component
function LensMatricesTabContent() {
  const [matrices, setMatrices] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingMatrix, setEditingMatrix] = useState<any>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formData, setFormData] = useState({
    lens_family_id: "",
    sphere_min: "",
    sphere_max: "",
    cylinder_min: "",
    cylinder_max: "",
    addition_min: "0",
    addition_max: "4.0",
    base_price: "",
    sourcing_type: "surfaced" as "stock" | "surfaced",
    cost: "",
    is_active: true,
  });

  const LENS_TYPES = [
    { value: "single_vision", label: "Monofocal" },
    { value: "bifocal", label: "Bifocal" },
    { value: "trifocal", label: "Trifocal" },
    { value: "progressive", label: "Progresivo" },
    { value: "reading", label: "Lectura" },
    { value: "computer", label: "Computadora" },
    { value: "sports", label: "Deportivo" },
  ];

  const LENS_MATERIALS = [
    { value: "cr39", label: "CR-39" },
    { value: "polycarbonate", label: "Policarbonato" },
    { value: "high_index_1_67", label: "Alto Índice 1.67" },
    { value: "high_index_1_74", label: "Alto Índice 1.74" },
    { value: "trivex", label: "Trivex" },
    { value: "glass", label: "Vidrio" },
  ];

  useEffect(() => {
    fetchFamilies();
    fetchMatrices();
  }, [includeInactive, selectedFamilyId]);

  const fetchFamilies = async () => {
    try {
      const response = await fetch(
        "/api/admin/lens-families?include_inactive=true",
      );
      if (response.ok) {
        const data = await response.json();
        setFamilies(data.families || []);
      }
    } catch (error) {
      console.error("Error fetching families:", error);
    }
  };

  const fetchMatrices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFamilyId !== "all") {
        params.append("family_id", selectedFamilyId);
      }
      if (includeInactive) {
        params.append("include_inactive", "true");
      }
      const response = await fetch(
        `/api/admin/lens-matrices?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Error al cargar matrices");
      }
      const data = await response.json();
      setMatrices(data.matrices || []);
    } catch (error) {
      console.error("Error fetching matrices:", error);
      toast.error("Error al cargar matrices de precios");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (matrix?: any) => {
    if (matrix) {
      setEditingMatrix(matrix);
      setFormData({
        lens_family_id: matrix.lens_family_id,
        sphere_min: matrix.sphere_min.toString(),
        sphere_max: matrix.sphere_max.toString(),
        cylinder_min: matrix.cylinder_min.toString(),
        cylinder_max: matrix.cylinder_max.toString(),
        addition_min: (matrix as any).addition_min?.toString() || "0",
        addition_max: (matrix as any).addition_max?.toString() || "4.0",
        base_price: matrix.base_price.toString(),
        sourcing_type: matrix.sourcing_type as "stock" | "surfaced",
        cost: matrix.cost.toString(),
        is_active: matrix.is_active,
      });
    } else {
      setEditingMatrix(null);
      setFormData({
        lens_family_id: selectedFamilyId !== "all" ? selectedFamilyId : "",
        sphere_min: "",
        sphere_max: "",
        cylinder_min: "",
        cylinder_max: "",
        addition_min: "0",
        addition_max: "4.0",
        base_price: "",
        sourcing_type: "surfaced",
        cost: "",
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingMatrix(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMatrix
        ? `/api/admin/lens-matrices/${editingMatrix.id}`
        : "/api/admin/lens-matrices";
      const method = editingMatrix ? "PUT" : "POST";

      const body: any = {
        lens_family_id: formData.lens_family_id,
        sphere_min: parseFloat(formData.sphere_min),
        sphere_max: parseFloat(formData.sphere_max),
        cylinder_min: parseFloat(formData.cylinder_min),
        cylinder_max: parseFloat(formData.cylinder_max),
        addition_min: parseFloat(formData.addition_min),
        addition_max: parseFloat(formData.addition_max),
        base_price: parseFloat(formData.base_price),
        cost: parseFloat(formData.cost),
        sourcing_type: formData.sourcing_type,
        is_active: formData.is_active,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar matriz");
      }

      toast.success(
        editingMatrix
          ? "Matriz actualizada exitosamente"
          : "Matriz creada exitosamente",
      );
      handleCloseDialog();
      fetchMatrices();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar matriz");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta matriz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/lens-matrices/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar matriz");
      }

      toast.success("Matriz eliminada exitosamente");
      fetchMatrices();
    } catch (error) {
      toast.error("Error al eliminar matriz");
    }
  };

  const filteredMatrices = matrices.filter((matrix) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      matrix.lens_families.name.toLowerCase().includes(searchLower) ||
      (matrix.lens_families.brand || "").toLowerCase().includes(searchLower) ||
      matrix.sourcing_type.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Matrices de Precios de Lentes</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona las matrices de precios para calcular costos de lentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Matriz
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Matrices</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIncludeInactive(!includeInactive)}
              >
                {includeInactive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar Inactivas
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Mostrar Inactivas
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchMatrices}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por familia, tipo o material..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <Select
                value={selectedFamilyId}
                onValueChange={setSelectedFamilyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por familia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las familias</SelectItem>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : filteredMatrices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron matrices de precios
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Familia</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Rango Esfera</TableHead>
                    <TableHead>Rango Cilindro</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead>Costo Compra</TableHead>
                    <TableHead>Sourcing</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatrices.map((matrix) => (
                    <TableRow key={matrix.id}>
                      <TableCell className="font-medium">
                        {matrix.lens_families.name}
                      </TableCell>
                      <TableCell>
                        {
                          LENS_TYPES.find(
                            (t) => t.value === matrix.lens_families.lens_type,
                          )?.label
                        }
                      </TableCell>
                      <TableCell>
                        {
                          LENS_MATERIALS.find(
                            (m) =>
                              m.value === matrix.lens_families.lens_material,
                          )?.label
                        }
                      </TableCell>
                      <TableCell>
                        {matrix.sphere_min} a {matrix.sphere_max}
                      </TableCell>
                      <TableCell>
                        {matrix.cylinder_min} a {matrix.cylinder_max}
                      </TableCell>
                      <TableCell>{formatCurrency(matrix.base_price)}</TableCell>
                      <TableCell>{formatCurrency(matrix.cost)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {matrix.sourcing_type === "stock"
                            ? "Stock"
                            : "Surfaced"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={matrix.is_active ? "default" : "secondary"}
                        >
                          {matrix.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(matrix)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(matrix.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMatrix ? "Editar Matriz" : "Nueva Matriz"}
            </DialogTitle>
            <DialogDescription>
              {editingMatrix
                ? "Modifica los datos de la matriz de precios"
                : "Crea una nueva matriz de precios para lentes"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="lens_family_id">Familia de Lente *</Label>
                <Select
                  value={formData.lens_family_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, lens_family_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar familia" />
                  </SelectTrigger>
                  <SelectContent>
                    {families
                      .filter((f) => f.is_active !== false)
                      .map((family) => (
                        <SelectItem key={family.id} value={family.id}>
                          {family.name} {family.brand && `(${family.brand})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.lens_family_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const fam = families.find(
                      (f) => f.id === formData.lens_family_id,
                    );
                    const typeLabel = fam
                      ? LENS_TYPES.find((t) => t.value === fam.lens_type)?.label
                      : undefined;
                    const materialLabel = fam
                      ? LENS_MATERIALS.find(
                          (m) => m.value === fam.lens_material,
                        )?.label
                      : undefined;
                    return (
                      <p className="text-sm text-blue-800">
                        Esta familia ya define <b>Tipo</b>: {typeLabel || "—"} y{" "}
                        <b>Material</b>: {materialLabel || "—"}.
                      </p>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sphere_min">Esfera Mínima *</Label>
                  <Input
                    id="sphere_min"
                    type="number"
                    step="0.25"
                    value={formData.sphere_min}
                    onChange={(e) =>
                      setFormData({ ...formData, sphere_min: e.target.value })
                    }
                    placeholder="-10.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sphere_max">Esfera Máxima *</Label>
                  <Input
                    id="sphere_max"
                    type="number"
                    step="0.25"
                    value={formData.sphere_max}
                    onChange={(e) =>
                      setFormData({ ...formData, sphere_max: e.target.value })
                    }
                    placeholder="+6.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cylinder_min">Cilindro Mínimo *</Label>
                  <Input
                    id="cylinder_min"
                    type="number"
                    step="0.25"
                    value={formData.cylinder_min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cylinder_min: e.target.value,
                      })
                    }
                    placeholder="-2.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cylinder_max">Cilindro Máximo *</Label>
                  <Input
                    id="cylinder_max"
                    type="number"
                    step="0.25"
                    value={formData.cylinder_max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cylinder_max: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Campos de Adición para Presbicia */}
              <div
                className="border-t-2 border-purple-300 pt-5 mt-5"
                style={{ display: "block" }}
              >
                <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-purple-900 mb-2">
                    💡 Campos de Adición (Presbicia):
                  </p>
                  <p className="text-xs text-purple-700">
                    Estos campos definen el rango de adición para cerca.
                    Necesarios para calcular precios de lentes progresivos,
                    bifocales y trifocales.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="addition_min"
                      className="text-sm font-semibold"
                    >
                      Adición Mínima (Dioptrías) *
                      <span className="text-xs text-gray-500 ml-1 font-normal">
                        (0.00 - 4.00)
                      </span>
                    </Label>
                    <Input
                      id="addition_min"
                      type="number"
                      step="0.25"
                      min="0"
                      max="4"
                      value={formData.addition_min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addition_min: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      required
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      <strong>Monofocales:</strong> 0.00 |{" "}
                      <strong>Progresivos/Bifocales:</strong> 0.00
                    </p>
                  </div>
                  <div>
                    <Label
                      htmlFor="addition_max"
                      className="text-sm font-semibold"
                    >
                      Adición Máxima (Dioptrías) *
                      <span className="text-xs text-gray-500 ml-1 font-normal">
                        (0.00 - 4.00)
                      </span>
                    </Label>
                    <Input
                      id="addition_max"
                      type="number"
                      step="0.25"
                      min="0"
                      max="4"
                      value={formData.addition_max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addition_max: e.target.value,
                        })
                      }
                      placeholder="4.00"
                      required
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      <strong>Monofocales:</strong> 0.00 |{" "}
                      <strong>Progresivos/Bifocales:</strong> 4.00
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="base_price">Precio Venta *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({ ...formData, base_price: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cost">Costo Compra *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sourcing_type">Tipo de Sourcing *</Label>
                <Select
                  value={formData.sourcing_type}
                  onValueChange={(value: "stock" | "surfaced") =>
                    setFormData({ ...formData, sourcing_type: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock (en bodega)</SelectItem>
                    <SelectItem value="surfaced">
                      Surfaced (fabricar)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Activa
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingMatrix ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Matrices desde CSV</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV con las matrices de precios siguiendo el
              formato especificado abajo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold">
                El formato debe incluir las siguientes columnas:
              </p>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="font-semibold text-sm mb-2 text-blue-900">
                  Columnas Requeridas:
                </p>
                <div className="space-y-1 text-xs font-mono text-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-blue-100 px-1 rounded">
                        family_name
                      </code>{" "}
                      - Nombre de la familia de lentes
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-blue-100 px-1 rounded">
                        sphere_min
                      </code>{" "}
                      - Esfera mínima (ej: -10.00)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-blue-100 px-1 rounded">
                        sphere_max
                      </code>{" "}
                      - Esfera máxima (ej: 6.00)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-blue-100 px-1 rounded">
                        cylinder_min
                      </code>{" "}
                      - Cilindro mínimo (ej: -4.00)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-blue-100 px-1 rounded">
                        cylinder_max
                      </code>{" "}
                      - Cilindro máximo (ej: 4.00)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-blue-100 px-1 rounded">price</code> o{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        base_price
                      </code>{" "}
                      - Precio de venta
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-blue-100 px-1 rounded">cost</code> -
                      Costo de compra
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-blue-100 px-1 rounded">
                        sourcing_type
                      </code>{" "}
                      - Tipo:{" "}
                      <code className="bg-blue-100 px-1 rounded">stock</code> o{" "}
                      <code className="bg-blue-100 px-1 rounded">surfaced</code>
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                <p className="font-semibold text-sm mb-2 text-purple-900">
                  Columnas para Presbicia (Adición):
                </p>
                <div className="space-y-1 text-xs font-mono text-purple-800">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-purple-100 px-1 rounded">
                        addition_min
                      </code>{" "}
                      - Adición mínima (default: 0.00)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-purple-100 px-1 rounded">
                        addition_max
                      </code>{" "}
                      - Adición máxima (default: 4.00)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-purple-700 mt-2">
                  <strong>Importante:</strong> Estos campos son necesarios para
                  calcular precios de lentes progresivos, bifocales y trifocales
                  que requieren adición para cerca.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="font-semibold text-sm mb-2 text-amber-900">
                  Columnas Opcionales:
                </p>
                <div className="space-y-1 text-xs font-mono text-amber-800">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">•</span>
                    <span>
                      <code className="bg-amber-100 px-1 rounded">
                        is_active
                      </code>{" "}
                      - Activa (default: true)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                <p className="font-semibold text-xs mb-2 text-gray-700">
                  📝 Notas importantes sobre Adición:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Lentes Monofocales (single_vision):</strong> Usar{" "}
                    <code className="bg-gray-200 px-1 rounded">
                      addition_min = 0.00
                    </code>{" "}
                    y{" "}
                    <code className="bg-gray-200 px-1 rounded">
                      addition_max = 0.00
                    </code>
                  </li>
                  <li>
                    <strong>Lentes Progresivos/Bifocales/Trifocales:</strong>{" "}
                    Usar{" "}
                    <code className="bg-gray-200 px-1 rounded">
                      addition_min = 0.00
                    </code>{" "}
                    y{" "}
                    <code className="bg-gray-200 px-1 rounded">
                      addition_max = 4.00
                    </code>{" "}
                    (rango completo)
                  </li>
                  <li>
                    <strong>Rango de Adición:</strong> Valores válidos entre
                    0.00 y 4.00 dioptrías
                  </li>
                  <li>
                    Si no se especifican, se usarán los valores por defecto
                    (0.00 y 4.00)
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <p className="font-semibold text-xs mb-2 text-green-800">
                  📄 Ejemplo de formato CSV:
                </p>
                <pre className="text-xs font-mono text-green-700 bg-green-100 p-2 rounded overflow-x-auto">
                  {`family_name,sphere_min,sphere_max,cylinder_min,cylinder_max,price,cost,sourcing_type,addition_min,addition_max
Varilux Comfort,-10.00,6.00,-4.00,4.00,120000,80000,surfaced,0.00,4.00
Poly Blue Single,-10.00,6.00,-4.00,4.00,80000,50000,stock,0.00,0.00`}
                </pre>
              </div>
            </div>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const fileInput = formData.get("file") as File;

              if (!fileInput) {
                toast.error("Por favor selecciona un archivo CSV");
                return;
              }

              try {
                const uploadFormData = new FormData();
                uploadFormData.append("file", fileInput);

                const response = await fetch(
                  "/api/admin/lens-matrices/import",
                  {
                    method: "POST",
                    body: uploadFormData,
                  },
                );

                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.error || "Error al importar");
                }

                toast.success(
                  `Importación completada: ${result.success} exitosas, ${result.errors} errores`,
                );

                if (result.errors > 0 && result.details?.errors) {
                  console.error(
                    "Errores de importación:",
                    result.details.errors,
                  );
                  const errorMessages = result.details.errors
                    .slice(0, 5)
                    .map((err: any) => `Fila ${err.row}: ${err.error}`)
                    .join("\n");
                  toast.error(
                    `Algunos errores:\n${errorMessages}${
                      result.details.errors.length > 5
                        ? `\n... y ${result.details.errors.length - 5} más`
                        : ""
                    }`,
                    { duration: 10000 },
                  );
                }

                setShowImportDialog(false);
                fetchMatrices();
              } catch (error: any) {
                toast.error(error.message || "Error al importar CSV");
              }
            }}
          >
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="file">Archivo CSV</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept=".csv"
                  required
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  El archivo debe tener encabezados en la primera fila
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowImportDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Importar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
