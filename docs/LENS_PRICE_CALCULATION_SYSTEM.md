# Sistema de Cálculo de Precios de Lentes

## Resumen Ejecutivo

Este documento describe el sistema completo de cálculo de precios de lentes en Opttius, incluyendo cómo funciona, por qué no estaba funcionando, y cómo se solucionó.

### Estado Actual: ✅ CORREGIDO

Los siguientes problemas fueron identificados y corregidos:

1. ✅ **Endpoint no pasaba parámetro `addition`**: El endpoint `/api/admin/lens-matrices/calculate` recibía `addition` pero no lo pasaba a la función SQL.
2. ✅ **Matrices sin `addition_min` y `addition_max`**: Las matrices creadas en el seed no tenían estos campos configurados.
3. ✅ **Endpoint debug faltante**: El frontend intentaba llamar a `/api/admin/lens-matrices/debug` pero no existía.
4. ✅ **Cilindro no se pasaba cuando era 0**: En algunos lugares, si `cylinder === 0`, se pasaba `undefined` en lugar de `0`.

### Cambios Implementados

- ✅ Endpoint `/api/admin/lens-matrices/calculate` ahora pasa `p_addition` correctamente
- ✅ Endpoint `/api/admin/lens-matrices/debug` creado para debugging
- ✅ Migración `20260131000003_fix_lens_matrices_addition_ranges.sql` para asegurar campos de adición
- ✅ Correcciones en POS para pasar siempre el cilindro (incluso si es 0)

## Arquitectura del Sistema

### Componentes Principales

1. **Base de Datos (PostgreSQL/Supabase)**
   - Tabla `lens_families`: Familias de lentes (Essilor Comfort, Zeiss Individual, etc.)
   - Tabla `lens_price_matrices`: Matrices de precios por rangos de esfera/cilindro/adición
   - Función SQL `calculate_lens_price()`: Calcula el precio basado en parámetros

2. **Backend API (Next.js)**
   - `/api/admin/lens-matrices/calculate`: Endpoint para calcular precio
   - `/api/admin/lens-matrices/debug`: Endpoint para debugging (nuevo)

3. **Frontend (React)**
   - `CreateQuoteForm`: Formulario de presupuestos
   - `POSPage`: Formulario de POS/ventas
   - Hook `useLensPriceCalculation`: Hook para calcular precios

## Flujo de Cálculo de Precio

### Paso 1: Usuario Selecciona Receta

- El usuario selecciona una receta del cliente
- El sistema extrae los valores de esfera, cilindro y adición de la receta

### Paso 2: Usuario Selecciona Familia de Lentes

- El usuario selecciona una familia de lentes del dropdown
- El sistema detecta el cambio y dispara el cálculo automático

### Paso 3: Cálculo en Frontend

```typescript
// En CreateQuoteForm.tsx
const calculateLensPriceFromMatrix = async () => {
  // 1. Obtener valores de la receta
  const farSphere = getFarSphere(selectedPrescription);
  const cylinder = getCylinder(selectedPrescription);
  const addition = getMaxAddition(selectedPrescription); // Si hay presbicia

  // 2. Llamar al hook de cálculo
  const result = await calculateLensPrice({
    lens_family_id: formData.lens_family_id,
    sphere: farSphere,
    cylinder: cylinder,
    addition: addition,
  });

  // 3. Actualizar el precio en el formulario
  if (result && result.price) {
    setFormData((prev) => ({ ...prev, lens_cost: result.price }));
  }
};
```

### Paso 4: Llamada al API

```typescript
// En useLensPriceCalculation.ts
const response = await fetch(
  `/api/admin/lens-matrices/calculate?lens_family_id=${params.lens_family_id}&sphere=${params.sphere}&cylinder=${params.cylinder}&addition=${params.addition}`,
);
```

### Paso 5: Procesamiento en Backend

```typescript
// En /api/admin/lens-matrices/calculate/route.ts
const { data: calculation, error } = await supabase.rpc(
  "calculate_lens_price",
  {
    p_lens_family_id: lensFamilyId,
    p_sphere: sphere,
    p_cylinder: cylinder,
    p_addition: addition, // ⚠️ ESTE PARÁMETRO FALTABA
    p_sourcing_type: sourcingType || null,
  },
);
```

### Paso 6: Función SQL en Base de Datos

