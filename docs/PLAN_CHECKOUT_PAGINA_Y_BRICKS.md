# Plan: Checkout en `/checkout` y pago en página (Checkout API / Bricks)

Este documento detalla el diagnóstico de los logs del servidor, las correcciones aplicadas al flujo actual (Checkout Pro + webhook) y el plan paso a paso para mover el checkout a `/checkout` (fuera de `/admin`) e implementar el pago en la misma página con Checkout API / Bricks de Mercado Pago.

---

## 1. Diagnóstico de los logs del servidor

### 1.1 Webhook rechazado: "Timestamp too old"

**Log:**

```text
{"level":"warn","msg":"Webhook timestamp too old","timestamp":1770058740,"now":1770058740411,"diff":1768288681671}
POST /api/webhooks/mercadopago?data.id=1344384249&type=payment 401
```

**Causa:** Mercado Pago envía el header `x-signature` con `ts` en **segundos** (Unix timestamp). El código comparaba `ts` con `Date.now()` (milisegundos), por lo que la diferencia era enorme y se rechazaba el webhook.

**Corrección aplicada:** En `src/lib/payments/mercadopago/webhook-validator.ts` se usa `Math.floor(Date.now() / 1000)` para comparar en segundos y `maxDiff = 5 * 60` (segundos).

### 1.2 Webhook rechazado: "Signature mismatch" (merchant_order)

**Log:**

```text
{"level":"warn","expected":"c11fae0aa...","computed":"83a856895...","manifest":"id:37835350960;request-id:...;ts:1770058798;","msg":"Webhook signature validation failed"}
POST /api/webhooks/mercadopago?id=37835350960&topic=merchant_order 401
```

**Causa:** Para notificaciones con `topic=merchant_order`, el manifest o el id que MP usa para firmar puede diferir. Actualmente solo procesamos `topic=payment`; las de `merchant_order` se validan igual pero no se usan para actualizar pagos.

**Estado:** El flujo de pago se basa en `topic=payment`. Si en el futuro se quiere usar `merchant_order`, habrá que revisar la documentación de MP para el formato exacto del manifest por tipo de notificación.

### 1.3 Create intent y redirect correctos

**Logs:**

- Payment record created: `e7433076-f7bc-4e6e-9831-47b5a58114ac`
- Preference created: `127257690-eaed33df-3fb7-4796-b75d-816f0d1e4528`
- Redirect a resultado: `preference_id=127257690-eaed33df-3fb7-4796-b75d-816f0d1e4528`

La búsqueda del pago interno se hace por `gateway_payment_intent_id` = preference_id. Se aseguró que el webhook tome el preference_id desde `order.id` o `preference_id` de la respuesta del GET payment de MP.

### 1.4 Suscripción / tier no se actualizaban

**Causa:** Tras un pago aprobado, solo se actualizaba el estado del pago y, si existía, la orden. No había lógica para actualizar `organizations.subscription_tier` ni la tabla `subscriptions`.

**Corrección aplicada:** Se añadió `PaymentService.applyPaymentSuccessToOrganization()` y se invoca desde el webhook de Mercado Pago cuando el pago es `succeeded`. Así se actualiza el tier de la organización (por metadata o por monto) y se crea/actualiza el registro en `subscriptions`.

---

## 2. Correcciones ya implementadas (resumen)

| Tarea                      | Archivo(s)                                            | Descripción                                                                    |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| Timestamp webhook          | `webhook-validator.ts`                                | Comparar `ts` en segundos con `nowSec` y `maxDiff` en segundos.                |
| Preference ID en webhook   | `mercadopago/gateway.ts`                              | Obtener preference_id de `order.id` o `preference_id` del payment.             |
| CSP font-src               | `next.config.js`, `middleware.ts`                     | Añadir `https://http2.mlstatic.com` a `font-src` para Bricks.                  |
| Actualizar org/suscripción | `payment-service.ts`, `webhooks/mercadopago/route.ts` | `applyPaymentSuccessToOrganization()` y llamada desde webhook al aprobar pago. |

---

## 3. Objetivo: Checkout en `/checkout` y pago en página

