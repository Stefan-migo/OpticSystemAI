# Guía de alta y variables de entorno — Flow, Mercado Pago, PayPal

**Proyecto:** Business Management App  
**Objetivo:** Obtener credenciales y configurar variables de entorno para las pasarelas de pago.  
**Referencia:** `docs/PAYMENT_GATEWAYS_IMPLEMENTATION_GUIDE.md`

**Nota importante:** Flow es la pasarela principal para Chile, ya que Stripe no tiene soporte en Chile.

---

## Tabla de contenidos

1. [Resumen de variables necesarias](#1-resumen-de-variables-necesarias)
2. [Flow (Chile) — Alta y obtención de claves](#2-flow-chile--alta-y-obtención-de-claves)
3. [Mercado Pago — Alta y obtención de claves](#3-mercado-pago--alta-y-obtención-de-claves)
4. [PayPal — Alta y obtención de claves](#4-paypal--alta-y-obtención-de-claves)
5. [NEXT_PUBLIC_BASE_URL](#5-next_public_base_url)
6. [Archivo .env.local de ejemplo](#6-archivo-envlocal-de-ejemplo)
7. [Producción (Vercel u otro host)](#7-producción-vercel-u-otro-host)

---

## 1. Resumen de variables necesarias

| Variable                    | Dónde se usa                                         | Requerida para |
| --------------------------- | ---------------------------------------------------- | -------------- |
| `FLOW_API_KEY`              | Backend (crear órdenes)                              | Flow           |
| `FLOW_SECRET_KEY`           | Backend (firma HMAC-SHA256)                          | Flow           |
| `FLOW_API_URL`              | Backend (opcional, default: https://www.flow.cl/api) | Flow           |
| `FLOW_DEFAULT_EMAIL`        | Backend (email del pagador, opcional)                | Flow           |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Frontend (Mercado Pago SDK)                          | Mercado Pago   |
| `MP_ACCESS_TOKEN`           | Backend (preferencias, webhooks)                     | Mercado Pago   |
| `MP_WEBHOOK_SECRET`         | Backend (opcional, validación webhook)               | Mercado Pago   |
| `PAYPAL_CLIENT_ID`          | Backend / Frontend                                   | PayPal         |
| `PAYPAL_CLIENT_SECRET`      | Backend                                              | PayPal         |
| `PAYPAL_API_BASE_URL`       | Backend (sandbox vs live)                            | PayPal         |
| `PAYPAL_WEBHOOK_ID`         | Backend (validación webhook)                         | PayPal         |
| `NEXT_PUBLIC_BASE_URL`      | Callbacks, URLs de retorno, webhooks                 | Todas          |

---

## 2. Flow (Chile) — Alta y obtención de claves

### 2.1. Darse de alta en Flow

1. Entra en **[https://www.flow.cl](https://www.flow.cl)** y haz clic en **"Regístrate"** o **"Crear cuenta"**.
2. Completa el registro con tus datos de negocio (nombre, RUT, email, teléfono, dirección).
3. Flow requiere validación de identidad para activar la cuenta de comercio.
4. Una vez activada tu cuenta, accede al **Panel de Comercio** de Flow.

### 2.2. Modo Sandbox vs Producción

- **Sandbox:** Ambiente de pruebas donde puedes probar pagos sin cobrar dinero real. Flow proporciona credenciales de prueba.
- **Producción:** Ambiente real donde se procesan pagos reales. Requiere activación completa de la cuenta.

### 2.3. Obtener API Key y Secret Key

1. Inicia sesión en tu **Panel de Comercio** de Flow.
2. Ve a la sección **"Integraciones"** o **"API"** (la ubicación exacta puede variar según la versión del panel).
3. Busca **"API Key"** y **"Secret Key"** (o **"Clave Secreta"**).
4. Copia los valores:
   - **API Key** → esta es `FLOW_API_KEY`.
   - **Secret Key** → esta es `FLOW_SECRET_KEY`.
5. **Importante:** La Secret Key no debe exponerse nunca en el frontend ni subirse a repositorios públicos. Solo en backend y en variables de entorno del servidor.

**Nota:** Si no encuentras estas opciones en el panel, contacta al soporte de Flow:

- Teléfono: +56 2 2583 0102 (opción 2)
- Email: soporte@flow.cl

### 2.4. Configurar URL de Webhook

1. En el Panel de Comercio de Flow, ve a **"Configuración"** → **"Webhooks"** o **"Notificaciones"**.
2. Agrega la URL de tu webhook:
   - Producción: `https://tudominio.com/api/webhooks/flow`
   - Desarrollo (con ngrok): `https://xxxx.ngrok.io/api/webhooks/flow`
3. Flow enviará callbacks a esta URL cuando cambie el estado de un pago.

### 2.5. Resumen Flow

| Variable             | Dónde copiarla                                     |
| -------------------- | -------------------------------------------------- |
| `FLOW_API_KEY`       | Panel de Comercio → Integraciones/API → API Key    |
| `FLOW_SECRET_KEY`    | Panel de Comercio → Integraciones/API → Secret Key |
| `FLOW_API_URL`       | Opcional, default: `https://www.flow.cl/api`       |
| `FLOW_DEFAULT_EMAIL` | Opcional, email del pagador por defecto            |

**Documentación oficial:** [https://developers.flow.cl](https://developers.flow.cl)

---

## 3. Mercado Pago — Alta y obtención de claves

### 3.1. Darse de alta en Mercado Pago Developers

1. Entra en **[https://www.mercadopago.com/developers](https://www.mercadopago.com/developers)**.
2. Inicia sesión con tu cuenta de Mercado Pago (o crea una).
3. Ve a **Tus integraciones** o **Tu panel** ([https://www.mercadopago.com/developers/panel](https://www.mercadopago.com/developers/panel)).

### 3.2. Crear una aplicación

1. En el panel, **Crear aplicación** (o **Applications**).
2. Elige un nombre (ej. "Business Management App") y el modo:
   - **Modo producción:** pagos reales.
   - **Modo pruebas (sandbox):** pagos de prueba.
3. Guarda. Entrarás a la ficha de la aplicación.

### 3.3. Obtener credenciales

1. En la aplicación, abre la pestaña **Credenciales** (o **Credentials**).
2. Verás dos conjuntos:
   - **Credenciales de prueba:** para sandbox.
   - **Credenciales de producción:** cuando actives la app en producción.
3. Copia:
   - **Public Key** (ej. `APP_USR-...`) → `NEXT_PUBLIC_MP_PUBLIC_KEY`.
   - **Access Token** (ej. `APP_USR-...`) → `MP_ACCESS_TOKEN`.  
     No compartas el Access Token; solo backend y variables de entorno.

### 3.4. Webhooks (notificaciones)

1. En la aplicación, ve a **Webhooks** o **Notificaciones**.
2. **URL de notificación:**
   - Producción: `https://tudominio.com/api/webhooks/mercadopago`
   - Con ngrok: `https://xxxx.ngrok.io/api/webhooks/mercadopago`
3. Eventos típicos: **Pagos** (payment created/updated).
4. Si Mercado Pago ofrece un "secret" o "clave de seguridad" para la URL, úsalo como `MP_WEBHOOK_SECRET` (si tu código lo soporta).

### 3.5. Resumen Mercado Pago

| Variable                    | Dónde copiarla                               |
| --------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Panel → Tu app → Credenciales → Public Key   |
| `MP_ACCESS_TOKEN`           | Panel → Tu app → Credenciales → Access Token |
| `MP_WEBHOOK_SECRET`         | Panel → Webhooks (si aplica); opcional       |

---

## 4. PayPal — Alta y obtención de claves

### 4.1. Darse de alta en PayPal Developer

1. Entra en **[https://developer.paypal.com](https://developer.paypal.com)**.
2. Inicia sesión con tu cuenta PayPal (o regístrate).
3. Ve al **Dashboard** ([https://developer.paypal.com/dashboard](https://developer.paypal.com/dashboard)).

### 4.2. Crear una aplicación

1. En **My Apps & Credentials** (o **Apps & Credentials**).
2. Clic en **Create App**.
3. Nombre (ej. "Business Management App") y tipo (Merchant / etc.). Crear.

### 4.3. Obtener Client ID y Secret

1. En la lista de apps, abre tu aplicación.
2. Pestaña **Sandbox** (pruebas) o **Live** (producción):
   - **Client ID** → `PAYPAL_CLIENT_ID`.
   - **Secret** → **Show** → copiar → `PAYPAL_CLIENT_SECRET`.
3. El Secret solo en backend y variables de entorno; nunca en el frontend.

### 4.4. URLs de API

- **Sandbox:** `https://api-m.sandbox.paypal.com` → `PAYPAL_API_BASE_URL`.
- **Live:** `https://api-m.paypal.com` → `PAYPAL_API_BASE_URL` (producción).

### 4.5. Webhooks

1. En el Dashboard, **Webhooks** (o dentro de la app).
2. **Add Webhook**.
3. **URL:**
   - Producción: `https://tudominio.com/api/webhooks/paypal`
   - Con ngrok: `https://xxxx.ngrok.io/api/webhooks/paypal`
4. Eventos: p. ej. `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED`, etc.
5. Al crear el webhook, PayPal muestra un **Webhook ID** → ese valor es `PAYPAL_WEBHOOK_ID` (si tu implementación lo usa para validación).

### 4.6. Resumen PayPal

| Variable               | Dónde copiarla                                                                 |
| ---------------------- | ------------------------------------------------------------------------------ |
| `PAYPAL_CLIENT_ID`     | Developer Dashboard → App → Sandbox/Live → Client ID                           |
| `PAYPAL_CLIENT_SECRET` | Developer Dashboard → App → Sandbox/Live → Secret                              |
| `PAYPAL_API_BASE_URL`  | Sandbox: `https://api-m.sandbox.paypal.com` / Live: `https://api-m.paypal.com` |
| `PAYPAL_WEBHOOK_ID`    | Dashboard → Webhooks → ID del webhook creado                                   |

---

## 5. NEXT_PUBLIC_BASE_URL

- **Desarrollo:** `http://localhost:3000` (o el puerto que uses).
- **Producción:** `https://tudominio.com` (sin barra final).

Se usa en:

- Callbacks de Flow (urlConfirmation, urlReturn).
- Callbacks de Mercado Pago (success, failure, pending).
- Contexto de PayPal (return_url, cancel_url).
- Cualquier URL absoluta que devuelva tu backend a la pasarela.

Ejemplo:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 6. Archivo .env.local de ejemplo

Crea o edita `.env.local` en la raíz del proyecto (no subas este archivo a Git; ya debería estar en `.gitignore`):

```env
# ========== Base URL (callbacks, webhooks) ==========
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# ========== Flow (Chile) ==========
FLOW_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
FLOW_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
FLOW_API_URL=https://www.flow.cl/api
FLOW_DEFAULT_EMAIL=test@example.com

# ========== Mercado Pago ==========
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# MP_WEBHOOK_SECRET=optional_if_provided_by_mercadopago

# ========== PayPal (Sandbox) ==========
PAYPAL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=xxxxxxxxxx
```

Sustituye los valores `xxx...` por los que obtuviste en cada pasarela. Para desarrollo puedes dejar solo Flow (y `NEXT_PUBLIC_BASE_URL`) si aún no usas Mercado Pago ni PayPal.

---

## 7. Producción (Vercel u otro host)

1. **Variables de entorno:** En el panel de tu hosting (Vercel → Project → Settings → Environment Variables), crea las mismas variables con valores de **producción** (claves Live, URLs live de PayPal, `NEXT_PUBLIC_BASE_URL=https://tudominio.com`).
2. **Webhooks:** En cada pasarela, configura la URL de webhook con tu dominio real:
   - Flow: `https://tudominio.com/api/webhooks/flow`
   - Mercado Pago: `https://tudominio.com/api/webhooks/mercadopago`
   - PayPal: `https://tudominio.com/api/webhooks/paypal`
3. **HTTPS:** En producción la base y las URLs de webhook deben ser HTTPS.

---

**Última actualización:** 2026-01-29  
**Relacionado:** `docs/PAYMENT_GATEWAYS_IMPLEMENTATION_GUIDE.md`, `docs/PROGRESO_MEJORAS.md`