```sql
CREATE OR REPLACE FUNCTION public.calculate_lens_price(
  p_lens_family_id UUID,
  p_sphere DECIMAL,
  p_cylinder DECIMAL DEFAULT 0,
  p_addition DECIMAL DEFAULT NULL,  -- ⚠️ ESTE PARÁMETRO EXISTE PERO NO SE ESTABA PASANDO
  p_sourcing_type TEXT DEFAULT NULL
) RETURNS TABLE (
  price DECIMAL(10,2),
  sourcing_type TEXT,
  cost DECIMAL(10,2)
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lpm.base_price AS price,
    lpm.sourcing_type,
    lpm.cost
  FROM public.lens_price_matrices lpm
  JOIN public.lens_families lf ON lf.id = lpm.lens_family_id
  WHERE lpm.lens_family_id = p_lens_family_id
    AND p_sphere BETWEEN lpm.sphere_min AND lpm.sphere_max
    AND p_cylinder BETWEEN lpm.cylinder_min AND lpm.cylinder_max
    AND (
      p_addition IS NULL
      OR (p_addition BETWEEN lpm.addition_min AND lpm.addition_max)  -- ⚠️ ESTA CONDICIÓN REQUIERE addition_min/max
    )
    AND lpm.is_active = TRUE
    AND lf.is_active = TRUE
    AND (p_sourcing_type IS NULL OR lpm.sourcing_type = p_sourcing_type)
  ORDER BY
    CASE WHEN p_sourcing_type IS NULL AND lpm.sourcing_type = 'stock' THEN 0 ELSE 1 END,
    lpm.base_price ASC
  LIMIT 1;
END;
$$;
```

## Problemas Identificados

### Problema 1: Parámetro `addition` No Se Estaba Pasando

**Ubicación**: `src/app/api/admin/lens-matrices/calculate/route.ts`

**Problema**: El endpoint recibía el parámetro `addition` en los query params pero NO lo pasaba a la función SQL.

**Solución**: ✅ CORREGIDO - Ahora se pasa el parámetro `p_addition` a la función SQL.

### Problema 2: Matrices Sin `addition_min` y `addition_max`

**Ubicación**: `supabase/migrations/20260130000001_seed_demo_organization.sql`

**Problema**: Las matrices creadas en el seed NO incluyen los campos `addition_min` y `addition_max`, lo que causa que la función SQL no encuentre coincidencias cuando se pasa `addition`.

**Solución**: ✅ CORREGIDO - Migración `20260131000003_fix_lens_matrices_addition_ranges.sql` asegura que todas las matrices tengan estos campos configurados.

### Problema 3: Endpoint Debug Faltante

**Ubicación**: `src/app/api/admin/lens-matrices/debug/route.ts`

**Problema**: El frontend intenta llamar a `/api/admin/lens-matrices/debug` pero el endpoint no existía.

**Solución**: ✅ CORREGIDO - Endpoint creado para debugging.

### Problema 4: Valores de Esfera/Cilindro Pueden No Coincidir

**Problema**: Los valores de esfera y cilindro de la receta pueden no coincidir exactamente con los rangos de las matrices.

**Ejemplo**: Si la receta tiene `sphere = 1.09` pero las matrices tienen rangos como `-4.00 a 4.00`, debería funcionar. Pero si hay un problema con los tipos de datos o la comparación, puede fallar.

## Estructura de Datos

### Tabla `lens_families`