- **Ruta pública:** `/checkout` (y `/checkout/result`), fuera de `/admin`.
- **Flujo:** El usuario elige plan/tier, introduce datos de pago en la misma página (Bricks) y el backend cobra con Checkout API; no redirección a Mercado Pago.
- **Requisitos:** Intuitivo, seguro y funcional; opcionalmente guardar método de pago y suscripciones recurrentes.

---

## 4. Arquitectura objetivo

```
[Usuario] → /checkout (público o con sesión según negocio)
         → Elige tier / monto
         → Backend: POST /api/checkout/create-intent (crea payment intent según gateway)
         → Si Mercado Pago Bricks: se muestra Card Payment Brick (o Wallet Brick)
         → Usuario paga en página → Backend: POST /api/checkout/confirm-payment (token/id de Bricks)
         → Backend llama a MP Payments API → Webhook MP actualiza estado y org/suscripción
         → Redirección o estado en /checkout/result
```

- **Checkout Pro (actual):** Crear preferencia → redirigir a MP → volver a `back_url`.
- **Checkout API / Bricks:** Crear pago con token o payment_method_id en tu backend; el usuario no sale de tu dominio.

---

## 5. Tareas paso a paso

### Fase A: Mover checkout a `/checkout` (manteniendo Checkout Pro)

1. **Rutas y páginas**
   - Crear `src/app/checkout/page.tsx`: página principal de checkout (sin layout de admin).
   - Crear `src/app/checkout/result/page.tsx`: resultado de pago (éxito / fallo / pendiente).
   - Definir layout público para `/checkout` (por ejemplo `src/app/checkout/layout.tsx`) con header mínimo y sin sidebar de admin.

2. **APIs públicas o con sesión**
   - Crear `GET /api/checkout/tiers`: devolver tiers (puede ser público o requerir sesión).
   - Crear `POST /api/checkout/create-intent`: mismo contrato que el actual create-intent pero bajo `/api/checkout/`. Decidir si requiere sesión (cookie/JWT) y cómo obtener `organization_id` (sesión, query, body).
   - Mantener `POST/GET /api/webhooks/mercadopago` sin cambios de URL.

3. **Redirecciones y back_urls**
   - En el gateway de Mercado Pago, usar `baseUrl/checkout/result` para success/failure/pending en lugar de `admin/checkout/result`.
   - Actualizar cualquier enlace interno: de `/admin/checkout` a `/checkout` (emails, SubscriptionGuard, SubscriptionManagementSection, layout admin, etc.).

4. **Autenticación y autorización**
   - Definir si `/checkout` es solo para usuarios autenticados o también invitados. Si es solo autenticados, redirigir a login cuando no haya sesión y, tras login, volver a `/checkout`.
   - En `create-intent`, obtener `user_id` y `organization_id` desde la sesión (o desde token/body si se usa otro flujo).

5. **Deprecar rutas bajo admin**
   - Redirigir `/admin/checkout` → `/checkout` (redirect 308 o 302).
   - Redirigir `/admin/checkout/result` → `/checkout/result` (y preservar query params si aplica).
   - Actualizar referencias en el código a las nuevas rutas.

### Fase B: Checkout API / Bricks (pago en página)

6. **Backend: Payments API de MP**
   - Documentar y usar el endpoint de MP para crear un pago con token o payment_method_id (Checkout API), no solo preferencias.
   - Crear `POST /api/checkout/confirm-payment`: recibe token (o payment_method_id), amount, currency, organization_id, user_id, tier opcional; llama a MP para crear el pago; crea/actualiza registro en `payments` y devuelve estado.

7. **Frontend: Card Payment Brick (o Wallet Brick)**
   - En la página `/checkout`, tras obtener un “intent” o configuración (por ejemplo amount, public key), inicializar el Brick de MP (Card Payment Brick o el que corresponda) con la public key (sandbox/producción según env).
   - Al enviar el formulario del Brick, obtener token o payment_method_id y llamar a `POST /api/checkout/confirm-payment` con ese dato y el resto del contexto (amount, tier, etc.).
   - Mostrar loading y mensaje de éxito/error sin redirigir a MP; en éxito, redirigir a `/checkout/result?success=1` o mostrar estado en la misma página.

