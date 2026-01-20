# Análisis Completo: Sección de Presupuestos (Quotes)

**Fecha de Análisis:** 2025-01-27  
**Versión del Sistema:** 1.0  
**Autor:** Análisis Técnico Completo

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Frontend - Componentes y Páginas](#frontend---componentes-y-páginas)
5. [APIs y Endpoints](#apis-y-endpoints)
6. [Flujos de Datos](#flujos-de-datos)
7. [Sistema de Configuración](#sistema-de-configuración)
8. [Validaciones y Seguridad](#validaciones-y-seguridad)
9. [Multi-Tenancy (Sucursales)](#multi-tenancy-sucursales)
10. [Integración con Otras Secciones](#integración-con-otras-secciones)

---

## 🎯 Resumen Ejecutivo

La sección de presupuestos (quotes) es un módulo completo para gestionar cotizaciones de trabajos de lentes ópticos. Permite crear presupuestos detallados con especificaciones de armazones, lentes, tratamientos y mano de obra, con cálculo automático de precios, descuentos e impuestos. Los presupuestos pueden convertirse en trabajos de laboratorio o cargarse directamente en el POS.

### Características Principales

- ✅ CRUD completo de presupuestos
- ✅ Cálculo automático de precios
- ✅ Sistema de configuración de precios
- ✅ Gestión de estados (draft, sent, accepted, rejected, expired, converted)
- ✅ Expiración automática de presupuestos
- ✅ Conversión a trabajos de laboratorio
- ✅ Integración con recetas (prescriptions)
- ✅ Integración con productos (frames)
- ✅ Multi-sucursal con RLS
- ✅ Generación automática de números de presupuesto

---

## 🏗️ Arquitectura General

### Estructura de Directorios

```
src/app/admin/quotes/
├── page.tsx                    # Lista de presupuestos
├── [id]/
│   └── page.tsx                # Detalle y edición de presupuesto
└── settings/
    └── page.tsx                # Configuración de precios

src/components/admin/
└── CreateQuoteForm.tsx         # Formulario de creación/edición
```

### Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Estado:** React useState/useEffect (no React Query en esta sección)
- **UI:** shadcn/ui, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Cálculos:** Funciones utilitarias de tax y pricing
- **Validación:** Validación manual en cliente y servidor

---

## 🗄️ Estructura de Base de Datos

### Tabla: `quotes`

Tabla principal que almacena todos los presupuestos.

#### Columnas Principales

| Columna                      | Tipo          | Nullable | Default             | Descripción                                                                                                                       |
| ---------------------------- | ------------- | -------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `id`                         | UUID          | NO       | `gen_random_uuid()` | Identificador único                                                                                                               |
| `customer_id`                | UUID          | NO       | -                   | FK a customers (profiles)                                                                                                         |
| `quote_number`               | TEXT          | NO       | -                   | Número único (ej: "COT-2025-001")                                                                                                 |
| `quote_date`                 | DATE          | NO       | CURRENT_DATE        | Fecha del presupuesto                                                                                                             |
| `expiration_date`            | DATE          | YES      | NULL                | Fecha de expiración                                                                                                               |
| `prescription_id`            | UUID          | YES      | NULL                | FK a prescriptions                                                                                                                |
| `frame_product_id`           | UUID          | YES      | NULL                | FK a products (armazón)                                                                                                           |
| `frame_name`                 | TEXT          | YES      | NULL                | Nombre del armazón                                                                                                                |
| `frame_brand`                | TEXT          | YES      | NULL                | Marca del armazón                                                                                                                 |
| `frame_model`                | TEXT          | YES      | NULL                | Modelo del armazón                                                                                                                |
| `frame_color`                | TEXT          | YES      | NULL                | Color del armazón                                                                                                                 |
| `frame_size`                 | TEXT          | YES      | NULL                | Tamaño del armazón                                                                                                                |
| `frame_sku`                  | TEXT          | YES      | NULL                | SKU del armazón                                                                                                                   |
| `frame_price`                | DECIMAL(10,2) | NO       | 0                   | Precio del armazón                                                                                                                |
| `lens_type`                  | TEXT          | YES      | NULL                | Tipo: 'single_vision', 'bifocal', 'trifocal', 'progressive', 'reading', 'computer', 'sports'                                      |
| `lens_material`              | TEXT          | YES      | NULL                | Material del lente                                                                                                                |
| `lens_index`                 | DECIMAL(3,2)  | YES      | NULL                | Índice de refracción                                                                                                              |
| `lens_treatments`            | TEXT[]        | YES      | NULL                | Tratamientos: ['anti_reflective', 'blue_light_filter', 'uv_protection', 'scratch_resistant', 'photochromic', 'polarized', 'tint'] |
| `lens_tint_color`            | TEXT          | YES      | NULL                | Color del tinte                                                                                                                   |
| `lens_tint_percentage`       | INTEGER       | YES      | NULL                | Porcentaje de tinte (0-100)                                                                                                       |
| `frame_cost`                 | DECIMAL(10,2) | NO       | 0                   | Costo del armazón                                                                                                                 |
| `lens_cost`                  | DECIMAL(10,2) | NO       | 0                   | Costo del lente                                                                                                                   |
| `treatments_cost`            | DECIMAL(10,2) | NO       | 0                   | Costo de tratamientos                                                                                                             |
| `labor_cost`                 | DECIMAL(10,2) | NO       | 0                   | Costo de mano de obra                                                                                                             |
| `subtotal`                   | DECIMAL(10,2) | NO       | 0                   | Subtotal                                                                                                                          |
| `tax_amount`                 | DECIMAL(10,2) | NO       | 0                   | Monto de impuesto                                                                                                                 |
| `discount_amount`            | DECIMAL(10,2) | NO       | 0                   | Monto de descuento                                                                                                                |
| `discount_percentage`        | DECIMAL(5,2)  | NO       | 0                   | Porcentaje de descuento                                                                                                           |
| `total_amount`               | DECIMAL(10,2) | NO       | -                   | Monto total                                                                                                                       |
| `currency`                   | TEXT          | NO       | 'CLP'               | Moneda                                                                                                                            |
| `status`                     | TEXT          | NO       | 'draft'             | Estado: 'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted_to_work'                                                   |
| `notes`                      | TEXT          | YES      | NULL                | Notas internas                                                                                                                    |
| `customer_notes`             | TEXT          | YES      | NULL                | Notas visibles al cliente                                                                                                         |
| `terms_and_conditions`       | TEXT          | YES      | NULL                | Términos y condiciones                                                                                                            |
| `converted_to_work_order_id` | UUID          | YES      | NULL                | FK a lab_work_orders (si se convirtió)                                                                                            |
| `created_by`                 | UUID          | YES      | NULL                | FK a auth.users                                                                                                                   |
| `sent_by`                    | UUID          | YES      | NULL                | FK a auth.users                                                                                                                   |
| `sent_at`                    | TIMESTAMPTZ   | YES      | NULL                | Fecha de envío                                                                                                                    |
| `created_at`                 | TIMESTAMPTZ   | NO       | NOW()               | Fecha de creación                                                                                                                 |
| `updated_at`                 | TIMESTAMPTZ   | NO       | NOW()               | Fecha de actualización                                                                                                            |
| `branch_id`                  | UUID          | YES      | NULL                | FK a branches (multi-sucursal)                                                                                                    |

#### Constraints

- `quote_number` UNIQUE
- `status` CHECK IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted_to_work')
- `lens_type` CHECK IN ('single_vision', 'bifocal', 'trifocal', 'progressive', 'reading', 'computer', 'sports')
- `lens_tint_percentage` CHECK (>= 0 AND <= 100)
- Foreign Keys:
  - `customer_id` → `profiles(id)` ON DELETE CASCADE
  - `prescription_id` → `prescriptions(id)` ON DELETE SET NULL
  - `frame_product_id` → `products(id)` ON DELETE SET NULL
  - `converted_to_work_order_id` → `lab_work_orders(id)` ON DELETE SET NULL
  - `branch_id` → `branches(id)` ON DELETE SET NULL

#### Índices

```sql
CREATE INDEX idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at);
CREATE INDEX idx_quotes_branch_id ON public.quotes(branch_id);
```

#### Triggers

```sql
-- Trigger para actualizar updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para verificar expiración automática
CREATE TRIGGER trigger_check_quote_expiration
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION check_quote_expiration();
```

### Tabla: `quote_settings`

Tabla de configuración para precios y parámetros de presupuestos.

#### Columnas

| Columna                     | Tipo          | Nullable | Default             | Descripción                       |
| --------------------------- | ------------- | -------- | ------------------- | --------------------------------- |
| `id`                        | UUID          | NO       | `gen_random_uuid()` | Identificador único               |
| `treatment_prices`          | JSONB         | NO       | `{...}`             | Precios de tratamientos           |
| `lens_type_base_costs`      | JSONB         | NO       | `{...}`             | Costos base por tipo de lente     |
| `lens_material_multipliers` | JSONB         | NO       | `{...}`             | Multiplicadores por material      |
| `default_labor_cost`        | DECIMAL(10,2) | NO       | 15000               | Costo de mano de obra por defecto |
| `default_tax_percentage`    | DECIMAL(5,2)  | NO       | 19.0                | Porcentaje de impuesto (IVA)      |
| `default_expiration_days`   | INTEGER       | NO       | 30                  | Días de validez por defecto       |
| `default_margin_percentage` | DECIMAL(5,2)  | NO       | 0                   | Margen de ganancia por defecto    |
| `volume_discounts`          | JSONB         | NO       | `[]`                | Descuentos por volumen            |
| `currency`                  | TEXT          | NO       | 'CLP'               | Moneda                            |
| `terms_and_conditions`      | TEXT          | YES      | NULL                | Términos por defecto              |
| `notes_template`            | TEXT          | YES      | NULL                | Plantilla de notas                |
| `created_at`                | TIMESTAMPTZ   | NO       | NOW()               | Fecha de creación                 |
| `updated_at`                | TIMESTAMPTZ   | NO       | NOW()               | Fecha de actualización            |
| `updated_by`                | UUID          | YES      | NULL                | FK a auth.users                   |
| `branch_id`                 | UUID          | YES      | NULL                | FK a branches (multi-sucursal)    |

#### Constraints

- UNIQUE constraint para asegurar solo un registro (usando índice funcional)

#### Estructura de JSONB

**treatment_prices:**

```json
{
  "anti_reflective": 15000,
  "blue_light_filter": 20000,
  "uv_protection": 10000,
  "scratch_resistant": 12000,
  "anti_fog": 8000,
  "photochromic": 35000,
  "polarized": 25000,
  "tint": 15000
}
```

**lens_type_base_costs:**

```json
{
  "single_vision": 30000,
  "bifocal": 45000,
  "trifocal": 55000,
  "progressive": 60000,
  "reading": 25000,
  "computer": 35000,
  "sports": 40000
}
```

**lens_material_multipliers:**

```json
{
  "cr39": 1.0,
  "polycarbonate": 1.2,
  "high_index_1_67": 1.5,
  "high_index_1_74": 2.0,
  "trivex": 1.3,
  "glass": 0.9
}
```

**volume_discounts:**

```json
[
  { "min_amount": 100000, "discount_percentage": 5 },
  { "min_amount": 200000, "discount_percentage": 10 }
]
```

### Funciones SQL Personalizadas

#### `generate_quote_number()`

Genera números de presupuesto secuenciales por año.

```sql
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  last_number INTEGER;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get last quote number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)), 0)
  INTO last_number
  FROM public.quotes
  WHERE quote_number LIKE 'COT-' || year_part || '-%';

  -- Generate new number
  new_number := 'COT-' || year_part || '-' || LPAD((last_number + 1)::TEXT, 4, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
```

**Formato:** `COT-YYYY-0001`, `COT-YYYY-0002`, etc.

#### `expire_quotes()`

Marca presupuestos como expirados si su fecha de expiración ha pasado.

```sql
CREATE OR REPLACE FUNCTION expire_quotes()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.quotes
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE
    expiration_date IS NOT NULL
    AND expiration_date < CURRENT_DATE
    AND status NOT IN ('expired', 'converted_to_work', 'accepted');

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `check_and_expire_quotes()`

Función wrapper que se llama antes de listar presupuestos.

```sql
CREATE OR REPLACE FUNCTION check_and_expire_quotes()
RETURNS VOID AS $$
BEGIN
  PERFORM expire_quotes();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `check_quote_expiration()`

Función de trigger que verifica expiración en INSERT/UPDATE.

```sql
CREATE OR REPLACE FUNCTION check_quote_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiration_date IS NOT NULL
     AND NEW.expiration_date < CURRENT_DATE
     AND NEW.status NOT IN ('expired', 'converted_to_work', 'accepted') THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Relaciones

```
quotes
├── customer_id → profiles(id) / customers(id)
├── prescription_id → prescriptions(id)
├── frame_product_id → products(id)
├── converted_to_work_order_id → lab_work_orders(id)
├── branch_id → branches(id)
├── created_by → auth.users(id)
└── sent_by → auth.users(id)

quote_settings
├── updated_by → auth.users(id)
└── branch_id → branches(id)
```

### Row Level Security (RLS)

#### Políticas para `quotes`

```sql
-- Admins pueden ver todos los presupuestos
CREATE POLICY "Admins can view all quotes"
ON public.quotes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  )
);

-- Admins pueden crear presupuestos
CREATE POLICY "Admins can create quotes"
ON public.quotes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  )
);

-- Admins pueden actualizar presupuestos
CREATE POLICY "Admins can update quotes"
ON public.quotes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  )
);

-- Admins pueden eliminar presupuestos
CREATE POLICY "Admins can delete quotes"
ON public.quotes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  )
);
```

#### Políticas para `quote_settings`

```sql
-- Admins pueden ver configuración
CREATE POLICY "Admins can view quote settings"
ON public.quote_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  )
);

