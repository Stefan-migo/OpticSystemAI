# Análisis Completo: Sección de Trabajos (Work Orders)

**Fecha de Análisis:** 2025-01-27  
**Versión del Sistema:** 1.0  
**Autor:** Análisis Técnico Completo

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Frontend - Componentes y Páginas](#frontend---componentes-y-páginas)
5. [Sistema de Estados y Workflow](#sistema-de-estados-y-workflow)
6. [APIs y Endpoints](#apis-y-endpoints)
7. [Flujos de Datos](#flujos-de-datos)
8. [Historial de Estados](#historial-de-estados)
9. [Validaciones y Seguridad](#validaciones-y-seguridad)
10. [Multi-Tenancy (Sucursales)](#multi-tenancy-sucursales)
11. [Integración con Otras Secciones](#integración-con-otras-secciones)

---

## 🎯 Resumen Ejecutivo

La sección de trabajos (work orders) es un módulo completo para gestionar el ciclo de vida completo de trabajos de laboratorio óptico. Permite crear, rastrear y gestionar trabajos desde la orden inicial hasta la entrega al cliente, con seguimiento detallado de estados, fechas, laboratorios externos, y control de calidad.

### Características Principales

- ✅ CRUD completo de trabajos
- ✅ Sistema de estados con workflow completo
- ✅ Historial de cambios de estado (audit trail)
- ✅ Gestión de laboratorios externos
- ✅ Control de calidad
- ✅ Gestión de pagos (depósito, balance)
- ✅ Asignación de personal
- ✅ Integración con presupuestos
- ✅ Integración con POS
- ✅ Multi-sucursal con RLS
- ✅ Generación automática de números de trabajo

---

## 🏗️ Arquitectura General

### Estructura de Directorios

```
src/app/admin/work-orders/
├── page.tsx                    # Lista de trabajos
└── [id]/
    └── page.tsx                # Detalle y gestión de trabajo

src/components/admin/CreateWorkOrderForm/
├── index.tsx                   # Formulario principal
├── CustomerSelector.tsx        # Selector de cliente
├── PrescriptionSelector.tsx    # Selector de receta
├── FrameSelector.tsx           # Selector de armazón
├── LensConfiguration.tsx       # Configuración de lente
├── LabInfoSection.tsx          # Información de laboratorio
├── PricingSection.tsx          # Sección de precios
├── StatusSection.tsx           # Gestión de estado
├── NotesSection.tsx            # Notas
└── hooks/
    ├── useWorkOrderForm.ts     # Hook de formulario
    ├── useWorkOrderCalculations.ts # Hook de cálculos
    └── useWorkOrderValidation.ts   # Hook de validación
```

### Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Estado:** React useState/useEffect con hooks personalizados
- **UI:** shadcn/ui, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Cálculos:** Funciones utilitarias de tax y pricing
- **Validación:** Hooks personalizados de validación

---

## 🗄️ Estructura de Base de Datos

### Tabla: `lab_work_orders`

Tabla principal que almacena todos los trabajos de laboratorio.

#### Columnas Principales

| Columna                       | Tipo          | Nullable | Default             | Descripción                                                                                  |
| ----------------------------- | ------------- | -------- | ------------------- | -------------------------------------------------------------------------------------------- |
| `id`                          | UUID          | NO       | `gen_random_uuid()` | Identificador único                                                                          |
| `work_order_number`           | TEXT          | NO       | -                   | Número único (ej: "TRB-2025-001")                                                            |
| `work_order_date`             | DATE          | NO       | CURRENT_DATE        | Fecha del trabajo                                                                            |
| `customer_id`                 | UUID          | NO       | -                   | FK a customers (profiles)                                                                    |
| `prescription_id`             | UUID          | YES      | NULL                | FK a prescriptions                                                                           |
| `quote_id`                    | UUID          | YES      | NULL                | FK a quotes (si viene de presupuesto)                                                        |
| `frame_product_id`            | UUID          | YES      | NULL                | FK a products (armazón)                                                                      |
| `frame_name`                  | TEXT          | NO       | -                   | Nombre del armazón                                                                           |
| `frame_brand`                 | TEXT          | YES      | NULL                | Marca del armazón                                                                            |
| `frame_model`                 | TEXT          | YES      | NULL                | Modelo del armazón                                                                           |
| `frame_color`                 | TEXT          | YES      | NULL                | Color del armazón                                                                            |
| `frame_size`                  | TEXT          | YES      | NULL                | Tamaño del armazón                                                                           |
| `frame_sku`                   | TEXT          | YES      | NULL                | SKU del armazón                                                                              |
| `frame_serial_number`         | TEXT          | YES      | NULL                | Número de serie del armazón específico                                                       |
| `lens_type`                   | TEXT          | NO       | -                   | Tipo: 'single_vision', 'bifocal', 'trifocal', 'progressive', 'reading', 'computer', 'sports' |
| `lens_material`               | TEXT          | NO       | -                   | Material del lente                                                                           |
| `lens_index`                  | DECIMAL(3,2)  | YES      | NULL                | Índice de refracción                                                                         |
| `lens_treatments`             | TEXT[]        | NO       | '{}'                | Tratamientos aplicados                                                                       |
| `lens_tint_color`             | TEXT          | YES      | NULL                | Color del tinte                                                                              |
| `lens_tint_percentage`        | INTEGER       | YES      | NULL                | Porcentaje de tinte (0-100)                                                                  |
| `prescription_snapshot`       | JSONB         | YES      | NULL                | Snapshot completo de receta al momento de orden                                              |
| `lab_name`                    | TEXT          | YES      | NULL                | Nombre del laboratorio                                                                       |
| `lab_contact`                 | TEXT          | YES      | NULL                | Contacto del laboratorio                                                                     |
| `lab_order_number`            | TEXT          | YES      | NULL                | Número de orden del laboratorio                                                              |
| `lab_estimated_delivery_date` | DATE          | YES      | NULL                | Fecha estimada de entrega del lab                                                            |
| `status`                      | TEXT          | NO       | 'quote'             | Estado del trabajo (ver sección de estados)                                                  |
| `ordered_at`                  | TIMESTAMPTZ   | YES      | NULL                | Fecha de orden                                                                               |
| `sent_to_lab_at`              | TIMESTAMPTZ   | YES      | NULL                | Fecha de envío al lab                                                                        |
| `lab_started_at`              | TIMESTAMPTZ   | YES      | NULL                | Fecha de inicio en lab                                                                       |
| `lab_completed_at`            | TIMESTAMPTZ   | YES      | NULL                | Fecha de completado en lab                                                                   |
| `received_from_lab_at`        | TIMESTAMPTZ   | YES      | NULL                | Fecha de recepción del lab                                                                   |
| `mounted_at`                  | TIMESTAMPTZ   | YES      | NULL                | Fecha de montaje                                                                             |
| `quality_checked_at`          | TIMESTAMPTZ   | YES      | NULL                | Fecha de control de calidad                                                                  |
| `ready_at`                    | TIMESTAMPTZ   | YES      | NULL                | Fecha de listo para retiro                                                                   |
| `delivered_at`                | TIMESTAMPTZ   | YES      | NULL                | Fecha de entrega                                                                             |
| `cancelled_at`                | TIMESTAMPTZ   | YES      | NULL                | Fecha de cancelación                                                                         |
| `frame_cost`                  | DECIMAL(10,2) | NO       | 0                   | Costo del armazón                                                                            |
| `lens_cost`                   | DECIMAL(10,2) | NO       | 0                   | Costo del lente                                                                              |
| `treatments_cost`             | DECIMAL(10,2) | NO       | 0                   | Costo de tratamientos                                                                        |
| `labor_cost`                  | DECIMAL(10,2) | NO       | 0                   | Costo de mano de obra                                                                        |
| `lab_cost`                    | DECIMAL(10,2) | NO       | 0                   | Costo pagado al laboratorio                                                                  |
| `subtotal`                    | DECIMAL(10,2) | NO       | 0                   | Subtotal                                                                                     |
| `tax_amount`                  | DECIMAL(10,2) | NO       | 0                   | Monto de impuesto                                                                            |
| `discount_amount`             | DECIMAL(10,2) | NO       | 0                   | Monto de descuento                                                                           |
| `total_amount`                | DECIMAL(10,2) | NO       | -                   | Monto total                                                                                  |
| `currency`                    | TEXT          | NO       | 'CLP'               | Moneda                                                                                       |
| `payment_status`              | TEXT          | NO       | 'pending'           | Estado: 'pending', 'partial', 'paid', 'refunded'                                             |
| `payment_method`              | TEXT          | YES      | NULL                | Método de pago                                                                               |
| `deposit_amount`              | DECIMAL(10,2) | NO       | 0                   | Monto de depósito                                                                            |
| `balance_amount`              | DECIMAL(10,2) | NO       | 0                   | Saldo pendiente                                                                              |
| `pos_order_id`                | UUID          | YES      | NULL                | FK a orders (si se vendió por POS)                                                           |
| `internal_notes`              | TEXT          | YES      | NULL                | Notas internas                                                                               |
| `customer_notes`              | TEXT          | YES      | NULL                | Notas visibles al cliente                                                                    |
| `lab_notes`                   | TEXT          | YES      | NULL                | Notas del laboratorio                                                                        |
| `quality_notes`               | TEXT          | YES      | NULL                | Notas de control de calidad                                                                  |
| `cancellation_reason`         | TEXT          | YES      | NULL                | Razón de cancelación                                                                         |
| `created_by`                  | UUID          | YES      | NULL                | FK a auth.users                                                                              |
| `assigned_to`                 | UUID          | YES      | NULL                | FK a auth.users (personal asignado)                                                          |
| `lab_contact_person`          | TEXT          | YES      | NULL                | Persona de contacto en el lab                                                                |
| `warranty_start_date`         | DATE          | YES      | NULL                | Inicio de garantía                                                                           |
| `warranty_end_date`           | DATE          | YES      | NULL                | Fin de garantía                                                                              |
| `warranty_details`            | TEXT          | YES      | NULL                | Detalles de garantía                                                                         |
| `created_at`                  | TIMESTAMPTZ   | NO       | NOW()               | Fecha de creación                                                                            |
| `updated_at`                  | TIMESTAMPTZ   | NO       | NOW()               | Fecha de actualización                                                                       |
| `branch_id`                   | UUID          | YES      | NULL                | FK a branches (multi-sucursal)                                                               |

#### Constraints

- `work_order_number` UNIQUE
- `status` CHECK IN ('quote', 'ordered', 'sent_to_lab', 'in_progress_lab', 'ready_at_lab', 'received_from_lab', 'mounted', 'quality_check', 'ready_for_pickup', 'delivered', 'cancelled', 'returned')
- `payment_status` CHECK IN ('pending', 'partial', 'paid', 'refunded')
- `lens_type` CHECK IN ('single_vision', 'bifocal', 'trifocal', 'progressive', 'reading', 'computer', 'sports')
- `lens_tint_percentage` CHECK (>= 0 AND <= 100)
- Foreign Keys:
  - `customer_id` → `profiles(id)` ON DELETE CASCADE
  - `prescription_id` → `prescriptions(id)` ON DELETE SET NULL
  - `quote_id` → `quotes(id)` ON DELETE SET NULL
  - `frame_product_id` → `products(id)` ON DELETE SET NULL
  - `pos_order_id` → `orders(id)` ON DELETE SET NULL
  - `branch_id` → `branches(id)` ON DELETE SET NULL

#### Índices

```sql
CREATE INDEX idx_lab_work_orders_customer_id ON public.lab_work_orders(customer_id);
CREATE INDEX idx_lab_work_orders_status ON public.lab_work_orders(status);
CREATE INDEX idx_lab_work_orders_work_order_number ON public.lab_work_orders(work_order_number);
CREATE INDEX idx_lab_work_orders_prescription_id ON public.lab_work_orders(prescription_id);
CREATE INDEX idx_lab_work_orders_quote_id ON public.lab_work_orders(quote_id);
CREATE INDEX idx_lab_work_orders_assigned_to ON public.lab_work_orders(assigned_to);
CREATE INDEX idx_lab_work_orders_created_at ON public.lab_work_orders(created_at);
CREATE INDEX idx_lab_work_orders_branch_id ON public.lab_work_orders(branch_id);
```

### Tabla: `lab_work_order_status_history`

Tabla para rastrear cambios de estado (audit trail).

#### Columnas

| Columna         | Tipo        | Nullable | Default             | Descripción           |
| --------------- | ----------- | -------- | ------------------- | --------------------- |
| `id`            | UUID        | NO       | `gen_random_uuid()` | Identificador único   |
| `work_order_id` | UUID        | NO       | -                   | FK a lab_work_orders  |
| `from_status`   | TEXT        | YES      | NULL                | Estado anterior       |
| `to_status`     | TEXT        | NO       | -                   | Nuevo estado          |
| `changed_at`    | TIMESTAMPTZ | NO       | NOW()               | Fecha del cambio      |
| `changed_by`    | UUID        | YES      | NULL                | FK a auth.users       |
| `notes`         | TEXT        | YES      | NULL                | Notas sobre el cambio |
| `created_at`    | TIMESTAMPTZ | NO       | NOW()               | Fecha de creación     |

#### Índices

```sql
CREATE INDEX idx_status_history_work_order_id ON public.lab_work_order_status_history(work_order_id);
CREATE INDEX idx_status_history_changed_at ON public.lab_work_order_status_history(changed_at);
```

### Funciones SQL Personalizadas

#### `generate_work_order_number()`

Genera números de trabajo secuenciales por año.

```sql
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  last_number INTEGER;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM '[0-9]+$') AS INTEGER)), 0)
  INTO last_number
  FROM public.lab_work_orders
  WHERE work_order_number LIKE 'TRB-' || year_part || '-%';

  new_number := 'TRB-' || year_part || '-' || LPAD((last_number + 1)::TEXT, 4, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
```

**Formato:** `TRB-YYYY-0001`, `TRB-YYYY-0002`, etc.

#### `update_work_order_status()`

Actualiza estado y crea entrada en historial.

```sql
CREATE OR REPLACE FUNCTION update_work_order_status(
  p_work_order_id UUID,
  p_new_status TEXT,
  p_changed_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_old_status TEXT;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status
  FROM public.lab_work_orders
  WHERE id = p_work_order_id;

  -- Update work order with status-specific dates
  UPDATE public.lab_work_orders
  SET
    status = p_new_status,
    updated_at = NOW(),
    ordered_at = CASE WHEN p_new_status = 'ordered' THEN NOW() ELSE ordered_at END,
    sent_to_lab_at = CASE WHEN p_new_status = 'sent_to_lab' THEN NOW() ELSE sent_to_lab_at END,
    lab_started_at = CASE WHEN p_new_status = 'in_progress_lab' THEN NOW() ELSE lab_started_at END,
    lab_completed_at = CASE WHEN p_new_status = 'ready_at_lab' THEN NOW() ELSE lab_completed_at END,
    received_from_lab_at = CASE WHEN p_new_status = 'received_from_lab' THEN NOW() ELSE received_from_lab_at END,
    mounted_at = CASE WHEN p_new_status = 'mounted' THEN NOW() ELSE mounted_at END,
    quality_checked_at = CASE WHEN p_new_status = 'quality_check' THEN NOW() ELSE quality_checked_at END,
    ready_at = CASE WHEN p_new_status = 'ready_for_pickup' THEN NOW() ELSE ready_at END,
    delivered_at = CASE WHEN p_new_status = 'delivered' THEN NOW() ELSE delivered_at END,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN NOW() ELSE cancelled_at END
  WHERE id = p_work_order_id;

  -- Create history entry
  INSERT INTO public.lab_work_order_status_history (
    work_order_id,
    from_status,
    to_status,
    changed_by,
    notes
  ) VALUES (
    p_work_order_id,
    v_old_status,
    p_new_status,
    p_changed_by,
    p_notes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Relaciones

```
lab_work_orders
├── customer_id → profiles(id) / customers(id)
├── prescription_id → prescriptions(id)
├── quote_id → quotes(id)
├── frame_product_id → products(id)
├── pos_order_id → orders(id)
├── branch_id → branches(id)
├── created_by → auth.users(id)
└── assigned_to → auth.users(id)

lab_work_order_status_history
├── work_order_id → lab_work_orders(id)
└── changed_by → auth.users(id)
```

### Row Level Security (RLS)

#### Políticas para `lab_work_orders`

```sql
-- Admins pueden ver todos los trabajos
CREATE POLICY "Admins can view all work orders"
ON public.lab_work_orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  )
);

-- Admins pueden crear trabajos
CREATE POLICY "Admins can create work orders"
ON public.lab_work_orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  )
);

-- Admins pueden actualizar trabajos
CREATE POLICY "Admins can update work orders"
ON public.lab_work_orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  )
);

-- Admins pueden eliminar trabajos
CREATE POLICY "Admins can delete work orders"
ON public.lab_work_orders FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
  )
);
```

#### Políticas para `lab_work_order_status_history`

```sql
-- Admins pueden ver historial
CREATE POLICY "Admins can view status history"
ON public.lab_work_order_status_history FOR SELECT
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