8. **Seguridad y CSP**
   - Mantener CSP actualizado para scripts y frames de MP (ya se añadió `http2.mlstatic.com` para scripts, frames y fonts).
   - No exponer access token en el frontend; solo public key. El token solo en backend.

9. **Webhook y estado**
   - El webhook actual ya actualiza pago y organización/suscripción. Asegurar que los pagos creados por Checkout API (confirm-payment) tengan `gateway_payment_intent_id` o identificador que permita asociar la notificación de MP al registro interno (por ejemplo por payment_id de MP).

10. **Metadata y tier**
    - Al crear el pago (preferencia o payment), incluir en metadata `subscription_tier` cuando se sepa (por ejemplo el tier elegido en checkout) para que `applyPaymentSuccessToOrganization` pueda usarlo sin depender solo del monto.

### Fase C: Opcionales (guardar tarjeta, suscripciones recurrentes)

11. **Guardar método de pago**
    - Si MP lo permite (customer + payment_method_id), crear cliente en MP y asociar el método; guardar `gateway_customer_id` y `payment_method_id` en tu modelo (por ejemplo en `subscriptions` o tabla de payment_methods) para cobros futuros.

12. **Suscripciones recurrentes**
    - Usar la API de Suscripciones de Mercado Pago para planes recurrentes: crear plan, asociar método de pago y dejar que MP cobre automáticamente. Sincronizar estado con la tabla `subscriptions` y con `organizations.subscription_tier` vía webhooks de suscripción.

---

## 6. Flujo de pago intuitivo y seguro (diseño)

1. Usuario entra a `/checkout` (con o sin sesión según diseño).
2. Si requiere sesión y no está logueado → redirigir a login y volver a `/checkout`.
3. Mostrar planes/tiers (desde `GET /api/checkout/tiers`) y permitir elegir uno.
4. Mostrar resumen (tier, precio, moneda) y el Brick de pago (tarjeta o wallet).
5. Usuario completa datos en el Brick; al enviar, frontend obtiene token/id y llama a `POST /api/checkout/confirm-payment`.
6. Backend crea pago en MP, guarda en `payments` y devuelve éxito o error.
7. En éxito: redirigir a `/checkout/result?success=1` (y opcionalmente payment_id). En error: mostrar mensaje en la misma página sin redirigir.
8. Webhook de MP actualiza estado del pago y ejecuta `applyPaymentSuccessToOrganization` para tier y suscripción.

---

## 7. Archivos y rutas a crear/modificar (resumen)

| Acción    | Ruta o archivo                                                             |
| --------- | -------------------------------------------------------------------------- |
| Crear     | `src/app/checkout/page.tsx`                                                |
| Crear     | `src/app/checkout/result/page.tsx`                                         |
| Crear     | `src/app/checkout/layout.tsx` (opcional)                                   |
| Crear     | `src/app/api/checkout/tiers/route.ts` (o reutilizar lógica de admin)       |
| Crear     | `src/app/api/checkout/create-intent/route.ts` (o alias)                    |
| Crear     | `src/app/api/checkout/confirm-payment/route.ts` (para Bricks/Checkout API) |
| Modificar | `src/lib/payments/mercadopago/gateway.ts` – back_urls a `/checkout/result` |
| Modificar | Enlaces y redirects de `/admin/checkout` → `/checkout`                     |
| Modificar | SubscriptionGuard, SubscriptionManagementSection, layout admin             |
| Redirigir | `src/app/admin/checkout/page.tsx` → redirect a `/checkout`                 |
| Redirigir | `src/app/admin/checkout/result/page.tsx` → redirect a `/checkout/result`   |

---

## 8. Referencias

