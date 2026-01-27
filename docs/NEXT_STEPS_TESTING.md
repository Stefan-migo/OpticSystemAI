# Próximos Pasos: Ajustes de Autenticación en Tests de Integración

## 🎯 Tarea Actual

**Objetivo:** Hacer que los tests de integración pasen correctamente resolviendo el problema de autenticación.

## 📍 Estado Actual

- ✅ **Infraestructura lista:** Migraciones multi-tenancy aplicadas
- ✅ **Tests creados:** 34 tests de integración (Customers: 12, Products: 14, Orders: 8)
- ✅ **Detección funcionando:** Tests detectan correctamente la infraestructura
- ❌ **Autenticación falla:** Todos los tests reciben `401 Unauthorized`

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

- [ ] Todos los 34 tests de integración pasan
- [ ] No hay errores 401 Unauthorized
- [ ] Multi-tenancy se valida correctamente
- [ ] Tests son determinísticos

## 📚 Documentación Relacionada

- **Guía completa:** `docs/TESTING_INTEGRATION_AUTH_FIX.md`
- **Progreso general:** `docs/PROGRESO_MEJORAS.md` (Fase 6.2)
- **Arquitectura:** `docs/ARCHITECTURE_GUIDE.md`

## 🔗 Archivos Clave

- Helper de tests: `src/__tests__/integration/helpers/test-setup.ts`
- Cliente Supabase: `src/utils/supabase/server.ts`
- Ejemplo API route: `src/app/api/admin/customers/route.ts`

---

**Última Actualización:** 2026-01-27  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo Estimado:** 2-4 horas
