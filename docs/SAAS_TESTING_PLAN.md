# 🧪 Plan de Testing para Sistema SaaS Management

**Fecha Creación:** 2026-01-30  
**Estado:** 📋 Plan Documentado - Listo para Implementación  
**Prioridad:** 🔴 ALTA

---

## 📊 Análisis de la Situación Actual

### ✅ Infraestructura de Testing Existente

#### Tests Unitarios

- **Framework:** Vitest
- **Cobertura:** 17 tests pasando
- **Archivos:** `rut.test.ts`, `tax.test.ts`
- **Ubicación:** `src/__tests__/unit/`

#### Tests de Integración

- **Framework:** Vitest + Supabase Test Helpers
- **Cobertura:** 34 tests pasando
- **APIs Testeadas:** Customers (12), Products (14), Orders (8)
- **Ubicación:** `src/__tests__/integration/api/`
- **Características:**
  - Validación de multi-tenancy
  - Aislamiento de datos por organización
  - Autenticación híbrida (Bearer tokens + cookies)

#### Tests E2E

- **Estado:** ⏳ Pendiente
- **Framework:** No configurado aún

### ❌ Lo que NO Existe para SaaS Management

#### Tests para APIs de SaaS Management

- ❌ Tests para `/api/admin/saas-management/*`
- ❌ Tests para middleware `requireRoot()`
- ❌ Tests para políticas RLS específicas de root/dev
- ❌ Tests para funciones `is_root_user()`, `is_employee()`

#### Tests para Componentes SaaS

- ❌ Tests para páginas de SaaS Management
- ❌ Tests para componentes de gestión de organizaciones
- ❌ Tests para componentes de gestión de usuarios
- ❌ Tests para componentes de gestión de suscripciones

---

## 🎯 Objetivos del Plan de Testing

### Objetivos Principales

1. **Validar Seguridad Multi-Tenant**
   - Root/dev puede acceder a todas las organizaciones
   - Usuarios regulares solo pueden acceder a su organización
   - Políticas RLS funcionan correctamente

2. **Validar Funcionalidad Completa**
   - CRUD de organizaciones funciona
   - CRUD de usuarios funciona
   - Gestión de suscripciones funciona
   - Cambios de tier funcionan

3. **Validar APIs**
   - Todas las APIs retornan datos correctos
   - Validación de entrada funciona
   - Manejo de errores es correcto
   - Protección con `requireRoot()` funciona

4. **Prevenir Regresiones**
   - Tests automatizados en CI/CD
   - Cobertura mínima del 70%

---

## 🏗️ Estructura de Tests Propuesta

```
src/
└── __tests__/
    ├── unit/
    │   ├── lib/
    │   │   └── api/
    │   │       └── root-middleware.test.ts        # Tests para requireRoot()
    │   └── hooks/
    │       └── useRoot.test.ts                    # Tests para hook useRoot
    ├── integration/
    │   ├── api/
    │   │   └── saas-management/
    │   │       ├── analytics.test.ts              # Tests para analytics API
    │   │       ├── organizations.test.ts          # Tests para organizations API
    │   │       ├── organizations-actions.test.ts # Tests para actions API
    │   │       ├── users.test.ts                  # Tests para users API
    │   │       ├── users-actions.test.ts          # Tests para user actions API
    │   │       ├── subscriptions.test.ts          # Tests para subscriptions API
    │   │       ├── subscriptions-actions.test.ts # Tests para subscription actions API
    │   │       ├── tiers.test.ts                  # Tests para tiers API
    │   │       └── support-search.test.ts         # Tests para support search API
    │   └── database/
    │       ├── rls-policies.test.ts               # Tests para políticas RLS
    │       └── functions.test.ts                 # Tests para funciones SQL (is_root_user, etc.)
    └── e2e/
        └── saas-management/
            ├── root-login-flow.spec.ts            # Flujo de login para root
            ├── organizations-management.spec.ts    # Gestión de organizaciones
            ├── users-management.spec.ts           # Gestión de usuarios
            └── subscriptions-management.spec.ts   # Gestión de suscripciones
```

