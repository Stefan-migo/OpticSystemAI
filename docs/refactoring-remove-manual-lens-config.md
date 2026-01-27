# Plan de Refactorización: Remover Lógica de Configuración Manual de Lentes

## Objetivo

Remover completamente la lógica de configuración manual (tipo × material × tratamientos) del sistema de presupuestos, manteniendo solo:

1. **Familia de lentes + matrices de precios** (lógica principal)
2. **Ingreso manual directo** (fallback)

## Análisis de Dependencias

### Archivos Afectados

1. **`src/components/admin/CreateQuoteForm.tsx`**
   - Líneas 1668-1750: Selects de tipo/material con cálculo manual
   - Líneas 1678-1733: Lógica de cálculo con `lens_type_base_costs` y `lens_material_multipliers`
   - Líneas 863-864: Validación que requiere tipo/material si no hay familia
   - Líneas 1693-1773: Tratamientos manuales (mantener solo tint/prism cuando hay familia)

2. **`src/app/admin/pos/page.tsx`**
   - Líneas 1050-1076: Función `calculateLensCost` con multiplicadores
   - Líneas 1078-1087: useEffect que calcula costo cuando cambia tipo/material
   - Líneas 1143-1146: Validación que requiere tipo/material

3. **`src/components/admin/CreateWorkOrderForm/LensConfiguration.tsx`**
   - Líneas 116-135: Handlers de tipo/material (verificar si se usa)

4. **`src/app/admin/quotes/settings/page.tsx`**
   - Mantener UI de configuración (para compatibilidad) pero no se usará activamente

## Plan de Implementación

### Fase 1: CreateQuoteForm.tsx

#### Paso 1.1: Remover Selects de Tipo/Material Manual

- **Ubicación**: Líneas 1668-1750
- **Acción**: Eliminar completamente los selects de tipo y material
- **Reemplazar con**: Mensaje informativo + input manual directo

#### Paso 1.2: Simplificar Lógica de UI

- **Cuando hay familia seleccionada**: Mostrar info heredada (ya existe, líneas 1661-1666)
- **Cuando NO hay familia**: Mostrar solo input manual de precio (sin selects)

#### Paso 1.3: Actualizar Validaciones

- **Línea 863**: Cambiar validación de `!formData.lens_type || !formData.lens_material` a `!formData.lens_family_id && formData.lens_cost === 0`
- **Línea 826**: Similar para caso normal (no two_separate)

#### Paso 1.4: Limpiar Código No Usado

- Remover referencias a `lens_type_base_costs` y `lens_material_multipliers` en cálculos
- Mantener arrays `lensTypes` y `lensMaterials` solo si se usan en otros lugares (verificar)

### Fase 2: POS Page

#### Paso 2.1: Remover Función calculateLensCost

- **Ubicación**: Líneas 1050-1076
- **Acción**: Eliminar función completa

#### Paso 2.2: Remover useEffect de Cálculo Automático

- **Ubicación**: Líneas 1078-1087
- **Acción**: Eliminar useEffect que calcula costo basado en tipo/material

#### Paso 2.3: Actualizar Validaciones

- **Línea 1143**: Cambiar validación de tipo/material a verificar familia o precio manual

#### Paso 2.4: Simplificar UI Similar a CreateQuoteForm

- Mantener solo: familia o input manual

### Fase 3: Limpieza y Optimización

#### Paso 3.1: Verificar CreateWorkOrderForm

- Revisar si usa lógica similar y aplicar mismos cambios

#### Paso 3.2: Remover Imports/Constantes No Usadas

- Verificar si `lensTypes` y `lensMaterials` se usan en otros lugares
- Si no, removerlos

#### Paso 3.3: Actualizar Comentarios y Documentación

- Actualizar comentarios que mencionen configuración manual
- Documentar nueva lógica simplificada

### Fase 4: Testing y Verificación

#### Paso 4.1: Probar Flujo con Familia

- Seleccionar familia → verificar cálculo automático
- Verificar que tipo/material se heredan correctamente