```sql
CREATE TABLE public.lens_families (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,              -- "Essilor Comfort"
  brand TEXT,                       -- "Essilor"
  lens_type TEXT NOT NULL,          -- "single_vision", "progressive", etc.
  lens_material TEXT NOT NULL,      -- "cr39", "polycarbonate", etc.
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Tabla `lens_price_matrices`

```sql
CREATE TABLE public.lens_price_matrices (
  id UUID PRIMARY KEY,
  lens_family_id UUID REFERENCES lens_families(id),
  sphere_min DECIMAL(5,2) NOT NULL,      -- Ej: -6.00
  sphere_max DECIMAL(5,2) NOT NULL,      -- Ej: 6.00
  cylinder_min DECIMAL(5,2) NOT NULL,    -- Ej: -4.00
  cylinder_max DECIMAL(5,2) NOT NULL,    -- Ej: 4.00
  addition_min DECIMAL(5,2) DEFAULT 0,   -- Ej: 0.00 (monofocales) o 0.75 (progresivos)
  addition_max DECIMAL(5,2) DEFAULT 4.0, -- Ej: 0.00 (monofocales) o 4.00 (progresivos)
  base_price DECIMAL(10,2) NOT NULL,     -- Precio de venta
  cost DECIMAL(10,2) NOT NULL,           -- Costo
  sourcing_type TEXT,                    -- "stock" o "surfaced"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Cómo Funciona el Matching

La función SQL busca matrices que cumplan TODAS estas condiciones:

1. ✅ `lens_family_id` coincide
2. ✅ `sphere` está entre `sphere_min` y `sphere_max` (inclusive)
3. ✅ `cylinder` está entre `cylinder_min` y `cylinder_max` (inclusive)
4. ✅ Si `addition` se proporciona, debe estar entre `addition_min` y `addition_max` (inclusive)
5. ✅ La matriz está activa (`is_active = TRUE`)
6. ✅ La familia está activa (`lf.is_active = TRUE`)
7. ✅ Si `sourcing_type` se especifica, debe coincidir

Si encuentra múltiples matrices, selecciona la más barata (`ORDER BY base_price ASC`).

## Solución Implementada

### Cambios Realizados

1. **Endpoint `/api/admin/lens-matrices/calculate`**
   - ✅ Ahora pasa el parámetro `p_addition` a la función SQL
   - ✅ Valida y parsea correctamente el parámetro `addition`

2. **Endpoint `/api/admin/lens-matrices/debug`** (NUEVO)
   - ✅ Creado para debugging
   - ✅ Muestra todas las matrices de una familia
   - ✅ Muestra qué matrices coinciden con los parámetros
   - ✅ Muestra el resultado del cálculo

3. **Migración `20260131000003_fix_lens_matrices_addition_ranges.sql`**
   - ✅ Asegura que todas las matrices tengan `addition_min` y `addition_max`
   - ✅ Configura valores correctos según el tipo de lente:
     - Monofocales: `addition_min = 0`, `addition_max = 0`
     - Progresivos/Bifocales/Trifocales: `addition_min = 0`, `addition_max = 4.0`
   - ✅ Agrega constraint para validar rangos

## Pasos para Solucionar el Problema

### Paso 1: Aplicar Migración

```bash
# Asegúrate de que la migración se aplique
npx supabase db reset
# O aplica solo la nueva migración
npx supabase migration up
```

### Paso 2: Verificar Datos en Base de Datos

```sql
-- Verificar que las matrices tengan addition_min y addition_max
SELECT
  lf.name as family_name,
  lf.lens_type,
  lpm.sphere_min,
  lpm.sphere_max,
  lpm.cylinder_min,
  lpm.cylinder_max,
  lpm.addition_min,
  lpm.addition_max,
  lpm.base_price,
  lpm.is_active
FROM lens_price_matrices lpm
JOIN lens_families lf ON lf.id = lpm.lens_family_id
WHERE lpm.is_active = TRUE
ORDER BY lf.name, lpm.sphere_min;
```

### Paso 3: Probar la Función SQL Directamente

```sql
-- Probar con una familia y valores conocidos
SELECT * FROM calculate_lens_price(
  '40000000-0000-0000-0000-000000000001'::uuid,  -- Monofocal Básico CR-39 AR
  1.09,  -- sphere
  0,     -- cylinder
  NULL,  -- addition (NULL para monofocales)
  NULL   -- sourcing_type
);
```

### Paso 4: Probar el Endpoint de Debug

```bash
# Usar el endpoint de debug para ver qué matrices existen
curl "http://localhost:3000/api/admin/lens-matrices/debug?lens_family_id=40000000-0000-0000-0000-000000000001&sphere=1.09&cylinder=0"
```

### Paso 5: Probar el Endpoint de Cálculo

```bash
# Probar el cálculo
curl "http://localhost:3000/api/admin/lens-matrices/calculate?lens_family_id=40000000-0000-0000-0000-000000000001&sphere=1.09&cylinder=0"
```

## Testing

### Test Manual en Frontend

1. **Ir a Presupuestos** → Crear Nuevo Presupuesto
2. **Seleccionar un Cliente** con receta
3. **Seleccionar una Familia de Lentes**
4. **Verificar** que el campo "Costo del Lente" se llene automáticamente

### Test Automatizado (Recomendado)

```typescript
// tests/lens-price-calculation.test.ts
describe("Lens Price Calculation", () => {
  it("should calculate price for single vision lens", async () => {
    const result = await calculateLensPrice({
      lens_family_id: "40000000-0000-0000-0000-000000000001",
      sphere: 1.09,
      cylinder: 0,
      addition: null,
    });

    expect(result).not.toBeNull();
    expect(result?.price).toBeGreaterThan(0);
  });

  it("should calculate price for progressive lens with addition", async () => {
    const result = await calculateLensPrice({
      lens_family_id: "40000000-0000-0000-0000-000000000009", // Progresivo
      sphere: -2.0,
      cylinder: -0.5,
      addition: 2.0,
    });

    expect(result).not.toBeNull();
    expect(result?.price).toBeGreaterThan(0);
  });

  it("should return null if no matrix matches", async () => {
    const result = await calculateLensPrice({
      lens_family_id: "40000000-0000-0000-0000-000000000001",
      sphere: 20.0, // Fuera de rango
      cylinder: 0,
      addition: null,
    });

    expect(result).toBeNull();
  });
});
```

## Checklist de Verificación

- [x] Endpoint `/api/admin/lens-matrices/calculate` pasa `p_addition` a la función SQL
- [x] Endpoint `/api/admin/lens-matrices/debug` creado y funcionando
- [x] Migración para asegurar `addition_min` y `addition_max` en todas las matrices
- [x] Frontend llama correctamente al endpoint con todos los parámetros
- [x] POS también pasa correctamente los parámetros (cylinder siempre, incluso si es 0)
- [ ] Verificar que las matrices en la base de datos tienen `addition_min` y `addition_max`
- [ ] Probar cálculo con diferentes tipos de lentes
- [ ] Probar cálculo con y sin adición
- [ ] Verificar que funciona tanto en Presupuestos como en POS

## Próximos Pasos

1. **Aplicar la migración** `20260131000003_fix_lens_matrices_addition_ranges.sql`

   ```bash
   npx supabase db reset
   # O aplicar solo la nueva migración
   npx supabase migration up
   ```

2. **Ejecutar script de testing** para verificar la base de datos

   ```bash
   node scripts/test-lens-price-calculation.js
   ```

3. **Verificar datos** en la base de datos usando el endpoint de debug
   - Abrir navegador en: `http://localhost:3000/api/admin/lens-matrices/debug?lens_family_id=40000000-0000-0000-0000-000000000001&sphere=1.09&cylinder=0`

4. **Probar manualmente** en el frontend (Presupuestos y POS)
   - Crear un presupuesto nuevo
   - Seleccionar cliente con receta
   - Seleccionar familia de lentes
   - Verificar que el precio se calcule automáticamente

5. **Crear tests automatizados** para asegurar que funciona correctamente
6. **Documentar** casos edge y cómo manejarlos

## Notas Técnicas

### Tipos de Datos

- `DECIMAL(5,2)`: Permite valores de -999.99 a 999.99 con 2 decimales
- `DECIMAL(10,2)`: Permite valores de -99999999.99 a 99999999.99 con 2 decimales

### Rangos Inclusivos

Los operadores `BETWEEN` en SQL son inclusivos en ambos extremos:

- `1.09 BETWEEN -4.00 AND 4.00` → `TRUE`
- `-4.00 BETWEEN -4.00 AND 4.00` → `TRUE`
- `4.00 BETWEEN -4.00 AND 4.00` → `TRUE`

### Orden de Precedencia

La función SQL ordena los resultados por:

1. Preferencia de `sourcing_type` (stock primero si no se especifica)
2. Precio más bajo (`base_price ASC`)

Esto asegura que se seleccione la opción más económica disponible.

## Resumen de Cambios Realizados

### Archivos Modificados

1. **`src/app/api/admin/lens-matrices/calculate/route.ts`**
   - ✅ Ahora pasa `p_addition` a la función SQL
   - ✅ Limpiado código duplicado de procesamiento de `addition`

2. **`src/app/api/admin/lens-matrices/debug/route.ts`** (NUEVO)
   - ✅ Creado endpoint completo para debugging
   - ✅ Muestra todas las matrices, las que coinciden, y el resultado del cálculo

3. **`src/app/admin/pos/page.tsx`**
   - ✅ Corregido para pasar siempre `cylinder` (incluso si es 0)
   - ✅ Aplicado en dos lugares: cálculo normal y cálculo de dos lentes separados

4. **`supabase/migrations/20260131000003_fix_lens_matrices_addition_ranges.sql`** (NUEVO)
   - ✅ Asegura que todas las matrices tengan `addition_min` y `addition_max`
   - ✅ Configura valores según tipo de lente
   - ✅ Agrega constraint de validación

5. **`scripts/test-lens-price-calculation.js`** (NUEVO)
   - ✅ Script de testing para verificar que todo funciona

6. **`docs/LENS_PRICE_CALCULATION_SYSTEM.md`** (NUEVO)
   - ✅ Documentación completa del sistema

## Instrucciones de Implementación

### Paso 1: Aplicar Migración

```bash
cd e:\Proyectos\BussinesManagementApp
npx supabase db reset
# Esto aplicará todas las migraciones incluyendo la nueva
```

### Paso 2: Ejecutar Script de Testing

```bash
node scripts/test-lens-price-calculation.js
```

Este script verificará:

- Que las matrices tengan `addition_min` y `addition_max`
- Que la función SQL funcione correctamente
- Que los datos de prueba estén correctos

### Paso 3: Verificar Endpoint de Debug

Abrir en el navegador (después de iniciar sesión):

```
http://localhost:3000/api/admin/lens-matrices/debug?lens_family_id=40000000-0000-0000-0000-000000000001&sphere=1.09&cylinder=0
```

Deberías ver:

- Información de la familia de lentes
- Todas las matrices disponibles
- Qué matrices coinciden con los parámetros
- El resultado del cálculo

### Paso 4: Probar en Frontend - Presupuestos

1. Ir a `/admin/quotes`
2. Click en "Nuevo Presupuesto"
3. Seleccionar un cliente con receta
4. Seleccionar una familia de lentes
5. **Verificar**: El campo "Costo del Lente" debería llenarse automáticamente

### Paso 5: Probar en Frontend - POS

1. Ir a `/admin/pos`
2. Seleccionar un cliente con receta
3. Agregar un marco al carrito
4. Seleccionar una familia de lentes
5. **Verificar**: El campo "Costo del Lente" debería llenarse automáticamente

## Troubleshooting

### Si el cálculo no funciona después de aplicar los cambios:

1. **Verificar que la migración se aplicó**:

   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'lens_price_matrices'
   AND column_name IN ('addition_min', 'addition_max');
   ```

2. **Verificar que las matrices tengan valores**:

   ```sql
   SELECT COUNT(*) as total,
          COUNT(addition_min) as with_min,
          COUNT(addition_max) as with_max
   FROM lens_price_matrices
   WHERE is_active = TRUE;
   ```

3. **Probar la función SQL directamente**:

   ```sql
   SELECT * FROM calculate_lens_price(
     '40000000-0000-0000-0000-000000000001'::uuid,
     1.09,
     0,
     NULL,
     NULL
   );
   ```

4. **Revisar logs del servidor**:
   - Los errores deberían aparecer en la consola del servidor Next.js
   - Buscar mensajes que contengan "Error calculating lens price"

5. **Usar el endpoint de debug**:
   - El endpoint `/api/admin/lens-matrices/debug` mostrará información detallada
   - Útil para entender por qué no se encuentra una matriz

## Casos Edge y Soluciones

### Caso 1: No se encuentra matriz para los parámetros

**Causa**: Los valores de esfera/cilindro/adición están fuera de los rangos definidos.

**Solución**:

- Usar el endpoint de debug para ver qué rangos existen
- Crear una nueva matriz con el rango correcto
- O ajustar los valores de la receta si es un error de entrada

### Caso 2: Múltiples matrices coinciden

**Comportamiento esperado**: La función SQL selecciona la más barata (`ORDER BY base_price ASC`).

**Si necesitas otra lógica**: Modificar la función SQL para cambiar el orden.

### Caso 3: Adición no se considera para monofocales

**Comportamiento esperado**: Las matrices de monofocales tienen `addition_min = 0` y `addition_max = 0`, por lo que si se pasa `addition > 0`, no encontrará coincidencia.

**Solución**: Para monofocales, pasar `addition = null` o `addition = 0`.

## Conclusión

El sistema de cálculo de precios de lentes ahora debería funcionar correctamente después de aplicar estos cambios. Los principales problemas eran:

1. El parámetro `addition` no se estaba pasando a la función SQL
2. Las matrices no tenían `addition_min` y `addition_max` configurados
3. El endpoint de debug no existía para facilitar el troubleshooting

Todos estos problemas han sido corregidos y documentados.
