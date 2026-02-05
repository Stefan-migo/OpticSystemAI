# Guía de Implementación: Formulario Unificado para Familias y Matrices de Lentes

## 1. Resumen Ejecutivo

Esta guía detalla el plan de implementación para refactorizar la gestión de productos ópticos, unificando la creación de **Familias de Lentes** y **Matrices de Precios** en un flujo único y coherente. El objetivo es mejorar la experiencia de usuario (UX) garantizando que ninguna familia se cree sin al menos una matriz de precios válida, reduciendo errores y simplificando la navegación.

---

## 2. Arquitectura y Diseño

### 2.1 Enfoque de Diseño: "Wizard Step-by-Step"

Para la **creación**, utilizaremos un enfoque de asistente (wizard) de 2 pasos.
Para la **edición**, utilizaremos un enfoque de pestañas (tabs) para una gestión más flexible.

### 2.2 Estructura de Componentes Sugerida

```
src/components/admin/lenses/
├── LensFamilyWizard.tsx       # Contenedor principal del flujo de creación
├── LensFamilyBasicForm.tsx    # Paso 1: Datos de la familia
├── LensMatrixManager.tsx      # Paso 2: Gestión de matrices (Lista + Formulario)
└── LensFamilyEditor.tsx       # Contenedor principal para edición (Tabs)
```

### 2.3 Modelo de Datos Local (Frontend)

El estado del formulario debe manejar la estructura jerárquica temporalmente antes de enviar:

```typescript
interface LensFamilyFormData {
  // Datos Nivel 1: Familia
  name: string;
  brand: string;
  lens_type: string;
  lens_material: string;
  description: string;

  // Datos Nivel 2: Matrices (Array temporal)
  matrices: LensMatrixFormData[];
}

interface LensMatrixFormData {
  temp_id: string; // ID temporal para manejo en frontend
  sphere_min: number;
  sphere_max: number;
  cylinder_min: number;
  cylinder_max: number;
  addition_min: number;
  addition_max: number;
  base_price: number;
  cost: number;
  sourcing_type: "stock" | "surfaced";
}
```

---

## 3. Guía de Implementación: Frontend

### Paso 1: Crear Componente `LensMatrixManager`

Este componente será reutilizable tanto en el wizard como en la edición.

- **Responsabilidad**: Mostrar la lista de matrices añadidas en memoria y permitir añadir/editar/eliminar.
- **Props**: `matrices: LensMatrixFormData[]`, `onChange: (matrices) => void`.
- **UI**:
  - Tabla resumen de matrices agregadas.
  - Formulario (puede ser en línea o modal) para ingresar los rangos y precios.
  - Validación inmediata de solapamiento de rangos (opcional pero recomendado).

### Paso 2: Crear Componente `LensFamilyBasicForm`

- **Responsabilidad**: Capturar solo los datos de la familia.
- **Props**: `data: LensFamilyFormData`, `onChange: (data) => void`.
- **Validación**: Zod schema para campos requeridos (nombre, tipo, material).

### Paso 3: Implementar `LensFamilyWizard` (Creación)

- **Estado**: `currentStep` (1 o 2).
- **Flujo**:
  1.  Mostrar `LensFamilyBasicForm`. Botón "Siguiente" valida y avanza.
  2.  Mostrar `LensMatrixManager`. Botón "Crear Familia" envía todo el payload al servidor.
- **Validación Final**: Impedir el envío si el array `matrices` está vacío.

### Paso 4: Implementar `LensFamilyEditor` (Edición)

- **UI**: Layout con Tabs (`Información General` | `Matrices de Precios`).
- **Tab 1**: Reutiliza `LensFamilyBasicForm`. Botón "Guardar Cambios" actualiza solo la familia (`PUT /api/admin/lens-families/:id`).
- **Tab 2**: Reutiliza `LensMatrixManager`.
  - Aquí la lógica cambia ligeramente: las acciones (crear/borrar matriz) deben ser inmediatas contra la API (`POST/DELETE /api/admin/lens-matrices`), O mantener un botón "Guardar Matrices" que procese el lote. Se recomienda acciones inmediatas para simplificar la sincronización en edición.

---

## 4. Guía de Implementación: Backend

### Paso 1: Actualizar Endpoint de Creación (`POST /api/admin/lens-families`)

Modificar la ruta para aceptar un payload anidado y usar una transacción de Supabase.

**Payload Esperado:**

```json
{
  "name": "Varilux Comfort",
  "brand": "Essilor",
  "lens_type": "progressive",
  "lens_material": "high_index_1_67",
  "description": "...",
  "matrices": [
    {
      "sphere_min": -6.00,
      "sphere_max": 6.00,
      ...
    }
  ]
}
```

**Lógica Transaccional (Pseudo-código):**

```typescript
const { data: family, error } = await supabase.from('lens_families').insert({...});
if (error) return error;

const matricesWithId = body.matrices.map(m => ({ ...m, lens_family_id: family.id }));
const { error: matricesError } = await supabase.from('lens_price_matrices').insert(matricesWithId);

if (matricesError) {
  // CRÍTICO: Rollback manual o uso de RPC para transacción atómica real
  await supabase.from('lens_families').delete().eq('id', family.id);
  return matricesError;
}
```

_Nota: Para mayor robustez, se recomienda crear un RPC (Database Function) en Supabase `create_lens_family_with_matrices` para asegurar atomicidad SQL._

### Paso 2: Crear RPC (Opcional pero recomendado)

Crear una migración SQL para una función que maneje la inserción atómica.

```sql
CREATE OR REPLACE FUNCTION create_lens_family_full(
  p_family_data jsonb,
  p_matrices_data jsonb
) RETURNS jsonb AS $$
DECLARE
  v_family_id uuid;
BEGIN
  -- Insertar Familia
  INSERT INTO lens_families (...) VALUES (...) RETURNING id INTO v_family_id;

  -- Insertar Matrices (loop o json_populate_recordset)
  INSERT INTO lens_price_matrices (lens_family_id, ...)
  SELECT v_family_id, ... FROM jsonb_to_recordset(p_matrices_data) ...;

  RETURN json_build_object('id', v_family_id);
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Plan de Migración y Limpieza

1.  **Nuevas Rutas**: Crear la página `src/app/admin/products/lenses/new` que implemente el Wizard.
2.  **Rutaje**: Redirigir la antigua página de creación de familias a la nueva.
3.  **Menú Lateral**: Consolidar "Familias de Lentes" y "Matrices" en una sola entrada "Catálogo de Lentes" si se desea, o mantener "Familias" como la entrada principal y eliminar el acceso directo a "Matrices" (ya que ahora se gestionan dentro de la familia).
4.  **Limpieza**: Una vez verificado el funcionamiento, eliminar o desmeritar las páginas independientes antiguas que ya no se usen.

## 6. Checklist de Validación

- [ ] Se puede crear una familia completa con 1 o más matrices.
- [ ] Si falla la creación de matrices, la familia no se crea en BD (Atomicidad).
- [ ] No se permite crear una familia sin matrices.
- [ ] La edición permite agregar nuevas matrices a una familia existente sin perder datos anteriores.
- [ ] Los validadores de rangos (Min <= Max) funcionan en el cliente antes de enviar.
- [ ] La UI es responsiva y clara en los pasos.
