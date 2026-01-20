# Análisis y Plan de Refactorización - CreateWorkOrderForm

**Fecha:** 2025-01-27  
**Componente:** `src/components/admin/CreateWorkOrderForm.tsx`  
**Líneas Actuales:** 1,285  
**Objetivo:** < 200 líneas (orchestrator)

---

## 📋 Análisis del Componente Actual

### Estructura Actual

El componente `CreateWorkOrderForm` es un formulario monolítico que maneja la creación de órdenes de trabajo (work orders) para un sistema óptico. Contiene:

1. **Estado Complejo:**
   - 20+ estados locales (useState)
   - FormData con 30+ campos
   - Estados de búsqueda (customers, frames)
   - Estados de carga y validación

2. **Lógica de Negocio:**
   - Búsqueda de clientes con debounce
   - Búsqueda de marcos con debounce
   - Carga de recetas del cliente
   - Cálculos complejos de precios e impuestos
   - Validación de formulario
   - Manejo de presupuestos (quotes)

3. **Secciones Visuales Identificadas:**
   - **Customer Selection** (líneas 580-655): ~75 líneas
   - **Prescription Selection** (líneas 657-716): ~60 líneas
   - **Frame Selection** (líneas 718-839): ~120 líneas
   - **Lens Configuration** (líneas 841-991): ~150 líneas
   - **Lab Information** (líneas 993-1037): ~45 líneas
   - **Pricing Section** (líneas 1039-1190): ~150 líneas
   - **Status** (líneas 1192-1212): ~20 líneas
   - **Notes** (líneas 1214-1239): ~25 líneas
   - **Actions** (líneas 1241-1259): ~18 líneas
   - **Create Prescription Dialog** (líneas 1261-1281): ~20 líneas

4. **Funciones y Lógica:**
   - `loadQuote()`: Carga datos de presupuesto
   - `fetchCustomer()`: Obtiene datos del cliente
   - `fetchPrescriptions()`: Obtiene recetas del cliente
   - `calculateTotal()`: Calcula precios e impuestos
   - `handleTreatmentToggle()`: Maneja tratamientos de lentes
   - `handleFrameSelect()`: Maneja selección de marco
   - `handleSubmit()`: Envía el formulario

---

## 🎯 Plan de Refactorización

### Estructura Propuesta

```
src/components/admin/CreateWorkOrderForm/
├── index.tsx                    # Orchestrator principal (< 200 líneas)
├── CustomerSelector.tsx         # Selección de cliente (~100 líneas)
├── PrescriptionSelector.tsx    # Selección de receta (~80 líneas)
├── FrameSelector.tsx           # Selección de marco (~120 líneas)
├── LensConfiguration.tsx       # Configuración de lentes (~150 líneas)
├── LabInfoSection.tsx          # Información de laboratorio (~60 líneas)
├── PricingSection.tsx          # Cálculo de precios (~150 líneas)
├── StatusSection.tsx           # Estado inicial (~30 líneas)
├── NotesSection.tsx            # Notas (~40 líneas)
└── hooks/
    ├── useWorkOrderForm.ts      # Lógica del formulario
    ├── useWorkOrderCalculations.ts  # Cálculos de precios
    └── useWorkOrderValidation.ts   # Validación
```

### Componentes a Extraer

#### 1. CustomerSelector

**Responsabilidad:** Búsqueda y selección de cliente

- Búsqueda con debounce
- Lista de resultados
- Visualización del cliente seleccionado
- Botón para cambiar cliente

**Props:**

```typescript
interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
  onClear: () => void;
  currentBranchId: string | null;
}
```

**Estado Local:**

- `customerSearch`
- `customerResults`
- `searchingCustomers`

#### 2. PrescriptionSelector

**Responsabilidad:** Selección de receta del cliente

- Carga de recetas del cliente
- Selector de receta
- Botón para crear nueva receta
- Dialog para crear receta

**Props:**

```typescript
interface PrescriptionSelectorProps {
  customerId: string | null;
  selectedPrescription: Prescription | null;
  onSelect: (prescription: Prescription) => void;
  onCreateNew: () => void;
}
```

