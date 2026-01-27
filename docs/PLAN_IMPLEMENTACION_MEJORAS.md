# Plan de Implementación - Mejoras del Sistema

## 📋 Resumen de Requerimientos

### 1. Presupuestos

- ✅ Presupuesto debe pasar a "aceptado" cuando se finaliza pago en POS
- ✅ Presupuesto solo puede usarse una vez
- ✅ Presupuesto usado no debe estar disponible nuevamente

### 2. Caja

- ✅ Sistema de boletas e impresión (estructura base creada)
- ✅ Preparado para integración con SII (Servicio de Impuestos Internos)
- ✅ Soporte para boletas y facturas
- ✅ Personalizables (contenido y logo)
- ✅ POS debe aceptar ventas sin clientes registrados
- ✅ Campos opcionales de nombre y RUT para ventas sin cliente
- ✅ Mover "Configuración POS" del sidebar a sección "Sistema"

### 3. General

- ✅ Validación RUT: aceptar formato `x.xxx.xxx-x` (sin primer cero)
- ✅ Validación RUT: aceptar K o k como dígito verificador

---

## 🎯 Orden de Implementación

### Fase 1: Correcciones Rápidas (Prioridad Alta)

1. ✅ Validación RUT mejorada
2. ✅ Mover Configuración POS a Sistema
3. ✅ POS sin cliente obligatorio

### Fase 2: Presupuestos (Prioridad Alta)

4. ✅ Tracking de quote_id en POS
5. ✅ Actualizar presupuesto al procesar venta
6. ✅ Validar que presupuesto no esté usado
7. ✅ UI actualizada para mostrar presupuestos usados como no disponibles

### Fase 3: Sistema de Boletas (Prioridad Media-Alta)

8. ✅ Diseño de estructura de base de datos (`billing_documents`, `billing_document_items`, `billing_settings`)
9. ✅ Generación de PDFs (HTML template creado, PDF real pendiente)
10. ✅ Personalización (contenido y logo) - Página de configuración creada
11. ✅ Integración preparada para SII (campos y estructura listos)
12. ✅ Sistema de impresión (endpoints creados, generación real pendiente)

---

## 📝 Notas Técnicas

### RUT Validation

- Actual: `/^[0-9]{8,9}[0-9Kk]$/` (8-9 dígitos)
- Nuevo: `/^[0-9]{7,9}[0-9Kk]$/` (7-9 dígitos)
- Ya acepta K/k como verificador ✅

### Presupuestos

- Campo `quote_id` en `lab_work_orders` existe
- Campo `status` en `quotes` table
- Estados: 'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted_to_work'
- Nuevo estado necesario: 'accepted' cuando se usa en POS

### Boletas

- ✅ Tabla `billing_documents` creada con campos SII
- ✅ Tabla `billing_document_items` para items de línea
- ✅ Tabla `billing_settings` para personalización
- ✅ Función `generate_billing_folio()` para folios secuenciales
- ✅ Generador de HTML para boletas (template listo)
- ⏳ PDF generation: HTML template listo, falta implementar conversión a PDF real (pdfkit/react-pdf)
- ⏳ Logo: estructura lista, falta implementar upload a Supabase Storage
- ✅ Endpoints API creados: `/api/admin/billing/documents`, `/api/admin/billing/settings`
- ✅ Página de configuración: `/admin/system/billing-settings`
- ✅ Integración con `InternalBilling` adapter actualizada

---

## 🔄 Estado Actual

### ✅ Completado

1. Validación RUT mejorada (formato x.xxx.xxx-x y K/k)
2. Configuración POS movida a Sistema
3. POS acepta ventas sin clientes registrados
4. Presupuestos: tracking, actualización automática, validación de uso único
5. Sistema de boletas: estructura de BD, generación HTML, personalización, endpoints API

### ⏳ Pendiente (Mejoras Futuras)

1. Generación real de PDFs (conversión de HTML a PDF usando pdfkit o similar)
2. Upload de logos a Supabase Storage
3. Integración real con API SII (cuando esté disponible)
4. Sistema de impresión directa desde navegador
5. Preview de boletas antes de emitir

### 📁 Archivos Creados/Modificados

**Migraciones:**

- `supabase/migrations/20250128000000_create_billing_documents.sql`

**Backend:**

- `src/lib/billing/pdf-generator.ts` (nuevo)
- `src/lib/billing/adapters/InternalBilling.ts` (actualizado)
- `src/app/api/admin/billing/documents/route.ts` (nuevo)
- `src/app/api/admin/billing/documents/[folio]/pdf/route.ts` (nuevo)
- `src/app/api/admin/billing/settings/route.ts` (nuevo)
- `src/app/api/admin/pos/process-sale/route.ts` (actualizado)
- `src/app/api/admin/quotes/[id]/load-to-pos/route.ts` (actualizado)

**Frontend:**

- `src/app/admin/system/billing-settings/page.tsx` (nuevo)
- `src/app/admin/quotes/page.tsx` (actualizado)
- `src/app/admin/pos/page.tsx` (actualizado)
- `src/app/admin/layout.tsx` (actualizado)

**Validación:**

- `src/lib/api/validation/zod-schemas.ts` (actualizado)
- `src/lib/utils/rut.ts` (actualizado)
