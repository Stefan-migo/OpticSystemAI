# 📚 Documentación Completa - Opttius (Roadmap SaaS)

## 📋 Índice de Documentos

### 1. **PLAN_MEJORAS_ESTRUCTURALES.md**

Documento maestro con todas las fases (0-6 + SaaS)

- Metodología de trabajo
- Detalles de cada tarea
- Criterios de aceptación
- Checklists de verificación

👉 **Usar cuando:** Necesitas detalles completos de una tarea

---

### 2. **PROGRESO_MEJORAS.md**

Tracking detallado del avance

- Estado actual de cada fase
- Métricas de progreso
- Historial de cambios
- Notas sobre el plan híbrido

👉 **Usar cuando:** Necesitas saber el estado actual o qué hacer después

---

### 3. **SAAS_IMPLEMENTATION_PLAN.md** ⭐ NUEVO

Plan de implementación SaaS completo

- Arquitectura multi-tenancy
- Sistema de suscripciones (tiers)
- Integración de pagos
- Testing strategy
- Timeline detallado
- FAQ y troubleshooting

👉 **Usar cuando:** Necesitas entender la arquitectura SaaS o cómo funciona

---

### 3b. **SAAS_ONBOARDING_AND_NEW_USER_FLOW.md** ⭐ NUEVO (2026-01-28)

Flujo completo de onboarding y alta de nuevos usuarios SaaS

- Cómo se crea y asigna una organización (óptica) a un usuario
- Flujos: self-signup, usuario invitado, super admin crea organización
- Especificación detallada de UI/UX (pantallas, rutas, copy)
- APIs a implementar (crear organización, invitaciones, /me)
- Checklist de implementación y secuencia recomendada

👉 **Usar cuando:** Necesitas implementar el alta de un nuevo usuario/óptica o el flujo signup → crear óptica → configurar

---

### 4. **GIT_BRANCHING_REFERENCE.md** ⭐ NUEVO

Guía rápida de comandos git

- Comandos para cada phase
- Emergency rollback procedures
- Checklist antes de mergear
- Convención de commits

👉 **Usar cuando:** Necesitas hacer git push/merge o algo se rompe

---

### 5. **TESTING_INTEGRATION_AUTH_FIX.md** ⭐ NUEVO (2026-01-27)

Guía completa para resolver autenticación en tests de integración

- Análisis del problema (cookies vs tokens Bearer)
- Dos opciones de solución detalladas
- Pasos de implementación paso a paso
- Código de ejemplo
- Referencias técnicas

👉 **Usar cuando:** Necesitas hacer que los tests de integración pasen

---

### 6. **NEXT_STEPS_TESTING.md** ✅ COMPLETADO (2026-01-27)

Resumen ejecutivo de próximos pasos para tests

- Estado actual
- Problema identificado
- Pasos a seguir
- Criterios de éxito

👉 **Usar cuando:** Necesitas un resumen rápido de qué hacer con los tests

---

### 6b. **PAYMENT_GATEWAYS_ENV_SETUP.md** ⭐ (2026-01-29)

Guía para darse de alta y obtener variables de entorno de pasarelas de pago

- Flow (Chile): registro, API Key, Secret Key, webhooks — pasarela principal para Chile
- Mercado Pago: panel developers, aplicación, credenciales y webhooks
- PayPal: developer dashboard, aplicación, Client ID/Secret, webhooks
- `NEXT_PUBLIC_BASE_URL` y ejemplo de `.env.local`
- Producción (Vercel u otro host)

👉 **Usar cuando:** Necesitas configurar Flow, Mercado Pago o PayPal y obtener las claves para `.env.local`

---

### 6c. **LENS_FAMILIES_AND_MATRICES_SCHEMA.md** ⭐ NUEVO (2026-01-29)

Documentación completa del schema de base de datos para familias de lentes y matrices de precios

