# Guía de Implementación de Pasarelas de Pago Múltiples

**Proyecto:** Business Management App  
**Tecnologías:** Next.js 14, TypeScript, Supabase, React 18  
**Pasarelas:** Flow (Chile), Mercado Pago, PayPal  
**Fase:** SaaS 1 (Billing) - Parte del Plan de Mejoras Estructurales  
**Última actualización:** 2026-01-29

---

## ✅ Pasos completados hasta la fecha

| Paso                        | Descripción                             | Archivos / Notas                                                                                                                                                                                              |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. DB**                   | Migración `payments` y `webhook_events` | `supabase/migrations/20260131000000_create_payments_and_webhook_events.sql` — RLS, índices, `get_user_organization_id`. Aplicada en Supabase local (Docker).                                                  |
| **2. Tipos**                | Tipos e interfaces de pagos             | `src/types/payment.ts` — Payment, PaymentStatus, PaymentGateway, WebhookEvent, PaymentCreationAttributes. `src/lib/payments/interfaces.ts` — IPaymentGateway, PaymentIntentResponse.                          |
| **3. PaymentService**       | Lógica de negocio en DB                 | `src/lib/payments/services/payment-service.ts` — createPayment, updatePaymentStatus, getPaymentById, getPaymentByGatewayPaymentIntentId, recordWebhookEvent, markWebhookEventAsProcessed, fulfillOrder.       |
| **4. Factory y Flow**       | Abstracción y pasarelas                 | `src/lib/payments/index.ts` — PaymentGatewayFactory (Flow, Mercado Pago, PayPal). `src/lib/payments/flow/gateway.ts` — createPaymentIntent, processWebhookEvent, mapStatus.                                   |
| **5. create-intent**        | Endpoint para crear intento de pago     | `src/app/api/admin/payments/create-intent/route.ts` — POST con auth admin, organization_id, Zod (`createPaymentIntentSchema`), rate limit. Respuesta: paymentId, approvalUrl, gatewayPaymentIntentId, status. |
| **6. Webhook Flow**         | Endpoint para eventos Flow              | `src/app/api/webhooks/flow/route.ts` — POST sin rate limit; verificación de firma HMAC-SHA256, idempotencia con `webhook_events`, actualización de pago y fulfill de orden.                                   |
| **7. Variables de entorno** | Documentación y configuración de claves | `docs/PAYMENT_GATEWAYS_ENV_SETUP.md` — Alta en Flow (Chile), Mercado Pago, PayPal; obtención de API keys, webhook secrets; `NEXT_PUBLIC_BASE_URL`; ejemplo `.env.local` y producción (Vercel).                |
| **8. UI checkout**          | Página y componentes para Flow          | `src/app/admin/checkout/page.tsx`, `src/components/checkout/CheckoutForm.tsx` — Llama a create-intent, redirige a `approvalUrl` de Flow para completar el pago. Enlace en menú admin.                         |
| **9. Mercado Pago**         | Gateway + webhook                       | `src/lib/payments/mercadopago/gateway.ts` (Preference + Payment SDK v2), GET `/api/webhooks/mercadopago` (topic + id en query).                                                                               |
| **10. PayPal**              | Gateway + webhook                       | `src/lib/payments/paypal/gateway.ts` (OAuth + Orders v2), POST `/api/webhooks/paypal` (CHECKOUT.ORDER.COMPLETED, PAYMENT.CAPTURE.COMPLETED).                                                                  |

**Próximos pasos (en orden):**