**Ubicación:** `src/app/admin/work-orders/page.tsx`  
**Líneas:** ~747  
**Responsabilidad:** Lista y gestión de trabajos

#### Funcionalidades

1. **Lista de Trabajos**
   - Tabla con información principal
   - Paginación (20 por página)
   - Búsqueda por número, cliente, email, armazón, laboratorio
   - Filtro por estado

2. **Estados Visuales**
   - Badges de estado con iconos y colores
   - Indicadores de estado de pago
   - Fechas relevantes destacadas

3. **Acciones**
   - Ver detalle
   - Editar estado de pago (inline)
   - Eliminar (con confirmación)
   - Crear nuevo trabajo

#### Estados de Trabajo

| Estado              | Badge       | Color  | Descripción                |
| ------------------- | ----------- | ------ | -------------------------- |
| `quote`             | Outline     | Gray   | Presupuesto, no confirmado |
| `ordered`           | Secondary   | Blue   | Orden confirmada           |
| `sent_to_lab`       | Default     | Purple | Enviado al laboratorio     |
| `in_progress_lab`   | Default     | Purple | En proceso en laboratorio  |
| `ready_at_lab`      | Default     | Purple | Listo en laboratorio       |
| `received_from_lab` | Secondary   | Blue   | Recibido del laboratorio   |
| `mounted`           | Default     | Indigo | Lentes montados            |
| `quality_check`     | Secondary   | Yellow | Control de calidad         |
| `ready_for_pickup`  | Default     | Green  | Listo para retiro          |
| `delivered`         | Default     | Green  | Entregado al cliente       |
| `cancelled`         | Destructive | Red    | Cancelado                  |
| `returned`          | Destructive | Red    | Devuelto                   |

