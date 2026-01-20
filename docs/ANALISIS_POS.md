# Análisis Completo: Sección de Punto de Venta (POS)

**Fecha de Análisis:** 2025-01-27  
**Versión del Sistema:** 1.0  
**Autor:** Análisis Técnico Completo

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Frontend - Componentes y Páginas](#frontend---componentes-y-páginas)
5. [Sistema de Carrito](#sistema-de-carrito)
6. [Sistema de Órdenes Completas](#sistema-de-órdenes-completas)
7. [APIs y Endpoints](#apis-y-endpoints)
8. [Sistema de Pagos](#sistema-de-pagos)
9. [Integración SII (Chile)](#integración-sii-chile)
10. [Flujos de Datos](#flujos-de-datos)
11. [Validaciones y Seguridad](#validaciones-y-seguridad)
12. [Multi-Tenancy (Sucursales)](#multi-tenancy-sucursales)
13. [Integración con Otras Secciones](#integración-con-otras-secciones)

---

## 🎯 Resumen Ejecutivo

La sección de POS (Point of Sale) es un sistema completo de punto de venta integrado para una óptica. Permite realizar ventas rápidas de productos, crear órdenes completas de lentes (armazón + lente + tratamientos), cargar presupuestos existentes, gestionar múltiples métodos de pago, y generar documentos tributarios (boletas y facturas) según el sistema SII de Chile.

### Características Principales

- ✅ Ventas rápidas de productos
- ✅ Búsqueda inteligente de productos y clientes
- ✅ Carga de presupuestos al carrito
- ✅ Creación de órdenes completas (armazón + lente)
- ✅ Múltiples métodos de pago (efectivo, tarjeta, cuotas)
- ✅ Cálculo automático de impuestos (IVA)
- ✅ Integración SII (boletas y facturas)
- ✅ Gestión de sesiones de caja
- ✅ Actualización automática de inventario
- ✅ Multi-sucursal con RLS
- ✅ Sistema de cuotas para pagos

---

## 🏗️ Arquitectura General

### Estructura de Directorios

```
src/app/admin/pos/
└── page.tsx                    # Página principal de POS (monolítica)

src/app/api/admin/pos/
└── process-sale/
    └── route.ts                # Endpoint de procesamiento de venta
```

### Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Estado:** React useState/useEffect (componente monolítico)
- **UI:** shadcn/ui, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Cálculos:** Funciones utilitarias de tax
- **Validación:** Zod schemas
- **Rate Limiting:** Middleware de rate limiting

---

## 🗄️ Estructura de Base de Datos

### Tabla: `orders`

Tabla principal que almacena todas las órdenes (incluyendo POS).

#### Columnas Específicas de POS

| Columna                           | Tipo          | Nullable | Default   | Descripción                                                                                              |
| --------------------------------- | ------------- | -------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `is_pos_sale`                     | BOOLEAN       | NO       | FALSE     | Si es venta POS                                                                                          |
| `pos_terminal_id`                 | TEXT          | YES      | NULL      | ID del terminal POS                                                                                      |
| `pos_cashier_id`                  | UUID          | YES      | NULL      | FK a auth.users (cajero)                                                                                 |
| `pos_location`                    | TEXT          | YES      | NULL      | Ubicación del POS                                                                                        |
| `payment_method_type`             | TEXT          | YES      | NULL      | Método: 'cash', 'debit_card', 'credit_card', 'installments', 'transfer', 'check', 'mercadopago', 'other' |
| `card_machine_transaction_id`     | TEXT          | YES      | NULL      | ID de transacción de terminal                                                                            |
| `card_machine_authorization_code` | TEXT          | YES      | NULL      | Código de autorización                                                                                   |
| `card_machine_brand`              | TEXT          | YES      | NULL      | Marca de tarjeta (Visa, Mastercard)                                                                      |
| `card_last_four_digits`           | TEXT          | YES      | NULL      | Últimos 4 dígitos de tarjeta                                                                             |
| `installments_count`              | INTEGER       | NO       | 1         | Número de cuotas                                                                                         |
| `installment_amount`              | DECIMAL(12,2) | YES      | NULL      | Monto por cuota                                                                                          |
| `first_installment_due_date`      | TIMESTAMPTZ   | YES      | NULL      | Fecha de primera cuota                                                                                   |
| `sii_invoice_type`                | TEXT          | YES      | NULL      | Tipo: 'boleta', 'factura', 'none'                                                                        |
| `sii_rut`                         | TEXT          | YES      | NULL      | RUT del cliente                                                                                          |
| `sii_business_name`               | TEXT          | YES      | NULL      | Razón social (para facturas)                                                                             |
| `sii_address`                     | TEXT          | YES      | NULL      | Dirección fiscal                                                                                         |
| `sii_commune`                     | TEXT          | YES      | NULL      | Comuna                                                                                                   |
| `sii_city`                        | TEXT          | YES      | NULL      | Ciudad                                                                                                   |
| `sii_invoice_number`              | TEXT          | YES      | NULL      | Folio (único)                                                                                            |
| `sii_dte_number`                  | TEXT          | YES      | NULL      | Número DTE                                                                                               |
| `sii_track_id`                    | TEXT          | YES      | NULL      | Track ID de SII                                                                                          |
| `sii_status`                      | TEXT          | NO       | 'pending' | Estado: 'pending', 'sent', 'accepted', 'rejected', 'cancelled'                                           |
| `sii_sent_at`                     | TIMESTAMPTZ   | YES      | NULL      | Fecha de envío a SII                                                                                     |
| `sii_response`                    | JSONB         | YES      | NULL      | Respuesta de API SII                                                                                     |
| `tax_breakdown`                   | JSONB         | YES      | NULL      | Desglose de impuestos                                                                                    |

### Tabla: `pos_sessions`

Tabla para gestionar sesiones de caja (turnos de cajero).

#### Columnas

| Columna               | Tipo          | Nullable | Default             | Descripción                           |
| --------------------- | ------------- | -------- | ------------------- | ------------------------------------- |
| `id`                  | UUID          | NO       | `gen_random_uuid()` | Identificador único                   |
| `cashier_id`          | UUID          | NO       | -                   | FK a auth.users (cajero)              |
| `branch_id`           | UUID          | YES      | NULL                | FK a branches (multi-sucursal)        |
| `terminal_id`         | TEXT          | YES      | NULL                | ID del terminal                       |
| `location`            | TEXT          | YES      | NULL                | Ubicación                             |
| `opening_cash_amount` | DECIMAL(12,2) | NO       | 0                   | Efectivo inicial                      |
| `closing_cash_amount` | DECIMAL(12,2) | YES      | NULL                | Efectivo final                        |
| `opening_time`        | TIMESTAMPTZ   | NO       | NOW()               | Hora de apertura                      |
| `closing_time`        | TIMESTAMPTZ   | YES      | NULL                | Hora de cierre                        |
| `status`              | TEXT          | NO       | 'open'              | Estado: 'open', 'closed', 'suspended' |
| `notes`               | TEXT          | YES      | NULL                | Notas                                 |
| `created_at`          | TIMESTAMPTZ   | NO       | NOW()               | Fecha de creación                     |
| `updated_at`          | TIMESTAMPTZ   | NO       | NOW()               | Fecha de actualización                |

#### Constraints

- `status` CHECK IN ('open', 'closed', 'suspended')

### Tabla: `pos_transactions`

Tabla para rastrear transacciones POS detalladas.

#### Columnas

| Columna                           | Tipo          | Nullable | Default             | Descripción                              |
| --------------------------------- | ------------- | -------- | ------------------- | ---------------------------------------- |
| `id`                              | UUID          | NO       | `gen_random_uuid()` | Identificador único                      |
| `order_id`                        | UUID          | NO       | -                   | FK a orders                              |
| `pos_session_id`                  | UUID          | YES      | NULL                | FK a pos_sessions                        |
| `transaction_type`                | TEXT          | NO       | -                   | Tipo: 'sale', 'refund', 'void', 'return' |
| `payment_method`                  | TEXT          | NO       | -                   | Método de pago                           |
| `amount`                          | DECIMAL(12,2) | NO       | -                   | Monto de la transacción                  |
| `change_amount`                   | DECIMAL(12,2) | NO       | 0                   | Vuelto (para pagos en efectivo)          |
| `card_machine_transaction_id`     | TEXT          | YES      | NULL                | ID de transacción de terminal            |
| `card_machine_authorization_code` | TEXT          | YES      | NULL                | Código de autorización                   |
| `receipt_printed`                 | BOOLEAN       | NO       | FALSE               | Si se imprimió recibo                    |
| `receipt_number`                  | TEXT          | YES      | NULL                | Número de recibo                         |
| `notes`                           | TEXT          | YES      | NULL                | Notas                                    |
| `created_at`                      | TIMESTAMPTZ   | NO       | NOW()               | Fecha de creación                        |
| `updated_at`                      | TIMESTAMPTZ   | NO       | NOW()               | Fecha de actualización                   |

#### Constraints

- `transaction_type` CHECK IN ('sale', 'refund', 'void', 'return')

### Tabla: `payment_installments`

Tabla para rastrear pagos en cuotas.

#### Columnas

| Columna              | Tipo          | Nullable | Default             | Descripción                                       |
| -------------------- | ------------- | -------- | ------------------- | ------------------------------------------------- |
| `id`                 | UUID          | NO       | `gen_random_uuid()` | Identificador único                               |
| `order_id`           | UUID          | NO       | -                   | FK a orders                                       |
| `installment_number` | INTEGER       | NO       | -                   | Número de cuota (1, 2, 3...)                      |
| `due_date`           | TIMESTAMPTZ   | NO       | -                   | Fecha de vencimiento                              |
| `amount`             | DECIMAL(12,2) | NO       | -                   | Monto de la cuota                                 |
| `paid_amount`        | DECIMAL(12,2) | NO       | 0                   | Monto pagado                                      |
| `payment_status`     | TEXT          | NO       | 'pending'           | Estado: 'pending', 'paid', 'overdue', 'cancelled' |
| `paid_at`            | TIMESTAMPTZ   | YES      | NULL                | Fecha de pago                                     |
| `payment_method`     | TEXT          | YES      | NULL                | Método de pago                                    |
| `notes`              | TEXT          | YES      | NULL                | Notas                                             |
| `created_at`         | TIMESTAMPTZ   | NO       | NOW()               | Fecha de creación                                 |
| `updated_at`         | TIMESTAMPTZ   | NO       | NOW()               | Fecha de actualización                            |

#### Constraints

- `installment_number` CHECK (> 0)
- `amount` CHECK (> 0)
- `payment_status` CHECK IN ('pending', 'paid', 'overdue', 'cancelled')
- UNIQUE(`order_id`, `installment_number`)

#### Índices

```sql
CREATE INDEX idx_payment_installments_order ON public.payment_installments(order_id);
CREATE INDEX idx_payment_installments_due_date ON public.payment_installments(due_date);
CREATE INDEX idx_payment_installments_status ON public.payment_installments(payment_status);
```

### Funciones SQL Personalizadas

#### `generate_sii_invoice_number()`

Genera números de folio para boletas y facturas SII.

```sql
CREATE OR REPLACE FUNCTION generate_sii_invoice_number(invoice_type TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  year_part TEXT;
  sequence_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Set prefix based on invoice type
  IF invoice_type = 'boleta' THEN
    prefix := 'B';
  ELSIF invoice_type = 'factura' THEN
    prefix := 'F';
  ELSE
    prefix := 'N';
  END IF;

  -- Get year (last 2 digits)
  year_part := TO_CHAR(NOW(), 'YY');

  -- Get next sequence number for this year and type
  SELECT COALESCE(MAX(CAST(SUBSTRING(sii_invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_number
  FROM public.orders
  WHERE sii_invoice_type = invoice_type
    AND sii_invoice_number LIKE prefix || year_part || '%';

  -- Format: B240001, F240001, etc.
  invoice_number := prefix || year_part || LPAD(sequence_number::TEXT, 6, '0');

  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;
```

**Formato:** `B240001` (Boleta), `F240001` (Factura)

#### `decrement_inventory()`

Decrementa inventario de productos.

```sql
CREATE OR REPLACE FUNCTION decrement_inventory(product_id UUID, quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  SELECT inventory_quantity INTO current_stock
  FROM public.products
  WHERE id = product_id;

  IF current_stock IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.products
  SET inventory_quantity = GREATEST(0, current_stock - quantity),
      updated_at = NOW()
  WHERE id = product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `update_pos_session_cash()`

Actualiza monto de efectivo en sesión POS.

```sql
CREATE OR REPLACE FUNCTION update_pos_session_cash(session_id UUID, cash_amount DECIMAL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.pos_sessions
  SET closing_cash_amount = COALESCE(closing_cash_amount, opening_cash_amount) + cash_amount,
      updated_at = NOW()
  WHERE id = session_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Relaciones

```
orders
├── pos_cashier_id → auth.users(id)
├── branch_id → branches(id)
└── (relaciones indirectas)
    ├── order_items.order_id → orders(id)
    ├── payment_installments.order_id → orders(id)
    └── pos_transactions.order_id → orders(id)

pos_sessions
├── cashier_id → auth.users(id)
└── branch_id → branches(id)

pos_transactions
├── order_id → orders(id)
└── pos_session_id → pos_sessions(id)

payment_installments
└── order_id → orders(id)
```

### Row Level Security (RLS)

#### Políticas para `pos_sessions`

```sql
-- Admins pueden ver sesiones de sus sucursales
CREATE POLICY "Admins can view pos_sessions in their branches"
ON public.pos_sessions FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.admin_branch_access aba
    WHERE aba.admin_user_id = auth.uid()
    AND (
      aba.branch_id = pos_sessions.branch_id
      OR pos_sessions.branch_id IS NULL
    )
  )
);
```

---

## 🎨 Frontend - Componentes y Páginas

### Página Principal: `page.tsx`

**Ubicación:** `src/app/admin/pos/page.tsx`  
**Líneas:** ~2,283  
**Responsabilidad:** Sistema completo de POS (componente monolítico)

#### Estructura del Componente

El componente está dividido en secciones lógicas:

1. **Header**
   - Título y descripción
   - Selector de sucursal (super admin)
   - Link a caja
   - Total del carrito
   - Botón limpiar

2. **Panel Izquierdo - Búsqueda y Productos**
   - Búsqueda de productos (con sugerencias)
   - Búsqueda de clientes
   - Lista de productos sugeridos
   - Navegación por teclado

3. **Panel Central - Carrito**
   - Lista de items en carrito
   - Cantidades editables
   - Botones de eliminar
   - Totales (subtotal, impuesto, total)
   - Información de cliente seleccionado

4. **Panel Derecho - Checkout**
   - Información de cliente
   - Método de pago
   - Configuración SII (boleta/factura)
   - Formulario de orden completa (opcional)
   - Botón de procesar pago

#### Funcionalidades Principales

1. **Búsqueda de Productos**
   - Búsqueda desde 1 carácter
   - Debounce de 200ms
   - Sugerencias con navegación por teclado
   - Enter para agregar al carrito
   - Flechas arriba/abajo para navegar
   - Escape para cerrar

2. **Búsqueda de Clientes**
   - Búsqueda inteligente (RUT, nombre, email, teléfono)
   - Desde 1 carácter
   - Debounce de 200ms
   - Carga automática de presupuestos del cliente
   - Carga automática de recetas del cliente

3. **Gestión de Carrito**
   - Agregar productos
   - Actualizar cantidades
   - Eliminar items
   - Cálculo automático de totales
   - Consideración de `price_includes_tax`

4. **Carga de Presupuestos**
   - Lista de presupuestos del cliente
   - Carga automática si hay solo uno activo
   - Carga del más reciente si hay múltiples
   - Pre-población del formulario de orden completa

5. **Órdenes Completas**
   - Formulario para crear orden de lentes
   - Selección de receta
   - Selección de armazón (producto o manual)
   - Configuración de lente
   - Cálculo automático de precios
   - Agregar al carrito como item especial

6. **Sistema de Pagos**
   - Efectivo (con cálculo de vuelto)
   - Tarjeta de débito
   - Tarjeta de crédito
   - Cuotas (con generación automática de installments)

7. **Integración SII**
   - Selección de tipo: boleta, factura, ninguno
   - Captura de RUT para facturas
   - Captura de razón social
   - Generación automática de folio

#### Estados del Componente

```typescript
// Productos y búsqueda
const [products, setProducts] = useState<Product[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const [searching, setSearching] = useState(false);
const [selectedProductIndex, setSelectedProductIndex] = useState(-1);

// Clientes
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
const [customerSearchTerm, setCustomerSearchTerm] = useState("");
const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
const [customerQuotes, setCustomerQuotes] = useState<Quote[]>([]);

// Carrito
const [cart, setCart] = useState<CartItem[]>([]);

// Pagos
const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
const [cashReceived, setCashReceived] = useState<number>(0);
const [installmentsCount, setInstallmentsCount] = useState<number>(1);

// SII
const [siiInvoiceType, setSiiInvoiceType] = useState<"boleta" | "factura" | "none">("boleta");
const [customerRUT, setCustomerRUT] = useState<string>("");
const [customerBusinessName, setCustomerBusinessName] = useState<string>("");

// Órdenes completas
const [orderFormData, setOrderFormData] = useState({...});
const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
const [selectedFrame, setSelectedFrame] = useState<any>(null);
```

#### Cálculo de Totales

```typescript
// Considera price_includes_tax para cada item
const itemsForTaxCalculation = cart.map((item) => ({
  price: item.unitPrice * item.quantity,
  includesTax: item.priceIncludesTax,
}));

const subtotal = calculateSubtotal(itemsForTaxCalculation, taxPercentage);
const taxAmount = calculateTotalTax(itemsForTaxCalculation, taxPercentage);
const total = calculateTotal(itemsForTaxCalculation, taxPercentage);
const change = cashReceived - total;
```

---

## 🛒 Sistema de Carrito

### Estructura de CartItem

```typescript
interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  priceIncludesTax: boolean;
}
```

### Operaciones del Carrito

1. **Agregar Producto**
   - Si existe en carrito, incrementa cantidad
   - Si no existe, agrega nuevo item
   - Resetea búsqueda y enfoca input

2. **Actualizar Cantidad**
   - Permite editar cantidad directamente
   - Si cantidad <= 0, elimina del carrito
   - Recalcula subtotal del item

3. **Eliminar Item**
   - Remueve item del carrito
   - Recalcula totales

4. **Limpiar Carrito**
   - Vacía carrito
   - Resetea cliente
   - Resetea formularios
   - Resetea búsquedas

---

## 📋 Sistema de Órdenes Completas

### Concepto

Permite crear órdenes completas de lentes (armazón + lente + tratamientos + mano de obra) directamente desde POS, similar a un presupuesto pero con venta inmediata.

### Formulario de Orden Completa

1. **Receta**
   - Selección de receta del cliente
   - Visualización de datos de receta

2. **Armazón**
   - Búsqueda de productos (frames)
   - Carga automática de datos
   - Campos manuales si no hay producto

3. **Lente**
   - Tipo, material, índice
   - Tratamientos (múltiples)
   - Tinte (color y porcentaje)

4. **Precios**
   - Costos (auto-calculados desde quote_settings)
   - Descuentos
   - Impuestos
   - Total

5. **Agregar al Carrito**
   - Crea item especial en carrito
   - Puede combinarse con otros productos
   - Al procesar, crea orden y trabajo

### Integración con Trabajos

Cuando se procesa una orden completa:

1. Se crea la orden (order)
2. Se crea el trabajo de laboratorio (lab_work_order)
3. Se vincula trabajo con orden (`pos_order_id`)

---

## 🌐 APIs y Endpoints

### `POST /api/admin/pos/process-sale`

**Responsabilidad:** Procesar venta POS completa

#### Request Body (Zod Schema)

```typescript
{
  email: string;
  payment_method_type: "cash" | "debit_card" | "credit_card" | "installments";
  payment_status: "paid" | "pending" | "partial";
  status: "delivered" | "pending" | "processing";
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  installments_count?: number;
  sii_invoice_type?: "boleta" | "factura" | "none";
  sii_rut?: string;
  sii_business_name?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  cash_received?: number;
  change_amount?: number;
}
```

#### Lógica de Procesamiento

1. **Validación**
   - Autenticación y autorización
   - Validación de sucursal
   - Validación de body con Zod

2. **Generación de Números**
   - Número de orden: `POS-${Date.now()}`
   - Número SII (si aplica): `generate_sii_invoice_number()`

3. **Gestión de Sesión POS**
   - Busca sesión activa del cajero
   - Si no existe, crea nueva sesión
   - Asocia orden con sesión

4. **Creación de Orden**
   - Inserta en tabla `orders`
   - Marca como `is_pos_sale = true`
   - Asocia con cajero y sucursal

5. **Creación de Items**
   - Inserta en `order_items`
   - Snapshot de nombre de producto

6. **Actualización de Inventario**
   - Para cada item, llama `decrement_inventory()`
   - Reduce stock automáticamente

7. **Creación de Transacción POS**
   - Inserta en `pos_transactions`
   - Registra método de pago
   - Calcula vuelto si es efectivo

8. **Creación de Cuotas** (si aplica)
   - Si `payment_method_type === "installments"`
   - Crea registros en `payment_installments`
   - Primera cuota marcada como pagada
   - Resto como pendientes

9. **Actualización de Sesión**
   - Si es efectivo, actualiza `closing_cash_amount`
   - Llama `update_pos_session_cash()`

10. **Retorno**
    - Retorna orden creada
    - Incluye número de folio SII

#### Rate Limiting

- Endpoint protegido con rate limiting
- Configuración específica para POS
- Prevención de abuso

---

## 💳 Sistema de Pagos

### Métodos de Pago Disponibles

1. **Efectivo (cash)**
   - Captura de monto recibido
   - Cálculo automático de vuelto
   - Actualización de sesión de caja

2. **Tarjeta de Débito (debit_card)**
   - Captura de datos de transacción (opcional)
   - ID de transacción de terminal
   - Código de autorización

3. **Tarjeta de Crédito (credit_card)**
   - Similar a débito
   - Soporte para cuotas

4. **Cuotas (installments)**
   - Selección de número de cuotas
   - Generación automática de `payment_installments`
   - Primera cuota pagada, resto pendiente
   - Fechas de vencimiento mensuales

### Cálculo de Vuelto

```typescript
const change = cashReceived - total;
```

- Si `change < 0`: Error, monto insuficiente
- Si `change >= 0`: Muestra vuelto

---

## 🧾 Integración SII (Chile)

### Tipos de Documento

1. **Boleta**
   - Para consumidores finales
   - No requiere RUT
   - Formato: `B240001`

2. **Factura**
   - Para empresas
   - Requiere RUT y razón social
   - Formato: `F240001`

3. **Ninguno**
   - Sin documento tributario
   - Para ventas informales

### Campos SII

- `sii_invoice_type`: Tipo de documento
- `sii_rut`: RUT del cliente (formateado)
- `sii_business_name`: Razón social
- `sii_address`: Dirección fiscal
- `sii_commune`: Comuna
- `sii_city`: Ciudad
- `sii_invoice_number`: Folio generado
- `sii_status`: Estado de envío a SII
- `sii_response`: Respuesta de API SII (JSONB)

### Flujo de Generación

```
1. Usuario selecciona tipo de documento
   ↓
2. Si es factura, captura RUT y razón social
   ↓
3. Al procesar venta:
   - Genera número de folio (generate_sii_invoice_number)
   - Asigna a orden
   - Estado inicial: 'pending'
   ↓
4. (Futuro) Envío automático a SII
   ↓
5. Actualización de estado según respuesta
```

---

## 🔄 Flujos de Datos

### Flujo: Venta Rápida de Productos

```
1. Usuario busca producto (1+ caracteres)
   ↓
2. Sistema muestra sugerencias
   ↓
3. Usuario selecciona producto (Enter o click)
   ↓
4. Producto se agrega al carrito
   ↓
5. Usuario puede agregar más productos
   ↓
6. Usuario selecciona método de pago
   ↓
7. Si es efectivo, ingresa monto recibido
   ↓
8. Click "Procesar Pago"
   ↓
9. POST /api/admin/pos/process-sale
   ↓
10. Servidor:
    - Crea orden
    - Crea items
    - Actualiza inventario
    - Crea transacción POS
    - Genera folio SII (si aplica)
    - Actualiza sesión de caja
   ↓
11. Carrito se limpia
   ↓
12. Toast de éxito
```

### Flujo: Venta con Presupuesto

```
1. Usuario busca/selecciona cliente
   ↓
2. Sistema carga presupuestos del cliente
   ↓
3. Si hay 1 presupuesto activo, se carga automáticamente
   ↓
4. Si hay múltiples, se carga el más reciente
   ↓
5. Datos del presupuesto se cargan al formulario de orden completa
   ↓
6. Usuario puede ajustar antes de agregar al carrito
   ↓
7. Al agregar, se crea item especial en carrito
   ↓
8. Proceso de pago normal
   ↓
9. Al procesar, se crea orden Y trabajo de laboratorio
```

### Flujo: Orden Completa Manual

```
1. Usuario selecciona cliente
   ↓
2. Click en "Orden Completa"
   ↓
3. Formulario se expande
   ↓
4. Usuario selecciona receta
   ↓
5. Usuario busca/selecciona armazón
   ↓
6. Usuario configura lente:
   - Tipo, material, tratamientos
   ↓
7. Sistema calcula precios automáticamente
   ↓
8. Usuario ajusta si necesario
   ↓
9. Click "Agregar al Carrito"
   ↓
10. Item especial se agrega al carrito
   ↓
11. Proceso de pago normal
   ↓
12. Al procesar, se crea orden Y trabajo
```

### Flujo: Pago en Cuotas

```
1. Usuario selecciona "Cuotas" como método
   ↓
2. Selecciona número de cuotas (1-12)
   ↓
3. Sistema calcula monto por cuota
   ↓
4. Al procesar venta:
   - Crea orden con installments_count
   - Crea registros en payment_installments
   - Primera cuota: status = 'paid'
   - Resto: status = 'pending'
   - Fechas de vencimiento: mensuales
   ↓
5. Orden se marca como 'partial' payment_status
```

---

## 🔒 Validaciones y Seguridad

### Validaciones en Cliente

1. **Carrito**
   - No puede estar vacío
   - Cantidades > 0

2. **Pagos**
   - Efectivo: monto recibido >= total
   - Cuotas: número válido (1-12)

3. **SII**
   - Factura requiere RUT y razón social
   - RUT debe tener formato válido

### Validaciones en Servidor

1. **Autenticación y Autorización**
   - Usuario autenticado
   - Rol admin verificado
   - Sucursal válida (no super admin sin sucursal)

2. **Validación de Datos (Zod)**
   - Schema `processSaleSchema`
   - Campos requeridos
   - Tipos de datos correctos
   - Rangos válidos

3. **Validación de Negocio**
   - Productos deben existir
   - Stock suficiente (si se valida)
   - Cliente debe existir (si se proporciona)

4. **Rate Limiting**
   - Protección contra abuso
   - Límite de requests por minuto

### Seguridad

1. **Row Level Security (RLS)**
   - Solo admins pueden crear órdenes POS
   - Filtrado por sucursal

2. **Validación de Inventario**
   - Decremento automático
   - Prevención de stock negativo

3. **Transacciones**
   - Operaciones atómicas cuando es posible
   - Rollback en caso de error

---

## 🏢 Multi-Tenancy (Sucursales)

### Implementación

- **Campo `branch_id`**: Cada orden POS pertenece a una sucursal
- **Sesiones de Caja**: Cada sesión pertenece a una sucursal
- **RLS Policies**: Filtran por sucursal automáticamente
- **Super Admin**: Puede ver todas las sucursales pero debe seleccionar una para vender

### Flujo

```
1. Admin selecciona sucursal
   ↓
2. Header x-branch-id se envía en requests
   ↓
3. Servidor valida acceso a sucursal
   ↓
4. Sesión POS se crea/usa para esa sucursal
   ↓
5. Orden se asocia con sucursal
   ↓
6. Inventario se actualiza por sucursal
```

---

## 🔗 Integración con Otras Secciones

### Integración con Productos

- **Búsqueda**: POS busca productos activos
- **Inventario**: Al vender, se decrementa inventario
- **Stock**: Muestra cantidad disponible
- **Precios**: Respeta `price_includes_tax`

### Integración con Clientes

- **Búsqueda Inteligente**: Por RUT, nombre, email, teléfono
- **Creación Rápida**: Posibilidad de crear cliente desde POS
- **Historial**: Acceso a presupuestos y recetas del cliente

### Integración con Presupuestos

- **Carga Automática**: Presupuestos activos se cargan automáticamente
- **Pre-población**: Datos del presupuesto se cargan al formulario
- **Vinculación**: Órdenes pueden referenciar presupuestos

### Integración con Trabajos

- **Creación Automática**: Órdenes completas crean trabajos automáticamente
- **Vínculo**: `lab_work_orders.pos_order_id` vincula trabajo con orden
- **Estado de Pago**: Trabajos heredan estado de pago de la orden

### Integración con Recetas

- **Selección**: Cliente puede tener múltiples recetas
- **Uso en Órdenes**: Receta se asocia con orden completa
- **Snapshot**: Se guarda snapshot en trabajo

---

## 📝 Notas Finales

### Dependencias Clave

- `@/lib/utils/tax`: Funciones de cálculo de impuestos
- `@/lib/utils/tax-config`: Configuración de impuestos
- `@/lib/utils/rut`: Formateo de RUT chileno
- `@/hooks/useBranch`: Contexto de sucursal
- `@/lib/api/validation/zod-schemas`: Validación con Zod

### Extensiones Futuras Posibles

1. **Impresión de Recibos**: Integración con impresoras térmicas
2. **Integración con Terminales**: Comunicación con terminales de tarjeta
3. **Envío Automático a SII**: API para envío de documentos
4. **Dashboard de Ventas**: Estadísticas de ventas POS
5. **Reportes de Caja**: Cierres de caja detallados
6. **Múltiples Cajeros**: Soporte para múltiples cajeros simultáneos
7. **Descuentos Automáticos**: Sistema de descuentos por cliente/producto
8. **Promociones**: Aplicación automática de promociones

---

**Fin del Documento**
