# Plan de Mejoras Estructurales - OpticSystemAI
## Proceso Sistemático, Minucioso y Quirúrgico

**Fecha de Creación:** 2025-01-27  
**Versión del Plan:** 1.1  
**Última Actualización:** 2025-01-27  
**Objetivo:** Mejorar la calidad del código de forma incremental sin romper funcionalidad existente

**Estrategia de Branching:** Branches por fase para mantener `main` estable y permitir revisión antes de mergear

---

## 📋 Tabla de Contenidos

1. [Filosofía del Plan](#filosofía-del-plan)
2. [Metodología de Trabajo](#metodología-de-trabajo)
3. [Fase 0: Preparación y Configuración](#fase-0-preparación-y-configuración)
4. [Fase 1: Estabilización Crítica](#fase-1-estabilización-crítica)
5. [Fase 2: Refactorización de Componentes](#fase-2-refactorización-de-componentes)
6. [Fase 3: Mejoras de Seguridad](#fase-3-mejoras-de-seguridad)
7. [Fase 4: Optimización de Performance](#fase-4-optimización-de-performance)
8. [Fase 5: Mejoras de Mantenibilidad](#fase-5-mejoras-de-mantenibilidad)
9. [Fase 6: Testing y Calidad](#fase-6-testing-y-calidad)
10. [Checklist de Verificación](#checklist-de-verificación)
11. [Procedimientos de Rollback](#procedimientos-de-rollback)

---

## 🚀 Guía Rápida de Branching

### Comandos Esenciales

#### Iniciar una Fase
```bash
git checkout main
git pull origin main
git checkout -b phase-X-nombre-fase
```

#### Trabajar en la Fase
```bash
# Hacer cambios y commits
git add .
git commit -m "tipo: descripción"
git push origin phase-X-nombre-fase  # Opcional pero recomendado
```

#### Finalizar una Fase
```bash
# Verificar todo funciona
npm run type-check && npm run lint && npm run build

# Mergear a main
git checkout main
git merge phase-X-nombre-fase
git push origin main

# Limpiar (opcional)
git branch -d phase-X-nombre-fase
git push origin --delete phase-X-nombre-fase
```

### Nombres de Branches por Fase

- `phase-0-preparation` - Preparación y configuración
- `phase-1-stabilization` - Estabilización crítica
- `phase-2-refactoring` - Refactorización de componentes
- `phase-3-security` - Mejoras de seguridad
- `phase-4-performance` - Optimización de performance
- `phase-5-maintainability` - Mejoras de mantenibilidad
- `phase-6-testing` - Testing y calidad

---

## Filosofía del Plan

### Principios Fundamentales

1. **Incrementalismo**: Cambios pequeños y frecuentes
2. **Reversibilidad**: Cada cambio debe poder revertirse fácilmente
3. **Verificación**: Validar después de cada cambio
4. **Documentación**: Documentar cada decisión importante
5. **Sin Romper**: Mantener funcionalidad existente en todo momento

### Reglas de Oro

- ✅ **Nunca** hacer múltiples cambios grandes simultáneamente
- ✅ **Siempre** hacer commit después de cada tarea completada
- ✅ **Siempre** verificar que la aplicación funciona después de cada cambio
- ✅ **Siempre** documentar cambios significativos
- ✅ **Nunca** saltar pasos de verificación

---

## Metodología de Trabajo

### Estrategia de Branching

**Recomendación: Branches por Fase**

Para mantener `main` estable y permitir revisión antes de mergear, trabajaremos en branches separados por fase:

```
main (siempre estable)
├── phase-0-preparation
├── phase-1-stabilization
├── phase-2-refactoring
├── phase-3-security
├── phase-4-performance
├── phase-5-maintainability
└── phase-6-testing
```

**Reglas de Branching:**
- ✅ Cada fase tiene su propio branch
- ✅ Commits frecuentes dentro de cada branch
- ✅ Merge a `main` solo después de verificar toda la fase
- ✅ `main` siempre debe estar en estado funcional
- ✅ Si una fase falla, se puede revertir fácilmente

### Flujo de Trabajo por Fase

#### Inicio de Fase

```bash
# 1. Asegurarse de estar en main y actualizado
git checkout main
git pull origin main

# 2. Crear branch para la fase
git checkout -b phase-X-nombre-fase

# 3. Verificar que el branch se creó correctamente
git branch
```

#### Durante la Fase

```bash
# Para cada tarea completada:
# 1. Verificar cambios
git status
git diff

# 2. Agregar cambios
git add .

# 3. Commit descriptivo
git commit -m "feat/fix/refactor: Descripción clara de la tarea"

# 4. Push al branch (opcional, pero recomendado)
git push origin phase-X-nombre-fase
```

#### Finalización de Fase

```bash
# 1. Verificar que todo funciona
npm run type-check
npm run lint
npm run build
npm run dev  # Verificar manualmente

# 2. Si hay tests, ejecutarlos
npm test

# 3. Merge a main
git checkout main
git merge phase-X-nombre-fase

# 4. Verificar que main sigue funcionando
npm run build
npm run dev

# 5. Push a main
git push origin main

# 6. (Opcional) Eliminar branch local
git branch -d phase-X-nombre-fase

# 7. (Opcional) Eliminar branch remoto
git push origin --delete phase-X-nombre-fase
```

### Flujo de Trabajo por Tarea (dentro de una fase)

```
1. Leer y entender el código actual
2. Implementar cambio
3. Ejecutar verificaciones (type-check, lint, build)
4. Commit con mensaje descriptivo
5. Continuar con siguiente tarea
6. Al finalizar la fase: merge a main
7. Verificar en desarrollo
8. Marcar fase como completada
```

### Criterios de Aceptación

Cada tarea debe cumplir:
- ✅ Código compila sin errores
- ✅ No hay errores de TypeScript
- ✅ No hay warnings críticos en consola
- ✅ Funcionalidad existente sigue funcionando
- ✅ Tests pasan (cuando estén implementados)
- ✅ Código revisado y aprobado

### Herramientas de Verificación

- `npm run type-check` - Verificación de tipos
- `npm run lint` - Linting
- `npm run build` - Build de producción
- `npm run dev` - Verificar en desarrollo
- Tests unitarios/integración (cuando estén configurados)

---

## Fase 0: Preparación y Configuración

**Duración Estimada:** 3-5 días  
**Objetivo:** Preparar el entorno para las mejoras  
**Branch:** `phase-0-preparation`

### Inicio de Fase 0

```bash
# Crear branch para esta fase
git checkout main
git pull origin main
git checkout -b phase-0-preparation
```

### Finalización de Fase 0

```bash
# Verificar todo funciona
npm run type-check
npm run lint
npm run build

# Merge a main
git checkout main
git merge phase-0-preparation
git push origin main

# Actualizar PROGRESO_MEJORAS.md
```

### Tarea 0.1: Configurar Testing Básico

**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 1-2 días

#### Pasos:

1. **Instalar dependencias de testing**
   ```bash
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. **Configurar Vitest**
   - Crear `vitest.config.ts`
   - Configurar entorno de testing
   - Configurar coverage

3. **Crear estructura de tests**
   ```
   src/
     __tests__/
       unit/
       integration/
       e2e/
       setup.ts
   ```

4. **Crear primeros tests de ejemplo**
   - Test para utilidades simples (rut.ts)
   - Test para funciones de cálculo

5. **Configurar scripts en package.json**
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

**Criterios de Aceptación:**
- ✅ Vitest configurado y funcionando
- ✅ Al menos 3 tests de ejemplo pasando
- ✅ Coverage básico configurado
- ✅ Scripts funcionando

**Commit:** `feat: Configurar Vitest y estructura de testing básica`

---

### Tarea 0.2: Configurar Sistema de Logging

**Prioridad:** 🟡 ALTA  
**Tiempo:** 1 día

#### Pasos:

1. **Instalar librería de logging**
   ```bash
   npm install pino pino-pretty
   ```

2. **Crear módulo de logging**
   - `src/lib/logger/index.ts`
   - Configurar niveles de log
   - Configurar formato para desarrollo/producción

3. **Crear wrapper para reemplazar console.log**
   ```typescript
   // src/lib/logger/index.ts
   export const logger = {
     debug: (message: string, data?: any) => { ... },
     info: (message: string, data?: any) => { ... },
     warn: (message: string, data?: any) => { ... },
     error: (message: string, error?: Error, data?: any) => { ... }
   }
   ```

4. **Documentar uso del logger**

**Criterios de Aceptación:**
- ✅ Logger configurado
- ✅ Funciona en desarrollo y producción
- ✅ Documentación creada
- ✅ Ejemplo de uso implementado

**Commit:** `feat: Implementar sistema de logging estructurado con pino`

---

### Tarea 0.3: Configurar Pre-commit Hooks

**Prioridad:** 🟡 MEDIA  
**Tiempo:** 0.5 días

#### Pasos:

1. **Instalar husky y lint-staged**
   ```bash
   npm install -D husky lint-staged
   ```

2. **Configurar husky**
   ```bash
   npx husky init
   ```

3. **Configurar lint-staged**
   - Verificar TypeScript
   - Ejecutar ESLint
   - Formatear con Prettier

4. **Crear pre-commit hook**
   - Verificar tipos
   - Ejecutar lint
   - Ejecutar tests básicos

**Criterios de Aceptación:**
- ✅ Pre-commit hooks funcionando
- ✅ Verificaciones automáticas antes de commit
- ✅ Documentación de uso

**Commit:** `feat: Configurar pre-commit hooks con husky y lint-staged`

---

### Tarea 0.4: Crear Error Boundary

**Prioridad:** 🟡 MEDIA  
**Tiempo:** 0.5 días

#### Pasos:

1. **Crear componente ErrorBoundary**
   - `src/components/ErrorBoundary.tsx`
   - Implementar error boundary de React
   - UI de fallback amigable

2. **Integrar en layout principal**
   - Agregar en `src/app/layout.tsx`
   - Agregar en `src/app/admin/layout.tsx`

3. **Crear página de error personalizada**
   - `src/app/error.tsx`
   - `src/app/admin/error.tsx`

**Criterios de Aceptación:**
- ✅ Error Boundary implementado
- ✅ Integrado en layouts principales
- ✅ Páginas de error personalizadas
- ✅ Tests básicos del ErrorBoundary

**Commit:** `feat: Implementar Error Boundaries para manejo de errores`

---

## Fase 1: Estabilización Crítica

**Duración Estimada:** 2-3 semanas  
**Objetivo:** Resolver problemas críticos que afectan estabilidad  
**Branch:** `phase-1-stabilization`

### Inicio de Fase 1

```bash
# Crear branch para esta fase
git checkout main
git pull origin main
git checkout -b phase-1-stabilization
```

### Finalización de Fase 1

```bash
# Verificar todo funciona
npm run type-check
npm run lint
npm run build
npm run dev  # Verificar manualmente

# Merge a main
git checkout main
git merge phase-1-stabilization
git push origin main

# Actualizar PROGRESO_MEJORAS.md
```

### Tarea 1.1: Eliminar Console.log de Producción

**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 3-5 días  
**Riesgo:** Bajo (solo remover logs)

#### Estrategia:

Dividir por módulos y hacer commit después de cada módulo:

1. **Módulo 1: API Routes** (1 día)
   - Reemplazar console.log por logger en todas las rutas API
   - Verificar que cada ruta funciona
   - Commit: `refactor: Reemplazar console.log por logger en API routes`

2. **Módulo 2: Componentes Admin** (1 día)
   - Reemplazar en componentes de administración
   - Verificar funcionalidad
   - Commit: `refactor: Reemplazar console.log por logger en componentes admin`

3. **Módulo 3: Hooks y Contextos** (1 día)
   - Reemplazar en hooks personalizados
   - Reemplazar en contextos
   - Commit: `refactor: Reemplazar console.log por logger en hooks y contextos`

4. **Módulo 4: Utilidades y Lib** (1 día)
   - Reemplazar en funciones de utilidad
   - Reemplazar en librerías
   - Commit: `refactor: Reemplazar console.log por logger en utilidades`

5. **Verificación Final** (0.5 días)
   - Buscar console.log restantes: `grep -r "console\." src/`
   - Verificar que no quedan logs de debug
   - Commit: `chore: Verificación final - eliminar console.log restantes`

**Criterios de Aceptación:**
- ✅ 0 instancias de console.log en código de producción
- ✅ Todos los logs usan el sistema de logging estructurado
- ✅ Funcionalidad no afectada
- ✅ Build de producción sin warnings de console

**Verificación:**
```bash
# Buscar console.log restantes
grep -r "console\." src/ --exclude-dir=node_modules | grep -v "logger\." | wc -l
# Debe retornar 0 o muy pocos (solo en tests o código de debug condicional)
```

---

### Tarea 1.2: Reducir Uso de `any` - Fase 1 (Tipos RPC)

**Prioridad:** 🟡 ALTA  
**Tiempo:** 1 semana  
**Riesgo:** Medio (cambios de tipos pueden afectar código)

#### Estrategia:

Crear tipos para funciones RPC de Supabase primero:

1. **Crear archivo de tipos RPC** (1 día)
   - `src/types/supabase-rpc.ts`
   - Definir tipos para todas las funciones RPC usadas
   - Documentar cada función

2. **Reemplazar `any` en middleware** (1 día)
   - `src/lib/api/middleware.ts`
   - Usar tipos específicos para RPC calls
   - Commit: `refactor: Tipar funciones RPC en middleware`

3. **Reemplazar `any` en API routes** (2 días)
   - Reemplazar por módulos (customers, products, etc.)
   - Verificar cada ruta después del cambio
   - Commits separados por módulo

4. **Reemplazar `any` en hooks** (1 día)
   - Hooks que usan RPC calls
   - Commit: `refactor: Tipar RPC calls en hooks`

5. **Verificación** (0.5 días)
   - Verificar que no hay errores de tipo
   - Verificar funcionalidad

**Criterios de Aceptación:**
- ✅ Todas las funciones RPC tienen tipos definidos
- ✅ No se usa `any` para RPC calls
- ✅ TypeScript compila sin errores
- ✅ Funcionalidad no afectada

**Tipos a crear:**
```typescript
// src/types/supabase-rpc.ts
export interface IsAdminResult {
  data: boolean | null;
  error: PostgrestError | null;
}

export interface GetUserBranchesResult {
  data: Array<{
    branch_id: string;
    branch_name: string;
    branch_code: string;
    role: string;
    is_primary: boolean;
  }> | null;
  error: PostgrestError | null;
}
```

---

### Tarea 1.3: Aplicar Rate Limiting en Rutas Críticas

**Prioridad:** 🟡 ALTA  
**Tiempo:** 3-5 días  
**Riesgo:** Bajo (solo agregar middleware)

#### Estrategia:

Aplicar rate limiting por categorías de rutas:

1. **Rutas de Autenticación** (1 día)
   - `/api/admin/login` (si existe)
   - `/api/admin/signup` (si existe)
   - Rate limit: 5 requests / 15 minutos
   - Commit: `feat: Aplicar rate limiting en rutas de autenticación`

2. **Rutas de Búsqueda** (1 día)
   - `/api/admin/customers/search`
   - `/api/admin/products/search`
   - Rate limit: 30 requests / minuto
   - Commit: `feat: Aplicar rate limiting en rutas de búsqueda`

3. **Rutas de POS y Pagos** (1 día)
   - `/api/admin/pos/process-sale`
   - Rate limit: 20 requests / 5 minutos
   - Commit: `feat: Aplicar rate limiting en rutas de POS`

4. **Rutas de Creación/Modificación** (1 día)
   - Rutas POST/PUT/DELETE críticas
   - Rate limit: 50 requests / minuto
   - Commit: `feat: Aplicar rate limiting en rutas de modificación`

5. **Verificación** (0.5 días)
   - Probar rate limiting funciona
   - Verificar que no bloquea uso normal

**Criterios de Aceptación:**
- ✅ Rate limiting aplicado en todas las rutas críticas
- ✅ Headers de rate limit incluidos en respuestas
- ✅ No afecta uso normal de la aplicación
- ✅ Errores de rate limit manejados apropiadamente

**Ejemplo de implementación:**
```typescript
// src/app/api/admin/customers/search/route.ts
import { withRateLimit, rateLimitConfigs } from '@/lib/api/middleware'

export async function GET(request: NextRequest) {
  return withRateLimit(rateLimitConfigs.general, async () => {
    // ... lógica existente
  })(request)
}
```

---

## Fase 2: Refactorización de Componentes

**Duración Estimada:** 3-4 semanas  
**Objetivo:** Dividir componentes monolíticos en componentes más pequeños y manejables  
**Branch:** `phase-2-refactoring`

⚠️ **Nota Importante:** Esta fase tiene alto riesgo. Trabajar en branch separado es **obligatorio**.

### Inicio de Fase 2

```bash
# Crear branch para esta fase
git checkout main
git pull origin main
git checkout -b phase-2-refactoring
```

### Finalización de Fase 2

```bash
# Verificación exhaustiva (esta fase es crítica)
npm run type-check
npm run lint
npm run build
npm test  # Si hay tests
npm run dev  # Verificar manualmente todas las funcionalidades

# Merge a main (solo si todo está OK)
git checkout main
git merge phase-2-refactoring
git push origin main

# Actualizar PROGRESO_MEJORAS.md
```

### Tarea 2.1: Refactorizar CreateWorkOrderForm

**Prioridad:** 🔴 ALTA  
**Tiempo:** 1 semana  
**Riesgo:** Alto (componente crítico y complejo)

#### Estrategia:

Dividir en componentes más pequeños manteniendo funcionalidad:

1. **Análisis y Planificación** (0.5 días)
   - Analizar estructura actual del componente
   - Identificar secciones lógicas
   - Crear plan de división
   - Documentar dependencias

2. **Crear estructura de carpetas** (0.5 días)
   ```
   src/components/admin/CreateWorkOrderForm/
     ├── index.tsx              # Orchestrator principal
     ├── CustomerSelector.tsx   # Selección de cliente
     ├── PrescriptionSelector.tsx # Selección de receta
     ├── FrameSelector.tsx      # Selección de marco
     ├── LensConfiguration.tsx  # Configuración de lentes
     ├── PricingSection.tsx    # Cálculo de precios
     ├── LabInfoSection.tsx     # Información de laboratorio
     └── hooks/
         ├── useWorkOrderForm.ts
         ├── useWorkOrderCalculations.ts
         └── useWorkOrderValidation.ts
   ```

3. **Extraer CustomerSelector** (1 día)
   - Crear componente CustomerSelector
   - Mover lógica relacionada
   - Verificar funcionalidad
   - Commit: `refactor: Extraer CustomerSelector de CreateWorkOrderForm`

4. **Extraer PrescriptionSelector** (1 día)
   - Crear componente PrescriptionSelector
   - Mover lógica relacionada
   - Verificar funcionalidad
   - Commit: `refactor: Extraer PrescriptionSelector de CreateWorkOrderForm`

5. **Extraer FrameSelector** (1 día)
   - Crear componente FrameSelector
   - Mover lógica relacionada
   - Verificar funcionalidad
   - Commit: `refactor: Extraer FrameSelector de CreateWorkOrderForm`

6. **Extraer LensConfiguration** (1 día)
   - Crear componente LensConfiguration
   - Mover lógica relacionada
   - Verificar funcionalidad
   - Commit: `refactor: Extraer LensConfiguration de CreateWorkOrderForm`

7. **Extraer PricingSection** (1 día)
   - Crear componente PricingSection
   - Mover lógica de cálculos
   - Verificar funcionalidad
   - Commit: `refactor: Extraer PricingSection de CreateWorkOrderForm`

8. **Crear hooks personalizados** (1 día)
   - `useWorkOrderForm` - Lógica del formulario
   - `useWorkOrderCalculations` - Cálculos
   - `useWorkOrderValidation` - Validación
   - Commit: `refactor: Crear hooks personalizados para CreateWorkOrderForm`

9. **Refactorizar orchestrator** (1 día)
   - Simplificar index.tsx usando componentes extraídos
   - Verificar que todo funciona
   - Tests básicos
   - Commit: `refactor: Simplificar orchestrator de CreateWorkOrderForm`

10. **Verificación Final** (0.5 días)
    - Probar flujo completo de creación de work order
    - Verificar que no hay regresiones
    - Verificar performance

**Criterios de Aceptación:**
- ✅ Componente dividido en al menos 5 sub-componentes
- ✅ Hooks personalizados creados
- ✅ Funcionalidad completa preservada
- ✅ Código más legible y mantenible
- ✅ Tests básicos pasando

**Verificación:**
- Probar crear work order completo
- Verificar cálculos de precios
- Verificar validaciones
- Verificar guardado en BD

---

### Tarea 2.2: Refactorizar Products Page

**Prioridad:** 🔴 ALTA  
**Tiempo:** 1.5 semanas  
**Riesgo:** Alto (página muy grande y compleja)

#### Estrategia:

Dividir en componentes y usar React Query:

1. **Análisis y Planificación** (0.5 días)
   - Analizar estructura actual
   - Identificar secciones
   - Plan de división

2. **Instalar React Query** (0.5 días)
   ```bash
   npm install @tanstack/react-query
   ```
   - Configurar QueryClient
   - Crear provider
   - Commit: `feat: Instalar y configurar React Query`

3. **Crear hooks de datos** (1 día)
   - `useProducts` - Fetch y gestión de productos
   - `useProductSearch` - Búsqueda de productos
   - `useProductFilters` - Filtros
   - Commit: `refactor: Crear hooks de datos para products con React Query`

4. **Extraer ProductList Component** (1 día)
   - Crear componente ProductList
   - Mover lógica de renderizado de lista
   - Commit: `refactor: Extraer ProductList de products page`

5. **Extraer ProductFilters Component** (1 día)
   - Crear componente ProductFilters
   - Mover lógica de filtros
   - Commit: `refactor: Extraer ProductFilters de products page`

6. **Extraer ProductActions Component** (1 día)
   - Crear componente ProductActions
   - Mover acciones (crear, editar, eliminar)
   - Commit: `refactor: Extraer ProductActions de products page`

7. **Extraer ProductTable/Grid Views** (1 día)
   - Crear componentes de vista separados
   - Commit: `refactor: Extraer vistas de tabla y grid`

8. **Refactorizar página principal** (1 día)
   - Simplificar usando componentes extraídos
   - Usar React Query para data fetching
   - Commit: `refactor: Simplificar products page usando componentes extraídos`

9. **Verificación Final** (0.5 días)
    - Probar todas las funcionalidades
    - Verificar performance
    - Verificar que no hay regresiones

**Criterios de Aceptación:**
- ✅ Página dividida en al menos 4 componentes principales
- ✅ React Query implementado para data fetching
- ✅ Estado local reducido significativamente
- ✅ Funcionalidad completa preservada
- ✅ Performance mejorada

---

### Tarea 2.3: Refactorizar System Page

**Prioridad:** 🟡 MEDIA  
**Tiempo:** 1 semana  
**Riesgo:** Medio

#### Estrategia:

Dividir en tabs/páginas separadas:

1. **Análisis** (0.5 días)
   - Identificar secciones lógicas
   - Plan de división

2. **Crear estructura de tabs** (1 día)
   - Implementar sistema de tabs
   - Crear componentes para cada sección
   - Commit: `refactor: Implementar sistema de tabs en system page`

3. **Extraer secciones** (4 días)
   - Configuración General
   - Email Templates
   - Webhooks
   - Backups
   - etc.
   - Commits separados por sección

4. **Verificación** (0.5 días)
   - Probar todas las secciones
   - Verificar funcionalidad

**Criterios de Aceptación:**
- ✅ Página dividida en tabs/secciones
- ✅ Cada sección es un componente independiente
- ✅ Funcionalidad preservada
- ✅ Carga más rápida

---

## Fase 3: Mejoras de Seguridad

**Duración Estimada:** 1-2 semanas  
**Objetivo:** Mejorar seguridad del sistema  
**Branch:** `phase-3-security`

### Inicio de Fase 3

```bash
# Crear branch para esta fase
git checkout main
git pull origin main
git checkout -b phase-3-security
```

### Finalización de Fase 3

```bash
# Verificar todo funciona
npm run type-check
npm run lint
npm run build

# Merge a main
git checkout main
git merge phase-3-security
git push origin main

# Actualizar PROGRESO_MEJORAS.md
```

### Tarea 3.1: Validación Consistente con Zod

**Prioridad:** 🟡 ALTA  
**Tiempo:** 1 semana

#### Estrategia:

Implementar validación por módulos:

1. **Crear schemas base** (1 día)
   - Schemas comunes (email, RUT, etc.)
   - Schemas reutilizables
   - Commit: `feat: Crear schemas de validación base con Zod`

2. **Validar rutas de Customers** (1 día)
   - Crear schemas para customers
   - Aplicar validación
   - Commit: `feat: Agregar validación Zod a rutas de customers`

3. **Validar rutas de Products** (1 día)
   - Crear schemas para products
   - Aplicar validación
   - Commit: `feat: Agregar validación Zod a rutas de products`

4. **Validar rutas de POS** (1 día)
   - Crear schemas para POS
   - Aplicar validación
   - Commit: `feat: Agregar validación Zod a rutas de POS`

5. **Validar rutas restantes** (1 día)
   - Aplicar a todas las rutas restantes
   - Commit: `feat: Agregar validación Zod a rutas restantes`

6. **Verificación** (0.5 días)
   - Probar validaciones
   - Verificar mensajes de error

**Criterios de Aceptación:**
- ✅ Todas las rutas API tienen validación
- ✅ Mensajes de error claros
- ✅ Validación consistente
- ✅ No hay validación duplicada

---

### Tarea 3.2: Mejorar Headers de Seguridad

**Prioridad:** 🟡 MEDIA  
**Tiempo:** 2-3 días

#### Pasos:

1. **Mejorar CSP** (1 día)
   - Actualizar Content Security Policy
   - Probar que no rompe funcionalidad
   - Commit: `feat: Mejorar Content Security Policy`

2. **Agregar HSTS** (0.5 días)
   - Solo en producción
   - Commit: `feat: Agregar HSTS header en producción`

3. **Mejorar otros headers** (0.5 días)
   - Actualizar headers existentes
   - Commit: `feat: Mejorar headers de seguridad`

**Criterios de Aceptación:**
- ✅ CSP mejorado y funcional
- ✅ HSTS configurado
- ✅ Headers de seguridad completos
- ✅ No rompe funcionalidad

---

## Fase 4: Optimización de Performance

**Duración Estimada:** 2-3 semanas  
**Objetivo:** Mejorar rendimiento de la aplicación  
**Branch:** `phase-4-performance`

### Inicio de Fase 4

```bash
# Crear branch para esta fase
git checkout main
git pull origin main
git checkout -b phase-4-performance
```

### Finalización de Fase 4

```bash
# Verificar performance mejorado
npm run type-check
npm run lint
npm run build
# Medir bundle size y tiempos de carga

# Merge a main
git checkout main
git merge phase-4-performance
git push origin main

# Actualizar PROGRESO_MEJORAS.md
```

### Tarea 4.1: Implementar Memoización

**Prioridad:** 🟡 ALTA  
**Tiempo:** 1 semana

#### Estrategia:

Memoizar componentes pesados:

1. **Identificar componentes a memoizar** (0.5 días)
   - Componentes que re-renderizan frecuentemente
   - Componentes con props complejas

2. **Memoizar ProductCard** (1 día)
   - Aplicar React.memo
   - Optimizar comparación
   - Commit: `perf: Memoizar ProductCard component`

3. **Memoizar otros componentes** (3 días)
   - Aplicar a componentes identificados
   - Commits separados

4. **Verificación** (0.5 días)
   - Verificar que no hay regresiones
   - Medir mejora de performance

**Criterios de Aceptación:**
- ✅ Componentes pesados memoizados
- ✅ Re-renders reducidos
- ✅ Performance mejorada
- ✅ Sin regresiones

---

### Tarea 4.2: Implementar Lazy Loading

**Prioridad:** 🟡 ALTA  
**Tiempo:** 1 semana

#### Estrategia:

Lazy load componentes grandes:

1. **Identificar componentes** (0.5 días)
   - Componentes grandes
   - Componentes no críticos

2. **Lazy load CreateWorkOrderForm** (1 día)
   - Usar dynamic import
   - Agregar loading state
   - Commit: `perf: Lazy load CreateWorkOrderForm`

3. **Lazy load otros componentes** (3 días)
   - Aplicar a componentes identificados
   - Commits separados

4. **Verificación** (0.5 días)
   - Verificar carga
   - Medir mejora

**Criterios de Aceptación:**
- ✅ Componentes grandes lazy loaded
   - ✅ Bundle size reducido
   - ✅ Carga inicial más rápida
   - ✅ Sin regresiones

---

### Tarea 4.3: Optimizar Queries (N+1)

**Prioridad:** 🟡 MEDIA  
**Tiempo:** 1 semana

#### Estrategia:

Auditar y optimizar queries:

1. **Auditar queries** (1 día)
   - Identificar queries N+1
   - Documentar problemas

2. **Optimizar queries de Orders** (1 día)
   - Usar JOINs
   - Reducir número de queries
   - Commit: `perf: Optimizar queries de orders`

3. **Optimizar otras queries** (3 días)
   - Aplicar optimizaciones
   - Commits separados

4. **Verificación** (0.5 días)
   - Medir mejora
   - Verificar funcionalidad

**Criterios de Aceptación:**
- ✅ Queries N+1 eliminadas
- ✅ Performance mejorada
- ✅ Funcionalidad preservada

---

## Fase 5: Mejoras de Mantenibilidad

**Duración Estimada:** 1-2 semanas  
**Objetivo:** Mejorar mantenibilidad del código  
**Branch:** `phase-5-maintainability`

### Inicio de Fase 5

```bash
# Crear branch para esta fase
git checkout main
git pull origin main
git checkout -b phase-5-maintainability
```

### Finalización de Fase 5

```bash
# Verificar todo funciona
npm run type-check
npm run lint
npm run build

# Merge a main
git checkout main
git merge phase-5-maintainability
git push origin main

# Actualizar PROGRESO_MEJORAS.md
```

### Tarea 5.1: Reducir Código Duplicado

**Prioridad:** 🟡 MEDIA  
**Tiempo:** 1 semana

#### Estrategia:

Identificar y extraer código duplicado:

1. **Auditar código duplicado** (1 día)
   - Buscar patrones duplicados
   - Documentar

2. **Crear utilidades compartidas** (2 días)
   - Extraer funciones comunes
   - Crear helpers
   - Commits separados

3. **Refactorizar uso** (2 días)
   - Reemplazar código duplicado
   - Commits separados

4. **Verificación** (0.5 días)
   - Verificar funcionalidad
   - Verificar que no hay regresiones

**Criterios de Aceptación:**
- ✅ Código duplicado reducido significativamente
   - ✅ Utilidades compartidas creadas
   - ✅ Funcionalidad preservada

---

### Tarea 5.2: Mejorar Documentación Técnica

**Prioridad:** 🟢 BAJA  
**Tiempo:** 1 semana

#### Pasos:

1. **Agregar JSDoc a funciones críticas** (3 días)
   - Funciones complejas
   - APIs públicas
   - Commits separados

2. **Crear guía de arquitectura** (2 días)
   - Documentar decisiones
   - Documentar estructura
   - Commit: `docs: Crear guía de arquitectura`

3. **Documentar hooks personalizados** (1 día)
   - Documentar uso
   - Ejemplos
   - Commit: `docs: Documentar hooks personalizados`

**Criterios de Aceptación:**
- ✅ JSDoc en funciones críticas
- ✅ Guía de arquitectura creada
- ✅ Documentación completa

---

## Fase 6: Testing y Calidad

**Duración Estimada:** 3-4 semanas  
**Objetivo:** Implementar suite completa de tests  
**Branch:** `phase-6-testing`

### Inicio de Fase 6

```bash
# Crear branch para esta fase
git checkout main
git pull origin main
git checkout -b phase-6-testing
```

### Finalización de Fase 6

```bash
# Verificar tests pasan
npm test
npm run test:coverage  # Verificar coverage

# Verificar todo funciona
npm run type-check
npm run lint
npm run build

# Merge a main
git checkout main
git merge phase-6-testing
git push origin main

# Actualizar PROGRESO_MEJORAS.md
```

### Tarea 6.1: Tests Unitarios para Utilidades

**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 1 semana

#### Estrategia:

Crear tests para funciones de utilidad:

1. **Tests para rut.ts** (1 día)
   - Test de formateo
   - Test de validación
   - Test de búsqueda
   - Commit: `test: Agregar tests unitarios para rut.ts`

2. **Tests para tax.ts** (1 día)
   - Test de cálculos
   - Test de configuraciones
   - Commit: `test: Agregar tests unitarios para tax.ts`

3. **Tests para otras utilidades** (3 días)
   - Aplicar a utilidades críticas
   - Commits separados

**Criterios de Aceptación:**
- ✅ Coverage > 80% en utilidades críticas
- ✅ Todos los tests pasando
- ✅ Tests bien documentados

---

### Tarea 6.2: Tests de Integración para API

**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 2 semanas

#### Estrategia:

Crear tests por módulos:

1. **Tests para Customers API** (2 días)
   - GET, POST, PUT, DELETE
   - Validaciones
   - Commit: `test: Agregar tests de integración para Customers API`

2. **Tests para Products API** (2 días)
   - Similar estructura
   - Commit: `test: Agregar tests de integración para Products API`

3. **Tests para otras APIs** (6 días)
   - Aplicar a todas las APIs
   - Commits separados

4. **Verificación** (1 día)
   - Coverage > 70%
   - Todos los tests pasando

**Criterios de Aceptación:**
- ✅ Tests para todas las APIs principales
- ✅ Coverage > 70%
- ✅ Tests bien estructurados

---

### Tarea 6.3: Tests E2E para Flujos Críticos

**Prioridad:** 🟡 ALTA  
**Tiempo:** 1 semana

#### Estrategia:

Usar Playwright o Cypress:

1. **Configurar herramienta E2E** (1 día)
   - Instalar Playwright
   - Configurar
   - Commit: `feat: Configurar Playwright para tests E2E`

2. **Test de flujo de login** (1 día)
   - Login exitoso
   - Login fallido
   - Commit: `test: Agregar test E2E para login`

3. **Test de creación de customer** (1 día)
   - Flujo completo
   - Commit: `test: Agregar test E2E para creación de customer`

4. **Test de creación de work order** (2 días)
   - Flujo completo
   - Commit: `test: Agregar test E2E para creación de work order`

5. **Otros flujos críticos** (1 día)
   - Aplicar a flujos importantes
   - Commit: `test: Agregar tests E2E para flujos críticos`

**Criterios de Aceptación:**
- ✅ Tests E2E para flujos críticos
- ✅ Tests pasando
- ✅ Configuración CI/CD

---

## Checklist de Verificación

### Antes de Crear un Branch de Fase

- [ ] Estar en `main` y actualizado (`git pull origin main`)
- [ ] Verificar que `main` está limpio (`git status`)
- [ ] Crear branch con nombre descriptivo (`git checkout -b phase-X-nombre`)

### Antes de Cada Commit

- [ ] Código compila sin errores
- [ ] TypeScript sin errores (`npm run type-check`)
- [ ] Linting pasa (`npm run lint`)
- [ ] Tests pasan (si aplica)
- [ ] Funcionalidad probada manualmente
- [ ] Sin console.log de debug
- [ ] Mensaje de commit descriptivo
- [ ] Cambios relacionados agrupados en el mismo commit

### Antes de Mergear una Fase a Main

- [ ] Todas las tareas de la fase completadas
- [ ] Estar en el branch de la fase (`git branch`)
- [ ] Último commit en main traído (`git checkout main && git pull`)
- [ ] Vuelto al branch de fase (`git checkout phase-X-nombre`)
- [ ] Merge de main al branch (si hay cambios nuevos): `git merge main`
- [ ] Resueltos conflictos (si los hay)
- [ ] Tests pasando (`npm test`)
- [ ] Build de producción exitoso (`npm run build`)
- [ ] Verificación manual en desarrollo (`npm run dev`)
- [ ] TypeScript sin errores (`npm run type-check`)
- [ ] Linting pasa (`npm run lint`)
- [ ] Documentación actualizada
- [ ] PROGRESO_MEJORAS.md actualizado

### Después de Mergear una Fase

- [ ] Verificar que main funciona (`npm run build && npm run dev`)
- [ ] Push a main (`git push origin main`)
- [ ] (Opcional) Eliminar branch local (`git branch -d phase-X-nombre`)
- [ ] (Opcional) Eliminar branch remoto (`git push origin --delete phase-X-nombre`)
- [ ] Actualizar PROGRESO_MEJORAS.md

### Al Final de Cada Fase

- [ ] Todas las tareas de la fase completadas
- [ ] Verificación completa de funcionalidad
- [ ] Performance medida y documentada (si aplica)
- [ ] Tests con coverage adecuado (si aplica)
- [ ] Documentación actualizada
- [ ] Branch mergeado a main
- [ ] PROGRESO_MEJORAS.md actualizado
- [ ] Branch eliminado (opcional, pero recomendado)

---

## Procedimientos de Rollback

### Rollback de un Commit (dentro de un branch)

```bash
# Si estás en un branch de fase y algo salió mal:

# Opción 1: Revertir último commit (mantiene historial)
git revert HEAD

# Opción 2: Resetear a commit anterior (cuidado: pierde cambios)
git reset --hard HEAD~1

# Opción 3: Ver commits y resetear a uno específico
git log --oneline -10
git reset --hard <commit-hash>
```

### Rollback de una Fase Completa (antes de mergear)

Si una fase tiene problemas antes de mergear a main:

```bash
# 1. Identificar el commit antes de la fase
git log --oneline -20

# 2. Crear branch de rollback (opcional, para seguridad)
git checkout main
git checkout -b rollback-phase-X

# 3. Si la fase no se ha mergeado, simplemente no mergear
# Si ya se mergeó, revertir el merge commit
git revert -m 1 <merge-commit-hash>

# 4. Verificar que todo funciona
npm run type-check
npm run lint
npm run build

# 5. Push del rollback
git push origin main
```

### Rollback de una Fase Completa (después de mergear)

Si una fase ya está en main y hay problemas:

```bash
# 1. Identificar el merge commit de la fase
git log --oneline --merges -10

# 2. Revertir el merge commit
git revert -m 1 <merge-commit-hash>

# 3. Verificar que todo funciona
npm run type-check
npm run lint
npm run build

# 4. Push del rollback
git push origin main

# 5. Corregir problemas en el branch de la fase
git checkout phase-X-nombre-fase
# ... hacer correcciones ...
git checkout main
git merge phase-X-nombre-fase
git push origin main
```

### Abandonar un Branch de Fase

Si una fase no funciona y quieres empezar de nuevo:

```bash
# 1. Volver a main
git checkout main

# 2. Eliminar branch local
git branch -D phase-X-nombre-fase

# 3. Eliminar branch remoto (si existe)
git push origin --delete phase-X-nombre-fase

# 4. Crear nuevo branch con el mismo nombre
git checkout -b phase-X-nombre-fase
```

### Rollback de Emergencia

Si algo crítico se rompe:

1. **Inmediato**: Revertir último commit
2. **Verificar**: Probar funcionalidad crítica
3. **Comunicar**: Notificar al equipo
4. **Investigar**: Identificar causa
5. **Corregir**: Arreglar en branch separado
6. **Re-aplicar**: Aplicar corrección

---

## Métricas de Progreso

### Métricas a Seguir

- **Cobertura de Tests**: Meta > 70%
- **Uso de `any`**: Reducir de 602 a < 100
- **Console.log**: Reducir de 1,077 a 0
- **Componentes grandes**: Reducir de 15+ a < 5
- **Performance**: Mejorar tiempos de carga en 30%
- **Bundle size**: Reducir en 20%

### Dashboard de Progreso

Crear archivo `PROGRESO_MEJORAS.md` para trackear:

```markdown
# Progreso de Mejoras Estructurales

## Fase 0: Preparación
- [x] Tarea 0.1: Configurar Testing
- [x] Tarea 0.2: Configurar Logging
- [ ] Tarea 0.3: Pre-commit hooks
- [ ] Tarea 0.4: Error Boundary

## Fase 1: Estabilización
- [ ] Tarea 1.1: Eliminar console.log
- [ ] Tarea 1.2: Reducir `any`
- [ ] Tarea 1.3: Rate limiting

...
```

---

## Notas Finales

### Principios a Recordar

1. **Paciencia**: Mejoras estructurales toman tiempo
2. **Precisión**: Mejor hacerlo bien que rápido
3. **Verificación**: Siempre verificar después de cambios
4. **Documentación**: Documentar decisiones importantes
5. **Incrementalismo**: Pequeños pasos, grandes resultados

### Recursos Útiles

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Testing Library](https://testing-library.com/)

---

**Última Actualización:** 2025-01-27  
**Próxima Revisión:** Después de completar Fase 1
