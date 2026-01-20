# Análisis y Plan de Refactorización - Products Page

**Fecha:** 2025-01-27  
**Componente:** `src/app/admin/products/page.tsx`  
**Líneas Actuales:** 1,970  
**Objetivo:** < 300 líneas (página principal)

---

## 📋 Análisis del Componente Actual

### Estructura Actual

El componente `ProductsPage` es una página monolítica que maneja la gestión completa de productos. Contiene:

1. **Estado Complejo:**
   - 25+ estados locales (useState)
   - Estados de productos, categorías, filtros
   - Estados de paginación
   - Estados de operaciones bulk
   - Estados de diálogos y modales
   - Estados de configuración

2. **Lógica de Negocio:**
   - Fetch de productos con paginación
   - Fetch de categorías
   - Cálculo de estadísticas globales
   - Filtrado y búsqueda
   - Operaciones bulk (actualizar estado, categoría, precios, inventario, eliminar)
   - Importación/Exportación JSON
   - Gestión de categorías (CRUD)
   - Selección múltiple de productos

3. **Secciones Visuales Identificadas:**
   - **Stats Cards** (líneas ~1038-1103): ~65 líneas
   - **Search and Filters** (líneas ~1105-1199): ~95 líneas
   - **Actions Bar** (líneas ~1200-1300): ~100 líneas
   - **Product Grid View** (líneas ~1300-1450): ~150 líneas
   - **Product Table View** (líneas ~1450-1532): ~82 líneas
   - **Pagination** (líneas ~1534-1633): ~100 líneas
   - **Categories Management** (líneas ~1636-1970): ~334 líneas
   - **Bulk Operations Dialogs** (líneas ~700-900): ~200 líneas
   - **Import/Export Dialogs** (líneas ~900-1000): ~100 líneas

4. **Funciones y Lógica:**
   - `fetchProducts()`: Obtiene productos con paginación
   - `fetchCategories()`: Obtiene categorías
   - `fetchGlobalStats()`: Calcula estadísticas
   - `handleBulkOperation()`: Maneja operaciones masivas
   - `handleDeleteProduct()`: Elimina producto
   - `handleImportJSON()`: Importa productos desde JSON
   - `renderBulkOperationForm()`: Renderiza formularios de bulk operations
   - Múltiples handlers de categorías

---

## 🎯 Plan de Refactorización

### Estructura Propuesta

```
src/app/admin/products/
├── page.tsx                    # Página principal (< 300 líneas)
├── components/
│   ├── ProductStats.tsx        # Tarjetas de estadísticas (~80 líneas)
│   ├── ProductFilters.tsx     # Filtros y búsqueda (~120 líneas)
│   ├── ProductActions.tsx     # Barra de acciones (~100 líneas)
│   ├── ProductList.tsx        # Lista de productos (orchestrator) (~150 líneas)
│   ├── ProductGrid.tsx        # Vista de grid (~150 líneas)
│   ├── ProductTable.tsx       # Vista de tabla (~120 líneas)
│   ├── ProductPagination.tsx   # Paginación (~100 líneas)
│   ├── CategoriesManager.tsx  # Gestión de categorías (~300 líneas)
│   ├── BulkOperationsDialog.tsx # Diálogo de operaciones bulk (~200 líneas)
│   └── ImportExportDialog.tsx  # Diálogo de import/export (~150 líneas)
└── hooks/
    ├── useProducts.ts          # Fetch y gestión de productos con React Query
    ├── useProductSearch.ts     # Búsqueda de productos
    ├── useProductFilters.ts    # Filtros
    ├── useProductStats.ts      # Estadísticas
    └── useCategories.ts        # Gestión de categorías
```

### Componentes a Extraer

#### 1. ProductStats

**Responsabilidad:** Mostrar estadísticas de productos

- Total productos
- Productos activos
- Stock bajo
- Valor total

**Props:**

```typescript
interface ProductStatsProps {
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockCount: number;
    totalValue: number;
  };
  statsLabel: string;
}
```

#### 2. ProductFilters

**Responsabilidad:** Filtros y búsqueda

- Búsqueda por nombre
- Filtro por categoría
- Filtro por estado
- Toggle de stock bajo
- Toggle de vista (grid/table)

**Props:**

```typescript
interface ProductFiltersProps {
  searchTerm: string;
  categoryFilter: string;
  statusFilter: string;
  showLowStockOnly: boolean;
  viewMode: "grid" | "table";
  categories: Category[];
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
  onLowStockToggle: () => void;
  onViewModeChange: (mode: "grid" | "table") => void;
}
```

#### 3. ProductActions

**Responsabilidad:** Barra de acciones

- Botón crear producto
- Operaciones bulk
- Importar/Exportar
- Configuración

**Props:**

```typescript
interface ProductActionsProps {
  selectedProducts: string[];
  onBulkOperation: (operation: string) => void;
  onImport: () => void;
  onExport: () => void;
  onSettings: () => void;
}
```

#### 4. ProductList

**Responsabilidad:** Orchestrator de lista de productos

- Decide qué vista mostrar (grid/table)
- Maneja selección de productos
- Pasa props a vistas específicas

**Props:**

```typescript
interface ProductListProps {
  products: Product[];
  viewMode: "grid" | "table";
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onSelectAll: () => void;
  onDelete: (product: Product) => void;
  loading: boolean;
}
```

#### 5. ProductGrid

**Responsabilidad:** Vista de grid de productos

- Renderiza productos en formato de cards
- Muestra información básica
- Acciones por producto

**Props:**

```typescript
interface ProductGridProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onDelete: (product: Product) => void;
}
```