### Página de Detalle: `[id]/page.tsx`

**Responsabilidad:** Vista completa y gestión de trabajo individual

#### Funcionalidades

1. **Información del Trabajo**
   - Número, fecha, estado actual
   - Cliente, receta, presupuesto asociado
   - Especificaciones completas (armazón, lente, tratamientos)

2. **Timeline de Estados**
   - Visualización del progreso
   - Fechas de cada cambio de estado
   - Indicador visual del estado actual

3. **Gestión de Estado**
   - Cambio de estado con diálogo
   - Validación de transiciones permitidas
   - Notas opcionales en cada cambio
   - Actualización automática de fechas

4. **Información de Laboratorio**
   - Nombre y contacto del laboratorio
   - Número de orden del laboratorio
   - Fecha estimada de entrega
   - Notas del laboratorio

5. **Control de Calidad**
   - Notas de control de calidad
   - Fecha de verificación
   - Estado de calidad

6. **Gestión de Pagos**
   - Estado de pago
   - Depósito y balance
   - Método de pago
   - Actualización inline

7. **Historial de Estados**
   - Lista completa de cambios
   - Usuario que hizo el cambio
   - Fecha y hora
   - Notas de cada cambio

8. **Acciones Disponibles**
   - Editar trabajo
   - Cambiar estado
   - Actualizar información de laboratorio
   - Actualizar estado de pago
   - Eliminar trabajo

