# Plan de Organización del Proyecto

**Fecha:** 2026-01-28  
**Objetivo:** Ordenar y estructurar el proyecto antes de continuar con mejoras  
**Prioridad:** 🔴 ALTA

---

## 📋 Resumen Ejecutivo

Este documento define un plan sistemático para organizar el proyecto, asegurando que todo esté en orden antes de continuar con las mejoras estructurales y la implementación de Phase SaaS 1.

---

## 🎯 Objetivos de Organización

1. **Validar Estado Actual:** Verificar que todo funciona correctamente
2. **Limpiar Código:** Eliminar archivos temporales, comentarios obsoletos
3. **Organizar Documentación:** Estructurar y actualizar documentación
4. **Verificar Tests:** Asegurar que todos los tests pasen
5. **Preparar Ambiente:** Configurar entorno para Phase SaaS 1

---

## 📝 Tareas de Organización

### Fase 1: Validación del Estado Actual (2-3 horas)

#### 1.1 Verificar Tests

- [ ] Ejecutar todos los tests unitarios
  ```bash
  npm run test:run -- src/__tests__/unit
  ```
- [ ] Ejecutar tests de integración de Customers
  ```bash
  npm run test:run -- src/__tests__/integration/api/customers.test.ts
  ```
- [ ] Ejecutar tests de integración de Products
  ```bash
  npm run test:run -- src/__tests__/integration/api/products.test.ts
  ```
- [ ] Ejecutar tests de integración de Orders
  ```bash
  npm run test:run -- src/__tests__/integration/api/orders.test.ts
  ```
- [ ] Documentar resultados en `docs/ESTADO_ACTUAL_PROYECTO.md`

#### 1.2 Verificar Compilación

- [ ] TypeScript sin errores
  ```bash
  npm run type-check
  ```
- [ ] Linting sin errores críticos
  ```bash
  npm run lint
  ```
- [ ] Build de producción exitoso
  ```bash
  npm run build
  ```

#### 1.3 Verificar Base de Datos

- [ ] Supabase local corriendo
  ```bash
  npm run supabase:status
  ```
- [ ] Migraciones aplicadas
  ```bash
  npm run supabase:push
  ```
- [ ] Verificar tablas multi-tenancy existen
  - `organizations`
  - `subscriptions`
  - `subscription_tiers`

---

### Fase 2: Limpieza de Código (1-2 horas)

#### 2.1 Archivos Temporales

- [ ] Buscar y eliminar archivos `.tmp`, `.bak`, `.old`
  ```bash
  find . -name "*.tmp" -o -name "*.bak" -o -name "*.old"
  ```
- [ ] Eliminar archivos de log innecesarios
- [ ] Limpiar archivos de cache si es necesario

#### 2.2 Comentarios y Código Muerto

- [ ] Buscar `TODO` y `FIXME` sin resolver
  ```bash
  grep -r "TODO\|FIXME" src/ --exclude-dir=node_modules
  ```
- [ ] Documentar o resolver TODOs críticos
- [ ] Eliminar código comentado obsoleto
- [ ] Limpiar console.log restantes en frontend (si hay)

#### 2.3 Imports No Utilizados

- [ ] Verificar imports no utilizados
  ```bash
  npm run lint -- --fix
  ```
- [ ] Eliminar imports duplicados
- [ ] Organizar imports (agrupar por tipo)

---

### Fase 3: Organización de Documentación (1-2 horas)

#### 3.1 Estructura de Documentación

- [x] Crear `docs/ESTADO_ACTUAL_PROYECTO.md` ✅
- [x] Crear `docs/PLAN_ORGANIZACION_PROYECTO.md` ✅
- [ ] Verificar que todos los documentos estén actualizados
- [ ] Crear índice de documentación si no existe
- [ ] Organizar documentos por categoría

#### 3.2 Actualizar Documentación

- [ ] Actualizar `docs/PROGRESO_MEJORAS.md` con estado actual
- [ ] Verificar que `docs/PLAN_MEJORAS_ESTRUCTURALES.md` esté actualizado
- [ ] Revisar `docs/ARCHITECTURE_GUIDE.md` para cambios recientes
- [ ] Actualizar `README.md` si es necesario

#### 3.3 Documentación de Tests

- [ ] Documentar estructura de tests
- [ ] Crear guía de cómo ejecutar tests
- [ ] Documentar helpers de tests

---

### Fase 4: Verificación de Configuración (1 hora)

#### 4.1 Variables de Entorno

- [ ] Verificar `.env.local` existe y está configurado
- [ ] Verificar `.env.example` está actualizado
- [ ] Documentar variables de entorno necesarias
- [ ] Verificar que no hay secrets en código