---

## 📋 Plan de Implementación por Sprint

### Sprint 1: Tests Unitarios (2-3 días)

#### Tareas:

1. ✅ Tests para `requireRoot()` middleware
2. ✅ Tests para `isRootUser()` helper
3. ✅ Tests para hook `useRoot()`
4. ✅ Tests para funciones de utilidad de SaaS

**Archivos a crear:**

- `src/__tests__/unit/lib/api/root-middleware.test.ts`
- `src/__tests__/unit/hooks/useRoot.test.ts`

**Cobertura Objetivo:** 80%+

---

### Sprint 2: Tests de Integración - APIs Básicas (3-4 días)

#### Tareas:

1. ✅ Tests para Analytics API
2. ✅ Tests para Organizations API (CRUD completo)
3. ✅ Tests para Organizations Actions API
4. ✅ Tests para Support Search API

**Archivos a crear:**

- `src/__tests__/integration/api/saas-management/analytics.test.ts`
- `src/__tests__/integration/api/saas-management/organizations.test.ts`
- `src/__tests__/integration/api/saas-management/organizations-actions.test.ts`
- `src/__tests__/integration/api/saas-management/support-search.test.ts`

**Cobertura Objetivo:** 75%+

**Casos de prueba clave:**

- Root/dev puede acceder a todas las APIs
- Usuarios regulares NO pueden acceder
- Filtros funcionan correctamente
- Validación de entrada funciona
- Manejo de errores es correcto

---

### Sprint 3: Tests de Integración - APIs Avanzadas (3-4 días)

#### Tareas:

1. ✅ Tests para Users API
2. ✅ Tests para Users Actions API
3. ✅ Tests para Subscriptions API
4. ✅ Tests para Subscriptions Actions API
5. ✅ Tests para Tiers API

**Archivos a crear:**

- `src/__tests__/integration/api/saas-management/users.test.ts`
- `src/__tests__/integration/api/saas-management/users-actions.test.ts`
- `src/__tests__/integration/api/saas-management/subscriptions.test.ts`
- `src/__tests__/integration/api/saas-management/subscriptions-actions.test.ts`
- `src/__tests__/integration/api/saas-management/tiers.test.ts`

**Cobertura Objetivo:** 75%+

---

### Sprint 4: Tests de Base de Datos (2-3 días)

#### Tareas:

1. ✅ Tests para políticas RLS
2. ✅ Tests para funciones SQL (`is_root_user`, `is_employee`)
3. ✅ Tests para constraints de base de datos
4. ✅ Tests para triggers

**Archivos a crear:**

- `src/__tests__/integration/database/rls-policies.test.ts`
- `src/__tests__/integration/database/functions.test.ts`

**Cobertura Objetivo:** 70%+

**Casos de prueba clave:**

- Root/dev puede leer todas las organizaciones
- Root/dev puede escribir en todas las organizaciones
- Usuarios regulares solo pueden leer su organización
- Funciones SQL retornan valores correctos

---

### Sprint 5: Tests E2E (Opcional pero Recomendado) (3-4 días)

#### Tareas:

1. ✅ Configurar Playwright o Cypress
2. ✅ Test de flujo de login para root/dev
3. ✅ Test de gestión de organizaciones
4. ✅ Test de gestión de usuarios
5. ✅ Test de gestión de suscripciones

**Archivos a crear:**

- `src/__tests__/e2e/saas-management/root-login-flow.spec.ts`
- `src/__tests__/e2e/saas-management/organizations-management.spec.ts`
- `src/__tests__/e2e/saas-management/users-management.spec.ts`
- `src/__tests__/e2e/saas-management/subscriptions-management.spec.ts`

**Cobertura Objetivo:** Flujos críticos cubiertos

---

## 📝 Ejemplos de Tests

### Test Unitario: `requireRoot()` Middleware