### Componente: `CreateWorkOrderForm`

**Ubicación:** `src/components/admin/CreateWorkOrderForm/`  
**Líneas:** ~377 (principal) + componentes hijos  
**Responsabilidad:** Formulario completo de creación

#### Estructura Modular

El formulario está dividido en componentes especializados:

1. **CustomerSelector** - Selección de cliente
2. **PrescriptionSelector** - Selección de receta
3. **FrameSelector** - Selección de armazón
4. **LensConfiguration** - Configuración de lente
5. **LabInfoSection** - Información de laboratorio
6. **PricingSection** - Precios y costos
7. **StatusSection** - Estado inicial
8. **NotesSection** - Notas

#### Hooks Personalizados

1. **useWorkOrderForm**
   - Gestión de estado del formulario
   - Carga de datos desde presupuesto (si aplica)
   - Persistencia temporal

2. **useWorkOrderCalculations**
   - Cálculo automático de precios
   - Aplicación de descuentos
   - Cálculo de impuestos
   - Balance de pagos

3. **useWorkOrderValidation**
   - Validación de campos requeridos
   - Validación de negocio
   - Mensajes de error

#### Secciones del Formulario

1. **Cliente y Receta**
   - Búsqueda de cliente
   - Carga de recetas del cliente
   - Crear nueva receta