-- Admins pueden actualizar configuración
CREATE POLICY "Admins can update quote settings"
ON public.quote_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  )
);
```

---

## 🎨 Frontend - Componentes y Páginas

### Página Principal: `page.tsx`

**Ubicación:** `src/app/admin/quotes/page.tsx`  
**Líneas:** ~565  
**Responsabilidad:** Lista y gestión de presupuestos

#### Funcionalidades

1. **Lista de Presupuestos**
   - Tabla con información principal
   - Paginación (20 por página)
   - Búsqueda por número, cliente, email, armazón
   - Filtro por estado

2. **Estados Visuales**
   - Badges de estado con iconos
   - Indicadores de conversión a trabajo
   - Fechas de expiración destacadas

3. **Acciones**
   - Ver detalle
   - Eliminar (con confirmación)
   - Crear nuevo presupuesto

#### Estados de Presupuesto

| Estado              | Badge       | Descripción              |
| ------------------- | ----------- | ------------------------ |
| `draft`             | Outline     | Borrador, no enviado     |
| `sent`              | Secondary   | Enviado al cliente       |
| `accepted`          | Default     | Aceptado por el cliente  |
| `rejected`          | Destructive | Rechazado por el cliente |
| `expired`           | Outline     | Expirado automáticamente |
| `converted_to_work` | Default     | Convertido a trabajo     |

### Página de Detalle: `[id]/page.tsx`

**Responsabilidad:** Vista y edición de presupuesto individual

#### Funcionalidades

1. **Información del Presupuesto**
   - Número, fecha, estado
   - Cliente y receta asociada
   - Especificaciones completas

2. **Cálculo de Precios**
   - Desglose de costos
   - Aplicación de descuentos
   - Cálculo de impuestos
   - Total final

3. **Acciones Disponibles**
   - Editar presupuesto
   - Enviar al cliente
   - Convertir a trabajo
   - Eliminar

### Componente: `CreateQuoteForm.tsx`

**Ubicación:** `src/components/admin/CreateQuoteForm.tsx`  
**Líneas:** ~1,200  
**Responsabilidad:** Formulario completo de creación/edición

#### Secciones del Formulario

1. **Selección de Cliente**
   - Búsqueda inteligente (RUT, nombre, email)
   - Crear nuevo cliente si no existe
   - Carga automática de recetas del cliente

2. **Selección de Receta**
   - Lista de recetas del cliente
   - Crear nueva receta desde el formulario
   - Visualización de datos de receta

3. **Selección de Armazón**
   - Búsqueda de productos (frames)
   - Carga automática de datos del producto
   - Campos manuales si no hay producto

4. **Especificaciones de Lente**
   - Tipo de lente (select)
   - Material del lente (select)
   - Índice de refracción
   - Tratamientos (checkboxes múltiples)
   - Tinte (color y porcentaje)

5. **Precios y Costos**
   - Precio del armazón (auto o manual)
   - Costo del lente (calculado automáticamente)
   - Costo de tratamientos (calculado automáticamente)
   - Costo de mano de obra
   - Descuentos (porcentaje o monto fijo)

6. **Cálculo Automático**
   - Subtotal
   - Impuesto (IVA)
   - Descuento
   - Total

7. **Notas y Configuración**
   - Notas internas
   - Notas para el cliente
   - Días de expiración

#### Lógica de Cálculo

```typescript
// 1. Costo base del lente según tipo
const baseLensCost = quoteSettings.lens_type_base_costs[lens_type] || 0;