```typescript
// src/__tests__/unit/lib/api/root-middleware.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { requireRoot } from "@/lib/api/root-middleware";
import { AuthorizationError } from "@/lib/api/errors";

describe("requireRoot", () => {
  it("should allow root user", async () => {
    // Mock Supabase client con usuario root
    // Verificar que no lanza error
  });

  it("should throw AuthorizationError for non-root user", async () => {
    // Mock Supabase client con usuario admin regular
    // Verificar que lanza AuthorizationError
  });

  it("should throw AuthorizationError for unauthenticated user", async () => {
    // Mock Supabase client sin usuario
    // Verificar que lanza AuthorizationError
  });
});
```

### Test de Integración: Organizations API

```typescript
// src/__tests__/integration/api/saas-management/organizations.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestClient,
  createRootUser,
  createOrganization,
} from "../helpers/test-setup";

describe("SaaS Management - Organizations API", () => {
  let rootClient: ReturnType<typeof createTestClient>;
  let adminClient: ReturnType<typeof createTestClient>;
  let rootUserId: string;
  let orgId: string;

  beforeAll(async () => {
    // Crear usuario root y admin regular
    rootUserId = await createRootUser();
    rootClient = createTestClient(rootUserId);

    const adminUserId = await createAdminUser();
    adminClient = createTestClient(adminUserId);

    orgId = await createOrganization();
  });

  describe("GET /api/admin/saas-management/organizations", () => {
    it("should return all organizations for root user", async () => {
      const response = await rootClient.get(
        "/api/admin/saas-management/organizations",
      );
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.organizations)).toBe(true);
    });

    it("should reject non-root users", async () => {
      const response = await adminClient.get(
        "/api/admin/saas-management/organizations",
      );
      expect(response.status).toBe(403);
    });

    it("should filter by tier", async () => {
      const response = await rootClient.get(
        "/api/admin/saas-management/organizations?tier=pro",
      );
      expect(response.status).toBe(200);
      response.data.organizations.forEach((org: any) => {
        expect(org.subscription_tier).toBe("pro");
      });
    });

    it("should filter by status", async () => {
      const response = await rootClient.get(
        "/api/admin/saas-management/organizations?status=active",
      );
      expect(response.status).toBe(200);
      response.data.organizations.forEach((org: any) => {
        expect(org.status).toBe("active");
      });
    });

    it("should search by name", async () => {
      const response = await rootClient.get(
        "/api/admin/saas-management/organizations?search=test",
      );
      expect(response.status).toBe(200);
      // Verificar que los resultados contienen "test"
    });

    it("should paginate results", async () => {
      const response = await rootClient.get(
        "/api/admin/saas-management/organizations?page=1&limit=10",
      );
      expect(response.status).toBe(200);
      expect(response.data.organizations.length).toBeLessThanOrEqual(10);
      expect(response.data.pagination).toBeDefined();
    });
  });

  describe("POST /api/admin/saas-management/organizations", () => {
    it("should create organization for root user", async () => {
      const newOrg = {
        name: "Test Organization",
        slug: "test-org",
        subscription_tier: "basic",
      };

      const response = await rootClient.post(
        "/api/admin/saas-management/organizations",
        newOrg,
      );
      expect(response.status).toBe(201);
      expect(response.data.organization.name).toBe(newOrg.name);
    });

    it("should validate required fields", async () => {
      const response = await rootClient.post(
        "/api/admin/saas-management/organizations",
        {},
      );
      expect(response.status).toBe(400);
    });

    it("should validate slug uniqueness", async () => {
      const org = {
        name: "Duplicate Slug",
        slug: "existing-slug", // Slug que ya existe
        subscription_tier: "basic",
      };

      const response = await rootClient.post(
        "/api/admin/saas-management/organizations",
        org,
      );
      expect(response.status).toBe(409);
    });

    it("should reject non-root users", async () => {
      const org = {
        name: "Test",
        slug: "test",
        subscription_tier: "basic",
      };

      const response = await adminClient.post(
        "/api/admin/saas-management/organizations",
        org,
      );
      expect(response.status).toBe(403);
    });
  });

  describe("PATCH /api/admin/saas-management/organizations/[id]", () => {
    it("should update organization for root user", async () => {
      const updates = {
        name: "Updated Name",
        status: "suspended",
      };

      const response = await rootClient.patch(
        `/api/admin/saas-management/organizations/${orgId}`,
        updates,
      );
      expect(response.status).toBe(200);
      expect(response.data.organization.name).toBe(updates.name);
      expect(response.data.organization.status).toBe(updates.status);
    });

    it("should reject invalid status", async () => {
      const updates = {
        status: "invalid_status",
      };

      const response = await rootClient.patch(
        `/api/admin/saas-management/organizations/${orgId}`,
        updates,
      );
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/admin/saas-management/organizations/[id]/actions", () => {
    it("should suspend organization", async () => {
      const response = await rootClient.post(
        `/api/admin/saas-management/organizations/${orgId}/actions`,
        {
          action: "suspend",
        },
      );

      expect(response.status).toBe(200);
      // Verificar que la organización está suspendida
    });

    it("should activate organization", async () => {
      const response = await rootClient.post(
        `/api/admin/saas-management/organizations/${orgId}/actions`,
        {
          action: "activate",
        },
      );

      expect(response.status).toBe(200);
      // Verificar que la organización está activa
    });

    it("should change tier", async () => {
      const response = await rootClient.post(
        `/api/admin/saas-management/organizations/${orgId}/actions`,
        {
          action: "change_tier",
          tier: "pro",
        },
      );

      expect(response.status).toBe(200);
      // Verificar que el tier cambió
    });
  });
});
```

