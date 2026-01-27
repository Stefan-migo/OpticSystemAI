# 🚀 SaaS Implementation Plan - Transformación a Plataforma Multi-Tenant

**Fecha Creación:** 2026-01-24  
**Estado:** 📋 Plan Documentado - Listo para Implementación  
**Timeline Estimado:** 6-7 semanas

---

## 📊 Resumen Ejecutivo

### Objetivo

Transformar el sistema monolítico actual en una plataforma SaaS profesional capaz de servir múltiples ópticas de forma independiente, con sistema de suscripciones por tiers.

### Estrategia Híbrida

Combinar mejoras de código (Phase 5), arquitectura SaaS (Phase SaaS 0), testing (Phase 6) y billing (Phase SaaS 1) de forma sistemática y segura.

### Restricción Crítica ⚠️

**Phase 6.2 (Tests de Integración) DEBE validar multi-tenancy ANTES de mergear Phase SaaS 0 a main**

---

## 🏗️ Arquitectura Multi-Tenancy

### Modelo de Datos Propuesto

```
organizations (Tenants/Ópticas)
├── id (UUID, PK)
├── name (Nombre de la óptica)
├── slug (URL-friendly: "mióptica.app")
├── subscription_tier (basic|pro|premium)
├── status (active|suspended|cancelled)
├── metadata (JSONB)
└── created_at, updated_at

subscriptions (Asociados a Organizations)
├── id (UUID, PK)
├── organization_id (FK)
├── stripe_subscription_id
├── status (active|past_due|cancelled)
├── current_period_start, current_period_end
└── cancel_at

subscription_tiers (Definiciones)
├── id (UUID, PK)
├── name (basic|pro|premium)
├── price_monthly (49|99|299)
├── max_branches (1|3|20)
├── max_users (2|5|50)
├── max_customers (500|2000|unlimited)
└── features (JSONB con capacidades)

branches
├── ... (existentes)
├── organization_id (FK) ← NUEVA
└── (Cada rama pertenece a una organización)

products, orders, customers, etc.
├── ... (existentes)
├── organization_id (FK) ← NUEVA
└── (Todos los datos aislados por organización)
```

### Row Level Security (RLS)

```sql
CREATE OR REPLACE FUNCTION get_user_organization_id(user_id UUID)
RETURNS UUID AS $$
  SELECT organization_id FROM admin_users WHERE id = user_id;
$$ LANGUAGE SQL;

-- Aplicar a TODAS las tablas de datos:
CREATE POLICY "Tenant isolation"
ON [table_name] FOR SELECT
USING (organization_id = get_user_organization_id());
```

**Beneficio:** Supabase garantiza aislamiento de datos a nivel DB. No hay forma de que un usuario acceda datos de otra organización.

---

## 💳 Sistema de Suscripciones

### Tier Definitions

```typescript
const TIER_LIMITS = {
  basic: {
    price: 49,
    max_branches: 1,
    max_users: 2,
    max_customers: 500,
    max_products: 100,
    features: {
      pos: true,
      appointments: true,
      quotes: true,
      work_orders: true,
      chat_ia: false,
      advanced_analytics: false,
      api_access: false,
      custom_branding: false,
    },
  },
  pro: {
    price: 99,
    max_branches: 3,
    max_users: 5,
    max_customers: 2000,
    max_products: 500,
    features: {
      pos: true,
      appointments: true,
      quotes: true,
      work_orders: true,
      chat_ia: true, // ✅ Desbloqueado
      advanced_analytics: true, // ✅ Desbloqueado
      api_access: false,
      custom_branding: false,
    },
  },
  premium: {
    price: 299,
    max_branches: 20,
    max_users: 50,
    max_customers: "unlimited",
    max_products: "unlimited",
    features: {
      pos: true,
      appointments: true,
      quotes: true,
      work_orders: true,
      chat_ia: true,
      advanced_analytics: true,
      api_access: true, // ✅ Desbloqueado
      custom_branding: true, // ✅ Desbloqueado
    },
  },
};
```

### Validación de Límites

```typescript
// Middleware para validar tier limits
async function validateTierLimit(
  orgId: UUID,
  action: "create_branch" | "add_user" | "enable_feature",
  currentCount: number,
): Promise<void> {
  const org = await getOrganization(orgId);
  const tier = TIER_LIMITS[org.subscription_tier];

  switch (action) {
    case "create_branch":
      if (currentCount >= tier.max_branches) {
        throw new ForbiddenError(
          `Límite de ${tier.max_branches} sucursales alcanzado. Upgrade a ${getNextTier()}`,
        );
      }
      break;
    // ... más validaciones
  }
}
```

**Aplicar a:**

- POST /api/admin/branches
- POST /api/admin/admin-users
- POST /api/admin/features

---

## 🔌 Integración de Pagos

### Stripe Integration

```typescript
// 1. Crear sesión de checkout
app / api / admin / billing / checkout / route.ts;

// 2. Webhook para renovación de suscripción
app / api / admin / billing / webhook / stripe / route.ts;

// 3. Dashboard de suscripción
src / components / admin / SubscriptionManager.tsx;
```

### MercadoPago (Alternativa)

Ya está parcialmente integrado. Necesita:

- Adaptación para suscripciones periódicas
- Webhooks de renovación
- Gestión de cambio de planes

---

## 🧪 Testing Strategy

### Tests Unitarios (Phase 6.1)

- Utilidades (rut.ts, tax.ts, etc.)
- Funciones de cálculo
- Validadores de tier

### Tests de Integración (Phase 6.2) ✅ **CRÍTICO**