- [Checkout Bricks – Mercado Pago](https://www.mercadopago.com.ar/developers/en/docs/checkout-bricks/landing)
- [Checkout API – Mercado Pago](https://www.mercadopago.com.ar/developers/en/docs/checkout-api/landing)
- [Payments API – Get Payment](https://www.mercadopago.com.ar/developers/en/reference/payments/_payments_id/get)
- Documentación interna: `docs/INTEGRACION_MERCADOPAGO_DEFINITIVA.md`, `docs/MERCADOPAGO_README.md`

---

## 9. Orden sugerido de implementación

1. Fase A (mover a `/checkout` y back_urls) para tener el flujo actual funcionando en ruta pública.
2. Probar webhook con un pago de prueba y verificar que el tier y la suscripción se actualicen.
3. Fase B (confirm-payment + Bricks) para pago en página.
4. Fase C cuando se requiera guardar tarjeta o suscripciones recurrentes.

---

## 10. Estado de implementación (actualizado)

### Fase A – Completada

| Tarea                                                   | Estado | Notas                                                                                     |
| ------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Rutas y páginas `/checkout`, `/checkout/result`, layout | Hecho  | `src/app/checkout/page.tsx`, `result/page.tsx`, `layout.tsx`                              |
| GET /api/checkout/tiers                                 | Hecho  | Requiere sesión                                                                           |
| POST /api/checkout/create-intent                        | Hecho  | Sesión + organization_id desde admin_users                                                |
| back_urls Mercado Pago                                  | Hecho  | `gateway.ts` usa `/checkout/result`                                                       |
| Enlaces internos                                        | Hecho  | SubscriptionManagementSection, layout admin, subscription-required → `/checkout`          |
| Flow y PayPal return/cancel URLs                        | Hecho  | Apuntan a `/checkout/result`                                                              |
| Autenticación `/checkout`                               | Hecho  | Solo autenticados; sin sesión se muestra “Inicia sesión” con link a login                 |
| Deprecar rutas admin                                    | Hecho  | `/admin/checkout` y `/admin/checkout/result` redirigen a `/checkout` y `/checkout/result` |
| SubscriptionGuard                                       | Hecho  | No bloquea en `/checkout` (ni `/admin/checkout`)                                          |
| CheckoutForm (legacy)                                   | Hecho  | Usa `/api/checkout/tiers`                                                                 |

### Fase B – Completada

| Tarea                              | Estado | Notas                                                                |
| ---------------------------------- | ------ | -------------------------------------------------------------------- |
| POST /api/checkout/confirm-payment | Hecho  | Recibe token, payment_method_id, issuer_id; crea pago en MP          |
| Card Payment Brick en `/checkout`  | Hecho  | `CheckoutPageContent.tsx` con Bricks, payer email, upgrade/downgrade |
| CSP                                | Hecho  | `secure-fields.mercadopago.com` en frame-src                         |
| Webhook y payment_id               | Hecho  | Pagos Bricks se asocian por payment_id de MP                         |
| Metadata subscription_tier         | Hecho  | create-intent y confirm-payment envían tier en metadata              |

### Fase C – Completada (opcional)

| Tarea                     | Estado | Notas                                                                                                                                                                                                             |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guardar método de pago    | Hecho  | Customers API de MP; columna `gateway_payment_method_id` en `subscriptions`; opción "Guardar tarjeta" en checkout; `createCustomerAndAddCard` en gateway                                                          |
| Suscripciones recurrentes | Hecho  | PreApprovalPlan/PreApproval en gateway; `gateway_plan_id` en `subscription_tiers`; GET `/api/checkout/recurring-plans`, POST `/api/checkout/create-preapproval`; webhook `subscription_preapproval`/`preapproval` |

**Archivos Fase C:** Migraciones `20260207000000_add_subscription_gateway_payment_method.sql`, `20260207000001_add_gateway_plan_id_to_subscription_tiers.sql`; `src/lib/payments/mercadopago/gateway.ts` (createCustomer, addCardToCustomer, createPreApprovalPlan, createPreApproval, getPreApproval); `src/lib/payments/services/payment-service.ts` (updateSubscriptionPaymentMethod); `src/app/api/checkout/confirm-payment/route.ts` (saveCard); `src/app/api/checkout/recurring-plans/route.ts`, `src/app/api/checkout/create-preapproval/route.ts`; `src/app/api/webhooks/mercadopago/route.ts` (topic subscription_preapproval/preapproval); `src/components/checkout/CheckoutPageContent.tsx` (checkbox Guardar tarjeta).