- Schema detallado de `lens_families` y `lens_price_matrices`
- Descripción de todos los campos, tipos y constraints
- Función SQL `calculate_lens_price` con ejemplos
- Políticas RLS (Row Level Security)
- Índices y optimización (GIST para rangos)
- Flujo de funcionamiento completo
- Ejemplos de uso y consultas SQL
- API endpoints disponibles
- Relaciones con otras tablas (quotes, lab_work_orders)

👉 **Usar cuando:** Necesitas entender el schema de familias de lentes, cómo funcionan las matrices de precios, o cómo calcular precios automáticamente según recetas

---

### 6d. **ONBOARDING_TOUR_GUIDE.md** ⭐ NUEVO (2026-01-29)

Guía completa de implementación del sistema de tour de primera visita

- Análisis del flujo del sistema y secciones principales
- Diseño del tour interactivo con spotlight y tarjetas
- Arquitectura técnica completa (DB, componentes, API)
- Implementación paso a paso con código de ejemplo
- **Sección completa de Testing** (unitarios, integración, E2E)
- Configuración y personalización
- Acceso y re-visitación del tour

👉 **Usar cuando:** Necesitas implementar el sistema de guía interactiva para usuarios nuevos o entender cómo funciona el tour

---

### 6e. **CONTACT_LENSES_INTEGRATION_GUIDE.md** ⭐ NUEVO (2026-01-29)

Guía completa de integración de lentes de contacto al sistema Opttius

- Análisis del sistema actual y diferencias con lentes ópticos
- Arquitectura propuesta con tablas paralelas
- Schema completo de base de datos
- Funciones SQL para cálculo de precios
- Integración con módulos existentes (quotes, lab_work_orders)
- API endpoints y componentes frontend
- **Sección completa de Testing** (unitarios, integración)
- Checklist de implementación

👉 **Usar cuando:** Necesitas integrar la gestión de lentes de contacto al sistema o entender cómo funciona el módulo

---

### 6f. **AI_IMPLEMENTATION_GUIDE.md** ⭐ NUEVO (2026-01-29)

Guía completa de implementación del sistema de IA mejorado

- Visión general del sistema de IA como "Socio Gerente Activo"
- Análisis del sistema actual y mejoras propuestas
- Arquitectura con widgets contextuales por sección
- Implementación detallada por módulo (Dashboard, POS, Productos, Clientes, Analíticas)
- Mejoras del chatbot flotante
- Remoción del chatbot del sidebar
- **Sección completa de Testing** (unitarios, integración, E2E con mocking de LLMs)
- Estrategia de costos y monitoreo

👉 **Usar cuando:** Necesitas implementar el sistema de IA mejorado con widgets contextuales o entender cómo funciona

---

### 6g. **TESTING_STRATEGY_NEW_FEATURES.md** ⭐ NUEVO (2026-01-29)

Estrategia de testing para las nuevas implementaciones

- Análisis de prioridades de testing por implementación
- Resumen de qué necesita tests y qué no
- Estructura de tests propuesta
- Recomendaciones de implementación
- Cobertura objetivo por funcionalidad

👉 **Usar cuando:** Necesitas entender qué tests implementar para las nuevas funcionalidades o planificar la estrategia de testing

---

### 6h. **SAAS_SUPPORT_SYSTEM_PLAN.md** ⭐ NUEVO (2026-01-30)

Plan completo del sistema de soporte SaaS

- Arquitectura del sistema de tickets
- Base de datos (tablas, RLS, funciones SQL)
- APIs backend (root/dev y públicas)
- Portal público `/support`
- Paneles de gestión (root/dev y organizaciones)
- Sistema de notificaciones por email
- Métricas y dashboard
- Plan de testing

👉 **Usar cuando:** Necesitas entender el sistema de soporte SaaS o implementar nuevas funcionalidades

---

### 6i. **SAAS_SUPPORT_IMPLEMENTATION_COMPLETE.md** ⭐ NUEVO (2026-01-30) ✅ COMPLETADO

Resumen completo de la implementación del sistema de soporte SaaS

