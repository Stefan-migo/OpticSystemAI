# Análisis Completo: Sección de Productos

**Fecha de Análisis:** 2025-01-27  
**Versión del Sistema:** 1.0  
**Autor:** Análisis Técnico Completo

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Frontend - Componentes y Páginas](#frontend---componentes-y-páginas)
5. [Hooks Personalizados](#hooks-personalizados)
6. [APIs y Endpoints](#apis-y-endpoints)
7. [Flujos de Datos](#flujos-de-datos)
8. [Validaciones y Seguridad](#validaciones-y-seguridad)
9. [Multi-Tenancy (Sucursales)](#multi-tenancy-sucursales)
10. [Características Especiales](#características-especiales)
11. [Consideraciones de Performance](#consideraciones-de-performance)

---

## 🎯 Resumen Ejecutivo

La sección de productos es un módulo completo de gestión de catálogo para una óptica, implementado con Next.js 14 (App Router), React Query, y Supabase como backend. El sistema soporta multi-sucursal, operaciones masivas, importación/exportación, y gestión completa de productos ópticos con especificaciones técnicas detalladas.

### Características Principales

- ✅ CRUD completo de productos
- ✅ Gestión de categorías
- ✅ Operaciones masivas (bulk operations)
- ✅ Importación/Exportación JSON/CSV
- ✅ Multi-sucursal con RLS
- ✅ Sistema de opciones configurables
- ✅ Especificaciones técnicas para productos ópticos
- ✅ Gestión de inventario por sucursal
- ✅ Búsqueda y filtrado avanzado
- ✅ Estadísticas en tiempo real

---

## 🏗️ Arquitectura General

### Estructura de Directorios

```
src/app/admin/products/
├── page.tsx                    # Página principal (orquestador)
├── add/
│   └── page.tsx                # Formulario de creación
├── edit/
│   └── [id]/
│       └── page.tsx            # Formulario de edición
├── [slug]/
│   └── page.tsx                # Vista pública del producto
├── bulk/
│   └── page.tsx                # Operaciones masivas
├── options/
│   └── page.tsx                # Configuración de opciones
├── components/                 # Componentes modulares
│   ├── ProductStats.tsx        # Tarjetas de estadísticas
│   ├── ProductFilters.tsx      # Filtros y búsqueda
│   ├── ProductActions.tsx      # Barra de acciones
│   ├── ProductList.tsx         # Orquestador de vistas
│   ├── ProductGrid.tsx         # Vista de grid (cards)
│   ├── ProductTable.tsx        # Vista de tabla
│   ├── ProductPagination.tsx   # Paginación
│   └── QuickActions.tsx        # Acciones rápidas
└── hooks/                      # Hooks personalizados
    ├── useProducts.ts          # Gestión de productos
    ├── useCategories.ts        # Gestión de categorías
    ├── useProductFilters.ts    # Estado de filtros
    └── useProductStats.ts      # Estadísticas
```

### Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Estado del Servidor:** TanStack Query (React Query)
- **UI:** shadcn/ui, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Storage:** Supabase Storage (imágenes)
- **Validación:** Zod schemas

---

## 🗄️ Estructura de Base de Datos

### Tabla: `products`

Tabla principal que almacena todos los productos del sistema.

#### Columnas Principales

| Columna               | Tipo          | Nullable | Default              | Descripción                           |
| --------------------- | ------------- | -------- | -------------------- | ------------------------------------- |
| `id`                  | UUID          | NO       | `uuid_generate_v4()` | Identificador único                   |
| `name`                | TEXT          | NO       | -                    | Nombre del producto                   |
| `slug`                | TEXT          | NO       | -                    | URL amigable (único)                  |
| `description`         | TEXT          | YES      | NULL                 | Descripción detallada                 |
| `short_description`   | TEXT          | YES      | NULL                 | Descripción corta                     |
| `price`               | DECIMAL(10,2) | NO       | -                    | Precio de venta                       |
| `compare_at_price`    | DECIMAL(10,2) | YES      | NULL                 | Precio comparado (antes)              |
| `cost_price`          | DECIMAL(10,2) | YES      | NULL                 | Precio de costo                       |
| `currency`            | TEXT          | NO       | 'ARS'                | Moneda                                |
| `price_includes_tax`  | BOOLEAN       | NO       | FALSE                | Si el precio incluye IVA              |
| `sku`                 | TEXT          | YES      | NULL                 | SKU único                             |
| `barcode`             | TEXT          | YES      | NULL                 | Código de barras                      |
| `weight`              | DECIMAL(8,2)  | YES      | NULL                 | Peso en gramos                        |
| `dimensions`          | JSONB         | YES      | NULL                 | Dimensiones {length, width, height}   |
| `track_inventory`     | BOOLEAN       | NO       | TRUE                 | Si se rastrea inventario              |
| `inventory_quantity`  | INTEGER       | NO       | 0                    | Cantidad en stock                     |
| `inventory_policy`    | TEXT          | NO       | 'deny'               | Política: 'continue' o 'deny'         |
| `low_stock_threshold` | INTEGER       | NO       | 5                    | Umbral de stock bajo                  |
| `featured_image`      | TEXT          | YES      | NULL                 | URL imagen principal                  |
| `gallery`             | JSONB         | YES      | NULL                 | Array de URLs de imágenes             |
| `video_url`           | TEXT          | YES      | NULL                 | URL de video                          |
| `meta_title`          | TEXT          | YES      | NULL                 | Título SEO                            |
| `meta_description`    | TEXT          | YES      | NULL                 | Descripción SEO                       |
| `search_keywords`     | TEXT[]        | YES      | NULL                 | Palabras clave para búsqueda          |
| `category_id`         | UUID          | YES      | NULL                 | FK a categories                       |
| `branch_id`           | UUID          | YES      | NULL                 | FK a branches (multi-sucursal)        |
| `tags`                | TEXT[]        | YES      | NULL                 | Tags del producto                     |
| `collections`         | TEXT[]        | YES      | NULL                 | Colecciones                           |
| `vendor`              | TEXT          | NO       | 'ALKIMYA DA LUZ'     | Proveedor                             |
| `status`              | TEXT          | NO       | 'draft'              | Estado: 'draft', 'active', 'archived' |
| `is_featured`         | BOOLEAN       | NO       | FALSE                | Si es destacado                       |
| `is_digital`          | BOOLEAN       | NO       | FALSE                | Si es producto digital                |
| `requires_shipping`   | BOOLEAN       | NO       | TRUE                 | Si requiere envío                     |
| `published_at`        | TIMESTAMPTZ   | YES      | NULL                 | Fecha de publicación                  |
| `created_at`          | TIMESTAMPTZ   | NO       | NOW()                | Fecha de creación                     |
| `updated_at`          | TIMESTAMPTZ   | NO       | NOW()                | Fecha de actualización                |

#### Campos Específicos para Productos Ópticos

##### Tipo y Categoría

- `product_type`: TEXT - Tipo: 'frame', 'lens', 'accessory', 'service'
- `optical_category`: TEXT - Categoría: 'sunglasses', 'prescription_glasses', 'reading_glasses', 'safety_glasses', 'contact_lenses', 'accessories', 'services'

##### Especificaciones de Armazón (Frame)

- `frame_type`: TEXT - Tipo: 'full_frame', 'half_frame', 'rimless', 'semi_rimless', 'browline', 'cat_eye', 'aviator', 'round', 'square', 'rectangular', 'oval', 'geometric'
- `frame_material`: TEXT - Material: 'acetate', 'metal', 'titanium', 'stainless_steel', 'aluminum', 'carbon_fiber', 'wood', 'horn', 'plastic', 'tr90', 'monel', 'beta_titanium'
- `frame_shape`: TEXT - Forma: 'round', 'square', 'rectangular', 'oval', 'cat_eye', 'aviator', 'browline', 'geometric', 'shield', 'wrap', 'sport'
- `frame_color`: TEXT - Color principal
- `frame_colors`: TEXT[] - Array de colores disponibles
- `frame_brand`: TEXT - Marca del armazón
- `frame_model`: TEXT - Modelo del armazón
- `frame_sku`: TEXT - SKU del armazón
- `frame_gender`: TEXT - Género: 'mens', 'womens', 'unisex', 'kids', 'youth'
- `frame_age_group`: TEXT - Grupo etario: 'adult', 'youth', 'kids', 'senior'
- `frame_size`: TEXT - Tamaño: 'narrow', 'medium', 'wide', 'extra_wide'
- `frame_features`: TEXT[] - Características: ['spring_hinges', 'adjustable_nose_pads', 'flexible_temples', 'lightweight', 'durable']
- `frame_measurements`: JSONB - Medidas en mm: `{lens_width: 52, bridge_width: 18, temple_length: 140, lens_height: 40, total_width: 140}`

##### Especificaciones de Lentes (Lens)

- `lens_type`: TEXT - Tipo: 'single_vision', 'bifocal', 'trifocal', 'progressive', 'reading', 'computer', 'driving', 'sports', 'photochromic', 'polarized'
- `lens_material`: TEXT - Material: 'cr39', 'polycarbonate', 'high_index_1_67', 'high_index_1_74', 'trivex', 'glass', 'photochromic'
- `lens_index`: DECIMAL(3,2) - Índice de refracción (1.50, 1.59, 1.67, 1.74)
- `prescription_available`: BOOLEAN - Si acepta receta
- `prescription_range`: JSONB - Rango de receta: `{sph_min: -10, sph_max: +6, cyl_min: -4, cyl_max: +4, add_min: 0, add_max: 4}`
- `lens_coatings`: TEXT[] - Tratamientos: ['anti_reflective', 'blue_light_filter', 'uv_protection', 'scratch_resistant', 'anti_fog', 'mirror', 'tint']
- `uv_protection`: TEXT - Nivel UV: 'none', 'uv400', 'uv380', 'uv350'
- `blue_light_filter`: BOOLEAN - Si tiene filtro de luz azul
- `blue_light_filter_percentage`: INTEGER - Porcentaje de filtro (0-100)
- `photochromic`: BOOLEAN - Si es fotocromático
- `photochromic_tint_levels`: JSONB - Niveles de tinte: `{clear: 0, dark: 3}`
- `lens_tint_options`: TEXT[] - Opciones de tinte: ['clear', 'gray', 'brown', 'green', 'blue', 'yellow', 'rose', 'mirror']

##### Campos Generales

- `brand`: TEXT - Marca general
- `manufacturer`: TEXT - Fabricante
- `model_number`: TEXT - Número de modelo
- `warranty_months`: INTEGER - Meses de garantía
- `warranty_details`: TEXT - Detalles de garantía
- `compatible_with`: TEXT[] - Compatibilidad
- `requires_prescription`: BOOLEAN - Si requiere receta
- `is_customizable`: BOOLEAN - Si es personalizable

#### Índices

```sql
-- Índices básicos
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_featured ON public.products(is_featured);
CREATE INDEX idx_products_branch ON public.products(branch_id);
CREATE INDEX idx_products_price_includes_tax ON public.products(price_includes_tax);

-- Índices GIN para arrays
CREATE INDEX idx_products_search ON public.products USING gin(search_keywords);
CREATE INDEX idx_products_skin_type ON public.products USING gin(skin_type);
CREATE INDEX idx_products_frame_colors ON public.products USING gin(frame_colors);
CREATE INDEX idx_products_frame_features ON public.products USING gin(frame_features);
CREATE INDEX idx_products_lens_coatings ON public.products USING gin(lens_coatings);
CREATE INDEX idx_products_lens_tint_options ON public.products USING gin(lens_tint_options);

-- Índices para campos ópticos
CREATE INDEX idx_products_product_type ON public.products(product_type);
CREATE INDEX idx_products_optical_category ON public.products(optical_category);
CREATE INDEX idx_products_frame_type ON public.products(frame_type);
CREATE INDEX idx_products_frame_material ON public.products(frame_material);
CREATE INDEX idx_products_frame_brand ON public.products(frame_brand);
CREATE INDEX idx_products_frame_gender ON public.products(frame_gender);
CREATE INDEX idx_products_lens_type ON public.products(lens_type);
CREATE INDEX idx_products_lens_material ON public.products(lens_material);
CREATE INDEX idx_products_brand ON public.products(brand);
```

#### Triggers

```sql
-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Constraints

- `slug` UNIQUE
- `sku` UNIQUE (si no es NULL)
- `status` CHECK IN ('draft', 'active', 'archived')
- `product_type` CHECK IN ('frame', 'lens', 'accessory', 'service')
- `inventory_policy` CHECK IN ('continue', 'deny')
- Foreign Keys:
  - `category_id` → `categories(id)` ON DELETE SET NULL
  - `branch_id` → `branches(id)` ON DELETE SET NULL

### Tabla: `categories`

Tabla para categorizar productos.

#### Columnas

| Columna       | Tipo        | Nullable | Default              | Descripción                 |
| ------------- | ----------- | -------- | -------------------- | --------------------------- |
| `id`          | UUID        | NO       | `uuid_generate_v4()` | Identificador único         |
| `name`        | TEXT        | NO       | -                    | Nombre de la categoría      |
| `slug`        | TEXT        | NO       | -                    | URL amigable (único)        |
| `description` | TEXT        | YES      | NULL                 | Descripción                 |
| `image_url`   | TEXT        | YES      | NULL                 | URL de imagen               |
| `parent_id`   | UUID        | YES      | NULL                 | FK a categories (jerarquía) |
| `sort_order`  | INTEGER     | NO       | 0                    | Orden de visualización      |
| `is_active`   | BOOLEAN     | NO       | TRUE                 | Si está activa              |
| `created_at`  | TIMESTAMPTZ | NO       | NOW()                | Fecha de creación           |
| `updated_at`  | TIMESTAMPTZ | NO       | NOW()                | Fecha de actualización      |

#### Índices

```sql
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_active ON public.categories(is_active);
```

### Tabla: `product_option_fields`

Sistema de opciones configurables para campos de productos.

#### Columnas

| Columna          | Tipo        | Nullable | Default             | Descripción                                        |
| ---------------- | ----------- | -------- | ------------------- | -------------------------------------------------- |
| `id`             | UUID        | NO       | `gen_random_uuid()` | Identificador único                                |
| `field_key`      | TEXT        | NO       | -                   | Clave del campo (único)                            |
| `field_label`    | TEXT        | NO       | -                   | Etiqueta de visualización                          |
| `field_category` | TEXT        | NO       | -                   | Categoría: 'general', 'frame', 'lens', 'accessory' |
| `is_array`       | BOOLEAN     | NO       | FALSE               | Si acepta múltiples valores                        |
| `is_active`      | BOOLEAN     | NO       | TRUE                | Si está activo                                     |
| `display_order`  | INTEGER     | NO       | 0                   | Orden de visualización                             |
| `created_at`     | TIMESTAMPTZ | NO       | NOW()               | Fecha de creación                                  |
| `updated_at`     | TIMESTAMPTZ | NO       | NOW()               | Fecha de actualización                             |

### Tabla: `product_option_values`

Valores posibles para cada campo de opción.

#### Columnas

| Columna         | Tipo        | Nullable | Default             | Descripción                |
| --------------- | ----------- | -------- | ------------------- | -------------------------- |
| `id`            | UUID        | NO       | `gen_random_uuid()` | Identificador único        |
| `field_id`      | UUID        | NO       | -                   | FK a product_option_fields |
| `value`         | TEXT        | NO       | -                   | Valor almacenado en DB     |
| `label`         | TEXT        | NO       | -                   | Etiqueta de visualización  |
| `display_order` | INTEGER     | NO       | 0                   | Orden de visualización     |
| `is_active`     | BOOLEAN     | NO       | TRUE                | Si está activo             |
| `is_default`    | BOOLEAN     | NO       | FALSE               | Si es valor por defecto    |
| `metadata`      | JSONB       | NO       | '{}'                | Metadatos adicionales      |
| `created_at`    | TIMESTAMPTZ | NO       | NOW()               | Fecha de creación          |
| `updated_at`    | TIMESTAMPTZ | NO       | NOW()               | Fecha de actualización     |

#### Constraints

- UNIQUE(`field_id`, `value`)

### Relaciones

```
products
├── category_id → categories(id)
├── branch_id → branches(id)
└── (relaciones indirectas)
    ├── order_items.product_id → products(id)
    ├── cart_items.product_id → products(id)
    └── product_variants.product_id → products(id)

categories
└── parent_id → categories(id) (auto-referencia)

product_option_values
└── field_id → product_option_fields(id)
```

### Row Level Security (RLS)

#### Políticas para `products`

```sql
-- Super admin ve todos los productos
-- Admin regular ve productos de sus sucursales accesibles
CREATE POLICY "Admins can view products in their branches"
ON public.products FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.admin_branch_access aba
    WHERE aba.admin_user_id = auth.uid()
    AND (
      aba.branch_id = products.branch_id
      OR products.branch_id IS NULL
    )
  )
);

CREATE POLICY "Admins can insert products in their branches"
ON public.products FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.admin_branch_access aba
    WHERE aba.admin_user_id = auth.uid()
    AND aba.branch_id = products.branch_id
  )
);

CREATE POLICY "Admins can update products in their branches"
ON public.products FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.admin_branch_access aba
    WHERE aba.admin_user_id = auth.uid()
    AND (
      aba.branch_id = products.branch_id
      OR products.branch_id IS NULL
    )
  )
);

CREATE POLICY "Admins can delete products in their branches"
ON public.products FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.admin_branch_access aba
    WHERE aba.admin_user_id = auth.uid()
    AND (
      aba.branch_id = products.branch_id
      OR products.branch_id IS NULL
    )
  )
);
```

#### Políticas para `categories`

```sql
-- Cualquiera puede ver categorías activas
CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
USING (is_active = TRUE);
```

### Funciones SQL Personalizadas

#### `search_frames_by_measurements`

Función para buscar armazones por medidas.

```sql
CREATE OR REPLACE FUNCTION search_frames_by_measurements(
  min_lens_width INTEGER DEFAULT NULL,
  max_lens_width INTEGER DEFAULT NULL,
  min_bridge_width INTEGER DEFAULT NULL,
  max_bridge_width INTEGER DEFAULT NULL,
  min_temple_length INTEGER DEFAULT NULL,
  max_temple_length INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  frame_measurements JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.frame_measurements
  FROM public.products p
  WHERE p.product_type = 'frame'
    AND p.frame_measurements IS NOT NULL
    AND (min_lens_width IS NULL OR (p.frame_measurements->>'lens_width')::INTEGER >= min_lens_width)
    AND (max_lens_width IS NULL OR (p.frame_measurements->>'lens_width')::INTEGER <= max_lens_width)
    AND (min_bridge_width IS NULL OR (p.frame_measurements->>'bridge_width')::INTEGER >= min_bridge_width)
    AND (max_bridge_width IS NULL OR (p.frame_measurements->>'bridge_width')::INTEGER <= max_bridge_width)
    AND (min_temple_length IS NULL OR (p.frame_measurements->>'temple_length')::INTEGER >= min_temple_length)
    AND (max_temple_length IS NULL OR (p.frame_measurements->>'temple_length')::INTEGER <= max_temple_length);
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 Frontend - Componentes y Páginas

### Página Principal: `page.tsx`

**Ubicación:** `src/app/admin/products/page.tsx`  
**Líneas:** ~1,200  
**Responsabilidad:** Orquestador principal de la gestión de productos

#### Funcionalidades

1. **Gestión de Estado**
   - View mode (grid/table) con persistencia en localStorage
   - Paginación (página actual, items por página)
   - Filtros (búsqueda, categoría, estado, stock bajo)
   - Selección múltiple de productos
   - Estados de diálogos y modales

2. **Integración de Hooks**
   - `useBranch()` - Contexto de sucursal
   - `useProducts()` - Fetch y gestión de productos
   - `useCategories()` - Gestión de categorías
   - `useProductFilters()` - Estado de filtros
   - `useProductStats()` - Estadísticas

3. **Operaciones Masivas**
   - Panel que aparece al seleccionar productos
   - Formularios dinámicos según operación
   - Validaciones y confirmaciones

4. **Gestión de Categorías**
   - Tab separado para categorías
   - CRUD completo con diálogos

### Componente: `ProductStats.tsx`

**Responsabilidad:** Mostrar estadísticas de productos

#### Métricas Mostradas

1. **Total Productos** - Cantidad total de productos
2. **Productos Activos** - Productos con status 'active'
3. **Stock Bajo** - Productos con inventario ≤ 5
4. **Valor Total** - Suma de (precio × cantidad) de todos los productos

### Componente: `ProductFilters.tsx`

**Responsabilidad:** Filtros y búsqueda de productos

#### Filtros Disponibles

- **Búsqueda por nombre** - Input de texto con icono de búsqueda
- **Filtro por categoría** - Select con todas las categorías
- **Filtro por estado** - Select: Todos, Activo, Borrador, Archivado
- **Toggle Stock Bajo** - Botón para mostrar solo productos con stock bajo
- **Toggle Vista** - Botones para cambiar entre grid y tabla

### Componente: `ProductList.tsx`

**Responsabilidad:** Orquestador que decide qué vista mostrar

#### Lógica

- Si `viewMode === "grid"` → Renderiza `ProductGrid`
- Si `viewMode === "table"` → Renderiza `ProductTable`

### Componente: `ProductGrid.tsx`

**Responsabilidad:** Vista de productos en formato de cards

#### Características

- Grid responsive: 1 columna (mobile) → 2 (tablet) → 3 (desktop) → 4 (xl)
- Cada card muestra:
  - Checkbox de selección (top-right)
  - Badge "Destacado" si `is_featured` (top-left)
  - Imagen del producto o placeholder
  - Nombre del producto
  - Precio formateado
  - Badge de estado
  - Cantidad de stock (con alerta si es bajo)
  - Categoría
  - Botones de acción (Ver, Editar, Eliminar)

### Componente: `ProductTable.tsx`

**Responsabilidad:** Vista de productos en formato de tabla

#### Columnas

1. Checkbox (con "Seleccionar todos")
2. Imagen (thumbnail)
3. Nombre
4. Categoría
5. Precio
6. Stock
7. Estado
8. Acciones (Ver, Editar, Eliminar)

### Componente: `ProductPagination.tsx`

**Responsabilidad:** Control de paginación

#### Características

- Navegación: Primera, Anterior, Siguiente, Última
- Selector de items por página: 12, 24, 48, 96
- Información: "Mostrando X-Y de Z productos"
- Persistencia de preferencias en localStorage

### Componente: `ProductActions.tsx`

**Responsabilidad:** Barra de acciones en el header

#### Acciones Disponibles

1. **Opciones** - Link a `/admin/products/options`
2. **JSON** - Dropdown con:
   - Exportar Productos
   - Descargar Plantilla
   - Importar Productos
3. **Agregar Producto** - Link a `/admin/products/add`
4. **Panel de Selección** (cuando hay productos seleccionados):
   - Badge con cantidad seleccionada
   - Botón "Limpiar selección"
   - Botón "Eliminar"
   - Botón "Operaciones Masivas"

### Componente: `QuickActions.tsx`

**Responsabilidad:** Acciones rápidas en cards

#### Acciones

1. **Nuevo Producto** - Link a formulario de creación
2. **Stock Bajo** - Filtro rápido (muestra contador si hay)
3. **Exportar** - Exportación JSON
4. **Importar** - Importación JSON
5. **Categorías** - Cambiar a tab de categorías
6. **Opciones** - Link a configuración de opciones

### Página: `add/page.tsx`

**Responsabilidad:** Formulario de creación de productos

#### Características

- Formulario extenso con múltiples secciones
- Protección contra pérdida de datos (`useProtectedForm`)
- Validación en tiempo real
- Upload de imágenes (featured + gallery)
- Editor de texto enriquecido para descripción
- Campos condicionales según tipo de producto
- Integración con sistema de opciones configurables

#### Secciones del Formulario

1. **Información Básica**
   - Nombre, Slug (auto-generado), Descripciones
2. **Precios e Inventario**
   - Precio, Precio comparado, Precio de costo
   - Cantidad en stock, SKU, Código de barras
3. **Categoría y Estado**
   - Categoría, Estado, Destacado
4. **Imágenes**
   - Imagen destacada, Galería (máx 4)
5. **Especificaciones Ópticas**
   - Tipo de producto, Categoría óptica
   - Campos específicos según tipo (frame/lens/accessory)
6. **SEO** (opcional)
   - Meta título, Meta descripción, Keywords

### Página: `edit/[id]/page.tsx`

**Responsabilidad:** Formulario de edición de productos

#### Características

- Similar a `add/page.tsx` pero pre-poblado
- Carga datos existentes al montar
- Mismo sistema de validación y protección
- Actualización optimista con React Query

---

## 🪝 Hooks Personalizados

### `useProducts.ts`

**Ubicación:** `src/app/admin/products/hooks/useProducts.ts`

#### Funcionalidad

Hook principal para gestión de productos con React Query.

#### Parámetros

```typescript
interface FetchProductsParams {
  page: number;
  itemsPerPage: number;
  categoryFilter: string;
  statusFilter: string;
  searchTerm?: string;
  showLowStockOnly?: boolean;
  currentBranchId: string | null;
  isGlobalView: boolean;
  isSuperAdmin: boolean;
}
```

#### Retorno

```typescript
{
  products: Product[];
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
  total: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createProduct: (data: any) => Promise<void>;
  updateProduct: (id: string, data: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}
```

#### Características

- **Query Key:** Incluye todos los parámetros de filtrado para cache correcto
- **Stale Time:** 30 segundos
- **Mutations:** Create, Update, Delete con invalidación automática
- **Headers:** Incluye `x-branch-id` para multi-sucursal
- **Error Handling:** Toasts automáticos

### `useCategories.ts`

**Ubicación:** `src/app/admin/products/hooks/useCategories.ts`

#### Funcionalidad

Hook para gestión de categorías.

#### Retorno

```typescript
{
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createCategory: (data: {...}) => Promise<void>;
  updateCategory: ({id, data}) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}
```

#### Características

- **Stale Time:** 5 minutos (categorías cambian poco)
- **Mutations:** CRUD completo con invalidación automática

### `useProductFilters.ts`

**Ubicación:** `src/app/admin/products/hooks/useProductFilters.ts`

#### Funcionalidad

Hook para gestión de estado de filtros (cliente).

#### Retorno

```typescript
{
  filters: {
    searchTerm: string;
    categoryFilter: string;
    statusFilter: string;
    showLowStockOnly: boolean;
  };
  updateFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  applyFilters: (products: Product[]) => Product[];
}
```

### `useProductStats.ts`

**Ubicación:** `src/app/admin/products/hooks/useProductStats.ts`

#### Funcionalidad

Hook para calcular estadísticas de productos.

#### Parámetros

```typescript
interface FetchStatsParams {
  currentBranchId: string | null;
  isGlobalView: boolean;
  isSuperAdmin: boolean;
}
```

#### Retorno

```typescript
{
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockCount: number;
    totalValue: number;
  };
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

#### Implementación

- Fetch de todos los productos (limit: 10000, include_archived: true)
- Cálculo en cliente de las métricas
- **Stale Time:** 1 minuto

---

## 🌐 APIs y Endpoints

### `GET /api/admin/products`

**Responsabilidad:** Listar productos con paginación y filtros

#### Query Parameters

| Parámetro          | Tipo    | Descripción                                  |
| ------------------ | ------- | -------------------------------------------- |
| `limit`            | number  | Items por página (default: 12)               |
| `offset`           | number  | Offset para paginación                       |
| `page`             | number  | Número de página (alternativa a offset)      |
| `category`         | string  | ID de categoría o "all"                      |
| `status`           | string  | Estado: "active", "draft", "archived", "all" |
| `search`           | string  | Búsqueda por nombre                          |
| `low_stock_only`   | boolean | Solo productos con stock bajo                |
| `include_archived` | boolean | Incluir productos archivados                 |

#### Headers

- `x-branch-id`: ID de sucursal o "global" para super admin

#### Response

```json
{
  "products": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "price": 0,
      "status": "active",
      "inventory_quantity": 0,
      "category": {
        "name": "string"
      },
      ...
    }
  ],
  "pagination": {
    "total": 100,
    "totalPages": 9,
    "currentPage": 1
  },
  "total": 100
}
```

### `POST /api/admin/products`

**Responsabilidad:** Crear nuevo producto

#### Request Body

```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "price": 0,
  "category_id": "uuid",
  "branch_id": "uuid",
  ...
}
```

#### Validaciones

- Campos requeridos: `name`, `price`
- `slug` único
- `sku` único (si se proporciona)
- Validación de `branch_id` (acceso del admin)

### `PUT /api/admin/products/[id]`

**Responsabilidad:** Actualizar producto existente

#### Validaciones

- Producto debe existir
- Admin debe tener acceso a la sucursal del producto
- `slug` único (si se modifica)
- `sku` único (si se modifica)

### `DELETE /api/admin/products/[id]`

**Responsabilidad:** Eliminar producto (soft delete por defecto)

#### Query Parameters

- `hard_delete`: boolean - Si es true, elimina permanentemente

### `POST /api/admin/products/bulk`

**Responsabilidad:** Operaciones masivas sobre múltiples productos

#### Operaciones Disponibles

1. **update_status** - Cambiar estado
2. **update_category** - Cambiar categoría
3. **update_pricing** - Ajustar precios (porcentaje o monto fijo)
4. **update_inventory** - Ajustar inventario (establecer o agregar/quitar)
5. **duplicate** - Duplicar productos
6. **delete** - Soft delete (archivar)
7. **hard_delete** - Eliminación permanente

### `GET /api/admin/products/bulk`

**Responsabilidad:** Exportar productos en JSON o CSV

#### Query Parameters

- `format`: "json" | "csv" (default: "csv")
- `category_id`: string - Filtrar por categoría
- `status`: string - Filtrar por estado

### `POST /api/admin/products/import-json`

**Responsabilidad:** Importar productos desde JSON

#### Modos de Importación

1. **create** - Solo crea nuevos (omite existentes)
2. **update** - Solo actualiza existentes (omite nuevos)
3. **upsert** - Crea o actualiza según corresponda
4. **skip_duplicates** - Omite duplicados

#### Validaciones

- Campos requeridos: `name`, `price`
- `category_id` o `category` (nombre) debe existir
- Genera `slug` automáticamente si no se proporciona
- Detecta duplicados por `slug` o `name`

### `GET /api/categories`

**Responsabilidad:** Listar todas las categorías

### `POST /api/categories`

**Responsabilidad:** Crear nueva categoría

### `PUT /api/categories/[id]`

**Responsabilidad:** Actualizar categoría

### `DELETE /api/categories/[id]`

**Responsabilidad:** Eliminar categoría

---

## 🔄 Flujos de Datos

### Flujo: Carga Inicial de Productos

```
1. Usuario accede a /admin/products
   ↓