**Estado Local:**

- `prescriptions`
- `loadingPrescriptions`
- `showCreatePrescription`

#### 3. FrameSelector

**Responsabilidad:** Búsqueda y selección de marco

- Búsqueda de marcos con debounce
- Lista de resultados
- Entrada manual de marco
- Campo de número de serie

**Props:**

```typescript
interface FrameSelectorProps {
  selectedFrame: Product | null;
  onSelect: (frame: Product) => void;
  onClear: () => void;
  frameName: string;
  frameSerialNumber: string;
  onFrameNameChange: (name: string) => void;
  onSerialNumberChange: (serial: string) => void;
  currentBranchId: string | null;
}
```

**Estado Local:**

- `frameSearch`
- `frameResults`
- `searchingFrames`

#### 4. LensConfiguration

**Responsabilidad:** Configuración de lentes

- Tipo de lente
- Material
- Índice de refracción
- Tratamientos y recubrimientos
- Tinte (si aplica)

**Props:**

```typescript
interface LensConfigurationProps {
  lensType: string;
  lensMaterial: string;
  lensIndex: number | null;
  lensTreatments: string[];
  lensTintColor: string;
  lensTintPercentage: number;
  onLensTypeChange: (type: string) => void;
  onLensMaterialChange: (material: string) => void;
  onLensIndexChange: (index: number | null) => void;
  onTreatmentsChange: (treatments: string[]) => void;
  onTintChange: (color: string, percentage: number) => void;
  onLensCostChange: (cost: number) => void;
}
```

#### 5. LabInfoSection

**Responsabilidad:** Información del laboratorio

- Nombre del laboratorio
- Contacto
- Número de orden
- Fecha estimada de entrega

**Props:**

```typescript
interface LabInfoSectionProps {
  labName: string;
  labContact: string;
  labOrderNumber: string;
  labEstimatedDeliveryDate: string;
  onLabNameChange: (name: string) => void;
  onLabContactChange: (contact: string) => void;
  onLabOrderNumberChange: (number: string) => void;
  onLabDeliveryDateChange: (date: string) => void;
}
```

#### 6. PricingSection

**Responsabilidad:** Cálculo y visualización de precios

- Costos (marco, lente, tratamientos, mano de obra, lab)
- Descuento
- Cálculo de subtotal, IVA y total
- Información de pago (estado, método, seña, saldo)

**Props:**

```typescript
interface PricingSectionProps {
  frameCost: number;
  lensCost: number;
  treatmentsCost: number;
  laborCost: number;
  labCost: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  depositAmount: number;
  balanceAmount: number;
  onFrameCostChange: (cost: number) => void;
  onLensCostChange: (cost: number) => void;
  onLaborCostChange: (cost: number) => void;
  onLabCostChange: (cost: number) => void;
  onDiscountChange: (amount: number) => void;
  onPaymentStatusChange: (status: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onDepositChange: (amount: number) => void;
  taxPercentage: number;
  quoteSettings: any;
}
```

#### 7. StatusSection

**Responsabilidad:** Estado inicial del trabajo

- Selector de estado

**Props:**

```typescript
interface StatusSectionProps {
  status: string;
  onStatusChange: (status: string) => void;
}
```

#### 8. NotesSection

**Responsabilidad:** Notas del trabajo

- Notas internas
- Notas para el cliente

**Props:**

```typescript
interface NotesSectionProps {
  internalNotes: string;
  customerNotes: string;
  onInternalNotesChange: (notes: string) => void;
  onCustomerNotesChange: (notes: string) => void;
}
```

### Hooks Personalizados

#### 1. useWorkOrderForm

**Responsabilidad:** Gestión del estado del formulario

- Estado centralizado del formulario
- Funciones para actualizar campos
- Carga de datos iniciales (quote, customer)
- Validación básica

**Retorna:**