2. **Armazón**
   - Búsqueda de productos (frames)
   - Carga automática de datos
   - Campos manuales

3. **Lente**
   - Tipo, material, índice
   - Tratamientos (múltiples)
   - Tinte (color y porcentaje)

4. **Laboratorio**
   - Nombre y contacto
   - Número de orden
   - Fecha estimada

5. **Precios**
   - Costos (auto-calculados o manuales)
   - Descuentos
   - Impuestos
   - Total

6. **Pagos**
   - Estado de pago
   - Depósito
   - Balance

7. **Estado Inicial**
   - Estado por defecto: 'quote' o 'ordered'

---

## 🔄 Sistema de Estados y Workflow

### Estados Disponibles

1. **`quote`** - Presupuesto creado, no confirmado
2. **`ordered`** - Orden confirmada, preparando para enviar
3. **`sent_to_lab`** - Enviado al laboratorio
4. **`in_progress_lab`** - En proceso en laboratorio
5. **`ready_at_lab`** - Listo en laboratorio, esperando retiro
6. **`received_from_lab`** - Recibido del laboratorio, necesita montaje
7. **`mounted`** - Lentes montados en armazón
8. **`quality_check`** - Control de calidad
9. **`ready_for_pickup`** - Listo para retiro del cliente
10. **`delivered`** - Entregado al cliente
11. **`cancelled`** - Cancelado
12. **`returned`** - Devuelto por el cliente