// 2. Multiplicador por material
const materialMultiplier =
  quoteSettings.lens_material_multipliers[lens_material] || 1.0;
const lensCost = baseLensCost * materialMultiplier;

// 3. Costo de tratamientos
const treatmentsCost = lens_treatments.reduce((sum, treatment) => {
  return sum + (quoteSettings.treatment_prices[treatment] || 0);
}, 0);

// 4. Subtotal
const subtotal = frame_cost + lensCost + treatmentsCost + labor_cost;

// 5. Descuento
const discountAmount =
  discountType === "percentage"
    ? subtotal * (discount_percentage / 100)
    : discount_amount;

// 6. Subtotal con descuento
const subtotalAfterDiscount = subtotal - discountAmount;

// 7. Impuesto
const taxAmount = subtotalAfterDiscount * (taxPercentage / 100);

// 8. Total
const totalAmount = subtotalAfterDiscount + taxAmount;
```

### Página de Configuración: `settings/page.tsx`

**Responsabilidad:** Configuración de precios y parámetros

#### Configuraciones Disponibles

1. **Precios de Tratamientos**
   - Anti-reflejante
   - Filtro de luz azul
   - Protección UV
   - Anti-rayaduras
   - Anti-vaho
   - Fotocromático
   - Polarizado
   - Tinte

2. **Costos Base por Tipo de Lente**
   - Visión simple
   - Bifocal
   - Trifocal
   - Progresivo
   - Lectura
   - Computadora
   - Deportivo

3. **Multiplicadores por Material**
   - CR-39
   - Policarbonato
   - Alto Índice 1.67
   - Alto Índice 1.74
   - Trivex
   - Vidrio

4. **Parámetros Generales**
   - Costo de mano de obra por defecto
   - Porcentaje de impuesto (IVA)
   - Días de expiración por defecto
   - Margen de ganancia
   - Descuentos por volumen

5. **Plantillas**
   - Términos y condiciones
   - Plantilla de notas

---

## 🌐 APIs y Endpoints

### `GET /api/admin/quotes`

**Responsabilidad:** Listar presupuestos con paginación y filtros

#### Query Parameters

| Parámetro     | Tipo   | Descripción                                                                                        |
| ------------- | ------ | -------------------------------------------------------------------------------------------------- |
| `page`        | number | Número de página (default: 1)                                                                      |
| `limit`       | number | Items por página (default: 20)                                                                     |
| `status`      | string | Filtrar por estado: "all", "draft", "sent", "accepted", "rejected", "expired", "converted_to_work" |
| `customer_id` | string | Filtrar por cliente                                                                                |

#### Headers

- `x-branch-id`: ID de sucursal o "global" para super admin

#### Response

```json
{
  "quotes": [
    {
      "id": "uuid",
      "quote_number": "COT-2025-0001",
      "quote_date": "2025-01-27",
      "expiration_date": "2025-02-26",
      "customer": {
        "id": "uuid",
        "first_name": "string",
        "last_name": "string",
        "email": "string"
      },
      "prescription": {...},
      "frame_name": "string",
      "lens_type": "progressive",
      "total_amount": 150000,
      "status": "sent",
      "created_at": "2025-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Lógica

1. Verifica autenticación y rol admin
2. Obtiene contexto de sucursal
3. Llama a `check_and_expire_quotes()` para expirar automáticamente
4. Aplica filtros de sucursal (RLS)
5. Aplica filtros de estado y cliente
6. Pagina resultados
7. Carga relaciones (customers, prescriptions, products)
8. Retorna presupuestos con relaciones

### `POST /api/admin/quotes`

**Responsabilidad:** Crear nuevo presupuesto

#### Request Body

```json
{
  "customer_id": "uuid",
  "prescription_id": "uuid",
  "frame_product_id": "uuid",
  "frame_name": "string",
  "frame_brand": "string",
  "frame_model": "string",
  "frame_color": "string",
  "frame_size": "string",
  "frame_sku": "string",
  "frame_price": 0,
  "lens_type": "progressive",
  "lens_material": "polycarbonate",
  "lens_index": 1.67,
  "lens_treatments": ["anti_reflective", "blue_light_filter"],
  "lens_tint_color": "gray",
  "lens_tint_percentage": 20,
  "frame_cost": 0,
  "lens_cost": 0,
  "treatments_cost": 0,
  "labor_cost": 0,
  "subtotal": 0,
  "tax_amount": 0,
  "discount_amount": 0,
  "discount_percentage": 0,
  "total_amount": 0,
  "notes": "string",
  "customer_notes": "string",
  "expiration_days": 30,
  "branch_id": "uuid"
}
```

#### Lógica

1. Genera número de presupuesto (`generate_quote_number()`)
2. Obtiene configuración de expiración desde `quote_settings`
3. Calcula `expiration_date` basado en `expiration_days`
4. Valida datos
5. Inserta presupuesto
6. Retorna presupuesto creado

### `GET /api/admin/quotes/[id]`

**Responsabilidad:** Obtener presupuesto por ID

#### Response

```json
{
  "quote": {
    "id": "uuid",
    "quote_number": "COT-2025-0001",
    "customer": {...},
    "prescription": {...},
    "frame_product": {...},
    ...
  }
}
```

### `PUT /api/admin/quotes/[id]`

**Responsabilidad:** Actualizar presupuesto

#### Request Body

Mismo formato que POST, todos los campos opcionales.

#### Validaciones

- Presupuesto debe existir
- No se puede editar si está convertido a trabajo
- Validación de estado (transiciones permitidas)

### `DELETE /api/admin/quotes/[id]`

**Responsabilidad:** Eliminar presupuesto

#### Validaciones

- No se puede eliminar si está convertido a trabajo
- Confirmación requerida

### `POST /api/admin/quotes/[id]/convert`

**Responsabilidad:** Convertir presupuesto a trabajo de laboratorio

#### Request Body

```json
{
  "work_order_data": {
    // Datos adicionales para el trabajo
  }
}
```

#### Lógica

1. Valida que el presupuesto esté en estado válido
2. Crea trabajo de laboratorio con datos del presupuesto
3. Actualiza estado del presupuesto a 'converted_to_work'
4. Vincula presupuesto con trabajo (`converted_to_work_order_id`)
5. Retorna trabajo creado

### `POST /api/admin/quotes/[id]/send`

**Responsabilidad:** Enviar presupuesto al cliente

#### Lógica

1. Actualiza estado a 'sent'
2. Registra `sent_by` y `sent_at`
3. Opcionalmente envía email al cliente
4. Retorna presupuesto actualizado

### `GET /api/admin/quote-settings`

**Responsabilidad:** Obtener configuración de presupuestos

#### Headers

- `x-branch-id`: ID de sucursal

#### Response

```json
{
  "settings": {
    "treatment_prices": {...},
    "lens_type_base_costs": {...},
    "lens_material_multipliers": {...},
    "default_labor_cost": 15000,
    "default_tax_percentage": 19.0,
    "default_expiration_days": 30,
    ...
  }
}
```

### `PUT /api/admin/quote-settings`

**Responsabilidad:** Actualizar configuración de presupuestos

#### Request Body

```json
{
  "treatment_prices": {...},
  "lens_type_base_costs": {...},
  "lens_material_multipliers": {...},
  "default_labor_cost": 15000,
  "default_tax_percentage": 19.0,
  "default_expiration_days": 30,
  ...
}
```

---

## 🔄 Flujos de Datos

### Flujo: Crear Presupuesto

```
1. Usuario accede a /admin/quotes
   ↓
2. Click en "Nuevo Presupuesto"
   ↓
3. CreateQuoteForm se abre
   ↓
4. Usuario busca/selecciona cliente
   ↓
5. Sistema carga recetas del cliente
   ↓
6. Usuario selecciona receta (opcional)
   ↓
7. Usuario busca/selecciona armazón
   ↓
8. Usuario configura lente:
   - Tipo, material, tratamientos
   ↓
9. Sistema calcula precios automáticamente:
   - Costo base lente × multiplicador material
   - Suma tratamientos
   - Aplica descuentos
   - Calcula impuesto
   ↓
10. Usuario ajusta precios manualmente si necesario
   ↓
11. Submit → POST /api/admin/quotes
   ↓
12. Servidor genera número de presupuesto
   ↓
13. Calcula fecha de expiración
   ↓
14. Inserta en BD
   ↓
15. Retorna presupuesto creado
   ↓
16. Formulario se cierra, lista se actualiza
```

### Flujo: Convertir Presupuesto a Trabajo

```
1. Usuario abre detalle de presupuesto
   ↓
2. Click en "Convertir a Trabajo"
   ↓
3. POST /api/admin/quotes/[id]/convert
   ↓
4. Servidor valida estado del presupuesto
   ↓
5. Crea trabajo de laboratorio:
   - Copia datos del presupuesto
   - Genera número de trabajo
   - Estado inicial: 'quote'
   ↓
6. Actualiza presupuesto:
   - status = 'converted_to_work'
   - converted_to_work_order_id = nuevo trabajo
   ↓
7. Retorna trabajo creado
   ↓
8. Redirección a detalle del trabajo
```

### Flujo: Expiración Automática

```
1. Usuario lista presupuestos
   ↓
2. GET /api/admin/quotes
   ↓
3. Servidor llama check_and_expire_quotes()
   ↓
4. Función busca presupuestos con:
   - expiration_date < CURRENT_DATE
   - status NOT IN ('expired', 'converted_to_work', 'accepted')
   ↓
5. Actualiza status a 'expired'
   ↓
6. Retorna lista con presupuestos actualizados
```

### Flujo: Cargar Presupuesto en POS

```
1. Usuario en POS selecciona cliente
   ↓
2. Sistema busca presupuestos del cliente
   ↓
3. Muestra lista de presupuestos activos
   ↓
4. Usuario selecciona presupuesto
   ↓
5. Sistema carga datos al formulario de orden:
   - Armazón (producto o manual)
   - Especificaciones de lente
   - Precios y costos
   ↓
6. Usuario puede ajustar antes de crear orden
   ↓
7. Al crear orden, se vincula con presupuesto
```

---

## ⚙️ Sistema de Configuración

### Tabla `quote_settings`

Almacena configuración de precios y parámetros.

#### Características

- **Único registro por sucursal**: Usa índice funcional para garantizar unicidad
- **Multi-sucursal**: Soporta configuración por sucursal
- **Valores por defecto**: Se insertan valores iniciales en migración

#### Uso en Cálculos

```typescript
// Obtener configuración
const settings = await fetch("/api/admin/quote-settings");

// Calcular costo de lente
const baseCost = settings.lens_type_base_costs[lensType];
const multiplier = settings.lens_material_multipliers[lensMaterial];
const lensCost = baseCost * multiplier;

// Calcular costo de tratamientos
const treatmentsCost = treatments.reduce((sum, treatment) => {
  return sum + (settings.treatment_prices[treatment] || 0);
}, 0);
```

---

## 🔒 Validaciones y Seguridad

### Validaciones en Cliente

1. **Campos Requeridos**
   - Cliente (customer_id)
   - Total amount > 0

2. **Validaciones de Negocio**
   - Porcentaje de descuento: 0-100
   - Porcentaje de tinte: 0-100
   - Fechas válidas

### Validaciones en Servidor

1. **Autenticación y Autorización**
   - Usuario autenticado
   - Rol admin verificado

2. **Validación de Datos**
   - Campos requeridos
   - Tipos de datos correctos
   - Constraints de BD

3. **Validación de Negocio**
   - Cliente debe existir
   - Receta debe existir (si se proporciona)
   - Producto debe existir (si se proporciona)
   - Estado válido para transiciones

### Seguridad

1. **Row Level Security (RLS)**
   - Solo admins pueden ver/crear/editar presupuestos
   - Filtrado por sucursal

2. **Validación de Estado**
   - No se puede editar presupuesto convertido
   - Transiciones de estado controladas

---

## 🏢 Multi-Tenancy (Sucursales)

### Implementación

- **Campo `branch_id`**: Cada presupuesto pertenece a una sucursal
- **RLS Policies**: Filtran por sucursal automáticamente
- **Configuración por Sucursal**: `quote_settings` puede tener valores por sucursal
- **Super Admin**: Puede ver todas las sucursales

### Flujo

```
1. Admin selecciona sucursal
   ↓
2. Header x-branch-id se envía en requests
   ↓
3. Servidor aplica filtro de sucursal
   ↓
4. Solo presupuestos de esa sucursal se retornan
```

---

## 🔗 Integración con Otras Secciones

### Integración con Productos

- **Selección de Armazones**: Los presupuestos pueden vincularse con productos (frames)
- **Carga de Datos**: Al seleccionar producto, se cargan automáticamente:
  - Nombre, marca, modelo
  - Color, tamaño, SKU
  - Precio

### Integración con Recetas (Prescriptions)

- **Vinculación**: Presupuestos pueden asociarse con recetas
- **Datos de Receta**: Se muestran en el presupuesto
- **Historial**: Cliente puede tener múltiples recetas

### Integración con Trabajos (Work Orders)

- **Conversión**: Presupuestos se convierten en trabajos
- **Vínculo Bidireccional**:
  - `quotes.converted_to_work_order_id` → trabajo
  - `lab_work_orders.quote_id` → presupuesto original

### Integración con POS

- **Carga de Presupuestos**: POS puede cargar presupuestos del cliente
- **Datos Pre-poblados**: Formulario de orden se pre-pobla con datos del presupuesto
- **Vinculación**: Órdenes pueden referenciar presupuestos

---

## 📝 Notas Finales

### Dependencias Clave

- `@/lib/utils/tax`: Funciones de cálculo de impuestos
- `@/lib/utils/tax-config`: Configuración de impuestos
- `@/hooks/useBranch`: Contexto de sucursal

### Extensiones Futuras Posibles

1. **Envío de Emails**: Notificaciones automáticas al cliente
2. **PDF de Presupuesto**: Generación de PDF para envío
3. **Firma Digital**: Aceptación/rechazo con firma
4. **Historial de Cambios**: Audit log de modificaciones
5. **Plantillas Personalizables**: Plantillas de presupuesto por sucursal
6. **Aprobaciones**: Flujo de aprobación para presupuestos grandes

---

**Fin del Documento**
