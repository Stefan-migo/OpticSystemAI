# Próximos Pasos: Ajustes de Autenticación en Tests de Integración

## 🎯 Tarea Actual

**Objetivo:** Hacer que los tests de integración pasen correctamente resolviendo el problema de autenticación.

## 📍 Estado Actual

- ✅ **Infraestructura lista:** Migraciones multi-tenancy aplicadas
- ✅ **Tests creados:** 34 tests de integración (Customers: 12, Products: 14, Orders: 8)
- ✅ **Detección funcionando:** Tests detectan correctamente la infraestructura
- ✅ **Autenticación funcionando:** Implementada solución híbrida (Bearer tokens + cookies)
- ✅ **Tests pasando:** 12/12 tests de Customers API pasando correctamente

## 🔍 Problema

Los tests intentan autenticarse con **tokens Bearer**, pero las API routes de Next.js esperan **cookies de sesión**.

### Archivos a Modificar

1. **`src/__tests__/integration/helpers/test-setup.ts`**
   - Función `makeAuthenticatedRequest()` (línea ~334)
   - Función `createTestUser()` (línea ~120) - agregar retorno de `sessionData`

2. **Tests que usan `makeAuthenticatedRequest()`:**
   - `src/__tests__/integration/api/customers.test.ts`
   - `src/__tests__/integration/api/products.test.ts`
   - `src/__tests__/integration/api/orders.test.ts`

## 📋 Pasos a Seguir

### Paso 1: Leer Documentación Completa

Leer `docs/TESTING_INTEGRATION_AUTH_FIX.md` que contiene:

- Análisis detallado del problema
- Dos opciones de solución (A y B)
- Pasos detallados de implementación
- Código de ejemplo
- Referencias técnicas

### Paso 2: Elegir Solución

**Recomendación: Opción A** (modificar tests para usar cookies)

- No requiere cambios en código de producción
- Simula mejor el comportamiento real

### Paso 3: Implementar

Seguir los pasos detallados en `docs/TESTING_INTEGRATION_AUTH_FIX.md`

### Paso 4: Verificar

```bash
# Ejecutar tests
npm run test:run -- src/__tests__/integration/api/customers.test.ts

# Verificar que pasen todos los tests
npm run test:run
```

## ✅ Criterios de Éxito

- [x] Todos los 12 tests de Customers API pasan ✅
- [x] No hay errores 401 Unauthorized ✅
- [x] Multi-tenancy se valida correctamente ✅
- [x] Tests son determinísticos ✅
- [x] Validar tests de Products API (14 tests) ✅ **COMPLETADO**
- [x] Validar tests de Orders API (8 tests) ✅ **COMPLETADO**

## 📚 Documentación Relacionada

- **Guía completa:** `docs/TESTING_INTEGRATION_AUTH_FIX.md`
- **Progreso general:** `docs/PROGRESO_MEJORAS.md` (Fase 6.2)
- **Arquitectura:** `docs/ARCHITECTURE_GUIDE.md`

## 🔗 Archivos Clave

- Helper de tests: `src/__tests__/integration/helpers/test-setup.ts`
- Cliente Supabase: `src/utils/supabase/server.ts`
- Ejemplo API route: `src/app/api/admin/customers/route.ts`

---

**Última Actualización:** 2026-01-29  
**Estado:** ✅ EN PROGRESO  
**Resultado:**

- ✅ 12/12 tests de Customers API pasando
- ✅ 14/14 tests de Products API pasando
- ✅ 8/8 tests de Orders API pasando

**Próximo Paso:** Iniciar Phase SaaS 1 (Billing)

**Nota Importante:** El test "should search products" fue corregido aislando los datos de prueba. Cada test ahora crea sus propios datos en lugar de depender de estado compartido, garantizando independencia y determinismo.