#### 6. ProductTable

**Responsabilidad:** Vista de tabla de productos

- Renderiza productos en formato de tabla
- Columnas configurables
- Acciones por fila

**Props:**

```typescript
interface ProductTableProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onSelectAll: () => void;
  onDelete: (product: Product) => void;
  visibleColumns: Record<string, boolean>;
}
```

#### 7. ProductPagination

**Responsabilidad:** Paginación

- Navegación de páginas
- Selector de items por página
- Información de paginación

**Props:**

```typescript
interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}
```

#### 8. CategoriesManager

**Responsabilidad:** Gestión completa de categorías

- Lista de categorías
- Crear categoría
- Editar categoría
- Eliminar categoría

**Props:**

```typescript
interface CategoriesManagerProps {
  categories: Category[];
  onCategoryCreated: () => void;
  onCategoryUpdated: () => void;
  onCategoryDeleted: () => void;
}
```

#### 9. BulkOperationsDialog

**Responsabilidad:** Diálogo de operaciones masivas

- Formularios para diferentes operaciones
- Validación
- Ejecución de operaciones

**Props:**

```typescript
interface BulkOperationsDialogProps {
  open: boolean;
  operation: string;
  selectedProducts: string[];
  categories: Category[];
  onClose: () => void;
  onConfirm: (updates: any) => void;
}
```

#### 10. ImportExportDialog

**Responsabilidad:** Importación y exportación

- Importar desde JSON
- Exportar a JSON
- Resultados de importación

**Props:**

```typescript
interface ImportExportDialogProps {
  open: boolean;
  mode: "import" | "export";
  onClose: () => void;
  onImport: (data: any, mode: string) => void;
  onExport: () => void;
}
```

### Hooks Personalizados con React Query

#### 1. useProducts

**Responsabilidad:** Fetch y gestión de productos con React Query

- Query para productos con paginación
- Mutations para crear/actualizar/eliminar
- Invalidación de cache

**Retorna:**

```typescript
{
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createProduct: (data: CreateProductData) => Promise<void>;
  updateProduct: (id: string, data: UpdateProductData) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}
```

#### 2. useProductSearch

**Responsabilidad:** Búsqueda de productos

- Query con debounce
- Cache de resultados

**Retorna:**

```typescript
{
  searchResults: Product[];
  isSearching: boolean;
  search: (term: string) => void;
}
```

#### 3. useProductFilters

**Responsabilidad:** Gestión de filtros

- Estado de filtros
- Aplicación de filtros
- Reset de filtros

**Retorna:**

```typescript
{
  filters: ProductFilters;
  updateFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  applyFilters: (products: Product[]) => Product[];
}
```

#### 4. useProductStats

**Responsabilidad:** Estadísticas de productos

- Query para estadísticas
- Cálculo de métricas

**Retorna:**

```typescript
{
  stats: ProductStats;
  isLoading: boolean;
  refetch: () => void;
}
```

#### 5. useCategories

**Responsabilidad:** Gestión de categorías con React Query

- Query para categorías
- Mutations para CRUD

**Retorna:**

```typescript
{
  categories: Category[];
  isLoading: boolean;
  createCategory: (data: CreateCategoryData) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}
```

---

## 📝 Dependencias Identificadas

### Hooks Externos

- `useBranch()` - Para obtener `currentBranchId` y `isSuperAdmin`

### Utilidades

- `getBranchHeader()` - Headers para requests

### Componentes Externos

- `BranchSelector` - Selector de sucursal
- Componentes UI de shadcn/ui

### APIs

- `/api/admin/products` - CRUD de productos
- `/api/categories` - CRUD de categorías
- `/api/admin/products/bulk` - Operaciones masivas
- `/api/admin/products/import` - Importación JSON
- `/api/admin/products/export` - Exportación JSON

---

## 🔄 Flujo de Datos con React Query

1. **Inicialización:**
   - QueryClient configurado en layout
   - Queries iniciales para productos y categorías

2. **Filtrado:**
   - Filtros actualizados → Query key cambia → Refetch automático
   - Cache compartido entre componentes

3. **Operaciones:**
   - Mutations invalidan queries relacionadas
   - Refetch automático después de mutaciones

4. **Optimistic Updates:**
   - Actualizaciones optimistas para mejor UX
   - Rollback en caso de error

---

## ✅ Criterios de Aceptación

- [ ] Página dividida en al menos 8 componentes principales
- [ ] React Query implementado para data fetching
- [ ] 5 hooks personalizados creados
- [ ] Página principal < 300 líneas
- [ ] Estado local reducido significativamente
- [ ] Funcionalidad completa preservada
- [ ] Performance mejorada (cache, menos re-renders)
- [ ] Sin regresiones en funcionalidad

---

## 📅 Plan de Ejecución

1. ✅ Análisis y planificación (0.5 días)
2. ⏳ Instalar React Query (0.5 días)
3. ⏳ Crear hooks de datos (1 día)
4. ⏳ Extraer ProductStats (0.5 días)
5. ⏳ Extraer ProductFilters (1 día)
6. ⏳ Extraer ProductActions (1 día)
7. ⏳ Extraer ProductList, ProductGrid, ProductTable (1 día)
8. ⏳ Extraer ProductPagination (0.5 días)
9. ⏳ Extraer CategoriesManager (1 día)
10. ⏳ Extraer BulkOperationsDialog (1 día)
11. ⏳ Extraer ImportExportDialog (0.5 días)
12. ⏳ Refactorizar página principal (1 día)
13. ⏳ Verificación final (0.5 días)

**Total Estimado:** 1.5 semanas
