# Payflow - Pruebas con Sandbox

Guía para probar el flujo de pagos con Flow y Mercado Pago en modo sandbox.

## Configuración

### Variables de entorno para sandbox

En `.env.local`:

```env
# Flow Sandbox
FLOW_SANDBOX_MODE=true
FLOW_API_KEY_SANDBOX=tu_api_key_sandbox_flow
FLOW_SECRET_KEY_SANDBOX=tu_secret_key_sandbox_flow

# Mercado Pago Sandbox
MERCADOPAGO_SANDBOX_MODE=true
MP_ACCESS_TOKEN_SANDBOX=tu_access_token_prueba_mp
```

### Flow (Chile)

1. Accede al **Panel de Comercio** de Flow.
2. Busca la sección de **Sandbox** o **Ambiente de pruebas**.
3. Obtén las credenciales de prueba (API Key y Secret Key).
4. Flow sandbox usa `https://sandbox.flow.cl/api` como URL base (se aplica automáticamente cuando `FLOW_SANDBOX_MODE=true`).

### Mercado Pago

1. Accede a [Mercado Pago Developers](https://www.mercadopago.cl/developers).
2. Crea una aplicación de prueba.
3. En **Credenciales de prueba**, copia el **Access Token**.
4. Usa ese token en `MP_ACCESS_TOKEN_SANDBOX`.

## Probar el checkout

1. Inicia la app: `npm run dev`
2. Navega a `/admin/checkout` (requiere sesión admin).
3. Selecciona pasarela (Flow o Mercado Pago).
4. Ingresa un monto de prueba (ej. 1000 CLP).
5. Haz clic en "Continuar con Flow" o "Continuar con Mercado Pago".
6. Serás redirigido a la página de pago de la pasarela (sandbox).

## Tarjetas de prueba

### Flow

Consulta la documentación de Flow para tarjetas de prueba en sandbox.

### Mercado Pago

- **Aprobada:** 5031 7557 3453 0604
- **Rechazada:** 5031 4332 1540 6351
- **Pendiente:** 5031 7557 3453 0604 (con CVV específico)

Más tarjetas: [Mercado Pago - Tarjetas de prueba](https://www.mercadopago.cl/developers/es/docs/checkout-bricks/additional-content/test-cards)

## Webhooks en desarrollo local

Para recibir webhooks de Flow o Mercado Pago en local:

1. Usa **ngrok** o similar: `ngrok http 3000`
2. Configura `NEXT_PUBLIC_BASE_URL` con la URL de ngrok.
3. En el panel de la pasarela, registra la URL del webhook: `https://xxx.ngrok.io/api/webhooks/flow` (o `/mercadopago`).