```typescript
{
  formData: WorkOrderFormData;
  updateField: (field: string, value: any) => void;
  updateFormData: (data: Partial<WorkOrderFormData>) => void;
  loadQuote: (quoteId: string) => Promise<void>;
  loadCustomer: (customerId: string) => Promise<void>;
  resetForm: () => void;
}
```

#### 2. useWorkOrderCalculations

**Responsabilidad:** Cálculos de precios e impuestos

- Cálculo de totales
- Manejo de impuestos
- Configuración de tax inclusion

**Retorna:**

```typescript
{
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  balanceAmount: number;
  calculateTotals: () => void;
  taxPercentage: number;
  quoteSettings: any;
}
```

#### 3. useWorkOrderValidation

**Responsabilidad:** Validación del formulario

- Validación de campos requeridos
- Validación de reglas de negocio
- Mensajes de error

**Retorna:**

```typescript
{
  errors: Record<string, string>;
  isValid: boolean;
  validate: () => boolean;
  validateField: (field: string) => boolean;
}
```

---

## 📝 Dependencias Identificadas

### Hooks Externos

- `useBranch()` - Para obtener `currentBranchId`

### Utilidades

- `getBranchHeader()` - Headers para requests
- `calculatePriceWithTax()` - Cálculo de precios con impuestos
- `getTaxPercentage()` - Obtener porcentaje de impuesto
- `getQuoteTaxInclusionSettings()` - Configuración de tax inclusion

### Componentes Externos

- `CreatePrescriptionForm` - Formulario de creación de receta
- Componentes UI de shadcn/ui

### APIs

- `/api/admin/quotes/${quoteId}` - Obtener presupuesto
- `/api/admin/customers/${customerId}` - Obtener cliente
- `/api/admin/customers/${customerId}/prescriptions` - Obtener recetas
- `/api/admin/customers/search` - Búsqueda de clientes
- `/api/admin/products/search` - Búsqueda de marcos
- `/api/admin/products/${productId}` - Obtener producto
- `/api/admin/quote-settings` - Configuración de presupuestos
- `/api/admin/work-orders` - Crear trabajo

---

## 🔄 Flujo de Datos

1. **Inicialización:**
   - Si hay `quoteId`, carga el presupuesto
   - Si hay `initialCustomerId`, carga el cliente
   - Carga configuración de impuestos

2. **Selección de Cliente:**
   - Usuario busca cliente
   - Selecciona cliente
   - Se cargan automáticamente las recetas

3. **Selección de Receta:**
   - Usuario selecciona receta
   - Se habilita configuración de lentes

4. **Selección de Marco:**
   - Usuario busca marco o ingresa manualmente
   - Se actualiza costo del marco

5. **Configuración de Lentes:**
   - Usuario selecciona tipo, material, tratamientos
   - Se calcula costo de lentes

6. **Información de Laboratorio:**
   - Usuario ingresa datos del lab

7. **Precios:**
   - Se calculan automáticamente cuando cambian costos
   - Usuario puede ajustar descuentos y pagos

8. **Envío:**
   - Validación
   - Envío a API
   - Callback `onSuccess`

---

## ✅ Criterios de Aceptación

- [ ] Componente dividido en al menos 7 sub-componentes
- [ ] 3 hooks personalizados creados
- [ ] Orchestrator principal < 200 líneas
- [ ] Funcionalidad completa preservada
- [ ] Código más legible y mantenible
- [ ] Tests básicos pasando (cuando se implementen)
- [ ] Sin regresiones en funcionalidad

---

## 📅 Plan de Ejecución

1. ✅ Análisis y planificación (0.5 días)
2. ⏳ Crear estructura de carpetas (0.5 días)
3. ⏳ Extraer CustomerSelector (1 día)
4. ⏳ Extraer PrescriptionSelector (1 día)
5. ⏳ Extraer FrameSelector (1 día)
6. ⏳ Extraer LensConfiguration (1 día)
7. ⏳ Extraer PricingSection (1 día)
8. ⏳ Crear hooks personalizados (1 día)
9. ⏳ Refactorizar orchestrator (1 día)
10. ⏳ Verificación final (0.5 días)

**Total Estimado:** 1 semana
