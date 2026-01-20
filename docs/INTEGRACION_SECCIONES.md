# Integración entre Secciones: Productos, Presupuestos, Trabajos y POS

**Fecha de Análisis:** 2025-01-27  
**Versión del Sistema:** 1.0  
**Autor:** Análisis Técnico Completo

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Integración](#arquitectura-de-integración)
3. [Flujos de Integración Principales](#flujos-de-integración-principales)
4. [Integración Productos ↔ Presupuestos](#integración-productos--presupuestos)
5. [Integración Presupuestos ↔ Trabajos](#integración-presupuestos--trabajos)
6. [Integración POS ↔ Todas las Secciones](#integración-pos--todas-las-secciones)
7. [Integración con Recetas](#integración-con-recetas)
8. [Integración con Clientes](#integración-con-clientes)
9. [Sincronización de Datos](#sincronización-de-datos)
10. [Casos de Uso Complejos](#casos-de-uso-complejos)
11. [Consideraciones Técnicas](#consideraciones-técnicas)

---

## 🎯 Resumen Ejecutivo

El sistema de gestión óptica está compuesto por cuatro secciones principales que trabajan de forma integrada para cubrir todo el ciclo de vida de una venta: desde la creación de presupuestos hasta la entrega final al cliente. Esta integración permite un flujo de trabajo continuo y sin fricciones, donde cada sección se alimenta de las otras y comparte datos de manera coherente.

### Secciones Integradas

1. **Productos** - Catálogo de productos (armazones, lentes, accesorios)
2. **Presupuestos** - Cotizaciones de trabajos de lentes
3. **Trabajos** - Órdenes de trabajo de laboratorio
4. **POS** - Punto de venta para ventas rápidas

### Conceptos Clave de Integración

- **Vínculos Bidireccionales**: Las secciones se referencian entre sí mediante foreign keys
- **Copia de Datos**: Al convertir entre secciones, se copian datos relevantes
- **Estado Sincronizado**: Los estados se actualizan en cascada
- **Multi-Sucursal**: Todas las secciones respetan el contexto de sucursal
- **Audit Trail**: Se mantiene historial de conversiones y cambios

---

## 🏗️ Arquitectura de Integración

### Diagrama de Relaciones

```
┌─────────────┐
│  Productos  │
│  (Frames)   │
└──────┬──────┘
       │
       │ frame_product_id
       │
       ▼
┌─────────────┐      ┌──────────────┐
│ Presupuestos│─────▶│   Trabajos   │
│  (Quotes)   │      │ (Work Orders) │
└──────┬──────┘      └──────┬───────┘
       │                    │
       │ quote_id           │ pos_order_id
       │                    │
       ▼                    ▼
┌─────────────┐      ┌──────────────┐
│     POS     │─────▶│   Órdenes    │
│             │      │   (Orders)   │
└─────────────┘      └──────────────┘
       │
       │ customer_id
       │
       ▼
┌─────────────┐
│  Clientes   │
│ (Customers) │
└──────┬──────┘
       │
       │ customer_id
       │
       ▼
┌─────────────┐
│  Recetas    │
│(Prescriptions)│
└─────────────┘
```

### Tablas de Integración

#### Tabla Central: `orders`

La tabla `orders` actúa como punto de integración entre POS y otras secciones:

- **POS → Orders**: Cada venta POS crea una orden
- **Orders → Work Orders**: Órdenes completas crean trabajos (`pos_order_id`)
- **Orders → Products**: Items de orden referencian productos

#### Vínculos Bidireccionales

1. **Presupuestos ↔ Trabajos**
   - `quotes.converted_to_work_order_id` → `lab_work_orders.id`
   - `lab_work_orders.quote_id` → `quotes.id`

2. **POS ↔ Trabajos**
   - `lab_work_orders.pos_order_id` → `orders.id`
   - `orders.id` → (indirecto) `lab_work_orders`

3. **Productos ↔ Todas**
   - `quotes.frame_product_id` → `products.id`
   - `lab_work_orders.frame_product_id` → `products.id`
   - `order_items.product_id` → `products.id`

---

## 🔄 Flujos de Integración Principales

### Flujo 1: Presupuesto → Trabajo → Entrega

**Escenario:** Cliente acepta presupuesto, se crea trabajo, se procesa y entrega.

```
1. Vendedor crea Presupuesto
   ├── Selecciona cliente
   ├── Selecciona receta
   ├── Selecciona armazón (producto)
   ├── Configura lente
   └── Calcula precios
   ↓
2. Presupuesto se envía al cliente
   ├── status = 'sent'
   └── expiration_date = +30 días
   ↓
3. Cliente acepta presupuesto
   ├── status = 'accepted'
   └── Click "Convertir a Trabajo"
   ↓
4. Sistema crea Trabajo
   ├── Copia datos del presupuesto:
   │   ├── Cliente, receta, armazón
   │   ├── Especificaciones de lente
   │   ├── Precios y costos
   │   └── Notas
   ├── Genera número de trabajo (TRB-YYYY-XXXX)
   ├── Estado inicial: 'quote' o 'ordered'
   └── Vincula con presupuesto (quote_id)
   ↓
5. Actualiza Presupuesto
   ├── status = 'converted_to_work'
   └── converted_to_work_order_id = nuevo trabajo
   ↓
6. Trabajo pasa por workflow:
   ├── 'ordered' → 'sent_to_lab' → 'in_progress_lab'
   ├── 'ready_at_lab' → 'received_from_lab' → 'mounted'
   ├── 'quality_check' → 'ready_for_pickup' → 'delivered'
   └── Cada cambio actualiza fecha correspondiente
   ↓
7. Al entregar:
   ├── status = 'delivered'
   ├── delivered_at = NOW()
   └── (Opcional) Se crea orden de venta si no existe
```

### Flujo 2: POS → Orden Completa → Trabajo

**Escenario:** Cliente compra directamente en POS, creando orden y trabajo simultáneamente.

```
1. Cliente llega a tienda
   ↓
2. Vendedor en POS:
   ├── Busca/selecciona cliente
   ├── Click "Orden Completa"
   ├── Selecciona receta
   ├── Busca/selecciona armazón
   ├── Configura lente
   └── Agrega al carrito
   ↓
3. Cliente paga
   ├── Selecciona método de pago
   ├── Procesa pago
   └── POST /api/admin/pos/process-sale
   ↓
4. Sistema crea Orden
   ├── Inserta en orders
   ├── is_pos_sale = true
   ├── Crea order_items
   └── Actualiza inventario
   ↓
5. Sistema crea Trabajo (automáticamente)
   ├── Copia datos de la orden completa
   ├── Genera número de trabajo
   ├── Estado inicial: 'ordered'
   ├── Vincula con orden (pos_order_id)
   └── Crea snapshot de receta
   ↓
6. Trabajo sigue workflow normal
   └── Hasta entrega
```

### Flujo 3: Presupuesto → POS → Trabajo

**Escenario:** Cliente tiene presupuesto, viene a pagar en POS, se carga presupuesto y se crea trabajo.

```
1. Cliente tiene presupuesto activo
   ↓
2. Vendedor en POS:
   ├── Busca/selecciona cliente
   ├── Sistema carga presupuestos del cliente
   ├── Si hay 1 activo, se carga automáticamente
   └── Si hay múltiples, se carga el más reciente
   ↓
3. Datos del presupuesto se cargan al formulario
   ├── Armazón, lente, tratamientos
   ├── Precios y costos
   └── Usuario puede ajustar
   ↓
4. Cliente paga
   ├── Procesa pago
   └── POST /api/admin/pos/process-sale
   ↓
5. Sistema crea Orden
   ├── Inserta en orders
   ├── Vincula con presupuesto (opcional)
   └── Actualiza inventario
   ↓
6. Sistema crea Trabajo
   ├── Copia datos del presupuesto
   ├── Vincula con presupuesto (quote_id)
   ├── Vincula con orden (pos_order_id)
   └── Estado inicial: 'ordered'
   ↓
7. Actualiza Presupuesto
   ├── status = 'converted_to_work'
   └── converted_to_work_order_id = nuevo trabajo
```

### Flujo 4: Venta Rápida POS (Solo Productos)

**Escenario:** Cliente compra solo productos (no lentes), sin crear trabajo.

```
1. Vendedor en POS:
   ├── Busca productos
   ├── Agrega al carrito
   └── Cliente paga
   ↓
2. Sistema crea Orden
   ├── Inserta en orders
   ├── Crea order_items
   └── Actualiza inventario
   ↓
3. NO se crea trabajo
   └── Solo orden de venta
```

---

## 🔗 Integración Productos ↔ Presupuestos

### Uso de Productos en Presupuestos

#### Selección de Armazón

```typescript
// En CreateQuoteForm
1. Usuario busca productos (frames)
2. Selecciona producto
3. Sistema carga datos automáticamente:
   - frame_name, frame_brand, frame_model
   - frame_color, frame_size, frame_sku
   - frame_price
4. Se guarda frame_product_id en presupuesto
```

#### Datos Copiados

Cuando se selecciona un producto en un presupuesto:

- **Si producto existe**: Se copian todos los datos del producto
- **Si producto no existe**: Se permiten campos manuales
- **Vínculo**: `quotes.frame_product_id` → `products.id`

#### Actualización de Precios

- Si el precio del producto cambia, los presupuestos existentes mantienen su precio original
- Los nuevos presupuestos usan el precio actualizado

### Impacto en Productos

- **Inventario**: Los presupuestos NO afectan inventario (solo cuando se convierte a trabajo/venta)
- **Estadísticas**: Los productos pueden tener contadores de uso en presupuestos

---

## 🔗 Integración Presupuestos ↔ Trabajos

### Conversión de Presupuesto a Trabajo

#### Proceso de Conversión

```typescript
// POST /api/admin/quotes/[id]/convert
1. Valida presupuesto:
   - Debe estar en estado válido ('accepted', 'sent')
   - No debe estar ya convertido

2. Crea trabajo:
   - Copia customer_id
   - Copia prescription_id
   - Copia frame_product_id y datos de armazón
   - Copia especificaciones de lente
   - Copia precios y costos
   - Copia notas
   - Genera número de trabajo
   - Estado inicial: 'quote' o 'ordered'

3. Crea snapshot de receta:
   - Si existe prescription_id, guarda snapshot JSONB
   - Permite ver receta original aunque se actualice

4. Vincula trabajo con presupuesto:
   - lab_work_orders.quote_id = presupuesto.id

5. Actualiza presupuesto:
   - status = 'converted_to_work'
   - converted_to_work_order_id = trabajo.id
```

#### Datos Copiados

| Campo Presupuesto      | Campo Trabajo          | Notas      |
| ---------------------- | ---------------------- | ---------- |
| `customer_id`          | `customer_id`          | Directo    |
| `prescription_id`      | `prescription_id`      | Directo    |
| `frame_product_id`     | `frame_product_id`     | Directo    |
| `frame_name`           | `frame_name`           | Directo    |
| `frame_brand`          | `frame_brand`          | Directo    |
| `frame_model`          | `frame_model`          | Directo    |
| `frame_color`          | `frame_color`          | Directo    |
| `frame_size`           | `frame_size`           | Directo    |
| `frame_sku`            | `frame_sku`            | Directo    |
| `frame_price`          | `frame_cost`           | Renombrado |
| `lens_type`            | `lens_type`            | Directo    |
| `lens_material`        | `lens_material`        | Directo    |
| `lens_index`           | `lens_index`           | Directo    |
| `lens_treatments`      | `lens_treatments`      | Directo    |
| `lens_tint_color`      | `lens_tint_color`      | Directo    |
| `lens_tint_percentage` | `lens_tint_percentage` | Directo    |
| `frame_cost`           | `frame_cost`           | Directo    |
| `lens_cost`            | `lens_cost`            | Directo    |
| `treatments_cost`      | `treatments_cost`      | Directo    |
| `labor_cost`           | `labor_cost`           | Directo    |
| `subtotal`             | `subtotal`             | Directo    |
| `tax_amount`           | `tax_amount`           | Directo    |
| `discount_amount`      | `discount_amount`      | Directo    |
| `total_amount`         | `total_amount`         | Directo    |
| `notes`                | `internal_notes`       | Renombrado |
| `customer_notes`       | `customer_notes`       | Directo    |

#### Vínculo Bidireccional

- **Desde Presupuesto**: Se puede ver el trabajo convertido
- **Desde Trabajo**: Se puede ver el presupuesto original
- **Navegación**: Links bidireccionales en las interfaces

---

## 🔗 Integración POS ↔ Todas las Secciones

### POS → Productos

#### Búsqueda y Selección

```typescript
// En POS page.tsx
1. Usuario busca productos (desde 1 carácter)
2. Sistema busca en products (filtrado por sucursal)
3. Muestra sugerencias con:
   - Nombre, precio, stock
   - Imagen (si existe)
4. Usuario selecciona → Agrega al carrito
```

#### Actualización de Inventario

```typescript
// Al procesar venta
1. Para cada item en carrito:
   - Llama decrement_inventory(product_id, quantity)
   - Reduce inventory_quantity
   - Actualiza updated_at
2. Si stock < 0, se permite (depende de inventory_policy)
```

### POS → Presupuestos

#### Carga de Presupuestos

```typescript
// Al seleccionar cliente
1. Sistema busca presupuestos del cliente:
   - GET /api/admin/quotes?customer_id=XXX&status=all
2. Filtra presupuestos activos:
   - status !== 'expired'
   - status !== 'converted_to_work'
   - status !== 'accepted'
3. Si hay 1 activo:
   - Carga automáticamente al formulario
4. Si hay múltiples:
   - Carga el más reciente
   - Muestra lista para selección manual
```

#### Uso de Datos de Presupuesto

```typescript
// handleLoadQuoteToForm()
1. Carga datos completos del presupuesto
2. Pre-pobla formulario de orden completa:
   - Armazón (producto o manual)
   - Especificaciones de lente
   - Precios y costos
3. Carga receta asociada
4. Usuario puede ajustar antes de agregar al carrito
```

### POS → Trabajos

#### Creación Automática de Trabajos

```typescript
// Al procesar orden completa
1. Si la orden contiene items de "orden completa":
   - Crea trabajo de laboratorio
   - Copia datos del formulario
   - Genera número de trabajo
   - Estado inicial: 'ordered'
   - Vincula con orden (pos_order_id)
2. Si viene de presupuesto:
   - También vincula con presupuesto (quote_id)
```

#### Vínculo con Órdenes

- `lab_work_orders.pos_order_id` → `orders.id`
- Permite rastrear qué orden generó el trabajo
- Permite ver estado de pago desde el trabajo

### POS → Clientes

#### Búsqueda Inteligente

```typescript
// Búsqueda de clientes
1. Busca por múltiples criterios:
   - RUT (formateado o sin formatear)
   - Nombre (first_name + last_name)
   - Email
   - Teléfono
2. Desde 1 carácter
3. Debounce de 200ms
4. Muestra resultados en tiempo real
```

#### Carga de Datos del Cliente

```typescript
// Al seleccionar cliente
1. Carga presupuestos del cliente
2. Carga recetas del cliente
3. Pre-pobla RUT y razón social (para SII)
4. Muestra historial de compras
```

---

## 🔗 Integración con Recetas

### Uso en Presupuestos

```typescript
// CreateQuoteForm
1. Al seleccionar cliente, carga recetas
2. Usuario selecciona receta
3. Se muestra información de receta:
   - Esfera, cilindro, eje (OD y OI)
   - Adición, distancia pupilar
4. Se guarda prescription_id en presupuesto
```

### Uso en Trabajos

```typescript
// CreateWorkOrderForm
1. Al seleccionar cliente, carga recetas
2. Usuario selecciona receta
3. Al crear trabajo:
   - Se guarda prescription_id
   - Se crea snapshot JSONB de la receta
   - Permite ver receta original aunque se actualice después
```

### Uso en POS

```typescript
// Orden completa
1. Al seleccionar cliente, carga recetas
2. Usuario selecciona receta para orden completa
3. Se muestra información de receta
4. Se usa para crear trabajo
```

### Snapshot de Receta

**Propósito**: Preservar la receta tal como estaba al momento de crear el trabajo/presupuesto.

```typescript
// Estructura del snapshot
{
  "id": "uuid",
  "customer_id": "uuid",
  "od_sphere": -2.5,
  "od_cylinder": -0.5,
  "od_axis": 180,
  "od_add": 2.0,
  "os_sphere": -2.5,
  "os_cylinder": -0.5,
  "os_axis": 180,
  "os_add": 2.0,
  "pupil_distance": 64,
  "created_at": "2025-01-27T10:00:00Z",
  "snapshot_date": "2025-01-27T10:00:00Z"
}
```

---

## 🔗 Integración con Clientes

### Cliente como Entidad Central

El cliente (`customers` / `profiles`) es el punto de unificación:

- **Presupuestos**: `quotes.customer_id`
- **Trabajos**: `lab_work_orders.customer_id`
- **Órdenes**: `orders.email` (puede ser customer_id indirecto)
- **Recetas**: `prescriptions.customer_id`

### Historial del Cliente

Desde la vista de cliente se puede ver:

1. **Presupuestos**
   - Lista de todos los presupuestos
   - Estados y fechas
   - Montos

2. **Trabajos**
   - Lista de todos los trabajos
   - Estados y fechas
   - Progreso

3. **Órdenes**
   - Historial de compras
   - Productos comprados
   - Montos

4. **Recetas**
   - Historial de recetas
   - Fechas de creación
   - Última receta activa

---

## 🔄 Sincronización de Datos

### Reglas de Sincronización

1. **Precios**
   - Presupuestos y trabajos mantienen precios al momento de creación
   - No se actualizan automáticamente si cambia precio del producto

2. **Inventario**
   - Solo se actualiza al procesar venta POS
   - Presupuestos NO afectan inventario
   - Trabajos NO afectan inventario directamente

3. **Estados**
   - Estados se actualizan en cascada:
     - Presupuesto → 'converted_to_work' cuando se convierte
     - Trabajo → estados según workflow
     - Orden → estados según procesamiento

4. **Datos de Productos**
   - Si se selecciona producto, se copian datos
   - Si producto se elimina, datos se mantienen (soft delete)
   - Si producto se actualiza, datos existentes no cambian

### Consistencia de Datos

1. **Foreign Keys**
   - Todas las relaciones tienen foreign keys
   - ON DELETE CASCADE para customer_id
   - ON DELETE SET NULL para productos (preserva datos)

2. **Validaciones**
   - Validación de existencia antes de crear vínculos
   - Validación de estado antes de transiciones
   - Validación de permisos antes de operaciones

3. **Transacciones**
   - Operaciones críticas en transacciones
   - Rollback en caso de error
   - Atomicidad garantizada

---

## 📊 Casos de Uso Complejos

### Caso 1: Cliente con Múltiples Presupuestos

**Escenario**: Cliente tiene 3 presupuestos activos, viene a pagar uno.

```
1. Vendedor busca cliente en POS
2. Sistema carga 3 presupuestos
3. Sistema muestra lista para selección
4. Vendedor selecciona presupuesto específico
5. Se carga al formulario
6. Cliente paga
7. Se crea orden y trabajo
8. Presupuesto seleccionado se marca como convertido
9. Otros 2 presupuestos permanecen activos
```

### Caso 2: Cambio de Armazón en Trabajo

**Escenario**: Cliente cambia de opinión sobre el armazón después de crear trabajo.

```
1. Trabajo ya creado con armazón A
2. Cliente quiere cambiar a armazón B
3. Vendedor edita trabajo:
   - Actualiza frame_product_id
   - Actualiza frame_name, frame_brand, etc.
   - Recalcula precios si necesario
4. Sistema mantiene historial de cambios
5. Trabajo continúa con nuevo armazón
```

### Caso 3: Venta Parcial en Cuotas

**Escenario**: Cliente paga trabajo en cuotas, trabajo se entrega antes de pagar completo.

```
1. Cliente compra orden completa en POS
2. Selecciona pago en cuotas (6 cuotas)
3. Sistema crea:
   - Orden con payment_status = 'partial'
   - 6 registros en payment_installments
   - Trabajo vinculado
4. Cliente paga primera cuota
5. Trabajo se procesa y entrega
6. Cliente continúa pagando cuotas restantes
7. Sistema rastrea pagos pendientes
```

### Caso 4: Presupuesto Expirado que se Reactiva

**Escenario**: Presupuesto expiró, cliente quiere reactivarlo.

```
1. Presupuesto tiene status = 'expired'
2. Cliente quiere usarlo
3. Opciones:
   a) Crear nuevo presupuesto copiando datos
   b) Actualizar fecha de expiración y cambiar status
   c) Convertir directamente a trabajo
4. Sistema permite cualquiera de las opciones
```

---

## ⚙️ Consideraciones Técnicas

### Performance

1. **Carga de Datos Relacionados**
   - Se cargan relaciones de forma lazy
   - Se usan índices en foreign keys
   - Se evitan N+1 queries

2. **Búsquedas**
   - Debounce en búsquedas de productos/clientes
   - Límites en resultados (20-50 items)
   - Índices en campos de búsqueda

3. **Cálculos**
   - Cálculos de precios en cliente cuando es posible
   - Cálculos complejos en servidor
   - Cache de configuraciones (quote_settings)

### Seguridad

1. **Validación de Acceso**
   - RLS en todas las tablas
   - Validación de sucursal en cada operación
   - Validación de permisos antes de conversiones

2. **Integridad de Datos**
   - Foreign keys con constraints
   - Validación de estados antes de transiciones
   - Validación de negocio (stock, precios, etc.)

3. **Audit Trail**
   - Historial de cambios de estado
   - Registro de usuario que hizo cambios
   - Timestamps en todas las operaciones

### Escalabilidad

1. **Multi-Sucursal**
   - Todas las secciones soportan multi-sucursal
   - Filtrado automático por RLS
   - Super admin puede ver todas las sucursales

2. **Extensibilidad**
   - Estructura modular permite agregar nuevas secciones
   - Hooks personalizados facilitan reutilización
   - APIs RESTful permiten integraciones externas

---

## 📝 Resumen de Vínculos

### Tabla de Vínculos Principales

| Desde             | Hacia             | Campo                        | Tipo      | Descripción                  |
| ----------------- | ----------------- | ---------------------------- | --------- | ---------------------------- |
| `quotes`          | `products`        | `frame_product_id`           | FK        | Armazón del presupuesto      |
| `quotes`          | `lab_work_orders` | `converted_to_work_order_id` | FK        | Trabajo convertido           |
| `lab_work_orders` | `quotes`          | `quote_id`                   | FK        | Presupuesto original         |
| `lab_work_orders` | `products`        | `frame_product_id`           | FK        | Armazón del trabajo          |
| `lab_work_orders` | `orders`          | `pos_order_id`               | FK        | Orden POS que generó trabajo |
| `orders`          | `products`        | (vía `order_items`)          | FK        | Productos en orden           |
| `quotes`          | `prescriptions`   | `prescription_id`            | FK        | Receta del presupuesto       |
| `lab_work_orders` | `prescriptions`   | `prescription_id`            | FK        | Receta del trabajo           |
| `quotes`          | `customers`       | `customer_id`                | FK        | Cliente del presupuesto      |
| `lab_work_orders` | `customers`       | `customer_id`                | FK        | Cliente del trabajo          |
| `orders`          | `customers`       | `email`                      | Indirecto | Cliente de la orden          |

### Flujos de Datos Resumidos

1. **Producto → Presupuesto**: Selección de armazón
2. **Presupuesto → Trabajo**: Conversión con copia de datos
3. **POS → Orden**: Venta rápida
4. **POS → Orden + Trabajo**: Orden completa
5. **Presupuesto → POS → Trabajo**: Carga de presupuesto en POS
6. **Trabajo → Entrega**: Workflow hasta entrega

---

## 🎯 Mejores Prácticas

### Para Desarrolladores

1. **Siempre validar existencia** antes de crear vínculos
2. **Usar transacciones** para operaciones que afectan múltiples tablas
3. **Mantener consistencia** en nombres de campos entre secciones
4. **Documentar vínculos** en código y documentación
5. **Probar flujos completos** de integración

### Para Usuarios

1. **Crear presupuesto primero** antes de crear trabajo directamente
2. **Revisar datos** al convertir entre secciones
3. **Verificar inventario** antes de procesar ventas
4. **Usar presupuestos** para cotizaciones formales
5. **Usar POS** para ventas rápidas y órdenes completas

---

**Fin del Documento**