| #   | Paso                                                                      | Estado              | Referencia                                                                                                                                 |
| --- | ------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 11  | **Tests** — Tests de integración para create-intent y webhooks (opcional) | Opcional / En curso | `src/__tests__/integration/api/payments.test.ts` — 401, 400 (body inválido), 200/403/500 create-intent; 500 webhook Flow campos faltantes. |

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Principios de Diseño y Seguridad](#2-principios-de-diseño-y-seguridad)
3. [Pre-requisitos](#3-pre-requisitos)
4. [Configuración Inicial (Supabase y Variables de Entorno)](#4-configuración-inicial-supabase-y-variables-de-entorno) — **Ver también:** [Guía de alta y variables (Flow, Mercado Pago, PayPal)](./PAYMENT_GATEWAYS_ENV_SETUP.md)
5. [Estructura de Directorios y Abstracción de Pasarelas](#5-estructura-de-directorios-y-abstracción-de-pasarelas)
6. [Implementación de Pasarelas](#6-implementación-de-pasarelas)
   - [6.1. Flow (Chile)](#61-flow-chile)
   - [6.2. Mercado Pago](#62-mercado-pago)
   - [6.3. PayPal](#63-paypal)
7. [Componentes Frontend de Checkout](#7-componentes-frontend-de-checkout)
8. [Gestión de Webhooks (CRÍTICO)](#8-gestión-de-webhooks-crítico)
9. [Integración con Multi-Tenancy](#9-integración-con-multi-tenancy)
10. [Consideraciones de Seguridad](#10-consideraciones-de-seguridad)
11. [Estrategia de Testing](#11-estrategia-de-testing)
12. [Despliegue y Monitoreo](#12-despliegue-y-monitoreo)
13. [Tareas Pendientes y Mejoras Futuras](#13-tareas-pendientes-y-mejoras-futuras)

---

## 1. Resumen Ejecutivo

Esta guía detalla la integración de las pasarelas de pago Stripe, Mercado Pago y PayPal en Opttius, adaptada específicamente a la arquitectura actual del proyecto. El objetivo es proporcionar una cobertura máxima de métodos de pago, optimizar la conversión y garantizar la máxima seguridad y mantenibilidad, integrando con el sistema multi-tenant existente.

**Diferencias clave con la guía genérica:**

- ✅ Integración con sistema multi-tenant (`organization_id`)
- ✅ Uso del logger existente (`appLogger`)
- ✅ Uso del sistema de validación existente (`parseAndValidateBody`)
- ✅ Uso de `createClientFromRequest` para autenticación híbrida
- ✅ Integración con `getBranchContext` para contexto de sucursal
- ✅ Sigue patrones de código existentes del proyecto

---

## 2. Principios de Diseño y Seguridad

Para esta implementación, seguiremos los siguientes principios:

- **Abstracción (Single Responsibility Principle):** La lógica de cada pasarela debe estar encapsulada. Una capa de abstracción unificará las interacciones con las pasarelas, facilitando la adición/eliminación futura.
- **Seguridad por Diseño (Security by Design):** Todas las interacciones con datos sensibles (especialmente webhooks y APIs) deben ser validadas, autenticadas y registradas. No se confiará en ningún dato de entrada sin verificación.
- **Tipado Estricto:** Utilizaremos TypeScript de manera estricta para definir todas las estructuras de datos de las pasarelas y del negocio, eliminando el uso de `any` en la medida de lo posible.
- **Logging Detallado:** Usaremos el sistema de logging existente (`appLogger`) para rastrear eventos de pago, webhooks y errores.
- **Testing Primero (Test-Driven Development / TDD):** Dada la ausencia actual de tests para pagos, esta implementación será una oportunidad para establecer una base de pruebas unitarias, de integración y E2E para una funcionalidad crítica.
- **Multi-Tenancy:** Todos los pagos deben estar asociados a una `organization_id` para mantener el aislamiento de datos.
- **Reusabilidad:** Componentes y hooks deben ser reutilizables.

---

## 3. Pre-requisitos

Antes de comenzar, asegúrate de que se hayan completado (o se estén completando en paralelo) las siguientes tareas:

- **✅ Sistema de Logging:** Ya implementado (`src/lib/logger`)
- **✅ Validación Consistente:** Ya implementada (`src/lib/api/validation`)
- **✅ Rate Limiting:** Ya implementado (`src/lib/api/middleware`)
- **✅ Configurar Vitest:** Ya configurado (`src/__tests__`)
- **✅ Multi-Tenancy:** Phase SaaS 0 completada (tablas `organizations`, `subscriptions`, etc.)
- **Cuentas de Pasarela:**
  - Cuenta de Stripe configurada (modos Live y Test).
  - Cuenta de Mercado Pago configurada (credenciales de producción y sandbox).
  - Cuenta de PayPal configurada (credenciales de producción y sandbox).

---

## 4. Configuración Inicial (Supabase y Variables de Entorno)

### 4.1. Base de Datos Supabase

Crear las siguientes tablas o modificar existentes para soportar múltiples pasarelas:

```sql
-- payments.sql
-- Migración para crear tabla de pagos con soporte multi-tenant

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CLP',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'refunded'
    gateway TEXT NOT NULL, -- 'stripe', 'mercadopago', 'paypal'
    gateway_transaction_id TEXT, -- ID único de la transacción en la pasarela
    gateway_payment_intent_id TEXT, -- Para Stripe, Mercado Pago
    gateway_charge_id TEXT, -- Para Stripe
    payment_method TEXT, -- 'card', 'webpay', 'bank_transfer', 'paypal_wallet'
    metadata JSONB DEFAULT '{}'::jsonb, -- Información adicional relevante de la pasarela
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment_intent_id ON payments(gateway_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_transaction_id ON payments(gateway_transaction_id);

-- Habilitar RLS para la tabla payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para multi-tenancy
-- Usuarios solo pueden ver pagos de su organización
CREATE POLICY "Users can view payments from their organization" ON payments
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM admin_users WHERE id = auth.uid()
    )
);

-- Admins pueden gestionar pagos de su organización
CREATE POLICY "Admins can manage payments from their organization" ON payments
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM admin_users WHERE id = auth.uid()
    )
    AND EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND is_admin = true
    )
);

-- Función para actualizar 'updated_at' automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla para rastrear eventos de webhooks (idempotencia)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway TEXT NOT NULL, -- 'stripe', 'mercadopago', 'paypal'
    gateway_event_id TEXT NOT NULL, -- ID del evento en la pasarela
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(gateway, gateway_event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_gateway_event_id ON webhook_events(gateway, gateway_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id ON webhook_events(payment_id);
```

### 4.2. Variables de Entorno

Añadir las siguientes variables a `.env.local` y a la configuración de producción de Vercel (o tu proveedor de hosting):

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_... # Solo el prefijo 'pk_test_' o 'pk_live_'
STRIPE_SECRET_KEY=sk_test_...             # Secreto, solo en el servidor
STRIPE_WEBHOOK_SECRET=whsec_...           # Secreto de webhook

# Mercado Pago
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-...     # Credencial pública
MP_ACCESS_TOKEN=APP_USR-...               # Access Token (secreto)
MP_WEBHOOK_SECRET=your_mp_webhook_secret  # Clave de seguridad para webhooks, si aplica

# PayPal
PAYPAL_CLIENT_ID=sb_...                   # Client ID (sandbox o live)
PAYPAL_CLIENT_SECRET=ECyQ...             # Secret (sandbox o live)
PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com # o https://api-m.paypal.com
PAYPAL_WEBHOOK_ID=your_webhook_id        # ID del webhook configurado en PayPal

# Base URL para callbacks y webhooks
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # o https://tudominio.com en producción
```

**Recordatorio:** Las variables `NEXT_PUBLIC_` son accesibles en el frontend. El resto solo debe ser accesible en el backend (API Routes).

---

## 5. Estructura de Directorios y Abstracción de Pasarelas

Crearemos una capa de abstracción para gestionar las interacciones con las diferentes pasarelas. Esto mejorará la mantenibilidad y la testabilidad, siguiendo la estructura existente del proyecto.

```
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── payments/                   # Rutas API relacionadas con pagos
│   │   │   │   ├── create-intent/route.ts  # Crea PaymentIntent (Stripe), Preference (MP), Order (PayPal)
│   │   │   │   └── confirm-payment/route.ts # Confirma pagos (si aplica)
│   │   │   └── ...
│   │   └── webhooks/                       # Endpoints para webhooks de pasarelas (CRÍTICO)
│   │       ├── stripe/route.ts
│   │       ├── mercadopago/route.ts
│   │       └── paypal/route.ts
│   └── checkout/                          # Página de checkout
│       └── page.tsx
├── components/
│   ├── checkout/
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── StripePaymentForm.tsx
│   │   ├── MercadoPagoPaymentForm.tsx
│   │   └── PayPalButton.tsx
│   └── ui/ # tus componentes UI existentes
├── lib/
│   ├── payments/                           # Lógica central de pagos (ABSTRACCIÓN)
│   │   ├── index.ts                       # Exporta la PaymentGatewayFactory
│   │   ├── types.ts                       # Tipos TS para la abstracción
│   │   ├── interfaces.ts                  # Interfaz IPaymentGateway
│   │   ├── stripe/                        # Implementación específica de Stripe
│   │   │   ├── gateway.ts
│   │   │   └── utils.ts
│   │   ├── mercadopago/                   # Implementación específica de Mercado Pago
│   │   │   ├── gateway.ts
│   │   │   └── utils.ts
│   │   ├── paypal/                        # Implementación específica de PayPal
│   │   │   ├── gateway.ts
│   │   │   └── utils.ts
│   │   └── services/                      # Servicios de negocio relacionados con pagos
│   │       └── payment-service.ts         # Lógica de creación de pagos en DB, actualización, etc.
│   └── api/ # Middleware y utilidades de API existentes
├── types/
│   ├── payment.ts                         # Tipos globales de pago
│   └── ...
└── __tests__/
    ├── unit/
    │   └── lib/payments/
    │       ├── payment-service.test.ts
    │       ├── stripe/gateway.test.ts
    │       ├── mercadopago/gateway.test.ts
    │       └── paypal/gateway.test.ts
    ├── integration/
    │   └── api/
    │       ├── payments/
    │       │   └── create-intent.test.ts
    │       └── webhooks/
    │           ├── stripe.test.ts
    │           ├── mercadopago.test.ts
    │           └── paypal.test.ts
    └── e2e/
        └── payments.spec.ts
```

### 5.1. Definición de la Interfaz `IPaymentGateway` (`src/lib/payments/interfaces.ts`)

Esta interfaz definirá los métodos comunes que cada pasarela deberá implementar.

```typescript
// src/lib/payments/interfaces.ts
import { NextRequest } from "next/server";
import {
  PaymentCreationAttributes,
  PaymentStatus,
  WebhookEvent,
} from "@/types/payment";

export interface IPaymentGateway {
  /**
   * Inicializa un intento de pago y devuelve la información necesaria para el frontend.
   * @param orderId ID de la orden (opcional, puede ser null para pagos directos).
   * @param amount Monto total.
   * @param currency Moneda.
   * @param userId ID del usuario.
   * @param organizationId ID de la organización (multi-tenancy).
   * @returns Objeto con la información para el frontend (ej. client_secret, preferenceId, approval_url).
   */
  createPaymentIntent(
    orderId: string | null,
    amount: number,
    currency: string,
    userId: string,
    organizationId: string,
  ): Promise<PaymentIntentResponse>;

  /**
   * Procesa un evento de webhook recibido de la pasarela.
   * @param request La solicitud HTTP del webhook.
   * @returns Un objeto WebhookEvent estandarizado.
   * @throws Error si la firma del webhook no es válida o el evento es desconocido.
   */
  processWebhookEvent(request: NextRequest): Promise<WebhookEvent>;

  /**
   * Mapea un estado de pasarela a un estado estandarizado de la aplicación.
   * @param gatewayStatus Estado devuelto por la pasarela.
   * @returns Estado estandarizado de PaymentStatus.
   */
  mapStatus(gatewayStatus: string): PaymentStatus;
}

export type PaymentIntentResponse = {
  clientSecret?: string; // Para Stripe
  preferenceId?: string; // Para Mercado Pago
  approvalUrl?: string; // Para PayPal (redirección)
  paymentId?: string; // ID interno del pago creado en nuestra DB
  gatewayPaymentIntentId?: string; // ID del intento de pago en la pasarela
  status: PaymentStatus;
};
```

### 5.2. `PaymentGatewayFactory` (`src/lib/payments/index.ts`)

Esta fábrica se encargará de instanciar la pasarela correcta.

```typescript
// src/lib/payments/index.ts
import { IPaymentGateway } from "./interfaces";
import { StripeGateway } from "./stripe/gateway";
import { MercadoPagoGateway } from "./mercadopago/gateway";
import { PayPalGateway } from "./paypal/gateway";

export type PaymentGatewayType = "stripe" | "mercadopago" | "paypal";

export class PaymentGatewayFactory {
  public static getGateway(type: PaymentGatewayType): IPaymentGateway {
    switch (type) {
      case "stripe":
        return new StripeGateway();
      case "mercadopago":
        return new MercadoPagoGateway();
      case "paypal":
        return new PayPalGateway();
      default:
        throw new Error(`Payment gateway ${type} not supported.`);
    }
  }
}

// Re-export types and interfaces
export type { IPaymentGateway, PaymentIntentResponse } from "./interfaces";
```

### 5.3. Tipos de Pago Globales (`src/types/payment.ts`)

```typescript
// src/types/payment.ts
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type PaymentGateway = "stripe" | "mercadopago" | "paypal";

export type Payment = {
  id: string;
  order_id: string | null;
  organization_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  gateway_transaction_id?: string | null;
  gateway_payment_intent_id?: string | null;
  gateway_charge_id?: string | null;
  payment_method?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type PaymentCreationAttributes = Omit<
  Payment,
  "id" | "created_at" | "updated_at"
>;

export type WebhookEvent = {
  gateway: PaymentGateway;
  gatewayEventId: string;
  type: string; // Ej. 'payment_succeeded', 'invoice.paid'
  status: PaymentStatus;
  gatewayTransactionId?: string | null;
  gatewayPaymentIntentId?: string | null;
  amount: number;
  currency: string;
  orderId?: string | null; // Si se puede extraer de la pasarela
  organizationId?: string | null; // Para multi-tenancy
  metadata?: Record<string, unknown> | null;
};
```

### 5.4. `PaymentService` (`src/lib/payments/services/payment-service.ts`)

Este servicio manejará la lógica de negocio de la base de datos relacionada con los pagos, usando el patrón existente del proyecto.

```typescript
// src/lib/payments/services/payment-service.ts
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Payment,
  PaymentCreationAttributes,
  PaymentStatus,
  WebhookEvent,
} from "@/types/payment";
import { Database } from "@/types/supabase";
import { appLogger as logger } from "@/lib/logger";

export class PaymentService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Crea un nuevo registro de pago en la base de datos.
   */
  async createPayment(data: PaymentCreationAttributes): Promise<Payment> {
    const { data: payment, error } = await this.supabase
      .from("payments")
      .insert(data)
      .select()
      .single();

    if (error) {
      logger.error("Failed to create payment in DB", error, { data });
      throw new Error(`Error creating payment: ${error.message}`);
    }

    if (!payment) {
      logger.error("Payment creation returned null", undefined, { data });
      throw new Error("Payment creation returned null");
    }

    logger.info("Payment record created", {
      paymentId: payment.id,
      gateway: payment.gateway,
      organizationId: payment.organization_id,
    });
    return payment;
  }

  /**
   * Actualiza el estado de un pago existente.
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    gatewayTransactionId?: string | null,
    metadata?: Record<string, unknown> | null,
  ): Promise<Payment> {
    const updateData: Partial<Payment> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (gatewayTransactionId) {
      updateData.gateway_transaction_id = gatewayTransactionId;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { data: payment, error } = await this.supabase
      .from("payments")
      .update(updateData)
      .eq("id", paymentId)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update payment status in DB", error, {
        paymentId,
        status,
      });
      throw new Error(`Error updating payment status: ${error.message}`);
    }

    if (!payment) {
      logger.error("Payment update returned null", undefined, {
        paymentId,
        status,
      });
      throw new Error("Payment update returned null");
    }

    logger.info("Payment status updated", {
      paymentId: payment.id,
      newStatus: status,
    });
    return payment;
  }

  /**
   * Busca un pago por su ID interno.
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    const { data: payment, error } = await this.supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116: No rows found
      logger.error("Error fetching payment by ID", error, { paymentId });
      throw new Error(`Error fetching payment: ${error.message}`);
    }
    return payment;
  }

  /**
   * Busca un pago por el ID de intento de pago de la pasarela.
   * Util para webhooks donde solo tienes el ID de la pasarela.
   */
  async getPaymentByGatewayPaymentIntentId(
    gatewayPaymentIntentId: string,
  ): Promise<Payment | null> {
    const { data: payment, error } = await this.supabase
      .from("payments")
      .select("*")
      .eq("gateway_payment_intent_id", gatewayPaymentIntentId)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Error fetching payment by gateway intent ID", error, {
        gatewayPaymentIntentId,
      });
      throw new Error(`Error fetching payment: ${error.message}`);
    }
    return payment;
  }

  /**
   * Registra un evento de webhook para idempotencia.
   */
  async recordWebhookEvent(
    gateway: PaymentGateway,
    gatewayEventId: string,
    eventType: string,
    paymentId: string | null,
    metadata?: Record<string, unknown> | null,
  ): Promise<boolean> {
    // Verificar si el evento ya fue procesado
    const { data: existingEvent } = await this.supabase
      .from("webhook_events")
      .select("id, processed")
      .eq("gateway", gateway)
      .eq("gateway_event_id", gatewayEventId)
      .single();

    if (existingEvent) {
      logger.info("Webhook event already processed", {
        gateway,
        gatewayEventId,
        wasProcessed: existingEvent.processed,
      });
      return existingEvent.processed;
    }

    // Registrar nuevo evento
    const { error } = await this.supabase.from("webhook_events").insert({
      gateway,
      gateway_event_id: gatewayEventId,
      payment_id: paymentId,
      event_type: eventType,
      processed: false,
      metadata: metadata || {},
    });

    if (error) {
      logger.error("Failed to record webhook event", error, {
        gateway,
        gatewayEventId,
      });
      throw new Error(`Error recording webhook event: ${error.message}`);
    }

    return false; // Evento nuevo, no procesado aún
  }

  /**
   * Marca un evento de webhook como procesado.
   */
  async markWebhookEventAsProcessed(
    gateway: PaymentGateway,
    gatewayEventId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("webhook_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq("gateway", gateway)
      .eq("gateway_event_id", gatewayEventId);

    if (error) {
      logger.error("Failed to mark webhook event as processed", error, {
        gateway,
        gatewayEventId,
      });
      // No lanzar error aquí, es solo para tracking
    }
  }

  /**
   * Lógica de negocio para completar una orden después de pago exitoso.
   */
  async fulfillOrder(orderId: string): Promise<void> {
    logger.info("Order fulfillment logic triggered", { orderId });

    const { data, error } = await this.supabase
      .from("orders")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      logger.error("Failed to fulfill order", error, { orderId });
      throw new Error(`Error fulfilling order: ${error.message}`);
    }

    if (!data) {
      logger.warn("Order not found for fulfillment", { orderId });
      return;
    }

    logger.info("Order fulfilled successfully", { orderId });
  }
}
```

---

## 6. Implementación de Pasarelas

Cada pasarela tendrá su propia implementación de `IPaymentGateway`, siguiendo los patrones del proyecto.

### 6.1. Flow (Chile)

**Nota:** Flow es la pasarela de pago principal para Chile, ya que Stripe no tiene soporte en Chile.

**Dependencias:**

Flow usa la API REST nativa de Node.js (no requiere SDK adicional). Solo necesitas `node:crypto` para la firma HMAC-SHA256 (incluido en Node.js).

**`src/lib/payments/flow/gateway.ts`:**

```typescript
// src/lib/payments/flow/gateway.ts
import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import type { IPaymentGateway, PaymentIntentResponse } from "../interfaces";
import type { PaymentStatus, WebhookEvent } from "@/types/payment";
import { appLogger as logger } from "@/lib/logger";

function getFlowConfig() {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error(
      "FLOW_API_KEY and FLOW_SECRET_KEY must be set. Configure them in .env.local for Flow payments.",
    );
  }
  return { apiKey, secretKey };
}

/**
 * Genera la firma HMAC-SHA256 requerida por Flow para crear órdenes.
 */
function generateFlowSignature(
  params: Record<string, string>,
  secretKey: string,
): string {
  const keys = Object.keys(params).sort();
  let toSign = "";
  for (const key of keys) {
    toSign += key + params[key];
  }
  return createHmac("sha256", secretKey).update(toSign).digest("hex");
}

export class FlowGateway implements IPaymentGateway {
  async createPaymentIntent(
    orderId: string | null,
    amount: number,
    currency: string,
    userId: string,
    organizationId: string,
  ): Promise<PaymentIntentResponse> {
    const { apiKey, secretKey } = getFlowConfig();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const flowApiUrl = process.env.FLOW_API_URL || "https://www.flow.cl/api";

    try {
      const commerceOrder = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const subject = `Pago orden ${orderId || "directo"}`;
      const email = process.env.FLOW_DEFAULT_EMAIL || "test@example.com";

      const urlConfirmation = `${baseUrl}/api/webhooks/flow`;
      const urlReturn = `${baseUrl}/admin/checkout?success=true&orderId=${orderId ?? ""}`;

      const params: Record<string, string> = {
        apiKey,
        commerceOrder,
        subject,
        amount: Math.round(amount).toString(),
        email,
        urlConfirmation,
        urlReturn,
      };

      const signature = generateFlowSignature(params, secretKey);
      params.s = signature;

      const response = await fetch(`${flowApiUrl}/payment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params).toString(),
      });

      const data = (await response.json()) as {
        token?: string;
        url?: string;
        flowOrder?: string;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.token || !data.url) {
        logger.error("Error creating Flow payment order", undefined, {
          orderId,
          error: data,
        });
        throw new Error(
          `Flow error: ${data.message ?? data.error ?? response.statusText}`,
        );
      }

      logger.info("Flow payment order created", {
        flowOrder: data.flowOrder ?? data.token,
        commerceOrder,
        amount,
        organizationId,
      });

      return {
        approvalUrl: data.url,
        gatewayPaymentIntentId: data.flowOrder ?? data.token,
        status: "pending",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        "Error creating Flow payment order",
        error instanceof Error ? error : new Error(errorMessage),
        { orderId, amount, organizationId },
      );
      throw new Error(`Flow error: ${errorMessage}`);
    }
  }

  async processWebhookEvent(request: NextRequest): Promise<WebhookEvent> {
    const formData = await request.formData();
    const token = formData.get("token")?.toString();
    const status = formData.get("status")?.toString();
    const flowOrder = formData.get("flowOrder")?.toString();
    const commerceOrder = formData.get("commerceOrder")?.toString();
    const amount = formData.get("amount")?.toString();

    if (!token || !status) {
      logger.warn("Flow Webhook: missing token or status", {
        token,
        status,
      });
      throw new Error("Flow Webhook: missing required fields");
    }

    // Verificar firma si está presente
    const signature = formData.get("s")?.toString();
    if (signature) {
      const { secretKey } = getFlowConfig();
      const params: Record<string, string> = {};
      for (const [key, value] of formData.entries()) {
        if (key !== "s" && typeof value === "string") {
          params[key] = value;
        }
      }
      const expectedSignature = generateFlowSignature(params, secretKey);
      if (signature !== expectedSignature) {
        logger.warn("Flow Webhook signature verification failed", {
          received: signature,
          expected: expectedSignature,
        });
        throw new Error("Flow Webhook: Invalid signature");
      }
    }

    logger.info("Flow Webhook received", {
      token,
      status,
      flowOrder,
      commerceOrder,
    });

    const amountNum = amount ? parseFloat(amount) : 0;

    return {
      gateway: "flow",
      gatewayEventId: token,
      type: "payment_status",
      status: this.mapStatus(status),
      gatewayTransactionId: flowOrder ?? token,
      gatewayPaymentIntentId: flowOrder ?? token,
      amount: amountNum,
      currency: "CLP",
      orderId: commerceOrder ? commerceOrder.replace(/^order_/, "") : null,
      organizationId: null,
      metadata: {
        token,
        flowOrder,
        commerceOrder,
        status,
      },
    };
  }

  mapStatus(flowStatus: string): PaymentStatus {
    switch (flowStatus?.toLowerCase()) {
      case "1":
      case "paid":
      case "pagado":
        return "succeeded";
      case "2":
      case "pending":
      case "pendiente":
        return "pending";
      case "3":
      case "rejected":
      case "rechazado":
      case "failed":
        return "failed";
      case "4":
      case "canceled":
      case "cancelado":
        return "failed";
      default:
        logger.warn("Unknown Flow status mapped to pending", {
          flowStatus,
        });
        return "pending";
    }
  }
}
```

**Notas importantes sobre Flow:**

- Flow requiere una firma HMAC-SHA256 para todas las solicitudes de creación de órdenes.
- Flow redirige al usuario a su página de pago (`approvalUrl`), no usa formularios embebidos.
- Los webhooks de Flow llegan como `application/x-www-form-urlencoded` (FormData).
- Flow soporta múltiples métodos de pago en Chile (tarjetas, transferencias, etc.).

### 6.2. Mercado Pago

**Dependencias:**

```bash
npm install mercadopago
```

**`src/lib/payments/mercadopago/gateway.ts`:**

```typescript
// src/lib/payments/mercadopago/gateway.ts
import mercadopago from "mercadopago";
import { NextRequest } from "next/server";
import { IPaymentGateway, PaymentIntentResponse } from "../interfaces";
import { PaymentStatus, WebhookEvent } from "@/types/payment";
import { appLogger as logger } from "@/lib/logger";

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN!,
});

export class MercadoPagoGateway implements IPaymentGateway {
  async createPaymentIntent(
    orderId: string | null,
    amount: number,
    currency: string,
    userId: string,
    organizationId: string,
  ): Promise<PaymentIntentResponse> {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      const preference = await mercadopago.preferences.create({
        items: [
          {
            title: `Order ${orderId || "Direct Payment"}`,
            quantity: 1,
            unit_price: amount,
            currency_id: currency.toUpperCase(),
          },
        ],
        payer: {
          // Puedes buscar el email del usuario en tu DB si lo tienes
          // email: 'test_payer@example.com',
        },
        back_urls: {
          success: `${baseUrl}/checkout/success?orderId=${orderId || ""}`,
          failure: `${baseUrl}/checkout/failure?orderId=${orderId || ""}`,
          pending: `${baseUrl}/checkout/pending?orderId=${orderId || ""}`,
        },
        auto_return: "approved",
        external_reference: orderId || "", // Para enlazar con tu orden
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        metadata: {
          user_id: userId,
          organization_id: organizationId,
        },
      });

      if (!preference.body.id || !preference.body.init_point) {
        throw new Error(
          "Mercado Pago preference creation failed or missing data.",
        );
      }

      logger.info("Mercado Pago Preference created", {
        preferenceId: preference.body.id,
        orderId,
        amount,
        organizationId,
      });

      return {
        preferenceId: preference.body.id,
        approvalUrl: preference.body.init_point,
        gatewayPaymentIntentId: preference.body.id,
        status: "pending",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        "Error creating Mercado Pago Preference",
        error instanceof Error ? error : new Error(errorMessage),
        {
          orderId,
          amount,
          organizationId,
        },
      );
      throw new Error(`Mercado Pago error: ${errorMessage}`);
    }
  }

  async processWebhookEvent(request: NextRequest): Promise<WebhookEvent> {
    const query = request.nextUrl.searchParams;
    const topic = query.get("topic");
    const id = query.get("id");

    if (topic === "payment" && id) {
      try {
        const paymentInfo = await mercadopago.payment.get(id);
        const paymentData = paymentInfo.body as {
          id: number;
          status: string;
          external_reference: string;
          transaction_amount: number;
          currency_id: string;
          metadata?: { user_id?: string; organization_id?: string };
        };

        const orderId = paymentData.external_reference || null;
        const organizationId = paymentData.metadata?.organization_id || null;
        const amount = paymentData.transaction_amount;
        const currency = paymentData.currency_id;

        logger.info("Mercado Pago Payment Webhook received", {
          paymentId: id,
          status: paymentData.status,
          organizationId,
        });

        return {
          gateway: "mercadopago",
          gatewayEventId: `${topic}-${id}`,
          type: topic,
          status: this.mapStatus(paymentData.status),
          gatewayTransactionId: paymentData.id.toString(),
          gatewayPaymentIntentId: paymentData.id.toString(),
          amount: amount,
          currency: currency.toUpperCase(),
          orderId: orderId,
          organizationId: organizationId,
          metadata: paymentData as unknown as Record<string, unknown>,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          "Error fetching Mercado Pago payment info for webhook",
          error instanceof Error ? error : new Error(errorMessage),
          {
            id,
          },
        );
        throw new Error(`Mercado Pago Webhook Error: ${errorMessage}`);
      }
    } else {
      logger.warn(
        "Mercado Pago Webhook received with unhandled topic or missing ID",
        {
          topic,
          id,
        },
      );
      throw new Error("Mercado Pago Webhook: Unhandled topic or missing ID");
    }
  }

  mapStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case "pending":
      case "in_process":
        return "pending";
      case "approved":
        return "succeeded";
      case "rejected":
      case "cancelled":
        return "failed";
      case "refunded":
        return "refunded";
      default:
        logger.warn("Unknown Mercado Pago status mapped to pending", {
          mpStatus,
        });
        return "pending";
    }
  }
}
```

### 6.3. PayPal

**`src/lib/payments/paypal/gateway.ts`:**

```typescript
// src/lib/payments/paypal/gateway.ts
import { NextRequest } from "next/server";
import { IPaymentGateway, PaymentIntentResponse } from "../interfaces";
import { PaymentStatus, WebhookEvent } from "@/types/payment";
import { appLogger as logger } from "@/lib/logger";

// Helper para obtener el token de acceso de PayPal
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(
    `${process.env.PAYPAL_API_BASE_URL}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    },
  );

  const data = (await response.json()) as {
    access_token?: string;
    error_description?: string;
  };

  if (!response.ok || !data.access_token) {
    logger.error("Failed to get PayPal Access Token", undefined, {
      error: data,
    });
    throw new Error(
      `PayPal Auth Error: ${data.error_description || response.statusText}`,
    );
  }

  return data.access_token;
}

export class PayPalGateway implements IPaymentGateway {
  async createPaymentIntent(
    orderId: string | null,
    amount: number,
    currency: string,
    userId: string,
    organizationId: string,
  ): Promise<PaymentIntentResponse> {
    try {
      const accessToken = await getPayPalAccessToken();
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      const response = await fetch(
        `${process.env.PAYPAL_API_BASE_URL}/v2/checkout/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                reference_id: orderId || "",
                amount: {
                  currency_code: currency.toUpperCase(),
                  value: amount.toFixed(2),
                },
                custom_id: organizationId,
              },
            ],
            application_context: {
              return_url: `${baseUrl}/checkout/success?orderId=${orderId || ""}`,
              cancel_url: `${baseUrl}/checkout/failure?orderId=${orderId || ""}`,
              user_action: "PAY_NOW",
            },
          }),
        },
      );

      const orderData = (await response.json()) as {
        id?: string;
        links?: Array<{ rel: string; href: string }>;
        message?: string;
        status?: string;
      };

      if (!response.ok || !orderData.id) {
        logger.error("Error creating PayPal Order", undefined, {
          orderId,
          error: orderData,
        });
        throw new Error(
          `PayPal Order Creation Error: ${orderData.message || response.statusText}`,
        );
      }

      const approveLink = orderData.links?.find(
        (link) => link.rel === "approve",
      );
      if (!approveLink) {
        throw new Error("PayPal approval link not found.");
      }

      logger.info("PayPal Order created", {
        orderId: orderData.id,
        amount,
        organizationId,
      });

      return {
        approvalUrl: approveLink.href,
        gatewayPaymentIntentId: orderData.id,
        status: this.mapStatus(orderData.status || "CREATED"),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        "Error creating PayPal Order",
        error instanceof Error ? error : new Error(errorMessage),
        {
          orderId,
          amount,
          organizationId,
        },
      );
      throw new Error(`PayPal error: ${errorMessage}`);
    }
  }

  async processWebhookEvent(request: NextRequest): Promise<WebhookEvent> {
    // PayPal tiene un proceso de validación de webhooks más complejo
    // Para simplificar, aquí se asume que ya validaste la autenticidad del webhook
    // En producción, debes implementar la validación del certificado y la firma del webhook.

    const event = (await request.json()) as {
      id?: string;
      event_type?: string;
      resource?: {
        id?: string;
        status?: string;
        purchase_units?: Array<{
          reference_id?: string;
          amount?: { value?: string; currency_code?: string };
        }>;
        amount?: { value?: string; currency_code?: string };
      };
    };

    logger.info("PayPal Webhook received", {
      eventType: event.event_type,
      eventId: event.id,
    });

    if (
      event.resource &&
      event.resource.id &&
      (event.event_type === "CHECKOUT.ORDER.COMPLETED" ||
        event.event_type === "PAYMENT.CAPTURE.COMPLETED")
    ) {
      const orderId =
        event.resource.purchase_units?.[0]?.reference_id ||
        event.resource.id ||
        null;
      const amount = parseFloat(
        event.resource.purchase_units?.[0]?.amount?.value ||
          event.resource.amount?.value ||
          "0",
      );
      const currency =
        event.resource.purchase_units?.[0]?.amount?.currency_code ||
        event.resource.amount?.currency_code ||
        "USD";

      return {
        gateway: "paypal",
        gatewayEventId: event.id || "",
        type: event.event_type || "",
        status: this.mapStatus(event.resource.status || "COMPLETED"),
        gatewayTransactionId: event.resource.id || null,
        gatewayPaymentIntentId: event.resource.id || null,
        amount: amount,
        currency: currency.toUpperCase(),
        orderId: orderId,
        organizationId: null, // PayPal no incluye esto en el webhook, se debe buscar en DB
        metadata: event as unknown as Record<string, unknown>,
      };
    } else {
      logger.warn(
        "PayPal Webhook received with unhandled event type or missing data",
        {
          eventType: event.event_type,
          eventId: event.id,
        },
      );
      throw new Error("PayPal Webhook: Unhandled event type or missing data");
    }
  }

  mapStatus(paypalStatus: string): PaymentStatus {
    switch (paypalStatus) {
      case "CREATED":
      case "SAVED":
      case "APPROVED":
      case "VOIDED":
        return "pending";
      case "COMPLETED":
      case "CAPTURED":
        return "succeeded";
      case "DECLINED":
      case "FAILED":
        return "failed";
      case "REFUNDED":
        return "refunded";
      default:
        logger.warn("Unknown PayPal status mapped to pending", {
          paypalStatus,
        });
        return "pending";
    }
  }
}
```

---

## 7. Componentes Frontend de Checkout

La página de checkout orquestará la selección de la pasarela y la interacción con los formularios o botones, siguiendo los patrones de componentes existentes del proyecto.

**Nota:** Los componentes frontend completos se implementarán en una fase posterior. Por ahora, se documenta la estructura básica.

---

## 8. Gestión de Webhooks (CRÍTICO)

Los webhooks son el mecanismo principal para que las pasarelas de pago te notifiquen sobre el estado de las transacciones. Es **CRÍTICO** que estos endpoints sean seguros, robustos y procesen los eventos de forma idempotente.

### 8.1. API Route para Crear Intento de Pago (`src/app/api/admin/payments/create-intent/route.ts`)

Este endpoint es llamado desde el frontend para iniciar un pago, siguiendo los patrones existentes del proyecto.

```typescript
// src/app/api/admin/payments/create-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PaymentGatewayFactory, PaymentGatewayType } from "@/lib/payments";
import { PaymentCreationAttributes } from "@/types/payment";
import { createClientFromRequest } from "@/utils/supabase/server";
import { getBranchContext } from "@/lib/api/branch-middleware";
import { PaymentService } from "@/lib/payments/services/payment-service";
import { appLogger as logger } from "@/lib/logger";
import { withRateLimit, rateLimitConfigs } from "@/lib/api/middleware";
import { parseAndValidateBody } from "@/lib/api/validation/zod-helpers";
import { z } from "zod";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";

// Define el esquema de validación para el body de la solicitud
const createPaymentIntentSchema = z.object({
  gateway: z.enum(["stripe", "mercadopago", "paypal"]),
  orderId: z.string().uuid("Invalid order ID format.").nullable().optional(),
  amount: z.number().positive("Amount must be positive."),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code.")
    .toUpperCase()
    .default("CLP"),
  userId: z.string().uuid("Invalid user ID format."),
});

export const POST = withRateLimit(
  rateLimitConfigs.payments || rateLimitConfigs.default,
  async (request: NextRequest) => {
    const { client: supabase, getUser } =
      await createClientFromRequest(request);

    try {
      // 1. Autenticación y Autorización
      const { data, error: userError } = await getUser();
      const user = data?.user;

      if (userError || !user) {
        logger.warn("Unauthorized attempt to create payment intent");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verificar que el usuario es admin
      const { data: isAdmin } = (await supabase.rpc("is_admin", {
        user_id: user.id,
      } as IsAdminParams)) as {
        data: IsAdminResult | null;
        error: Error | null;
      };

      if (!isAdmin) {
        logger.warn("Non-admin user attempted to create payment intent", {
          userId: user.id,
        });
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }

      // 2. Validación de Input
      const body = await parseAndValidateBody(
        request,
        createPaymentIntentSchema,
      );
      const { gateway, orderId, amount, currency, userId } = body;

      if (user.id !== userId) {
        logger.warn("User ID mismatch in payment intent creation", {
          authUserId: user.id,
          requestUserId: userId,
        });
        return NextResponse.json(
          {
            error: "User ID mismatch or unauthorized action",
          },
          { status: 403 },
        );
      }

      // 3. Obtener contexto de organización (multi-tenancy)
      const branchContext = await getBranchContext(request, user.id, supabase);

      // Obtener organization_id del usuario
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!adminUser?.organization_id) {
        logger.error("User has no organization_id", { userId: user.id });
        return NextResponse.json(
          {
            error: "User organization not found",
          },
          { status: 400 },
        );
      }

      const organizationId = adminUser.organization_id;

      // 4. Obtener la pasarela
      const paymentGateway = PaymentGatewayFactory.getGateway(
        gateway as PaymentGatewayType,
      );
      const paymentService = new PaymentService(supabase);

      // 5. Crear registro de pago preliminar en nuestra DB (estado 'pending')
      const paymentData: PaymentCreationAttributes = {
        order_id: orderId || null,
        organization_id: organizationId,
        user_id: user.id,
        amount: amount,
        currency: currency,
        status: "pending",
        gateway: gateway,
        metadata: { initial_request: body },
      };

      const newPayment = await paymentService.createPayment(paymentData);

      // 6. Crear el Payment Intent en la pasarela
      const gatewayResponse = await paymentGateway.createPaymentIntent(
        newPayment.order_id,
        newPayment.amount,
        newPayment.currency,
        newPayment.user_id,
        newPayment.organization_id,
      );

      // 7. Actualizar el registro de pago con el ID de intento de la pasarela
      await paymentService.updatePaymentStatus(
        newPayment.id,
        gatewayResponse.status,
        undefined,
        { gatewayPaymentIntentId: gatewayResponse.gatewayPaymentIntentId },
      );

      logger.info("Payment intent successfully created and recorded", {
        paymentId: newPayment.id,
        gateway: gateway,
        orderId: newPayment.order_id,
        organizationId: organizationId,
        gatewayPaymentIntentId: gatewayResponse.gatewayPaymentIntentId,
      });

      return NextResponse.json({
        success: true,
        paymentId: newPayment.id,
        clientSecret: gatewayResponse.clientSecret,
        preferenceId: gatewayResponse.preferenceId,
        approvalUrl: gatewayResponse.approvalUrl,
        gatewayPaymentIntentId: gatewayResponse.gatewayPaymentIntentId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        "Failed to create payment intent",
        error instanceof Error ? error : new Error(errorMessage),
      );
      return NextResponse.json(
        {
          error: errorMessage || "Internal Server Error",
        },
        { status: 500 },
      );
    }
  },
);
```

### 8.2. API Routes para Webhooks

**`src/app/api/webhooks/stripe/route.ts`:**

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { StripeGateway } from "@/lib/payments/stripe/gateway";
import { PaymentService } from "@/lib/payments/services/payment-service";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { appLogger as logger } from "@/lib/logger";

// No se aplica rate limiting aquí ya que los webhooks son del proveedor de pago
export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();
  const stripeGateway = new StripeGateway();
  const paymentService = new PaymentService(supabase);

  try {
    // 1. Procesar y validar el evento del webhook (firma CRÍTICA)
    const webhookEvent = await stripeGateway.processWebhookEvent(request);
    logger.info("Stripe Webhook Event processed", {
      gatewayEventId: webhookEvent.gatewayEventId,
      type: webhookEvent.type,
      status: webhookEvent.status,
    });

    // 2. Comprobar Idempotencia
    const alreadyProcessed = await paymentService.recordWebhookEvent(
      webhookEvent.gateway,
      webhookEvent.gatewayEventId,
      webhookEvent.type,
      null, // paymentId se actualizará después
      webhookEvent.metadata,
    );

    if (alreadyProcessed) {
      logger.info("Stripe Webhook event already processed, skipping", {
        gatewayEventId: webhookEvent.gatewayEventId,
      });
      return NextResponse.json(
        { received: true, message: "Already processed" },
        { status: 200 },
      );
    }

    // 3. Buscar el pago en nuestra DB usando el gatewayPaymentIntentId
    const existingPayment =
      await paymentService.getPaymentByGatewayPaymentIntentId(
        webhookEvent.gatewayPaymentIntentId!,
      );

    if (!existingPayment) {
      logger.warn(
        "Stripe Webhook: No existing payment found for gateway intent ID",
        {
          gatewayPaymentIntentId: webhookEvent.gatewayPaymentIntentId,
        },
      );
      // Marcar como procesado para evitar reintentos
      await paymentService.markWebhookEventAsProcessed(
        webhookEvent.gateway,
        webhookEvent.gatewayEventId,
      );
      return NextResponse.json(
        { received: true, message: "Payment not found internally" },
        { status: 200 },
      );
    }

    // 4. Actualizar el estado del pago en nuestra DB
    const updatedPayment = await paymentService.updatePaymentStatus(
      existingPayment.id,
      webhookEvent.status,
      webhookEvent.gatewayTransactionId || undefined,
      webhookEvent.metadata,
    );

    // 5. Actualizar el registro del webhook con el payment_id
    await paymentService.markWebhookEventAsProcessed(
      webhookEvent.gateway,
      webhookEvent.gatewayEventId,
    );

    // 6. Lógica de Negocio (ej. fulfillment de la orden)
    if (updatedPayment.status === "succeeded" && updatedPayment.order_id) {
      await paymentService.fulfillOrder(updatedPayment.order_id);
      logger.info("Order fulfilled successfully via Stripe Webhook", {
        orderId: updatedPayment.order_id,
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      "Error processing Stripe Webhook",
      error instanceof Error ? error : new Error(errorMessage),
      {
        requestHeaders: Object.fromEntries(request.headers.entries()),
      },
    );
    // Devolver 500 para que Stripe reintente
    return NextResponse.json(
      { error: "Webhook processing failed internally" },
      { status: 500 },
    );
  }
}
```

**Nota:** Los webhooks de Mercado Pago y PayPal seguirán el mismo patrón, adaptado a sus respectivas validaciones de firma.

---

## 9. Integración con Multi-Tenancy

Todos los pagos deben estar asociados a una `organization_id` para mantener el aislamiento de datos. El sistema de RLS en Supabase garantiza que:

1. Los usuarios solo pueden ver pagos de su organización
2. Los admins solo pueden gestionar pagos de su organización
3. Los webhooks actualizan solo los pagos de la organización correspondiente

**Consideraciones importantes:**

- El `organization_id` se obtiene del usuario autenticado en las API routes
- Los webhooks deben validar que el `organization_id` del pago coincida con el esperado
- Las políticas RLS previenen acceso cruzado entre organizaciones

---

## 10. Consideraciones de Seguridad

### 10.1. Validación de Firmas de Webhooks (CRÍTICO)

- **Stripe:** Usa `stripe.webhooks.constructEvent()` que verifica la firma automáticamente.
- **Mercado Pago:** Validar la clave de seguridad y hacer una segunda llamada a la API para obtener información real.
- **PayPal:** Implementar validación de certificado y firma del webhook.

### 10.2. Idempotencia

- Los webhooks pueden enviarse múltiples veces. El sistema usa la tabla `webhook_events` para rastrear eventos procesados.

### 10.3. Rate Limiting

- Aplicar `rate limiting` a los endpoints de `create-intent` usando el middleware existente.
- **NO** aplicar rate limiting a los endpoints de webhooks.

### 10.4. RLS (Row Level Security) en Supabase

- Las políticas RLS aseguran que los usuarios solo puedan acceder a pagos de su organización.

---

## 11. Estrategia de Testing

### 11.1. Tests Unitarios

- `lib/payments/payment-service.test.ts`
- `lib/payments/stripe/gateway.test.ts`
- `lib/payments/mercadopago/gateway.test.ts`
- `lib/payments/paypal/gateway.test.ts`

### 11.2. Tests de Integración

- `api/payments/create-intent.test.ts`
- `api/webhooks/stripe.test.ts`
- `api/webhooks/mercadopago.test.ts`
- `api/webhooks/paypal.test.ts`

### 11.3. Tests E2E

- Flujo completo de checkout con cada pasarela
- Validación de webhooks
- Validación de multi-tenancy

---

## 12. Despliegue y Monitoreo

### 12.1. Configuración de Webhooks en Pasarelas

Después de desplegar, configurar las URLs de webhooks:

- Stripe: `https://tudominio.com/api/webhooks/stripe`
- Mercado Pago: `https://tudominio.com/api/webhooks/mercadopago`
- PayPal: `https://tudominio.com/api/webhooks/paypal`

### 12.2. Monitoreo

- Configurar alertas en el sistema de logging para errores en webhooks
- Monitorear el estado de las transacciones en la base de datos
- Plan de contingencia para reconciliación manual de pagos

---

## 13. Tareas Pendientes y Mejoras Futuras

- **Componentes Frontend:** Implementar componentes de checkout completos

* `PaymentMethodSelector.tsx` - Selector de método de pago
* `StripePaymentForm.tsx` - Formulario de pago con Stripe Elements
* `MercadoPagoPaymentForm.tsx` - Integración con Mercado Pago Checkout
* `PayPalButton.tsx` - Botón de PayPal con redirección
* Páginas de éxito/fallo/pendiente (`/checkout/success`, `/checkout/failure`, `/checkout/pending`)

- **Reconciliación de Pagos:** Dashboard de administración para revisar y conciliar pagos

* Vista de todos los pagos con filtros por organización, estado, pasarela
* Herramientas para reconciliación manual
* Exportación de reportes de pagos
* Alertas para pagos pendientes o fallidos

- **Gestión de Reembolsos:** Implementar la lógica para procesar reembolsos

* Endpoint para iniciar reembolsos (`/api/admin/payments/[id]/refund`)
* Validación de elegibilidad para reembolso
* Integración con APIs de reembolso de cada pasarela
* Tracking de reembolsos en la base de datos

- **Suscripciones/Pagos Recurrentes:** Si el modelo de negocio lo requiere

* Integración con Stripe Billing para suscripciones
* Soporte para pagos recurrentes en Mercado Pago
* Gestión de ciclos de facturación
* Notificaciones de renovación y cancelación

- **Optimización de Carga:** Mejoras de performance

* Usar `dynamic import` de Next.js para cargar componentes de pasarela solo cuando se seleccionan
* Lazy loading de SDKs de pasarelas
* Reducir tamaño del bundle inicial

- **UX/UI Mejorada:** Mejoras en la experiencia de usuario

* Animaciones y feedback visual durante el proceso de pago
* Mensajes de error claros y accionables
* Indicadores de progreso
* Diseño responsive optimizado para móviles

- **Documentación de API:** Documentación detallada

* JSDoc completo en todas las funciones y clases
* Documentación de endpoints de API
* Guías de integración para desarrolladores
* Ejemplos de uso de cada pasarela

- **Monitoreo Avanzado:** Sistema de monitoreo y alertas

* Dashboard de métricas de pagos (tasa de éxito, tiempo promedio, etc.)
* Alertas proactivas para problemas de integración
* Integración con servicios de monitoreo (Sentry, LogRocket, etc.)
* Reportes automáticos de transacciones

- **Testing Completo:** Ampliar cobertura de tests

* Tests unitarios para todos los componentes de checkout
* Tests de integración para flujos completos
* Tests E2E con Playwright/Cypress
* Tests de carga para webhooks

- **Soporte Multi-Moneda:** Mejoras en manejo de monedas

* Conversión automática de monedas
* Soporte para múltiples monedas por organización
* Configuración de monedas permitidas por pasarela

- **Validación de PayPal Webhooks:** Implementar validación completa

* Validación de certificado y firma de webhooks de PayPal
* Implementar el proceso ping/pong de PayPal
* Manejo robusto de eventos de PayPal

---

## 14. Integración con el Plan de Mejoras Estructurales

Esta implementación forma parte de la **Phase SaaS 1 (Billing)** del Plan de Mejoras Estructurales.

### Relación con Otras Fases

- **Phase SaaS 0 (Multi-Tenancy):** ✅ Requerida - El sistema de pagos depende de la arquitectura multi-tenant
- **Phase 6 (Testing):** ⚠️ Recomendada - Los tests de integración validarán el sistema de pagos
- **Phase 3 (Seguridad):** ✅ Aplicada - Validación de webhooks, RLS, rate limiting

### Orden de Implementación Recomendado

1. **Completar Phase SaaS 0** - Asegurar que multi-tenancy está funcionando
2. **Crear estructura base de pagos** - Tablas, tipos, interfaces
3. **Implementar Stripe** - Pasarela más común y documentada
4. **Implementar Mercado Pago** - Para mercado latinoamericano
5. **Implementar PayPal** - Para cobertura global
6. **Implementar componentes frontend** - UI de checkout
7. **Testing completo** - Validar todas las integraciones
8. **Despliegue y monitoreo** - Configurar webhooks y alertas

### Checklist de Implementación

#### Fase 1: Preparación

- [x] Crear migración de base de datos (`payments`, `webhook_events`) — **2026-01-28:** Migración `20260131000000_create_payments_and_webhook_events.sql` creada y aplicada (RLS, índices, `get_user_organization_id` incluido).
- [ ] Configurar variables de entorno (Stripe, Mercado Pago, PayPal, `NEXT_PUBLIC_BASE_URL`)
- [x] Crear estructura de directorios (`src/lib/payments/`, `src/types/payment.ts`)
- [x] Definir tipos e interfaces (`Payment`, `WebhookEvent`, `IPaymentGateway`, etc.)

#### Fase 2: Backend Core

- [x] Implementar `PaymentService`
- [x] Implementar `PaymentGatewayFactory`
- [x] Crear endpoint `create-intent` (POST `/api/admin/payments/create-intent`)
- [x] Implementar validación y autenticación (Zod, admin + organization context)

#### Fase 3: Integración Stripe

- [x] Implementar `StripeGateway` (createPaymentIntent, processWebhookEvent, mapStatus)
- [x] Crear webhook endpoint de Stripe (`/api/webhooks/stripe`) — **2026-01-28:** `src/app/api/webhooks/stripe/route.ts` (firma, idempotencia, actualización pago, fulfill orden)
- [ ] Testing de integración con Stripe
- [ ] Documentación de Stripe

#### Fase 4: Integración Mercado Pago

- [ ] Implementar `MercadoPagoGateway`
- [ ] Crear webhook endpoint de Mercado Pago
- [ ] Testing de integración con Mercado Pago
- [ ] Documentación de Mercado Pago

#### Fase 5: Integración PayPal

- [ ] Implementar `PayPalGateway`
- [ ] Crear webhook endpoint de PayPal
- [ ] Implementar validación de webhooks de PayPal
- [ ] Testing de integración con PayPal
- [ ] Documentación de PayPal

#### Fase 6: Frontend

- [ ] Crear página de checkout
- [ ] Implementar `PaymentMethodSelector`
- [ ] Implementar componentes de cada pasarela
- [ ] Crear páginas de éxito/fallo/pendiente
- [ ] Testing de UI

#### Fase 7: Testing y Validación

- [ ] Tests unitarios completos
- [ ] Tests de integración completos
- [ ] Tests E2E
- [ ] Validación de multi-tenancy
- [ ] Validación de seguridad

#### Fase 8: Despliegue

- [ ] Configurar webhooks en pasarelas
- [ ] Configurar monitoreo y alertas
- [ ] Documentación final
- [ ] Training del equipo

---

## 15. Referencias y Recursos

### Documentación Oficial

- **Stripe:**
  - [Stripe API Documentation](https://stripe.com/docs/api)
  - [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
  - [Stripe React Elements](https://stripe.com/docs/stripe-js/react)

- **Mercado Pago:**
  - [Mercado Pago Developers](https://www.mercadopago.com/developers)
  - [Mercado Pago API Reference](https://www.mercadopago.com/developers/es/reference)
  - [Mercado Pago Webhooks](https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks)

- **PayPal:**
  - [PayPal Developer Documentation](https://developer.paypal.com/docs)
  - [PayPal Orders API](https://developer.paypal.com/docs/api/orders/v2/)
  - [PayPal Webhooks](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)

### Recursos del Proyecto

- `docs/PLAN_MEJORAS_ESTRUCTURALES.md` - Plan general de mejoras
- `docs/SAAS_IMPLEMENTATION_PLAN.md` - Plan de implementación SaaS
- `src/lib/logger/README.md` - Documentación del sistema de logging
- `src/lib/api/validation/` - Sistema de validación con Zod

### Herramientas y Librerías

- **Stripe:** `stripe`, `@stripe/react-stripe-js`, `@stripe/stripe-js`
- **Mercado Pago:** `mercadopago`
- **PayPal:** API REST nativa (sin librería oficial requerida)
- **Testing:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`

---

## 16. Conclusión

Esta guía proporciona una base sólida para implementar un sistema de pagos robusto, seguro y escalable que se integra perfectamente con la arquitectura multi-tenant existente del proyecto.

**Puntos clave a recordar:**

1. ✅ **Seguridad primero:** Validar siempre las firmas de webhooks
2. ✅ **Idempotencia:** Manejar eventos duplicados correctamente
3. ✅ **Multi-tenancy:** Aislar datos por organización
4. ✅ **Logging:** Registrar todos los eventos importantes
5. ✅ **Testing:** Validar cada integración antes de producción
6. ✅ **Monitoreo:** Configurar alertas para problemas críticos

**Próximos pasos:**

1. Revisar y aprobar esta guía
2. Crear el branch `phase-saas-1-billing`
3. Comenzar con la Fase 1: Preparación
4. Seguir el checklist de implementación
5. Documentar cualquier desviación o mejora encontrada

---

**Última actualización:** 2026-01-28  
**Versión del documento:** 1.0  
**Autor:** Equipo de Desarrollo - Opttius