```typescript
// EJEMPLO: Validar aislamiento de datos
describe("Multi-tenancy Data Isolation", () => {
  it("User A cannot access Organization B data", async () => {
    const userA = await createTestUser("org-a");
    const userB = await createTestUser("org-b");

    // UserA crea un producto en su org
    const productA = await createProduct(userA, { name: "Product A" });

    // UserB intenta acceder - DEBE fallar
    const result = await getProduct(userB, productA.id);
    expect(result).toBeUndefined();
  });
});
```

Estos tests VALIDAN que Phase SaaS 0 está correctamente implementada.

### Tests E2E (Phase 6.3)

- Flujo completo de signup → crear organización → usar plataforma
- Cambio de tier
- Validación de límites

---

## 🚀 Timeline Detallado

### Semana 1: Phase 5 - Mantenibilidad

```
Lunes-Viernes: Reducir código duplicado + Documentación
├── Branch: phase-5-maintainability
├── Commits: Utilities refactoring + JSDoc
└── Merge a main: Viernes
```

### Semana 2-3: Phase SaaS 0 - Architecture

```
Lunes-Viernes: Schema Multi-tenant
├── Branch: phase-saas-0-multitenancy
├── Tarea 0.1: Crear tablas (Lunes-Martes)
├── Tarea 0.2: Extender RLS (Miércoles-Jueves)
├── Tarea 0.3: Tier System (Viernes-Lunes Semana 3)
├── ⚠️ NO MERGEAR A MAIN todavía
└── Esperar tests en Phase 6
```

### Semana 3-4: Phase 6 (Paralelo) - Testing

```
Lunes-Viernes Semana 3:
├── Branch: phase-6-testing
├── Tarea 6.1: Tests unitarios (Lunes-Miércoles)
├── Tarea 6.2A: Tests integración básicos (Jueves-Viernes)

Lunes-Miércoles Semana 4:
├── Tarea 6.2B: Tests multi-tenancy contra Phase SaaS 0
├── Si tests FALLAN: Arreglar Phase SaaS 0
├── Si tests PASAN: Mergear Phase SaaS 0 a main
```

### Semana 5-6: Phase SaaS 1 - Billing

```
Lunes-Viernes:
├── Branch: phase-saas-1-billing
├── Tarea 1.1: Stripe Integration (Lunes-Martes)
├── Tarea 1.2: Subscription Management (Miércoles)
├── Tarea 1.3: Tier Enforcement (Jueves-Viernes)
└── Merge a main: Viernes
```

### Semana 7: Finalización

```
Lunes-Viernes:
├── Tarea 6.3: Tests E2E completos
├── Phase 6 Merge a main
├── Preparation para Cloud Deployment
└── Validación final: Sistema SaaS funcional
```

---

## 🔐 Consideraciones de Seguridad

### 1. RLS (Row Level Security)

- ✅ Implementada a nivel BD (Supabase)
- ✅ Imposible acceder datos de otro tenant
- ✅ Testing valida aislamiento

### 2. Validación de Límites

- ✅ Middleware valida tier limits
- ✅ API rechaza acciones fuera de tier
- ✅ UI muestra límites disponibles

### 3. Stripe Webhooks

- ✅ Validar firma de webhook
- ✅ Idempotencia en manejo de eventos
- ✅ Logging de transacciones

### 4. Data Isolation

- ✅ Cada tenant tiene su BD schema lógico
- ✅ Migraciones versionadas por tenant
- ✅ Backups independientes

---

## ✅ Checklist Pre-Launch

### Phase SaaS 0

- [ ] Schema creado sin errores
- [ ] RLS funcionando correctamente
- [ ] Tier system base implementado
- [ ] Tests validan aislamiento
- [ ] Documentación actualizada

### Phase SaaS 1

- [ ] Stripe integrado
- [ ] Webhooks funcionales
- [ ] Dashboard de suscripción
- [ ] Tests E2E pasando
- [ ] Documentación de billing

### Pre-Producción

- [ ] Load testing (múltiples tenants)
- [ ] Security audit
- [ ] Performance benchmarks
- [ ] Disaster recovery plan
- [ ] Runbook de deployment

---

## 📈 Métricas de Éxito

| Métrica              | Meta         | Cómo Medirlo            |
| -------------------- | ------------ | ----------------------- |
| Aislamiento de Datos | 100%         | Tests de integración    |
| Test Coverage        | > 70%        | `npm run test:coverage` |
| Uptime               | > 99.5%      | Monitoring de cloud     |
| Latencia             | < 200ms      | Performance metrics     |
| Escalabilidad        | 100+ tenants | Load testing            |

---

## 🤔 FAQ

### ¿Qué sucede si un test falla en Phase 6?

Detener. No mergear Phase SaaS 0. Arreglar en branch. Re-testear.

### ¿Puedo hacer cambios al schema después del merge?

Sí, pero con migraciones versionadas. Supabase maneja esto.

### ¿Qué si Phase 5 + SaaS 0 + 6 + 1 toma más de 7 semanas?

Ajustar timeline. Prioridad: Phase 5 → Phase 6 (tests) → Phase SaaS 0 → Phase SaaS 1

### ¿Backwards compatibility con clientes monolíticos?

Sí. El sistema puede servir:

- Ópticas monolíticas (sin organization_id)
- Ópticas SaaS multi-tenant (con organization_id)

---

## 📞 Support & Escalation

- **Technical Issues:** Revisar logs de branch
- **Bloqueadores:** Escalate a lead engineer
- **Critical Failures:** Rollback inmediato al main

---

**Próximo Paso:** Comenzar Phase 5 - `git checkout -b phase-5-maintainability`