### Workflow Típico

```
quote → ordered → sent_to_lab → in_progress_lab → ready_at_lab
  → received_from_lab → mounted → quality_check → ready_for_pickup → delivered
```

### Transiciones Permitidas

- Desde cualquier estado se puede cancelar
- Estados finales (delivered, cancelled, returned) no pueden cambiar
- Algunas transiciones pueden requerir validaciones adicionales

### Actualización Automática de Fechas

Cada cambio de estado actualiza automáticamente la fecha correspondiente:

- `ordered` → `ordered_at`
- `sent_to_lab` → `sent_to_lab_at`
- `in_progress_lab` → `lab_started_at`
- `ready_at_lab` → `lab_completed_at`
- `received_from_lab` → `received_from_lab_at`
- `mounted` → `mounted_at`
- `quality_check` → `quality_checked_at`
- `ready_for_pickup` → `ready_at`
- `delivered` → `delivered_at`
- `cancelled` → `cancelled_at`

---

## 🌐 APIs y Endpoints

### `GET /api/admin/work-orders`

**Responsabilidad:** Listar trabajos con paginación y filtros

#### Query Parameters

| Parámetro     | Tipo   | Descripción                    |
| ------------- | ------ | ------------------------------ |
| `page`        | number | Número de página (default: 1)  |
| `limit`       | number | Items por página (default: 20) |
| `status`      | string | Filtrar por estado             |
| `customer_id` | string | Filtrar por cliente            |

#### Headers

- `x-branch-id`: ID de sucursal

#### Response

