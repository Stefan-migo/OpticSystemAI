# 🧪 Guía de Testing - NOWPayments Sandbox

**Fecha:** 3 de Febrero, 2026  
**Tu Estado:** ✅ Cuenta creada, variables configuradas  
**Siguiente:** Probar la integración

---

## 📋 Checklist Pre-Testing

Antes de empezar, verifica que tienes:

- [x] Cuenta en NOWPayments Sandbox
- [x] Variables en `.env.local`:
  - `NOWPAYMENTS_SANDBOX_MODE=true`
  - `NOWPAYMENTS_SANDBOX_API_KEY=tu_key`
  - `NOWPAYMENTS_IPN_SECRET=tu_secret`
- [ ] Túnel ngrok configurado
- [ ] Aplicación corriendo
- [ ] Webhook URL configurada en NOWPayments

---

## 🚀 Paso a Paso - Testing Sandbox

### **Paso 1: Configurar Webhook URL** (5 minutos)

#### 1.1 Iniciar Túnel ngrok

```bash
# En una terminal, ejecuta:
npm run tunnel
```

**Resultado esperado:**

```
ngrok

Session Status                online
Account                       [tu cuenta]
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
```

**⚠️ IMPORTANTE:** Copia la URL HTTPS (ej: `https://abc123.ngrok-free.app`)

#### 1.2 Actualizar .env.local

Abre `.env.local` y actualiza:

```bash
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok-free.app
```

**Guarda el archivo.**

#### 1.3 Configurar en NOWPayments Dashboard

1. Ve a: https://account-sandbox.nowpayments.io
2. Navega a: **Settings** → **IPN Settings**
3. En "IPN Callback URL" ingresa:
   ```
   https://abc123.ngrok-free.app/api/webhooks/nowpayments
   ```
4. Marca la casilla **"Enable IPN"**
5. Haz clic en **"Save"**

---

### **Paso 2: Iniciar la Aplicación** (1 minuto)

#### 2.1 Abrir nueva terminal

```bash
# En una NUEVA terminal (deja ngrok corriendo)
npm run dev
```

**Resultado esperado:**

```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
- Ready in 2.3s
```

#### 2.2 Verificar que el servidor está corriendo

Abre tu navegador en: http://localhost:3000

---

### **Paso 3: Verificar Endpoint de Webhook** (30 segundos)

#### 3.1 Probar endpoint localmente

```bash
# En otra terminal:
curl http://localhost:3000/api/webhooks/nowpayments
```

**Resultado esperado:**

```json
{
  "status": "ok",
  "message": "NOWPayments webhook endpoint is active"
}
```

#### 3.2 Probar endpoint vía ngrok

```bash
curl https://abc123.ngrok-free.app/api/webhooks/nowpayments
```

**Resultado esperado:**

```json
{
  "status": "ok",
  "message": "NOWPayments webhook endpoint is active"
}
```

✅ Si ambos responden, ¡el webhook está listo!

---

### **Paso 4: Crear Pago de Prueba** (2 minutos)

#### 4.1 Ir al Checkout

1. Abre tu navegador
2. Ve a: http://localhost:3000/checkout
3. Si no estás logueado, inicia sesión primero

#### 4.2 Seleccionar Plan

1. Selecciona cualquier plan (Basic, Pro, o Premium)
2. Haz clic en el plan para seleccionarlo

#### 4.3 Seleccionar Método de Pago "Cripto"

1. En la sección "Método de Pago"
2. Haz clic en el botón **"Cripto"** (con ícono de monedas 💰)
3. Debe quedar seleccionado (borde azul)

#### 4.4 Proceder al Pago

1. Haz clic en el botón **"Pagar con Cripto"**
2. Deberías ver un mensaje: "Redirigiendo a la pasarela de criptomonedas..."

**¿Qué debería pasar?**

- ✅ Redirección a página de NOWPayments
- ✅ URL tipo: `https://nowpayments.io/payment/...`
- ✅ Página de invoice con opciones de pago

---

### **Paso 5: Simular Pago en Sandbox** (3 minutos)

#### 5.1 En la Página de Invoice de NOWPayments

**Opción A: Usar el Dashboard (Recomendado)**

1. **NO cierres** la página del invoice
2. Copia el **Payment ID** de la URL (ej: `123456789`)
3. Abre una nueva pestaña
4. Ve a: https://account-sandbox.nowpayments.io
5. Navega a: **Payments** → **All Payments**
6. Busca tu pago reciente (por Payment ID o monto)
7. Haz clic en el pago
8. Busca el botón **"Simulate Payment"** o **"Change Status"**
9. Selecciona estado: **"Finished"**
10. Confirma

**Opción B: Desde la Página de Invoice**

1. En la página de invoice de NOWPayments
2. Selecciona una criptomoneda (ej: BTC)
3. En modo sandbox, debería haber una opción para simular
4. Sigue las instrucciones en pantalla

#### 5.2 Verificar Webhook Recibido

**En tu terminal donde corre `npm run dev`, deberías ver:**

```
✓ NOWPayments webhook received
✓ NOWPayments webhook event processed
✓ Payment updated successfully
```

---

### **Paso 6: Verificar en Base de Datos** (1 minuto)

#### 6.1 Abrir Supabase Studio

```bash
# La URL debería ser:
http://127.0.0.1:54323
```

#### 6.2 Verificar Pago