2. ProductsPage se monta
   ↓
3. useBranch() obtiene contexto de sucursal
   ↓
4. useProductStats() carga estadísticas
   ↓
5. useCategories() carga categorías
   ↓
6. useProducts() carga productos paginados
   ↓
7. Componentes se renderizan con datos
```

### Flujo: Crear Producto

```
1. Usuario completa formulario en /admin/products/add
   ↓
2. Validación en cliente (Zod)
   ↓
3. Submit → POST /api/admin/products
   ↓
4. Validación en servidor
   ↓
5. Inserción en BD (Supabase)
   ↓
6. React Query invalida cache ["products"]
   ↓
7. Refetch automático de productos
   ↓
8. Redirección a lista o mensaje de éxito
```

### Flujo: Operación Masiva

```
1. Usuario selecciona productos (checkboxes)
   ↓
2. Panel de operaciones masivas aparece
   ↓
3. Usuario selecciona operación y configura parámetros
   ↓
4. Submit → POST /api/admin/products/bulk
   ↓
5. Servidor procesa cada producto en batch
   ↓
6. React Query invalida cache ["products", "productStats"]
   ↓
7. Refetch automático
   ↓
8. Toast con resumen de resultados
```

### Flujo: Importación JSON

```
1. Usuario selecciona archivo JSON
   ↓