```json
{
  "workOrders": [
    {
      "id": "uuid",
      "work_order_number": "TRB-2025-0001",
      "work_order_date": "2025-01-27",
      "customer": {...},
      "prescription": {...},
      "quote": {...},
      "frame_name": "string",
      "lens_type": "progressive",
      "status": "sent_to_lab",
      "total_amount": 150000,
      "payment_status": "partial",
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

### `POST /api/admin/work-orders`

**Responsabilidad:** Crear nuevo trabajo

#### Request Body

```json
{
  "customer_id": "uuid",
  "prescription_id": "uuid",
  "quote_id": "uuid",
  "frame_product_id": "uuid",
  "frame_name": "string",
  "frame_brand": "string",
  "frame_model": "string",
  "frame_color": "string",
  "frame_size": "string",
  "frame_sku": "string",
  "frame_serial_number": "string",
  "lens_type": "progressive",
  "lens_material": "polycarbonate",
  "lens_index": 1.67,
  "lens_treatments": ["anti_reflective", "blue_light_filter"],
  "lens_tint_color": "gray",
  "lens_tint_percentage": 20,
  "lab_name": "string",
  "lab_contact": "string",
  "lab_order_number": "string",
  "lab_estimated_delivery_date": "2025-02-15",
  "status": "ordered",
  "frame_cost": 0,
  "lens_cost": 0,
  "treatments_cost": 0,
  "labor_cost": 0,
  "lab_cost": 0,
  "subtotal": 0,
  "tax_amount": 0,
  "discount_amount": 0,
  "total_amount": 0,
  "payment_status": "pending",
  "deposit_amount": 0,
  "balance_amount": 0,
  "internal_notes": "string",
  "customer_notes": "string",
  "assigned_to": "uuid",
  "branch_id": "uuid"
}
```

#### Lógica

1. Genera número de trabajo (`generate_work_order_number()`)
2. Crea snapshot de receta si existe
3. Valida datos
4. Inserta trabajo
5. Crea entrada inicial en historial
6. Si viene de presupuesto, actualiza presupuesto
7. Retorna trabajo creado

### `GET /api/admin/work-orders/[id]`

**Responsabilidad:** Obtener trabajo por ID con historial

#### Response

```json
{
  "workOrder": {
    "id": "uuid",
    "work_order_number": "TRB-2025-0001",
    "customer": {...},
    "prescription": {...},
    "quote": {...},
    "frame_product": {...},
    "assigned_staff": {...},
    ...
  },
  "statusHistory": [
    {
      "id": "uuid",
      "from_status": "quote",
      "to_status": "ordered",
      "changed_at": "2025-01-27T10:00:00Z",
      "changed_by_user": {...},
      "notes": "string"
    }
  ]
}
```

### `PUT /api/admin/work-orders/[id]`

**Responsabilidad:** Actualizar trabajo

#### Request Body

Todos los campos opcionales, solo enviar los que se actualizan.

#### Validaciones

- Trabajo debe existir
- No se puede editar si está en estado final
- Validación de estado para transiciones

### `PUT /api/admin/work-orders/[id]/status`

**Responsabilidad:** Cambiar estado del trabajo

#### Request Body

```json
{
  "status": "sent_to_lab",
  "notes": "Enviado a laboratorio XYZ",
  "lab_name": "Laboratorio XYZ",
  "lab_contact": "contacto@lab.com",
  "lab_order_number": "LAB-001",
  "lab_estimated_delivery_date": "2025-02-15"
}
```

#### Lógica

1. Valida transición de estado
2. Llama a `update_work_order_status()`
3. Actualiza fechas específicas del estado
4. Crea entrada en historial
5. Retorna trabajo actualizado

### `PUT /api/admin/work-orders/[id]/payment`

**Responsabilidad:** Actualizar estado de pago

#### Request Body

```json
{
  "payment_status": "partial",
  "deposit_amount": 50000,
  "balance_amount": 100000,
  "payment_method": "cash"
}
```

### `DELETE /api/admin/work-orders/[id]`

**Responsabilidad:** Eliminar trabajo

#### Validaciones

- No se puede eliminar si está entregado
- Confirmación requerida

---

## 🔄 Flujos de Datos

### Flujo: Crear Trabajo desde Presupuesto

```
1. Usuario en presupuesto click "Convertir a Trabajo"
   ↓
2. POST /api/admin/quotes/[id]/convert
   ↓
3. Servidor crea trabajo:
   - Copia datos del presupuesto
   - Genera número de trabajo
   - Estado inicial: 'quote'
   - Vincula con presupuesto
   ↓
4. Actualiza presupuesto:
   - status = 'converted_to_work'
   - converted_to_work_order_id = nuevo trabajo
   ↓
5. Redirección a detalle del trabajo
```

### Flujo: Crear Trabajo Manual

```
1. Usuario en lista click "Nuevo Trabajo"
   ↓
2. CreateWorkOrderForm se abre
   ↓
3. Usuario completa formulario:
   - Cliente, receta, armazón, lente
   - Información de laboratorio
   - Precios y pagos
   ↓
4. Submit → POST /api/admin/work-orders
   ↓
5. Servidor:
   - Genera número de trabajo
   - Crea snapshot de receta
   - Inserta trabajo
   - Crea entrada inicial en historial
   ↓