- Estado de implementación (100% completado)
- Arquitectura final implementada
- Todas las APIs creadas
- Frontend completo (portal público y paneles)
- Sistema de notificaciones por email
- Métricas y dashboard
- Tests implementados (unitarios e integración)
- Checklist final de verificación
- Guía de uso del sistema

👉 **Usar cuando:** Necesitas una referencia completa de lo que se implementó o cómo usar el sistema

---

### 6j. **Gestión SaaS Opttius** ✅ ACTUALIZADO (2026-01-30)

Documentos del plan e implementación del panel root/dev:

- **PLAN_GESTION_SAAS_OPTTIUS.md** – Plan completo, roles, fases y **sección 10: Implementación completada y correcciones post-implementación** (estado de rutas, APIs simplificadas, páginas de detalle, UI).
- **RESUMEN_EJECUTIVO_CORRECCIONES.md** – Resumen de problemas/soluciones y **Implementación completada y correcciones (30-Ene-2026)**.
- **ESTADO_ACTUAL_PROYECTO.md** – Estado general del proyecto; incluye **Gestión SaaS (root/dev)** como completada y notas de correcciones.
- **IMPLEMENTACION_DETALLES_TECNICOS.md** – Detalles técnicos de implementación y **sección 9: Notas post-implementación** (APIs sin relaciones complejas, páginas de detalle, UI, referencias).

👉 **Usar cuando:** Necesitas el estado actual de la Gestión SaaS, qué se corrigió tras la implementación o referencias técnicas para mantener/ampliar el panel root/dev

---

### 7. **Cómo ejecutar tests**

**Estructura:** `src/__tests__/unit/` (unitarios), `src/__tests__/integration/api/` (integración).

**Comandos:**

```bash
# Todos los tests
npm run test:run

# Solo unitarios
npm run test:run -- src/__tests__/unit

# Integración: Customers, Products, Orders
npm run test:run -- src/__tests__/integration/api/customers.test.ts
npm run test:run -- src/__tests__/integration/api/products.test.ts
npm run test:run -- src/__tests__/integration/api/orders.test.ts
```

**Helpers:** `src/__tests__/integration/helpers/test-setup.ts` (autenticación híbrida).

**Guías:** `docs/TESTING_INTEGRATION_AUTH_FIX.md`, `docs/NEXT_STEPS_TESTING.md`, `docs/TESTING_ORDERS_API_VALIDATION.md`, `docs/TESTING_PRODUCTS_SEARCH_FIX.md`.

---

## 🎯 Flujo de Trabajo Recomendado

### Para comenzar una nueva fase:

```
1. Leer resumen de fase en PLAN_MEJORAS_ESTRUCTURALES.md
2. Ver commands en GIT_BRANCHING_REFERENCE.md
3. Verificar checklist en PLAN_MEJORAS_ESTRUCTURALES.md
4. Ejecutar: git checkout -b phase-X-nombre
5. Trabajar en la fase
6. Antes de mergear, verificar SAAS_IMPLEMENTATION_PLAN.md (si es SaaS)
7. Actualizar PROGRESO_MEJORAS.md al finalizar
```

---

## 📊 Estado Actual (2026-01-30)

```
✅ Completadas (Fases 0-5 + SaaS 0):  20 de 29 tareas
✅ Completada (Fase 6.2):              Tests de integración pasando (12/12 Customers API)
🟡 En progreso (Phase SaaS 1):        DB, Backend Core, Flow, Env doc, UI checkout
─────────────────────────────────────────
📈 Total: ~72% (Phase SaaS 1 ~60%: Flow + UI listos; pendiente MP/PayPal y tests)
⏱️  Tiempo estimado restante: 3-4 semanas
```

### Phase SaaS 1 (Billing) — Estado

**Completado:** Migración DB, tipos, PaymentService, Factory, Flow gateway (pasarela chilena), create-intent, webhook Flow, documentación de variables de entorno (`PAYMENT_GATEWAYS_ENV_SETUP.md`), UI checkout (`/admin/checkout` con redirección a Flow).  
**Próximo:** Tests de integración (create-intent, webhook Flow); Mercado Pago y PayPal (gateways + webhooks).