2. Cliente parsea y valida estructura
   ↓
3. POST /api/admin/products/import-json
   ↓
4. Servidor procesa cada producto:
   - Valida campos requeridos
   - Busca/resuelve categorías
   - Genera slugs si faltan
   - Detecta duplicados
   - Crea/actualiza según modo
   ↓
5. Retorna resumen con resultados y errores
   ↓
6. React Query invalida cache
   ↓
7. Refetch y mostrar resultados
```

---

## 🔒 Validaciones y Seguridad

### Validaciones en Cliente

#### Schema Zod

```typescript
export const productBaseSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  slug: z.string().max(255).trim().optional(),
  price: z.number().positive(),
  compare_at_price: z.number().positive().optional(),
  inventory_quantity: z.number().int().min(0).optional(),
  category_id: z.string().uuid().optional(),
  // ... más campos
});
```

### Validaciones en Servidor

1. **Autenticación**
   - Verifica token de Supabase
   - Usuario debe estar autenticado

2. **Autorización**
   - Verifica rol admin (`is_admin` RPC)
   - Verifica acceso a sucursal (RLS)

3. **Validación de Datos**
   - Campos requeridos
   - Tipos de datos correctos
   - Constraints de BD (unique, check)

4. **Validación de Negocio**
   - `slug` único
   - `sku` único (si se proporciona)
   - Categoría debe existir
   - Sucursal debe existir y admin debe tener acceso

### Seguridad

1. **Row Level Security (RLS)**
   - Políticas en BD que filtran por sucursal
   - Super admin ve todo, admin regular solo sus sucursales

2. **Rate Limiting**
   - Endpoints críticos tienen rate limiting
   - Prevención de abuso

3. **Sanitización**
   - Inputs sanitizados antes de insertar en BD
   - Prevención de SQL injection (Supabase usa prepared statements)

---

## 🏢 Multi-Tenancy (Sucursales)

### Concepto

El sistema soporta múltiples sucursales donde cada producto puede pertenecer a una sucursal específica o ser global (legacy).

### Implementación

#### Frontend

- **Hook `useBranch()`**: Proporciona `currentBranchId` y `isSuperAdmin`
- **Header `x-branch-id`**: Se envía en todas las requests
- **BranchSelector**: Componente para cambiar sucursal activa

#### Backend

- **RLS Policies**: Filtran productos por `branch_id`
- **Middleware `getBranchContext()`**: Valida acceso a sucursal
- **Super Admin**: Puede ver todas las sucursales (header `x-branch-id: "global"`)

---

## ⚡ Características Especiales

### Sistema de Opciones Configurables

Permite personalizar las opciones de los campos de productos desde la base de datos.

#### Tablas

- `product_option_fields`: Define los campos configurables
- `product_option_values`: Define los valores posibles para cada campo

#### Uso

- Hook `useProductOptions()` carga opciones desde BD
- Formularios usan estas opciones en lugar de valores hardcodeados
- Permite agregar nuevos valores sin cambiar código

### Protección contra Pérdida de Datos

Hook `useProtectedForm` detecta cambios no guardados y previene navegación accidental.

### Importación/Exportación

- **Exportación**: Respeta filtros aplicados
- **Importación**: Múltiples modos, validación robusta, resumen detallado
- **Plantilla JSON**: Disponible para descarga

### Búsqueda Avanzada

- Búsqueda por nombre (server-side)
- Filtros combinables
- Búsqueda en arrays (search_keywords) con índices GIN

### Estadísticas en Tiempo Real

- Cálculo de métricas al vuelo
- Actualización automática tras mutaciones
- Vista por sucursal o global

---

## 🚀 Consideraciones de Performance

### Optimizaciones Implementadas

1. **Paginación Server-Side**
   - Reduce carga de datos transferidos
   - Mejora tiempo de respuesta

2. **Índices en BD**
   - Índices B-tree para búsquedas comunes
   - Índices GIN para arrays (search_keywords, tags, etc.)

3. **React Query Cache**
   - Cache de queries con stale time configurado
   - Invalidación selectiva
   - Menos requests al servidor

4. **Lazy Loading**
   - Imágenes cargadas bajo demanda
   - Componentes pesados solo cuando se necesitan

5. **Optimistic Updates**
   - UI se actualiza inmediatamente
   - Rollback si falla

### Áreas de Mejora Potencial

1. **Búsqueda con Debounce**
   - Actualmente se busca en cada keystroke
   - Debounce reduciría requests

2. **Virtual Scrolling**
   - Para listas muy grandes
   - Mejoraría performance en renderizado

3. **Cache más Agresivo**
   - Categorías podrían cachearse más tiempo
   - Opciones de productos casi nunca cambian

---

## 📝 Notas Finales

### Dependencias Clave

- `@tanstack/react-query`: Gestión de estado del servidor
- `sonner`: Notificaciones toast
- `zod`: Validación de esquemas
- `supabase`: Backend y autenticación

### Extensiones Futuras Posibles

1. **Historial de Cambios**: Audit log de modificaciones
2. **Versiones de Productos**: Sistema de versionado
3. **Importación Masiva de Imágenes**: Desde URLs o archivos
4. **Sincronización entre Sucursales**: Copiar productos entre sucursales
5. **Plantillas de Productos**: Crear productos desde plantillas
6. **Analytics Avanzados**: Métricas de productos más detalladas

---

**Fin del Documento**