### Test de Base de Datos: RLS Policies

```typescript
// src/__tests__/integration/database/rls-policies.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { createClient } from "@/utils/supabase/client";

describe("RLS Policies - SaaS Management", () => {
  const serviceRoleClient = createServiceRoleClient();

  describe("admin_users table", () => {
    it("should allow root user to view all admin users", async () => {
      // Crear usuario root
      // Crear usuario admin regular
      // Verificar que root puede ver ambos
    });

    it("should prevent regular admin from viewing other organizations users", async () => {
      // Crear dos organizaciones
      // Crear admin en cada una
      // Verificar que cada admin solo ve su organización
    });
  });

  describe("organizations table", () => {
    it("should allow root user to view all organizations", async () => {
      // Crear múltiples organizaciones
      // Verificar que root puede ver todas
    });

    it("should prevent regular admin from viewing other organizations", async () => {
      // Crear dos organizaciones
      // Verificar que admin solo ve su organización
    });
  });

  describe("is_root_user() function", () => {
    it("should return true for root user", async () => {
      const rootUserId = await createRootUser();
      const { data } = await serviceRoleClient.rpc("is_root_user", {
        user_id: rootUserId,
      });
      expect(data).toBe(true);
    });

    it("should return false for regular admin", async () => {
      const adminUserId = await createAdminUser();
      const { data } = await serviceRoleClient.rpc("is_root_user", {
        user_id: adminUserId,
      });
      expect(data).toBe(false);
    });
  });
});
```

---

## ✅ Checklist de Implementación

### Infraestructura

- [ ] Configurar helpers de test para crear usuarios root/dev
- [ ] Configurar helpers de test para crear organizaciones de prueba
- [ ] Configurar helpers de test para crear suscripciones de prueba
- [ ] Actualizar `test-setup.ts` con funciones SaaS

### Tests Unitarios

- [ ] Tests para `requireRoot()` middleware
- [ ] Tests para `isRootUser()` helper
- [ ] Tests para hook `useRoot()`
- [ ] Tests para funciones de utilidad

### Tests de Integración - APIs