---

## 🔐 Constraints Críticos

### ✅ Phase 6.2 COMPLETADA - Tests de integración pasando (2026-01-27)

```
Phase SaaS 0 (Multi-tenant schema)
    ↓
    ├─→ Tests ejecutados contra SaaS 0
    │   (Phase 6.2: Integración + Multi-tenancy)
    │
    └─→ Si tests PASAN → Mergear a main ✅
        Si tests FALLAN → Arreglar SaaS 0 ❌
```

**Razón:** Validar que aislamiento de datos funciona antes de dejar en producción.

---

## 🚀 Próximos 3 Pasos

### 1️⃣ Phase SaaS 1: Tests de integración (create-intent + webhook Flow)

- **Archivo:** `src/__tests__/integration/api/payments.test.ts`
- Tareas: Ampliar tests (validación de body, 403 sin org, webhook idempotencia si aplica)
- Tiempo: 1-2 horas
- **Estado:** Tests básicos (401, 200/403/500 create-intent, 500 webhook Flow campos faltantes) ya creados

### 2️⃣ Phase SaaS 1: Mercado Pago y PayPal

- Gateways: `src/lib/payments/mercadopago/gateway.ts`, `src/lib/payments/paypal/gateway.ts`
- Webhooks: `src/app/api/webhooks/mercadopago/route.ts`, `src/app/api/webhooks/paypal/route.ts`
- Actualizar `PaymentGatewayFactory` para devolver MercadoPagoGateway y PayPalGateway
- Tiempo: 1-2 días
- **Referencia:** `docs/PAYMENT_GATEWAYS_IMPLEMENTATION_GUIDE.md` secciones 6.2 y 6.3

### 3️⃣ Phase SaaS 1: Gestión de suscripciones y Tier Enforcement

- Tareas: Dashboard de suscripción, cambio de plan, notificaciones, middleware por tier
- Tiempo: ~1 semana
- **Dependencia:** Flow/MP/PayPal operativos

---

## 📚 Archivos de Referencia Rápida

```
root/
├── README.md                          ← Setup del proyecto
└── docs/
    ├── PLAN_MEJORAS_ESTRUCTURALES.md  ← Detalles de cada fase
    ├── PROGRESO_MEJORAS.md            ← Estado actual
    ├── SAAS_IMPLEMENTATION_PLAN.md    ← Arquitectura SaaS ⭐
    ├── SAAS_ONBOARDING_AND_NEW_USER_FLOW.md ← Onboarding / alta nuevo usuario y óptica ⭐
    ├── GIT_BRANCHING_REFERENCE.md     ← Comandos Git ⭐
    ├── SETUP_GUIDE.md                 ← Guía de configuración
    ├── QUICK_SETUP.md                 ← Inicio rápido
    ├── ANALISIS_COMPLETO_PROYECTO.md ← Análisis técnico
    ├── ANALISIS_SISTEMA.md            ← Análisis del sistema
    ├── DOCKER_COMMANDS.md             ← Comandos Docker
    ├── phase-3-completion-summary.md
    ├── PlanDeRefraccionSecciones.md
    └── refactoring/
        ├── CreateWorkOrderForm-analysis.md
        ├── ProductsPage-analysis.md
        ├── SystemPage-analysis.md
        └── ...
```

---

## ✅ Verificación de Setup

Antes de empezar, asegúrate de:

```bash
# 1. Estar en main y actualizado
git checkout main
git pull origin main

# 2. Verificar que el proyecto compila
npm run type-check
npm run lint
npm run build

# 3. Verificar que tests están configurados
npm run test -- --run 2>/dev/null | head -20

# 4. Opcional: Ver branches existentes
git branch -a
```

---

## 🤝 Convención de Comunicación

- **CRÍTICO ⚠️:** Cambios que afectan RLS o schema
- **IMPORTANTE 🟡:** Cambios que afectan múltiples módulos
- **NORMAL ✅:** Cambios normales de funcionalidad
- **DOCUMENTATION 📝:** Solo cambios de documentación