6. Formulario se cierra, lista se actualiza
```

### Flujo: Cambiar Estado

```
1. Usuario en detalle click "Cambiar Estado"
   ↓
2. Diálogo de cambio de estado se abre
   ↓
3. Usuario selecciona nuevo estado y opcionalmente:
   - Notas
   - Información de laboratorio (si aplica)
   ↓
4. Submit → PUT /api/admin/work-orders/[id]/status
   ↓
5. Servidor llama update_work_order_status():
   - Actualiza estado
   - Actualiza fecha específica del estado
   - Crea entrada en historial
   ↓
6. UI se actualiza con nuevo estado y fecha
```

### Flujo: Actualizar Estado de Pago

```
1. Usuario en lista o detalle actualiza pago inline
   ↓
2. PUT /api/admin/work-orders/[id]/payment
   ↓
3. Servidor actualiza:
   - payment_status
   - deposit_amount
   - balance_amount
   - payment_method
   ↓
4. UI se actualiza inmediatamente
```

---

## 📊 Historial de Estados

### Tabla `lab_work_order_status_history`

Almacena registro completo de cambios de estado.

#### Características

- **Audit Trail Completo**: Cada cambio se registra
- **Usuario**: Quién hizo el cambio
- **Fecha y Hora**: Cuándo se hizo
- **Notas**: Por qué se hizo el cambio
- **Estados**: De dónde vino y a dónde fue

#### Visualización

En la página de detalle se muestra:

- Timeline visual del progreso
- Lista de cambios con detalles
- Usuario responsable de cada cambio
- Notas de cada cambio

---

## 🔒 Validaciones y Seguridad

### Validaciones en Cliente

1. **Campos Requeridos**
   - Cliente (customer_id)
   - Armazón (frame_name)
   - Tipo de lente (lens_type)
   - Material de lente (lens_material)
   - Total amount > 0

2. **Validaciones de Negocio**
   - Porcentaje de tinte: 0-100
   - Depósito no puede ser mayor al total
   - Balance = total - depósito

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
   - Presupuesto debe existir (si se proporciona)
   - Estado válido para transiciones

### Seguridad

1. **Row Level Security (RLS)**
   - Solo admins pueden ver/crear/editar trabajos
   - Filtrado por sucursal

2. **Validación de Estado**
   - Transiciones de estado controladas
   - Estados finales no pueden cambiar

---

## 🏢 Multi-Tenancy (Sucursales)

### Implementación

- **Campo `branch_id`**: Cada trabajo pertenece a una sucursal
- **RLS Policies**: Filtran por sucursal automáticamente
- **Super Admin**: Puede ver todas las sucursales

---

## 🔗 Integración con Otras Secciones

### Integración con Presupuestos

- **Conversión**: Presupuestos se convierten en trabajos
- **Vínculo Bidireccional**:
  - `quotes.converted_to_work_order_id` → trabajo
  - `lab_work_orders.quote_id` → presupuesto original
- **Copia de Datos**: Al convertir, se copian todos los datos del presupuesto

### Integración con Productos

- **Selección de Armazones**: Trabajos pueden vincularse con productos
- **Carga de Datos**: Al seleccionar producto, se cargan datos automáticamente

### Integración con Recetas

- **Vinculación**: Trabajos se asocian con recetas
- **Snapshot**: Se guarda snapshot de receta al momento de crear trabajo
- **Historial**: Permite ver receta original aunque se actualice después

### Integración con POS

- **Venta Directa**: Trabajos pueden crearse desde POS
- **Vínculo**: `pos_order_id` vincula trabajo con orden de venta
- **Pago**: Estado de pago se actualiza desde POS

---

## 📝 Notas Finales

### Dependencias Clave

- `@/lib/utils/tax`: Funciones de cálculo de impuestos
- `@/lib/utils/tax-config`: Configuración de impuestos
- `@/hooks/useBranch`: Contexto de sucursal

### Extensiones Futuras Posibles

1. **Notificaciones Automáticas**: Alertas de cambios de estado
2. **Dashboard de Trabajos**: Vista de trabajos en progreso
3. **Reportes**: Reportes de tiempos, productividad, etc.
4. **Integración con Laboratorios**: API para comunicación con labs externos
5. **Tracking de Envíos**: Integración con servicios de envío
6. **Garantías Automáticas**: Cálculo automático de fechas de garantía

---

**Fin del Documento**