- [ ] Tests para Analytics API
- [ ] Tests para Organizations API (GET, POST, PATCH, DELETE)
- [ ] Tests para Organizations Actions API
- [ ] Tests para Organizations Bulk Actions API
- [ ] Tests para Users API
- [ ] Tests para Users Actions API
- [ ] Tests para Subscriptions API
- [ ] Tests para Subscriptions Actions API
- [ ] Tests para Tiers API
- [ ] Tests para Support Search API

### Tests de Integración - Base de Datos

- [ ] Tests para políticas RLS de `admin_users`
- [ ] Tests para políticas RLS de `organizations`
- [ ] Tests para políticas RLS de `subscriptions`
- [ ] Tests para función `is_root_user()`
- [ ] Tests para función `is_employee()`
- [ ] Tests para constraints de base de datos

### Tests E2E (Opcional)

- [ ] Configurar Playwright/Cypress
- [ ] Test de flujo de login root/dev
- [ ] Test de gestión de organizaciones
- [ ] Test de gestión de usuarios
- [ ] Test de gestión de suscripciones

### CI/CD

- [ ] Configurar ejecución de tests en CI
- [ ] Configurar reporte de cobertura
- [ ] Configurar alertas si tests fallan

---

## 📊 Métricas de Cobertura Objetivo

| Categoría                          | Cobertura Objetivo | Prioridad |
| ---------------------------------- | ------------------ | --------- |
| APIs SaaS Management               | 75%+               | 🔴 ALTA   |
| Middleware `requireRoot()`         | 90%+               | 🔴 ALTA   |
| Funciones SQL (is_root_user, etc.) | 80%+               | 🔴 ALTA   |
| Políticas RLS                      | 70%+               | 🔴 ALTA   |
| Componentes React                  | 60%+               | 🟡 MEDIA  |
| Hooks (useRoot)                    | 80%+               | 🟡 MEDIA  |
| Tests E2E                          | Flujos críticos    | 🟢 BAJA   |

---

## 🚀 Comandos de Testing

```bash
# Ejecutar todos los tests de SaaS Management
npm run test:run -- src/__tests__/integration/api/saas-management/

# Ejecutar tests específicos
npm run test:run -- src/__tests__/integration/api/saas-management/organizations.test.ts

# Ejecutar tests con cobertura
npm run test:coverage -- src/__tests__/integration/api/saas-management/

# Ejecutar tests de base de datos
npm run test:run -- src/__tests__/integration/database/

# Ejecutar tests E2E (cuando estén configurados)
npm run test:e2e -- src/__tests__/e2e/saas-management/
```

---

## 📝 Notas Importantes

1. **Autenticación en Tests:**
   - Usar `createServiceRoleClient()` para crear usuarios de prueba
   - Usar helpers de test para crear usuarios root/dev
   - Simular autenticación con tokens Bearer en tests de API

2. **Aislamiento:**
   - Cada test debe limpiar datos después de ejecutarse
   - Usar transacciones cuando sea posible
   - Crear datos de prueba únicos para evitar conflictos

3. **Multi-Tenancy:**
   - Validar que root/dev puede acceder a todas las organizaciones
   - Validar que usuarios regulares solo pueden acceder a su organización
   - Validar que los filtros por `organization_id` funcionan correctamente

4. **Performance:**
   - Tests deben ejecutarse rápidamente (< 5 segundos por suite)
   - Usar mocks cuando sea apropiado
   - Evitar llamadas a APIs externas reales

---

## 🎯 Prioridades

### 🔴 Alta Prioridad (MVP)

1. Tests para `requireRoot()` middleware
2. Tests para Organizations API
3. Tests para Users API
4. Tests para políticas RLS básicas

### 🟡 Media Prioridad

1. Tests para Subscriptions API
2. Tests para Tiers API
3. Tests para funciones SQL
4. Tests para componentes React

### 🟢 Baja Prioridad

1. Tests E2E
2. Tests de performance
3. Tests de carga

---

**Última Actualización:** 2026-01-30  
**Versión:** 1.0.0