Ejemplo en commit:

```
⚠️ feat: Crear schema de organizations (CRÍTICO: Nuevo componente SaaS)
```

---

## 🆘 Help & Troubleshooting

### "¿Por dónde empiezo?"

→ Leer **PROGRESO_MEJORAS.md**, sección "Próximos Pasos"

### "¿Cómo hago git push?"

→ Ver **GIT_BRANCHING_REFERENCE.md**

### "¿Qué es el plan híbrido?"

→ Leer **SAAS_IMPLEMENTATION_PLAN.md**, sección "Roadmap Detallado"

### "Se rompió algo"

→ Ver **GIT_BRANCHING_REFERENCE.md**, sección "EMERGENCY"

### "¿Cuál es la arquitectura SaaS?"

→ Leer **SAAS_IMPLEMENTATION_PLAN.md**, sección "Arquitectura Multi-Tenancy"

---

## 📞 Quick Links

| Necesito                                     | Archivo                                    |
| -------------------------------------------- | ------------------------------------------ |
| Detalles de una tarea                        | PLAN_MEJORAS_ESTRUCTURALES.md              |
| Saber qué hacer ahora                        | PROGRESO_MEJORAS.md                        |
| Entender arquitectura SaaS                   | SAAS_IMPLEMENTATION_PLAN.md                |
| Flujo onboarding / alta nuevo usuario/óptica | SAAS_ONBOARDING_AND_NEW_USER_FLOW.md ⭐    |
| Comandos git                                 | GIT_BRANCHING_REFERENCE.md                 |
| Fix tests de integración                     | TESTING_INTEGRATION_AUTH_FIX.md ⭐         |
| Resumen rápido de tests                      | NEXT_STEPS_TESTING.md ⭐                   |
| Schema familias de lentes                    | LENS_FAMILIES_AND_MATRICES_SCHEMA.md ⭐    |
| Tour de primera visita                       | ONBOARDING_TOUR_GUIDE.md ⭐                |
| Lentes de contacto                           | CONTACT_LENSES_INTEGRATION_GUIDE.md ⭐     |
| Sistema de IA mejorado                       | AI_IMPLEMENTATION_GUIDE.md ⭐              |
| Estrategia de testing                        | TESTING_STRATEGY_NEW_FEATURES.md ⭐        |
| Sistema de soporte SaaS                      | SAAS_SUPPORT_SYSTEM_PLAN.md ⭐             |
| Implementación soporte SaaS                  | SAAS_SUPPORT_IMPLEMENTATION_COMPLETE.md ⭐ |
| Setup inicial                                | README.md                                  |
| Analizar fase anterior                       | docs/refactoring/                          |

---

## 🎯 Objetivo Final (Fin de Timeline)

```
┌─────────────────────────────────────────────────────────────┐
│                  SAAS PRODUCTION-READY                      │
│                                                              │
│  ✅ Multi-tenancy funcional                                │
│  ✅ Tier system (Basic/Pro/Premium)                        │
│  ✅ Flow integration completada (Chile)                    │
│  ✅ Tests coverage > 70%                                   │
│  ✅ Performance optimizado                                 │
│  ✅ RLS (Row Level Security) validado                     │
│  ✅ Documentación actualizada                              │
│  ✅ Listo para cloud deployment                            │
│                                                              │
│  Timeline: 7-8 semanas a partir de 2026-01-27            │
│  Release estimada: ~2026-03-14                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Última Actualización:** 2026-01-30  
**Estado:** Phase SaaS 1 (Billing) en progreso — Flow + UI checkout listos  
**Estado Actual:** DB, Backend Core, Flow gateway/webhook, doc variables de entorno, UI checkout (`/admin/checkout`), documentación schema familias de lentes  
**✅ COMPLETADO:** Sistema de Soporte SaaS (2026-01-30) - Portal público, paneles root/dev y organizaciones, notificaciones por email, métricas, tests  
**Próximo Paso:** Tests de integración (create-intent, webhook Flow), Mercado Pago y PayPal (gateways + webhooks)