1. Ve a **Table Editor**
2. Selecciona tabla: **payments**
3. Busca el pago más reciente
4. Verifica:
   - `gateway` = "nowpayments"
   - `status` = "succeeded" (si simulaste "finished")
   - `amount` = el monto que seleccionaste
   - `metadata` contiene información de la crypto

---

## 🧪 Tests Adicionales

### Test 1: Pago Fallido

1. Crear nuevo pago
2. En NOWPayments Sandbox, simular estado: **"Failed"**
3. Verificar que el pago en DB cambia a `status = "failed"`

### Test 2: Pago Expirado

1. Crear nuevo pago
2. Simular estado: **"Expired"**
3. Verificar que el pago en DB cambia a `status = "failed"`

### Test 3: Pago Parcial

1. Crear nuevo pago
2. Simular estado: **"Partially Paid"**
3. Verificar que el pago permanece en `status = "pending"`

---

## 🔍 Verificación de Logs

### Ver Logs de la Aplicación

En la terminal donde corre `npm run dev`, busca:

```
[INFO] NOWPayments invoice created
[INFO] NOWPayments webhook received
[INFO] Payment updated successfully
```

### Ver Logs en NOWPayments Dashboard

1. Ve a: https://account-sandbox.nowpayments.io
2. Navega a: **Payments** → **All Payments**
3. Haz clic en tu pago
4. Revisa el historial de eventos

---

## ✅ Checklist de Verificación

### Configuración

- [ ] ngrok corriendo
- [ ] NEXT_PUBLIC_BASE_URL actualizado
- [ ] Webhook URL configurada en NOWPayments
- [ ] IPN habilitado en NOWPayments
- [ ] Aplicación corriendo (`npm run dev`)

### Testing

- [ ] Endpoint de webhook responde OK
- [ ] Puedo acceder al checkout
- [ ] Puedo seleccionar "Cripto"
- [ ] Redirección a NOWPayments funciona
- [ ] Puedo ver la página de invoice
- [ ] Puedo simular pago en dashboard
- [ ] Webhook se recibe correctamente
- [ ] Pago se actualiza en base de datos

---

## 🐛 Troubleshooting

### Problema: No se crea el invoice

**Síntomas:**

- Error al hacer clic en "Pagar con Cripto"
- No hay redirección

**Solución:**

1. Verifica que `NOWPAYMENTS_SANDBOX_API_KEY` esté correcta
2. Verifica que `NOWPAYMENTS_SANDBOX_MODE=true`
3. Revisa los logs en la terminal
4. Verifica que estés logueado en la aplicación

### Problema: Webhook no llega

**Síntomas:**

- Pago simulado pero no se actualiza en DB
- No hay logs de webhook en la terminal

**Solución:**

1. Verifica que ngrok esté corriendo
2. Verifica que `NEXT_PUBLIC_BASE_URL` tenga la URL de ngrok
3. Verifica que la URL de webhook en NOWPayments sea correcta
4. Verifica que IPN esté habilitado
5. Prueba el endpoint manualmente:
   ```bash
   curl https://tu-ngrok-url.ngrok-free.app/api/webhooks/nowpayments
   ```

### Problema: Error de firma inválida

**Síntomas:**

- Webhook llega pero da error "Invalid IPN signature"

**Solución:**

1. Verifica que `NOWPAYMENTS_IPN_SECRET` esté correcto
2. Verifica que no haya espacios extra al copiar
3. Regenera el IPN Secret en NOWPayments si es necesario

### Problema: No puedo simular pago

**Síntomas:**

- No encuentro opción para simular en dashboard

**Solución:**

1. Asegúrate de estar en el dashboard de **Sandbox**
2. URL debe ser: `account-sandbox.nowpayments.io`
3. Si no ves la opción, contacta soporte de NOWPayments

---

## 📊 Comandos Útiles

### Ver logs en tiempo real

```bash
# Terminal 1: ngrok
npm run tunnel

# Terminal 2: aplicación con logs
npm run dev

# Terminal 3: monitorear base de datos
# Abre Supabase Studio: http://127.0.0.1:54323
```

### Probar webhook manualmente

```bash
# Simular webhook de pago exitoso
curl -X POST http://localhost:3000/api/webhooks/nowpayments \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "test_123",
    "payment_status": "finished",
    "price_amount": 10000,
    "price_currency": "CLP",
    "pay_amount": 0.001,
    "pay_currency": "BTC",
    "order_id": "test_order_123"
  }'
```

### Verificar pagos en DB

```sql
-- En Supabase Studio, SQL Editor:
SELECT
  id,
  status,
  amount,
  gateway,
  created_at,
  metadata
FROM payments
WHERE gateway = 'nowpayments'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🎯 Próximos Pasos

Una vez que todo funcione en Sandbox:

1. **Documentar:** Anota cualquier issue que encuentres
2. **Probar escenarios:** Prueba todos los estados (success, failed, expired)
3. **Verificar suscripciones:** Verifica que la suscripción se active correctamente
4. **Preparar para producción:** Cuando estés listo, sigue el deployment checklist

---

## 📚 Referencias

- **Testing Guide Completo:** `docs/CRYPTO_PAYMENTS_TESTING_GUIDE.md`
- **Troubleshooting:** `docs/CRYPTO_PAYMENTS_QUICKSTART.md`
- **NOWPayments Docs:** https://documenter.getpostman.com/view/7907941/S1a32n38

---

**¡Éxito con tus pruebas!** 🚀

Si encuentras algún problema, revisa la sección de Troubleshooting o consulta las guías completas.
