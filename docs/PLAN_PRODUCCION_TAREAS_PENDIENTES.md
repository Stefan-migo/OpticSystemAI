# Plan de Implementación para Producción - Tareas Pendientes

**Proyecto:** Opttius  
**Fecha:** Febrero 2026  
**Objetivo:** Documentación detallada para completar las tareas pendientes antes de entrar a producción.

---

## 📋 Progreso de Implementación

_Última actualización: 2026-02-01_

| Fase       | Tarea                       | Estado         | Notas                                                            |
| ---------- | --------------------------- | -------------- | ---------------------------------------------------------------- |
| **Fase 1** | Config POS visible          | ✅ Completado  | Botón Configuración en header POS, link a /admin/pos/settings    |
| **Fase 1** | Consolidar páginas POS      | ✅ Completado  | Eliminado duplicado, redirect en /admin/system/pos-settings      |
| **Fase 1** | Tab Boletas y Facturas      | ✅ Completado  | Nuevo tab en Sistema, Acción rápida en Overview                  |
| **Fase 1** | Remover referencias Daluz   | ✅ Completado  | 12 archivos actualizados, migración system_config, env.example   |
| **Fase 2** | Migrar Stripe → Flow/MP     | ✅ Completado  | Migración DB, 10+ archivos actualizados, gateway_subscription_id |
| **Fase 2** | Payflow sandbox             | ✅ Completado  | FLOW_SANDBOX_MODE, MERCADOPAGO_SANDBOX_MODE, docs                |
| **Fase 3** | Gestión total suscripciones | 📋 Documentado | CRUD existe; ver plan para mejoras (historial, acciones masivas) |
| **Fase 3** | Tiers completos             | 📋 Documentado | Schema existe; ver plan para useTierFeature y enforcement        |
| **Fase 4** | Prueba gratuita total       | ✅ Completado  | trial_ends_at, trial_days desde system_config, org creation      |
| **Fase 4** | Bloqueo post-trial          | ✅ Completado  | SubscriptionGuard, subscription-required page, API status        |

---

## Índice