#### 4.2 Configuración de Herramientas

- [ ] Verificar `package.json` está actualizado
- [ ] Verificar `tsconfig.json` está correcto
- [ ] Verificar `next.config.js` está configurado
- [ ] Verificar `vitest.config.ts` está correcto

#### 4.3 Git y Branches

- [ ] Verificar que estamos en `main`
  ```bash
  git branch
  ```
- [ ] Verificar que `main` está actualizado
  ```bash
  git pull origin main
  ```
- [ ] Limpiar branches locales obsoletos (opcional)
  ```bash
  git branch -d phase-X-nombre-fase
  ```

---

### Fase 5: Preparación para Phase SaaS 1 (1-2 horas)

#### 5.1 Revisar Dependencias

- [ ] Verificar si necesitamos instalar Stripe SDK
  ```bash
  npm list stripe
  ```
- [ ] Verificar versiones de dependencias
- [ ] Actualizar dependencias si es necesario
  ```bash
  npm outdated
  ```

#### 5.2 Preparar Estructura

- [ ] Crear estructura de carpetas para billing
  ```
  src/lib/saas/billing/
  src/app/api/admin/billing/
  src/components/admin/Billing/
  ```
- [ ] Crear archivos base si es necesario
- [ ] Documentar estructura planificada

#### 5.3 Revisar Plan de Implementación

- [ ] Leer `docs/SAAS_IMPLEMENTATION_PLAN.md`
- [ ] Revisar tareas de Phase SaaS 1 en `docs/PLAN_MEJORAS_ESTRUCTURALES.md`
- [ ] Preparar checklist de implementación

---

## ✅ Checklist Final de Verificación

Antes de considerar el proyecto "ordenado" y listo para continuar:

### Código

- [ ] Todos los tests pasan (unitarios + integración)
- [ ] TypeScript compila sin errores
- [ ] Linting pasa sin errores críticos
- [ ] Build de producción exitoso
- [ ] No hay código muerto o comentado obsoleto
- [ ] Imports organizados y sin duplicados

### Base de Datos

- [ ] Supabase local corriendo
- [ ] Todas las migraciones aplicadas
- [ ] Tablas multi-tenancy verificadas
- [ ] Datos de prueba disponibles (si es necesario)

### Documentación

- [ ] `docs/ESTADO_ACTUAL_PROYECTO.md` actualizado
- [ ] `docs/PROGRESO_MEJORAS.md` actualizado
- [ ] Documentación de tests completa
- [ ] README.md actualizado

### Configuración

- [ ] Variables de entorno configuradas
- [ ] `.env.example` actualizado
- [ ] Herramientas configuradas correctamente
- [ ] Git en estado limpio

### Preparación

- [ ] Dependencias revisadas
- [ ] Estructura para Phase SaaS 1 preparada
- [ ] Plan de implementación revisado
- [ ] Checklist de implementación listo

---

## 🚀 Siguiente Paso Después de Organización

Una vez completada la organización:

1. **Validar Tests Restantes** (2-4 horas)
   - Ejecutar tests de Products y Orders
   - Corregir cualquier fallo
   - Documentar resultados

2. **Iniciar Phase SaaS 1** (2 semanas)
   - Crear branch `phase-saas-1-billing`
   - Seguir plan en `docs/PLAN_MEJORAS_ESTRUCTURALES.md`
   - Implementar integración Stripe

---

## 📊 Tiempo Estimado Total

| Fase                  | Tiempo Estimado | Prioridad |
| --------------------- | --------------- | --------- |
| Fase 1: Validación    | 2-3 horas       | 🔴 ALTA   |
| Fase 2: Limpieza      | 1-2 horas       | 🟡 MEDIA  |
| Fase 3: Documentación | 1-2 horas       | 🟡 MEDIA  |
| Fase 4: Configuración | 1 hora          | 🟡 MEDIA  |
| Fase 5: Preparación   | 1-2 horas       | 🟡 MEDIA  |
| **TOTAL**             | **6-10 horas**  |           |

---

## 🎯 Resultado Esperado

Al finalizar este plan de organización:

✅ **Proyecto completamente funcional y validado**  
✅ **Código limpio y organizado**  
✅ **Documentación actualizada y estructurada**  
✅ **Tests pasando correctamente**  
✅ **Configuración verificada**  
✅ **Listo para iniciar Phase SaaS 1**

---

**Última Actualización:** 2026-01-28  
**Estado:** 🟡 En Progreso  
**Próxima Revisión:** Después de completar todas las fases
