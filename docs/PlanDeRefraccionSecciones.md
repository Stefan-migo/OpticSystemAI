# 🚀 PLAN MAESTRO V5.0: OPTTIUS (Final Release Strategy)

**Estrategia:** Cash-First + Shadow Billing (Adapter Pattern) + Matrices SQL.
**Objetivo:** Sistema robusto, escalable y preparado para SII sin fricción inicial.
**Fecha de Actualización:** 2026-01-20

---

## 📋 Índice

1. [Fase 1: El Núcleo de Datos](#fase-1-el-núcleo-de-datos-database-schema)
2. [Fase 2: POS con Shadow Billing](#fase-2-pos-con-shadow-billing-facturación-en-sombra)
3. [Fase 3: POS → Gatillo de Trabajo (Cash-First)](#fase-3-pos--gatillo-de-trabajo-cash-first)
4. [Fase 4: Pre-venta (Presupuestos como Alimentador)](#fase-4-pre-venta-presupuestos-como-alimentador)
5. [Fase 5: Post-venta (Producción & Entrega)](#fase-5-post-venta-producción--entrega)

---

## 📅 FASE 1: EL NÚCLEO DE DATOS (Database Schema)

### 1.1 Productos & Inventario (Separación Lógica)

**Decisión Arquitectónica:** Catálogo unificado, inventario por sucursal.

#### Problema Actual

- `products.inventory_quantity` es global y no refleja la realidad multi-sucursal
- Existe `product_branch_stock` pero no se usa consistentemente
- El stock se descuenta en diferentes momentos (inconsistente)

#### Solución Propuesta

**Tabla `products` (Catálogo Global):**

- **Propósito:** Definición única del producto compartida entre todas las sucursales
- **Contiene:** Nombre, Marca, SKU, Descripción, Fotos, Precio base, Categoría
- **NO contiene:** Cantidad de stock (esto va en `inventory`)

**Tabla `inventory` (Existencias por Sucursal):**

- **Propósito:** Stock físico específico por sucursal
- **Estructura:**
  ```sql
  CREATE TABLE inventory (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,              -- Stock disponible
    reserved_quantity INTEGER DEFAULT 0,              -- Reservado en carritos/órdenes pendientes
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    low_stock_threshold INTEGER DEFAULT 5,             -- Umbral de stock bajo
    reorder_point INTEGER,                             -- Punto de reorden
    last_stock_movement TIMESTAMPTZ,                  -- Último movimiento
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, branch_id)
  );
  ```

**Regla Crítica:**

- El stock se descuenta **SOLO** al confirmar la `Order` (Venta), **NO** al crear el `Work`.
- Esto asegura que el inventario refleje ventas reales, no intenciones.

#### Cambios en Código

1. **Migración de Base de Datos:**

   ```sql
   -- Remover inventario de products
   ALTER TABLE products
     DROP COLUMN IF EXISTS inventory_quantity,
     DROP COLUMN IF EXISTS track_inventory,
     DROP COLUMN IF EXISTS low_stock_threshold;

   -- Asegurar que inventory existe y tiene la estructura correcta
   -- (Ya existe product_branch_stock, migrar/renombrar si es necesario)
   ```

2. **Actualizar Queries:**
   - Reemplazar `products.inventory_quantity` por consultas a `inventory`
   - Crear función helper: `getProductStock(productId, branchId)`
   - Actualizar POS para consultar `inventory` en lugar de `products`

3. **Actualizar APIs:**
   - `GET /api/admin/products` - Incluir stock por sucursal en respuesta
   - `POST /api/admin/products` - No aceptar `inventory_quantity`, crear registro en `inventory` separado
   - `POST /api/admin/pos/process-sale` - Descontar de `inventory`, no de `products`

---

### 1.2 Cristales (Core Matricial SQL) — V2 alineado con negocio

**Decisión Arquitectónica:** Familia = definición genética (Tipo + Material). Matriz = precio por rangos (Esfera + Cilindro) + sourcing + costo único. Sin multiplicadores ni costos duplicados. Tratamientos estándar vienen en la familia; extras reales se cobran aparte en frontend (tinte/prisma).

#### Esquema V2

**Tabla `lens_families` (genética comercial):**

```sql
CREATE TABLE lens_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  lens_type TEXT NOT NULL CHECK (lens_type IN (
    'single_vision','bifocal','trifocal','progressive','reading','computer','sports'
  )),
  lens_material TEXT NOT NULL CHECK (lens_material IN (
    'cr39','polycarbonate','high_index_1_67','high_index_1_74','trivex','glass'
  )),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tabla `lens_price_matrices` (motor de precio):**

```sql
CREATE TABLE lens_price_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lens_family_id UUID REFERENCES lens_families(id) ON DELETE CASCADE,
  sphere_min DECIMAL(5,2) NOT NULL,
  sphere_max DECIMAL(5,2) NOT NULL,
  cylinder_min DECIMAL(5,2) NOT NULL,
  cylinder_max DECIMAL(5,2) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,   -- Precio venta
  cost DECIMAL(10,2) NOT NULL,         -- Costo compra
  sourcing_type TEXT CHECK (sourcing_type IN ('stock','surfaced')) DEFAULT 'surfaced',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_sphere_range CHECK (sphere_min <= sphere_max),
  CONSTRAINT valid_cylinder_range CHECK (cylinder_min <= cylinder_max)
);

CREATE INDEX idx_lens_matrices_family ON lens_price_matrices(lens_family_id);
CREATE INDEX idx_lens_matrices_sphere_range ON lens_price_matrices USING GIST (
  numrange(sphere_min::numeric, sphere_max::numeric, '[]')
);
```

**Función SQL `calculate_lens_price` (V2):**

```sql
CREATE OR REPLACE FUNCTION public.calculate_lens_price(
  p_lens_family_id UUID,
  p_sphere DECIMAL,
  p_cylinder DECIMAL DEFAULT 0,
  p_sourcing_type TEXT DEFAULT NULL
) RETURNS TABLE (
  price DECIMAL(10,2),
  sourcing_type TEXT,
  cost DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lpm.base_price,
    lpm.sourcing_type,
    lpm.cost
  FROM public.lens_price_matrices lpm
  JOIN public.lens_families lf ON lf.id = lpm.lens_family_id
  WHERE lpm.lens_family_id = p_lens_family_id
    AND p_sphere BETWEEN lpm.sphere_min AND lpm.sphere_max
    AND p_cylinder BETWEEN lpm.cylinder_min AND lpm.cylinder_max
    AND lpm.is_active = TRUE
    AND lf.is_active = TRUE
    AND (p_sourcing_type IS NULL OR lpm.sourcing_type = p_sourcing_type)
  ORDER BY
    CASE WHEN p_sourcing_type IS NULL AND lpm.sourcing_type = 'stock' THEN 0 ELSE 1 END,
    lpm.base_price ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

#### Reglas de UX/Negocio (frontend)

- Al seleccionar **Familia** se bloquean Tipo/Material/Índice (heredados de la familia).
- Precio = `Precio_Matriz(familia, receta) + Extras`.
- Tratamientos estándar (AR, Blue, UV, Anti-rayas) se asumen incluidos en la familia y se ocultan/deshabilitan.
- Extras visibles cuando hay familia: **Tinte (color/%)** y **Prisma**. Fotocromático se trata como familia (no extra).

#### Flujo recomendado

1. Receta seleccionada → se calcula esfera/cilindro normalizados.
2. Vendedor elige **Familia** → se consulta matriz SQL → se muestra precio.
3. Opcional: agrega extras reales (tinte/prisma).
4. Presupuesto guarda la configuración; el POS cobra y gatilla el trabajo según Cash-First.

#### Interfaz Administrativa

**CRUD para Familias de Cristales:**

- `GET /api/admin/lens-families` - Listar familias
- `POST /api/admin/lens-families` - Crear familia
- `PUT /api/admin/lens-families/[id]` - Actualizar familia
- `DELETE /api/admin/lens-families/[id]` - Desactivar familia

**CRUD para Matrices de Precios:**

- `GET /api/admin/lens-matrices?family_id=xxx` - Listar matrices
- `POST /api/admin/lens-matrices` - Crear matriz
- `PUT /api/admin/lens-matrices/[id]` - Actualizar matriz
- `DELETE /api/admin/lens-matrices/[id]` - Eliminar matriz

**Importador CSV:**

- Endpoint: `POST /api/admin/lens-matrices/import`
- Formato CSV: `family_name, lens_type, lens_material, sphere_min, sphere_max, base_price, sourcing_type, stock_cost, surfaced_cost`

#### Cambios en Código

1. **Reemplazar cálculo hardcodeado:**
   - `CreateQuoteForm` - Usar función SQL `calculate_lens_price()`
   - `CreateWorkOrderForm` - Usar función SQL `calculate_lens_price()`
   - `POS` - Usar función SQL `calculate_lens_price()`

2. **Crear componente `LensFamilySelector`:**
   - Dropdown que lista `lens_families`
   - Al seleccionar familia, carga matrices disponibles
   - Muestra precio calculado según receta

3. **Actualizar `quote_settings`:**
   - Remover campos JSONB de precios de lentes
   - Referenciar `lens_families` en lugar de valores hardcodeados

---

## 📅 FASE 2: POS CON "SHADOW BILLING" (Facturación en Sombra)

**Decisión Arquitectónica:** Patrón Adapter para facturación, empezar con interna, arquitectura lista para fiscal.

### 2.1 Arquitectura del Backend (Patrón Adapter)

El backend no debe saber si está emitiendo una boleta real o un papelito interno. Definimos una interfaz común.

**Estructura de Código:**

```typescript
// src/lib/billing/adapters/BillingAdapter.ts
export interface BillingAdapter {
  emitDocument(order: Order): Promise<BillingResult>;
  getDocumentStatus(folio: string): Promise<DocumentStatus>;
  cancelDocument(folio: string, reason: string): Promise<boolean>;
}

export interface BillingResult {
  folio: string;
  pdfUrl: string;
  type: "fiscal" | "internal";
  siiFolio?: string;
  siiStatus?: string;
  timestamp: Date;
}

export interface DocumentStatus {
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message?: string;
}
```

**Implementación Fase 1 (Control Interno):**

```typescript
// src/lib/billing/adapters/InternalBilling.ts
import {
  BillingAdapter,
  BillingResult,
  DocumentStatus,
} from "./BillingAdapter";
import PDFDocument from "pdfkit";

export class InternalBilling implements BillingAdapter {
  async emitDocument(order: Order): Promise<BillingResult> {
    // 1. Generar folio interno (secuencial por sucursal)
    const folio = await this.generateInternalFolio(order.branch_id);

    // 2. Generar PDF simple
    const pdfUrl = await this.generatePDF(order, folio);

    // 3. Guardar en orders
    await this.saveDocument(order.id, {
      document_type: "internal_ticket",
      internal_folio: folio,
      pdf_url: pdfUrl,
    });

    return {
      folio,
      pdfUrl,
      type: "internal",
      timestamp: new Date(),
    };
  }

  private async generateInternalFolio(branchId: string): Promise<string> {
    // Secuencial por sucursal: TKT-001, TKT-002, etc.
    const lastFolio = await this.getLastFolio(branchId);
    const nextNumber = (parseInt(lastFolio) || 0) + 1;
    return `TKT-${String(nextNumber).padStart(6, "0")}`;
  }

  private async generatePDF(order: Order, folio: string): Promise<string> {
    // Usar pdfkit o jsPDF para generar PDF simple
    // Incluir: Datos del cliente, items, totales, folio interno
    // Guardar en storage (Supabase Storage o local)
    // Retornar URL del PDF
  }

  async getDocumentStatus(folio: string): Promise<DocumentStatus> {
    // Para facturación interna, siempre está "aceptada"
    return { status: "accepted" };
  }

  async cancelDocument(folio: string, reason: string): Promise<boolean> {
    // Marcar como cancelado en orders
    return true;
  }
}
```

**Implementación Fase 2 (Control Fiscal SII - Futuro):**

```typescript
// src/lib/billing/adapters/SIIBilling.ts
export class SIIBilling implements BillingAdapter {
  constructor(private siiCredentials: SIICredentials) {}

  async emitDocument(order: Order): Promise<BillingResult> {
    // 1. Conectar con API externa (Haulmer/LibreDTE)
    const siiResponse = await this.callSIIAPI(order);

    // 2. Guardar en orders
    await this.saveDocument(order.id, {
      document_type: "boleta_electronica",
      sii_folio: siiResponse.folio,
      sii_status: siiResponse.status,
      pdf_url: siiResponse.pdfUrl,
    });

    return {
      folio: siiResponse.folio,
      pdfUrl: siiResponse.pdfUrl,
      type: "fiscal",
      siiFolio: siiResponse.folio,
      siiStatus: siiResponse.status,
      timestamp: new Date(),
    };
  }

  private async callSIIAPI(order: Order): Promise<SIIResponse> {
    // Implementar llamada a API de facturación
    // Retornar folio SII, PDF con timbre, estado
  }
}
```

**Factory Pattern:**

```typescript
// src/lib/billing/BillingFactory.ts
export class BillingFactory {
  static createAdapter(config: BillingConfig): BillingAdapter {
    if (config.useFiscalBilling) {
      return new SIIBilling(config.siiCredentials);
    }
    return new InternalBilling();
  }
}
```

### 2.2 Estrategia de Base de Datos para Facturación

**Cambios en tabla `orders`:**

```sql
-- Agregar campos para facturación
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS document_type TEXT
    CHECK (document_type IN ('internal_ticket', 'boleta_electronica', 'factura_electronica')),
  ADD COLUMN IF NOT EXISTS internal_folio TEXT,
  ADD COLUMN IF NOT EXISTS sii_folio TEXT,
  ADD COLUMN IF NOT EXISTS sii_status TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_orders_internal_folio ON orders(internal_folio);
CREATE INDEX IF NOT EXISTS idx_orders_sii_folio ON orders(sii_folio);
CREATE INDEX IF NOT EXISTS idx_orders_document_type ON orders(document_type);
```

**Estructura de Datos:**

- `document_type`: 'internal_ticket' (Fase 1) o 'boleta_electronica' (Fase 2)
- `internal_folio`: Correlativo simple para el cliente (Ej: TKT-000001)
- `sii_folio`: Correlativo fiscal (Ej: Boleta #998877). _Null en Fase 1._
- `sii_status`: Estado del envío al servicio de impuestos ('pending', 'accepted', 'rejected')
- `pdf_url`: URL del PDF generado (interno o fiscal)

### 2.3 Estrategia de Abonos y Pagos Parciales

**Tabla `order_payments` (Pagos Reales):**

```sql
CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'cash', 'debit', 'credit', 'transfer', 'check'
  )),
  payment_reference TEXT,              -- Número de transacción, cheque, etc.
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_payments_order ON order_payments(order_id);
CREATE INDEX idx_order_payments_date ON order_payments(paid_at);
```

**Función para Calcular Saldo Pendiente:**

```sql
CREATE OR REPLACE FUNCTION calculate_order_balance(p_order_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_total DECIMAL(10,2);
  v_paid DECIMAL(10,2);
BEGIN
  SELECT total_amount INTO v_total FROM orders WHERE id = p_order_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM order_payments
  WHERE order_id = p_order_id;
  RETURN GREATEST(0, v_total - v_paid);
END;
$$ LANGUAGE plpgsql;
```

**El Flujo de Abonos (Fase 1 vs Fase 2):**

**Escenario:** Total $100.000, Cliente abona $50.000.

**Fase 1 (Interna):**

- Se crea la `Order` por $100.000
- Se registra Pago de $50.000 en `order_payments`
- Se ejecuta `BillingAdapter` (genera folio interno TKT-000001)
- Se imprime "Comprobante de Pedido"
- _Dice:_ "Total: $100k / Pagado: $50k / **Saldo: $50k**"

**Fase 2 (SII Fiscal - Futuro):**

- Al recibir el **primer abono**, el sistema emite la **Boleta Electrónica por el TOTAL ($100.000)**
- _Por qué:_ Para rebajar el inventario fiscalmente de inmediato y simplificar la contabilidad
- _Recibo:_ Entrega la Boleta Fiscal + un "Comprobante de Deuda" interno que dice "Ud. ya tiene su boleta, pero nos debe $50.000"

---

## 📅 FASE 3: POS -> GATILLO DE TRABAJO (Cash-First)

**Decisión Arquitectónica:** Depósito mínimo configurable por organización, no hardcoded.

### 3.1 Configuración de Depósito Mínimo

**Tabla `organization_settings`:**

```sql
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  min_deposit_percent DECIMAL(5,2) DEFAULT 50.00,  -- Porcentaje mínimo de depósito
  min_deposit_amount DECIMAL(10,2),                -- Monto mínimo fijo (opcional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);
```

**Función para Obtener Depósito Mínimo:**

```sql
CREATE OR REPLACE FUNCTION get_min_deposit(
  p_organization_id UUID,
  p_order_total DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_percent DECIMAL(5,2);
  v_min_amount DECIMAL(10,2);
  v_calculated DECIMAL(10,2);
BEGIN
  SELECT
    COALESCE(min_deposit_percent, 50.00),
    COALESCE(min_deposit_amount, 0)
  INTO v_percent, v_min_amount
  FROM organization_settings
  WHERE organization_id = p_organization_id;

  -- Calcular depósito por porcentaje
  v_calculated := p_order_total * (v_percent / 100);

  -- Retornar el mayor entre porcentaje y monto fijo
  RETURN GREATEST(v_calculated, v_min_amount);
END;
$$ LANGUAGE plpgsql;
```

### 3.2 Endpoint `process-sale` (Orquestador)

**Flujo Completo:**

```typescript
// src/app/api/admin/pos/process-sale/route.ts

export async function POST(request: NextRequest) {
  // 1. TRANSACCIÓN FINANCIERA
  //    a. Crear Order
  const order = await createOrder({
    customer_id: cart.customerId,
    branch_id: currentBranchId,
    items: cart.items,
    totals: calculateTotals(cart),
  });

  //    b. Registrar pago(s)
  const payments = await createPayments(order.id, paymentData);

  //    c. Calcular saldo pendiente
  const balance = await calculateBalance(order.id);

  //    d. Ejecutar BillingAdapter (Shadow Billing)
  const billingConfig = await getBillingConfig(currentBranchId);
  const billingAdapter = BillingFactory.createAdapter(billingConfig);
  const billingResult = await billingAdapter.emitDocument(order);

  // 2. TRANSACCIÓN LOGÍSTICA (Inventario)
  //    Descontar productos físicos (solo si la venta es confirmada)
  const physicalItems = cart.items.filter((item) => item.isPhysical);
  await updateInventory(physicalItems, currentBranchId);

  // 3. TRANSACCIÓN OPERATIVA (Solo si hay lentes recetados)
  //    a. Verificar si hay item tipo "Cristal Matricial"
  const hasLensItem = cart.items.some((item) => item.type === "lens_complete");

  if (hasLensItem) {
    //    b. Obtener depósito mínimo configurado
    const minDeposit = await getMinDeposit(organizationId, order.total_amount);
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    //    c. Determinar estado según Cash-First
    let workOrderStatus: string;
    let paymentStatus: string;

    if (paidAmount < minDeposit) {
      // Pago insuficiente: trabajo en espera
      workOrderStatus = "on_hold_payment";
      paymentStatus = "pending";
    } else if (balance === 0) {
      // Pago completo: trabajo listo para procesar
      workOrderStatus = "ordered";
      paymentStatus = "paid";
    } else {
      // Pago parcial suficiente: trabajo listo pero con saldo pendiente
      workOrderStatus = "ordered";
      paymentStatus = "partial";
    }

    //    d. Crear Work Order
    const workOrder = await createWorkOrder({
      customer_id: order.customer_id,
      prescription_id: cart.prescriptionId,
      frame_data: cart.frameData,
      lens_data: cart.lensData,
      order_id: order.id,
      status: workOrderStatus,
      payment_status: paymentStatus,
      deposit_amount: paidAmount,
      balance_amount: balance,
      total_amount: order.total_amount,
    });
  }

  return NextResponse.json({
    order,
    billing: billingResult,
    workOrder: hasLensItem ? workOrder : null,
  });
}
```

**Regla Cash-First:**

- Si `paid_amount` < `min_deposit` → Trabajo en estado `on_hold_payment` (No visible en taller)
- Si `paid_amount` >= `min_deposit` → Trabajo en estado `ordered` o `in_process` (Visible en taller)
- Si `balance` = 0 → `payment_status` = 'paid'
- Si `balance` > 0 → `payment_status` = 'partial'

---

## 📅 FASE 4: PRE-VENTA (Presupuestos como Alimentador)

**Decisión Arquitectónica:** Presupuestos son "Carritos Guardados", editables al cargar al POS.

### 4.1 Cambio de Flujo

**Problema Actual:**

- Presupuesto → Trabajo directo (se salta la caja)
- No hay control de pago antes de crear trabajo

**Solución:**

- Presupuesto → Cargar al POS → Editar (opcional) → Pago → Trabajo

### 4.2 Nuevo Endpoint: Cargar Presupuesto al POS

```typescript
// src/app/api/admin/quotes/[id]/load-to-pos/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 1. Obtener presupuesto
  const quote = await getQuote(id);

  // 2. Validar que no esté convertido
  if (quote.status === "converted_to_work") {
    return NextResponse.json(
      { error: "Presupuesto ya convertido a trabajo" },
      { status: 400 },
    );
  }

  // 3. Retornar datos para cargar en POS
  return NextResponse.json({
    quoteId: quote.id,
    customerId: quote.customer_id,
    prescriptionId: quote.prescription_id,
    items: [
      {
        type: "lens_complete",
        frame: {
          product_id: quote.frame_product_id,
          name: quote.frame_name,
          brand: quote.frame_brand,
          model: quote.frame_model,
          color: quote.frame_color,
          price: quote.frame_cost,
        },
        lens: {
          family_id: quote.lens_family_id,
          type: quote.lens_type,
          material: quote.lens_material,
          index: quote.lens_index,
          treatments: quote.lens_treatments,
          price: quote.lens_cost,
        },
        treatments: quote.treatments_cost,
        labor: quote.labor_cost,
        price: quote.total_amount,
      },
    ],
    totals: {
      subtotal: quote.subtotal,
      tax: quote.tax_amount,
      discount: quote.discount_amount,
      total: quote.total_amount,
    },
    notes: quote.customer_notes,
  });
}
```

### 4.3 Cambios en Frontend

**En la página de Presupuestos:**

- Botón "Cargar al POS" en lugar de "Convertir a Trabajo"
- Al hacer clic, redirige a POS con datos precargados

**En el POS:**

- Al recibir `quoteId` en query params, cargar datos del presupuesto
- Volcar items al carrito actual
- **Permitir edición completa:**
  - Cambiar armazón (si ya no hay stock del original)
  - Cambiar cristal (si el cliente quiere mejorar calidad)
  - Actualizar precios
  - Agregar/quitar tratamientos
  - Modificar descuentos

**Flujo de Usuario:**

1. Vendedor busca presupuesto del cliente
2. Click "Cargar al POS"
3. POS se carga con datos del presupuesto
4. Vendedor puede ajustar lo que necesite
5. Cliente paga
6. Se procesa venta (crea Order + Work si aplica)
7. Presupuesto se marca como "converted_to_work" (opcional, o mantener como histórico)

### 4.4 Eliminar Conversión Directa y Creación Manual de Trabajos

**🚫 Regla Crítica: Los Trabajos NO se crean manualmente**

**Eliminar o Modificar:**

- `POST /api/admin/quotes/[id]/convert` - **ELIMINAR** (ya no se convierte directamente)
- Botón "Nuevo Trabajo" en `/admin/work-orders` - **ELIMINAR**

**Nuevo Flujo:**

- Presupuesto nunca crea trabajo directamente
- Siempre debe pasar por POS para asegurar pago
- Los trabajos se crean **SOLO** desde `process-sale` (POS) o `process-warranty` (Garantías)

**Por qué eliminar creación manual:**

1. **Trabajos Fantasma:** Si se permite crear trabajo directo en taller:
   - No tendrá `pos_order_id` (sin vínculo financiero)
   - No descontará stock de `inventory` (inconsistencia)
   - No habrá registro de pago (riesgo de fraude)

2. **Ruptura del Flujo:** El tallerista no debe poder crear trabajos sin pasar por caja

3. **Garantías y Repeticiones:**
   - **DEBEN pasar por POS** (aunque el cobro sea $0)
   - Crear "Venta" tipo **Garantía** con precio $0
   - Esto crea un nuevo trabajo vinculado a una orden ($0)
   - Inventario se descuenta correctamente
   - Finanzas registran pérdida justificada

**Instrucciones de Implementación:**

1. En `/admin/work-orders` - **ELIMINAR botón "Nuevo Trabajo"**
2. La vista de trabajos debe ser **SOLO lectura/gestión de estados**
3. La única forma de insertar en `lab_work_orders` debe ser:
   - `POST /api/admin/pos/process-sale` (venta normal)
   - `POST /api/admin/pos/process-warranty` (garantías - futuro)

---

## 📅 FASE 5: POST-VENTA (Producción & Entrega)

### 5.1 Kanban de Taller

**Filtro de Trabajos con Pago Validado:**

```typescript
// Solo mostrar trabajos con pago validado
const workOrders = await supabase
  .from("lab_work_orders")
  .select(
    `
    *,
    order:orders!lab_work_orders_pos_order_id_fkey(
      id,
      total_amount,
      balance_due:calculate_order_balance(id)
    ),
    payments:order_payments(amount, payment_method, paid_at)
  `,
  )
  .in("status", ["ordered", "in_progress_lab", "mounted", "quality_check"])
  .neq("payment_status", "pending"); // Solo pagados o parciales con mínimo

// Filtrar en frontend:
// - Si payment_status = 'paid' → Mostrar
// - Si payment_status = 'partial' → Verificar que deposit >= min_deposit
// - Si payment_status = 'pending' → NO mostrar
```

**Estados del Kanban:**

- `ordered` - Ordenado (listo para enviar a lab)
- `sent_to_lab` - Enviado a laboratorio
- `in_progress_lab` - En proceso en laboratorio
- `ready_at_lab` - Listo en laboratorio
- `received_from_lab` - Recibido del laboratorio
- `mounted` - Montado
- `quality_check` - Control de calidad
- `ready_for_pickup` - Listo para retiro
- `delivered` - Entregado

### 5.2 Control de Entrega

**Función de Entrega:**

```typescript
// src/app/api/admin/work-orders/[id]/deliver/route.ts

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 1. Obtener trabajo
  const workOrder = await getWorkOrder(id);

  // 2. Obtener orden asociada
  const order = await getOrder(workOrder.pos_order_id);

  // 3. Calcular saldo pendiente
  const balance = await calculateBalance(order.id);

  // 4. Verificar si hay deuda
  if (balance > 0) {
    return NextResponse.json({
      requiresPayment: true,
      balance,
      orderId: order.id,
      message: `El cliente tiene un saldo pendiente de $${balance.toLocaleString()}. Debe pagar antes de entregar.`,
    });
  }

  // 5. Si saldo es $0, permitir marcar como entregado
  await updateWorkOrderStatus(id, "delivered", {
    delivered_at: new Date(),
    delivered_by: user.id,
  });

  return NextResponse.json({
    success: true,
    workOrder: updatedWorkOrder,
  });
}
```

**Flujo en Frontend:**

1. Usuario intenta marcar trabajo como "Entregado"
2. Sistema verifica saldo pendiente
3. Si hay deuda:
   - Mostrar modal: "Cliente tiene saldo pendiente de $X. ¿Desea cobrar ahora?"
   - Botón "Cobrar" → Abre modal de cobro POS
   - Botón "Cancelar" → No permite entregar
4. Si saldo es $0:
   - Marcar como entregado directamente

---

## 📊 Resumen de Implementación

| Fase       | Objetivo        | Cambios Principales                         | Impacto                  | Prioridad  |
| ---------- | --------------- | ------------------------------------------- | ------------------------ | ---------- |
| **Fase 1** | Núcleo de Datos | Separar productos/inventario, Matrices SQL  | Alto - DB Schema         | 🔴 Crítica |
| **Fase 2** | Shadow Billing  | Adapter Pattern, Facturación interna/fiscal | Medio - Backend          | 🟡 Alta    |
| **Fase 3** | Cash-First      | Tabla pagos, Lógica POS, Gatillo trabajos   | Alto - Lógica Negocio    | 🔴 Crítica |
| **Fase 4** | Presupuestos    | Cambiar flujo a POS, Editable               | Medio - Frontend/Backend | 🟡 Alta    |
| **Fase 5** | Post-venta      | Kanban, Control entrega                     | Bajo - UI                | 🟢 Media   |

---

## 🎯 Próximos Pasos

1. **Crear branch:** `refactor/plan-v5-optimus`
2. **Fase 1.1:** Migrar productos/inventario (separación)
3. **Fase 1.2:** Crear tablas y funciones de matrices SQL
4. **Fase 2:** Implementar Adapter Pattern para facturación
5. **Fase 3:** Implementar Cash-First en POS
6. **Fase 4:** Cambiar flujo de presupuestos
7. **Fase 5:** Mejorar Kanban y control de entrega

---

**Última Actualización:** 2026-01-22  
**Estado:** Plan Detallado Completado - Listo para Implementación

---

## 🚫 REGLAS CRÍTICAS DE NEGOCIO

### Regla 1: Trabajos Solo desde POS

- **NO** se pueden crear trabajos manualmente desde el módulo de Taller
- **NO** se pueden convertir presupuestos directamente a trabajos
- Los trabajos se crean **SOLO** desde:
  - `POST /api/admin/pos/process-sale` (venta normal con pago)
  - `POST /api/admin/pos/process-warranty` (garantías con precio $0)

### Regla 2: Garantías Pasan por POS

- Incluso garantías y repeticiones **DEBEN pasar por POS**
- Precio de venta: **$0** (o 100% descuento motivo "Garantía")
- Esto asegura:
  - Descuento correcto de inventario
  - Registro financiero de pérdida justificada
  - Trazabilidad completa del proceso