#### Paso 4.2: Probar Flujo Manual

- Sin familia → ingresar precio manual directamente
- Verificar que funciona correctamente

#### Paso 4.3: Probar Casos Especiales

- Presbicia con dos lentes separados
- Tratamientos tint/prism cuando hay familia
- Validaciones de formulario

## Cambios Específicos por Archivo

### CreateQuoteForm.tsx

**Eliminar:**

```typescript
// Líneas 1668-1750: Selects de tipo/material
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Tipo de Lente *</Label>
    <Select value={formData.lens_type} onValueChange={...}>
      // ... cálculo con lens_type_base_costs
    </Select>
  </div>
  <div>
    <Label>Material *</Label>
    <Select value={formData.lens_material} onValueChange={...}>
      // ... cálculo con multiplicadores
    </Select>
  </div>
</div>
```

**Reemplazar con:**

```typescript
{!formData.lens_family_id && (
  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
    <p className="text-sm text-yellow-800 mb-2">
      No hay familia seleccionada. Ingresa el precio del lente manualmente en la sección de precios.
    </p>
  </div>
)}
```

**Actualizar validación:**

```typescript
// Antes:
if (!formData.lens_type || !formData.lens_material) {
  toast.error(
    "Selecciona familias de lentes o configura manualmente tipo y material",
  );
  return;
}

// Después:
if (!formData.lens_family_id && formData.lens_cost === 0) {
  toast.error(
    "Selecciona una familia de lentes o ingresa el precio manualmente",
  );
  return;
}
```

### POS Page

**Eliminar:**

```typescript
// Función calculateLensCost (líneas 1050-1076)
const calculateLensCost = (type: string, material: string) => { ... }

// useEffect (líneas 1078-1087)
useEffect(() => {
  if (!orderFormData.lens_family_id && !manualLensPrice && ...) {
    const cost = calculateLensCost(...);
    ...
  }
}, [...]);
```

**Actualizar validación:**

```typescript
// Antes:
if (!orderFormData.lens_type || !orderFormData.lens_material) {
  toast.error("Selecciona tipo y material de lente");
  return;
}

// Después:
if (!orderFormData.lens_family_id && orderFormData.lens_cost === 0) {
  toast.error(
    "Selecciona una familia de lentes o ingresa el precio manualmente",
  );
  return;
}
```

## Consideraciones

1. **Compatibilidad con Datos Existentes**: Los campos `lens_type` y `lens_material` se mantienen en la BD y en el formulario (se llenan automáticamente cuando hay familia), pero no son requeridos para entrada manual.

2. **Quote Settings**: Se mantiene la UI de configuración de multiplicadores en `quotes/settings` por compatibilidad, pero no se usará activamente. Se puede marcar como "deprecated" o remover en una futura versión.

3. **Tratamientos**: Cuando hay familia seleccionada, solo se permiten tint y prism_extra como extras. Esto ya está implementado correctamente.

4. **Índice de Refracción**: Se mantiene como campo informativo (readonly cuando hay familia), útil para documentación.

## Resultado Esperado

Después de la refactorización:

- ✅ UI más simple y clara
- ✅ Menos código a mantener
- ✅ Lógica más realista (familia + matrices)
- ✅ Flexibilidad mantenida (input manual como fallback)
- ✅ Menos errores potenciales
- ✅ Mejor UX para usuarios

## Checklist de Verificación

- [ ] CreateQuoteForm: Selects de tipo/material removidos
- [ ] CreateQuoteForm: Validaciones actualizadas
- [ ] CreateQuoteForm: UI simplificada (familia o manual)
- [ ] POS Page: Función calculateLensCost removida
- [ ] POS Page: useEffect de cálculo removido
- [ ] POS Page: Validaciones actualizadas
- [ ] CreateWorkOrderForm: Verificado y actualizado si necesario
- [ ] Código no usado removido
- [ ] Comentarios actualizados
- [ ] Testing completo realizado
- [ ] Funcionalidad preservada