1. [Sistema - Configuración POS](#1-sistema---configuración-pos)
2. [Sistema - Configuración Boletas y Facturas](#2-sistema---configuración-boletas-y-facturas)
3. [Sistema - Remover Información Daluz](#3-sistema---remover-información-daluz)
4. [Pasarelas de Pago - Migrar de Stripe a Flow/Mercado Pago](#4-pasarelas-de-pago---migrar-de-stripe-a-flowmercado-pago)
5. [Payflow con Sandboxes](#5-payflow-con-sandboxes)
6. [Gestión Total de Suscripciones (SaaS)](#6-gestión-total-de-suscripciones-saas)
7. [Funcionalidad Total de Tiers](#7-funcionalidad-total-de-tiers)
8. [Prueba Gratuita - Funcionalidad Total](#8-prueba-gratuita---funcionalidad-total)
9. [Lógica Post-Trial - Bloqueo e Invitación a Pago](#9-lógica-post-trial---bloqueo-e-invitación-a-pago)
10. [Orden de Ejecución Recomendado](#10-orden-de-ejecución-recomendado)

---

## 1. Sistema - Configuración POS

### Estado Actual

- **API:** `/api/admin/pos/settings` existe (GET/PUT)
- **Tabla:** `pos_settings` existe con `min_deposit_percent`, `min_deposit_amount` por branch
- **Función DB:** `get_min_deposit` usa `pos_settings` por branch
- **Páginas existentes:**
  - `src/app/admin/pos/settings/page.tsx` - Configuración min depósito (funcional)
  - `src/app/admin/system/pos-settings/page.tsx` - Duplicado (mismo contenido)

### Problema

La opción de **Configuración POS** no está visible en el menú de navegación. Los usuarios no pueden acceder a `/admin/pos/settings`.

### Plan de Implementación

#### Paso 1.1: Agregar enlace en navegación

**Archivo:** `src/app/admin/layout.tsx`

- Opción A (recomendada): Agregar enlace en el menú lateral dentro de "Punto de Venta" (sub-item o link directo).
- Opción B: Agregar botón "Configuración" en la página del POS (`/admin/pos`) que lleve a `/admin/pos/settings`.
- Opción C: Agregar un tab o botón en la sección Sistema que lleve a Configuración POS.

**Implementación sugerida (Opción B - más pragmática):**

1. En `src/app/admin/pos/page.tsx`, agregar un `Link` o `Button` con icono `Settings` en el header que navegue a `/admin/pos/settings`.
2. Alternativamente, en el sidebar, agregar un item secundario debajo de "Punto de Venta":
   ```tsx
   // En createNavigationItems o estructura similar
   { href: "/admin/pos/settings", label: "Config. POS", ... }
   ```

#### Paso 1.2: Consolidar páginas duplicadas

- **Eliminar:** `src/app/admin/system/pos-settings/page.tsx` (duplicado).
- **Mantener:** `src/app/admin/pos/settings/page.tsx` como única fuente de configuración POS.
- Si existían enlaces a `/admin/system/pos-settings`, redirigir a `/admin/pos/settings`.

#### Paso 1.3: Verificar API y RLS

- Confirmar que `pos_settings` tiene políticas RLS para admins de la sucursal.
- Verificar que `get_min_deposit` en `process-sale` recibe correctamente `branch_id`.

**Archivos clave:**

- `src/app/admin/layout.tsx` - Navegación
- `src/app/admin/pos/page.tsx` - Botón/link a settings
- `src/app/admin/pos/settings/page.tsx` - Página de configuración
- `src/app/api/admin/pos/settings/route.ts` - API

---

## 2. Sistema - Configuración Boletas y Facturas

### Estado Actual

- **Página:** `src/app/admin/system/pos-billing-settings/page.tsx` existe y contiene:
  - Configuración POS (min deposit) + Configuración de Boletas en una sola página.
- **API:** Usa `/api/admin/pos/settings` para ambos (pos y billing).
- **Configuración de boletas:** `default_document_type` (boleta/factura), header text, términos y condiciones.
- **Formato de impresión:** Hay sección "Configura el formato de impresión para boletas y facturas" con opciones básicas.

### Problema

1. La página no está enlazada desde la navegación principal.
2. Falta configuración para distintos formatos de impresión (térmica, tradicional, etc.).

### Plan de Implementación

#### Paso 2.1: Exponer en navegación

- Agregar enlace a `/admin/system/pos-billing-settings` desde:
  - Tab "Configuración" en Sistema, o
  - SystemOverview "Acciones Rápidas", o
  - Un nuevo tab "Facturación" en la página Sistema.

**Implementación sugerida:**

En `src/app/admin/system/page.tsx`, agregar un nuevo `TabsTrigger`:

```tsx
<TabsTrigger value="billing" className="flex-1">
  <Receipt className="h-4 w-4 mr-1" />
  Boletas y Facturas
</TabsTrigger>
```

Y un `TabsContent` que renderice la página de pos-billing-settings o su contenido como componente.

#### Paso 2.2: Extender schema de configuración de impresión

**Tabla actual (o system_config):** Extender para soportar:

| Clave            | Tipo    | Descripción                                |
| ---------------- | ------- | ------------------------------------------ |
| `print_format`   | enum    | `thermal_58`, `thermal_80`, `a4`, `letter` |
| `paper_width_mm` | number  | Ancho en mm (58, 80, 210, etc.)            |
| `print_logo`     | boolean | Incluir logo en boleta                     |
| `print_header`   | string  | Texto encabezado                           |
| `print_footer`   | string  | Texto pie                                  |

**Migración SQL:**

```sql
-- En pos_settings o billing_settings (según estructura actual)
ALTER TABLE pos_settings ADD COLUMN IF NOT EXISTS print_format TEXT DEFAULT 'thermal_80';
ALTER TABLE pos_settings ADD COLUMN IF NOT EXISTS paper_width_mm INTEGER DEFAULT 80;
-- O usar system_config si es global
```

#### Paso 2.3: UI para formatos de impresión

- Dropdown: "Formato de impresión"
  - Impresora térmica 58mm
  - Impresora térmica 80mm
  - Impresora tradicional A4
  - Impresora tradicional Carta
- Actualizar `src/lib/billing/pdf-generator.ts` para usar estas configuraciones al generar PDFs.
- Integrar con librerías de impresión directa si se requiere (ej. navegador `window.print()` con CSS `@media print` para diferentes anchos).

**Archivos clave:**

- `src/app/admin/system/pos-billing-settings/page.tsx`
- `src/app/admin/system/page.tsx` - Tabs
- `src/lib/billing/pdf-generator.ts`
- `src/app/api/admin/pos/settings/route.ts` (extender body)

---

## 3. Sistema - Remover Información Daluz

### Estado Actual

Referencias a "Daluz" / "daluzconsciente.com" encontradas en:

| Archivo                                                            | Contenido                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `src/lib/email/templates/support.ts`                               | URLs, emails contacto@daluzconsciente.com, soporte@daluzconsciente.com     |
| `src/lib/email/templates.ts`                                       | Argentina \| contacto@daluzconsciente.com                                  |
| `src/lib/email/template-utils.ts`                                  | support_email, contact_email, domain daluzconsciente.com                   |
| `src/lib/email/notifications.ts`                                   | Fallback contacto@daluzconsciente.com                                      |
| `src/lib/email/client.ts`                                          | from, replyTo, domain                                                      |
| `src/lib/api/middleware.ts`                                        | CORS daluzconsciente.com                                                   |
| `src/components/admin/SEOManager.tsx`                              | placeholder @daluzconsciente                                               |
| `src/components/admin/EmailTemplateEditor.tsx`                     | description, access_url, reset_link daluzconsciente.com                    |
| `src/app/api/admin/system/email-templates/[id]/test/route.ts`      | soporte@daluz.com                                                          |
| `src/components/admin/PaymentConfig.tsx`                           | URL daluzconsciente.com                                                    |
| `src/app/api/admin/system/webhooks/status/route.ts`                | host daluzconsciente.com                                                   |
| `supabase/migrations/20250116210000_create_system_admin_tools.sql` | system_config: site_name "DA LUZ CONSCIENTE", contact_email, support_email |
| `supabase/migrations/20250116000001_fix_admin_profile.sql`         | daluzalkimya@gmail.com (admin seed)                                        |
| `.env.example`                                                     | RESEND_FROM_EMAIL                                                          |

### Plan de Implementación

#### Paso 3.1: Migración de system_config

Crear migración que actualice valores por defecto a Opttius:

```sql
-- 20260201000010_replace_daluz_with_opttius.sql
UPDATE public.system_config
SET config_value = '"Opttius"'
WHERE config_key = 'site_name' AND config_value::text LIKE '%DA LUZ%';

UPDATE public.system_config
SET config_value = '"contacto@opttius.com"'
WHERE config_key = 'contact_email';

UPDATE public.system_config
SET config_value = '"soporte@opttius.com"'
WHERE config_key = 'support_email';

UPDATE public.system_config
SET config_value = '"Gestión óptica profesional"'
WHERE config_key = 'site_description' AND config_value::text LIKE '%Biocosmética%';
```

#### Paso 3.2: Reemplazar hardcodes en código

| Archivo                                                       | Cambio                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/lib/email/client.ts`                                     | `from: process.env.RESEND_FROM_EMAIL \|\| "noreply@opttius.com"`         |
| `src/lib/email/template-utils.ts`                             | Usar `process.env.NEXT_PUBLIC_APP_URL` y variables de negocio (no daluz) |
| `src/lib/email/templates/support.ts`                          | Reemplazar daluzconsciente.com por `${process.env.NEXT_PUBLIC_APP_URL}`  |
| `src/lib/email/templates.ts`                                  | Usar variable de configuración                                           |
| `src/lib/email/notifications.ts`                              | Fallback a system_config o env                                           |
| `src/lib/api/middleware.ts`                                   | Agregar dominio Opttius, remover daluz si no se usa                      |
| `src/components/admin/SEOManager.tsx`                         | placeholder "@opttius"                                                   |
| `src/components/admin/EmailTemplateEditor.tsx`                | URLs de ejemplo con opttius.com                                          |
| `src/app/api/admin/system/email-templates/[id]/test/route.ts` | soporte@opttius.com                                                      |
| `src/components/admin/PaymentConfig.tsx`                      | URL producción Opttius                                                   |
| `src/app/api/admin/system/webhooks/status/route.ts`           | Host Opttius                                                             |
| `.env.example`                                                | RESEND_FROM_EMAIL=noreply@opttius.com                                    |

#### Paso 3.3: Migraciones con daluzalkimya@gmail.com

- **No modificar** migraciones históricas que crean admin (podrían romper historia).
- Si se requiere un admin inicial para Opttius, crear una **nueva** migración que inserte/actualice con el email correcto del equipo Opttius.
- Documentar que `daluzalkimya@gmail.com` fue el seed original; en producción se usará otro email.

**Orden sugerido:** Crear un script `scripts/replace-daluz-references.sh` o usar search-replace para no olvidar ningún archivo.

---

## 4. Pasarelas de Pago - Migrar de Stripe a Flow/Mercado Pago

### Estado Actual

- **Base de datos:** Ya migrada de `stripe` a `flow` en `payments` y `webhook_events` (migración 20260129000001).
- **Tabla subscriptions:** Aún usa columnas `stripe_subscription_id`, `stripe_customer_id`.
- **Código:** Varias referencias a "Stripe" en saas-management, analytics, organizations.
- **Pasarelas implementadas:** Flow, Mercado Pago, PayPal (según `PAYMENT_GATEWAYS_IMPLEMENTATION_GUIDE.md`).

### Plan de Implementación

#### Paso 4.1: Migración de columnas en subscriptions

```sql
-- 20260201000011_subscriptions_gateway_agnostic.sql
-- Renombrar columnas para ser gateway-agnósticas
ALTER TABLE public.subscriptions
  RENAME COLUMN stripe_subscription_id TO gateway_subscription_id;

ALTER TABLE public.subscriptions
  RENAME COLUMN stripe_customer_id TO gateway_customer_id;

-- Agregar columna gateway para saber qué pasarela usa
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'flow' CHECK (gateway IN ('flow', 'mercadopago', 'paypal'));
```

#### Paso 4.2: Actualizar código - reemplazar referencias Stripe

**Archivos a modificar:**

| Archivo                                                                       | Cambios                                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/app/api/admin/saas-management/subscriptions/[id]/route.ts`               | `stripe_subscription_id` → `gateway_subscription_id`                               |
| `src/app/api/admin/saas-management/subscriptions/[id]/actions/route.ts`       | Remover case `sync_stripe`, implementar `sync_flow` / `sync_mercadopago` si aplica |
| `src/app/api/admin/saas-management/organizations/route.ts`                    | `stripe_subscription_id` → `gateway_subscription_id`                               |
| `src/app/api/admin/saas-management/organizations/[id]/route.ts`               | idem                                                                               |
| `src/app/api/admin/saas-management/organizations/[id]/subscriptions/route.ts` | idem                                                                               |
| `src/app/api/admin/saas-management/analytics/route.ts`                        | `stripe_subscription_id` → `gateway_subscription_id`                               |
| `src/app/admin/saas-management/subscriptions/page.tsx`                        | UI: "Stripe ID" → "ID Pasarela"                                                    |
| `src/app/admin/saas-management/subscriptions/[id]/page.tsx`                   | idem                                                                               |
| `src/app/admin/saas-management/organizations/[id]/page.tsx`                   | Formularios: Stripe Subscription ID → Gateway Subscription ID                      |
| `docs/PAYMENT_GATEWAYS_IMPLEMENTATION_GUIDE.md`                               | Actualizar referencias Stripe                                                      |

#### Paso 4.3: Actualizar README de billing

- `src/lib/saas/billing/README.md`: Cambiar "Stripe" por "Flow / Mercado Pago".

#### Paso 4.4: Verificar integración Flow y Mercado Pago

- Revisar que `src/lib/payments/flow/gateway.ts` y `mercadopago/gateway.ts` estén completos.
- Verificar webhooks: `/api/webhooks/flow`, `/api/webhooks/mercadopago`.
- Asegurar que `create-intent` soporta ambos gateways según configuración de organización.

---

## 5. Payflow con Sandboxes

### Estado Actual

- Página `/admin/checkout` existe con `CheckoutForm`.
- Flow, Mercado Pago y PayPal tienen gateways implementados.
- Falta ambiente sandbox explícito y flujo de prueba end-to-end.

### Plan de Implementación

#### Paso 5.1: Variables de entorno para sandbox

```
# .env.example - Agregar sección
# Payment Gateways - Sandbox
FLOW_SANDBOX_MODE=true
FLOW_API_KEY_SANDBOX=...
FLOW_SECRET_KEY_SANDBOX=...
MERCADOPAGO_SANDBOX_MODE=true
MERCADOPAGO_ACCESS_TOKEN_SANDBOX=...
```

#### Paso 5.2: Lógica de sandbox en gateways

- En `src/lib/payments/flow/gateway.ts`: Si `process.env.FLOW_SANDBOX_MODE === 'true'`, usar credenciales sandbox.
- En `src/lib/payments/mercadopago/gateway.ts`: Idem con `MERCADOPAGO_SANDBOX_MODE`.
- Documentar URLs de sandbox de Flow (Chile) y Mercado Pago.

#### Paso 5.3: Página de prueba de Payflow

- Crear `/admin/checkout/sandbox` (solo visible para root/super_admin) con:
  - Selector de pasarela (Flow / Mercado Pago)
  - Monto de prueba
  - Botón "Probar pago"
  - Instrucciones para usar tarjetas de prueba de cada pasarela
- O agregar toggle "Modo sandbox" en `/admin/checkout` cuando el usuario es root.

#### Paso 5.4: Documentación de tarjetas de prueba

- Flow: Consultar documentación Flow Chile para tarjetas de prueba.
- Mercado Pago: Usar tarjetas de prueba oficiales (ej. 5031 7557 3453 0604, etc.).
- Crear `docs/PAYFLOW_SANDBOX_TESTING.md` con instrucciones.

**Archivos clave:**

- `src/lib/payments/flow/gateway.ts`
- `src/lib/payments/mercadopago/gateway.ts`
- `src/app/admin/checkout/page.tsx` o nueva página sandbox
- `docs/PAYMENT_GATEWAYS_ENV_SETUP.md`

---

## 6. Gestión Total de Suscripciones (SaaS)

### Estado Actual

- Sección "Gestión SaaS Opttius" existe para usuario root.
- Páginas: Dashboard, Organizations, Subscriptions, Tiers, Users, Support.
- CRUD básico de organizaciones y suscripciones.
- Falta: crear suscripción desde cero, cambiar tier, renovar, cancelar, aplicar descuentos, histórico de pagos.

### Plan de Implementación

#### Paso 6.1: CRUD completo de suscripciones

- **Crear suscripción:** Desde org sin suscripción activa. Formulario: tier, período, gateway, monto.
- **Editar suscripción:** Cambiar tier, extender período, cambiar estado.
- **Cancelar suscripción:** Botón que setea `cancel_at` y status `cancelled`.
- **Renovar:** Crear nuevo período (o extender `current_period_end`).

#### Paso 6.2: Historial de pagos

- Tabla `payment_history` o usar `payments` existente vinculada a `subscriptions` (si aplica).
- En `/admin/saas-management/subscriptions/[id]` mostrar historial de pagos.
- Si no hay integración automática con Flow/MP, permitir registro manual de pago (monto, fecha, referencia).

#### Paso 6.3: Acciones masivas

- Desde lista de organizaciones: suspender, reactivar, cambiar tier en lote.
- Exportar lista de organizaciones con estado de suscripción.

#### Paso 6.4: Panel de métricas

- MRR (Monthly Recurring Revenue)
- Churn rate
- Trials activos, conversiones
- Próximas renovaciones

**Archivos clave:**

- `src/app/admin/saas-management/subscriptions/page.tsx`
- `src/app/admin/saas-management/subscriptions/[id]/page.tsx`
- `src/app/admin/saas-management/organizations/[id]/page.tsx`
- APIs en `src/app/api/admin/saas-management/`

---

## 7. Funcionalidad Total de Tiers

### Estado Actual

- Tabla `subscription_tiers` con: name, price_monthly, max_branches, max_users, max_customers, max_products, features (JSONB).
- `organizations.subscription_tier` referencia basic|pro|premium.
- No hay enforcement en runtime: el sistema no bloquea acciones según tier.

### Plan de Implementación

#### Paso 7.1: Definir features por tier

Documentar en código y DB:

```json
{
  "basic": {
    "pos": true,
    "appointments": true,
    "quotes": true,
    "work_orders": true,
    "products": true,
    "customers": true,
    "analytics": true,
    "branches": 1,
    "users": 2,
    "customers_limit": 500,
    "products_limit": 100,
    "ai_insights": false,
    "support_tickets": false,
    "api_access": false
  },
  "pro": {
    "branches": 3,
    "users": 5,
    "customers_limit": 2000,
    "products_limit": 500,
    "ai_insights": true,
    "support_tickets": true
  },
  "premium": {
    "branches": 20,
    "users": 50,
    "customers_limit": null,
    "products_limit": null,
    "ai_insights": true,
    "support_tickets": true,
    "api_access": true
  }
}
```

#### Paso 7.2: Hook/helper de verificación

Crear `src/hooks/useTierFeature.ts`:

```ts
export function useTierFeature(feature: string): boolean {
  const { organization } = useOrganization(); // o similar
  const tier = organization?.subscription_tier || "basic";
  return TIER_FEATURES[tier]?.[feature] ?? false;
}
```

#### Paso 7.3: Aplicar restricciones en UI

- Ocultar o deshabilitar secciones según tier (ej. Soporte solo en pro+).
- Mostrar mensaje "Upgrade para desbloquear" en features premium.
- En navegación: filtrar items según `useTierFeature`.

#### Paso 7.4: Aplicar restricciones en API

- Middleware o wrapper en rutas sensibles: verificar límites (branches, users, customers, products).
- Retornar 403 con mensaje claro si se excede límite.
- Usar `get_user_organization_id` y consultar tier desde `organizations`.

#### Paso 7.5: Página de Tiers

- En `/admin/saas-management/tiers`: CRUD de tiers (solo root).
- Permitir editar `features` JSON, precios, límites.
- Vista comparativa para mostrar a clientes.

**Archivos clave:**

- `src/hooks/useTierFeature.ts` (nuevo)
- `src/lib/saas/tiers.ts` (definiciones)
- `src/app/admin/layout.tsx` (filtrar nav)
- Rutas API (middleware de tier)
- `src/app/admin/saas-management/tiers/page.tsx`

---

## 8. Prueba Gratuita - Funcionalidad Total

### Estado Actual

- `system_config.membership_trial_days` = 7 (configurable desde Configuración).
- Al crear organización, se crea subscription con status `trialing`.
- No hay `trial_ends_at` explícito en subscriptions; se infiere de `current_period_end` o falta.
- No hay override por organización.

### Plan de Implementación

#### Paso 8.1: Schema de trial

```sql
-- En subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_days_override INTEGER; -- NULL = usar default del sistema
```

#### Paso 8.2: Lógica al crear organización

- Obtener `trial_days` = `organizations.trial_days_override ?? system_config.membership_trial_days ?? 7`.
- Calcular `trial_ends_at = NOW() + trial_days`.
- Crear subscription con `status = 'trialing'`, `current_period_end = trial_ends_at`.

#### Paso 8.3: Configuración global

- En tab Configuración (Sistema): campo "Días de prueba gratuita por defecto" (ya existe como `membership_trial_days`).
- Validar: mínimo 1, máximo 90 (o configurable).

#### Paso 8.4: Override por organización

- En `/admin/saas-management/organizations/[id]`: campo opcional "Días de prueba (override)".
- Si se define, usar ese valor para organizaciones nuevas o para extender trial de una existente.
- Botón "Extender trial X días" para dar más tiempo manualmente.

**Archivos clave:**

- `src/app/api/admin/organizations/route.ts` (crear org)
- `src/app/api/admin/onboarding/activate-real-org` (si aplica)
- `src/app/admin/saas-management/organizations/[id]/page.tsx`
- `src/app/admin/system/components/SystemConfig.tsx` (membership_trial_days)

---

## 9. Lógica Post-Trial - Bloqueo e Invitación a Pago

### Estado Actual

- No hay bloqueo cuando el trial termina.
- No hay pantalla de "Tu prueba ha terminado, suscríbete".

### Plan de Implementación

#### Paso 9.1: Verificación de suscripción activa

- Crear `src/lib/saas/subscription-status.ts`:
  - `getSubscriptionStatus(organizationId)`: retorna `active` | `trialing` | `expired` | `past_due` | `cancelled`.
  - `isTrialExpired(organizationId)`: true si `trialing` y `trial_ends_at < NOW()`.

#### Paso 9.2: Middleware o layout check

- En `admin/layout.tsx` o en un wrapper de rutas admin:
  - Antes de renderizar contenido, verificar estado de suscripción.
  - Si `expired` o trial expirado: no renderizar dashboard, mostrar pantalla de bloqueo.

#### Paso 9.3: Pantalla de bloqueo

Crear `/admin/subscription-required` o componente `SubscriptionExpiredBanner`:

- Mensaje: "Tu período de prueba ha terminado. Suscríbete para continuar usando Opttius."
- Botón principal: "Suscribirme ahora" → redirige a payflow (checkout).
- Botón secundario: "Contactar soporte" → abre modal o redirige a página de soporte para solicitar suscripción manual.
- Si payflow no está disponible: mostrar solo "Contactar soporte" con email/chat.

#### Paso 9.4: Variable de disponibilidad del Payflow

- `NEXT_PUBLIC_PAYFLOW_ENABLED=true|false`.
- Si false: en pantalla de bloqueo, no mostrar "Suscribirme ahora", solo "Contactar soporte".
- Soporte manual: email a ventas@opttius.com o similar, o formulario de contacto.

#### Paso 9.5: Recordatorios pre-expiracion

- Job o cron que envía email X días antes de que termine el trial (usar `membership_reminder_days`).
- Template de email: "Tu prueba termina en X días. Suscríbete para no perder acceso."

**Archivos clave:**

- `src/lib/saas/subscription-status.ts` (nuevo)
- `src/app/admin/layout.tsx` - Check de suscripción
- `src/app/admin/subscription-required/page.tsx` (nuevo)
- Componente `SubscriptionExpiredBanner`
- Emails: template de recordatorio y de trial expirado

---

## 10. Orden de Ejecución Recomendado

Para una implementación limpia y secuencial:

| Fase                    | Tareas                                                             | Dependencias | Prioridad |
| ----------------------- | ------------------------------------------------------------------ | ------------ | --------- |
| **Fase 1 - Quick Wins** | 1. Config POS visible, 2. Tab Boletas en Sistema, 3. Remover Daluz | Ninguna      | Alta      |
| **Fase 2 - Pasarelas**  | 4. Migrar Stripe → Flow/MP, 5. Payflow sandbox                     | Ninguna      | Alta      |
| **Fase 3 - SaaS Core**  | 6. Gestión total suscripciones, 7. Tiers completos                 | Fase 2       | Alta      |
| **Fase 4 - Trial**      | 8. Prueba gratuita total, 9. Bloqueo post-trial                    | Fase 3       | Alta      |

### Timeline sugerido

- **Fase 1:** 2-3 días
- **Fase 2:** 3-4 días
- **Fase 3:** 4-5 días
- **Fase 4:** 3-4 días

**Total estimado:** 12-16 días de desarrollo.

---

## Anexo: Checklist de Producción

- [ ] Configuración POS accesible y funcional
- [ ] Boletas/facturas con formatos de impresión
- [ ] Sin referencias a Daluz en código ni system_config
- [ ] Stripe eliminado; solo Flow y Mercado Pago
- [ ] Payflow con sandbox probado
- [ ] Gestión de suscripciones completa (root)
- [ ] Tiers aplicados en UI y API
- [ ] Trial 7 días (configurable) + override por org
- [ ] Bloqueo post-trial con opción payflow o soporte
- [ ] Variables de entorno documentadas (PAYMENT_GATEWAYS_ENV_SETUP.md)
- [ ] Tests críticos para payflow y tiers

---

_Documento generado para Opttius - Plan de Producción_
