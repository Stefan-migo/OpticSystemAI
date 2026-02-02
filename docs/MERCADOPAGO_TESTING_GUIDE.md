# Guía de Pruebas - MercadoPago

**Proyecto:** Opttius  
**Fecha:** Febrero 2026  
**Versión:** 1.0

---

## 📋 Tabla de Contenidos

1. [Ambiente Sandbox](#ambiente-sandbox)
2. [Tarjetas de Prueba](#tarjetas-de-prueba)
3. [Casos de Prueba](#casos-de-prueba)
4. [Herramientas de Testing](#herramientas-de-testing)
5. [Troubleshooting](#troubleshooting)

---

## Ambiente Sandbox

### Activar Modo Sandbox

Para activar el modo sandbox, configurar en `.env.local`:

```bash
MERCADOPAGO_SANDBOX_MODE=true
MP_ACCESS_TOKEN_SANDBOX=TEST-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxx
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_SANDBOX=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Credenciales de Prueba

1. Acceder a [Panel de Desarrolladores](https://www.mercadopago.com/developers/panel/app)
2. Seleccionar tu aplicación
3. Ir a **Detalles de aplicación > Pruebas > Credenciales de prueba**
4. Copiar:
   - **Public Key de prueba**
   - **Access Token de prueba**

### Usuarios de Prueba

Crear usuarios de prueba para simular compradores:

1. Ir a **Tus integraciones > Usuarios de prueba**
2. Crear un usuario comprador
3. Usar ese usuario para realizar pagos de prueba

---

## Tarjetas de Prueba

### Chile (CLP)

#### Tarjetas Aprobadas

| Tarjeta          | Número              | CVV  | Fecha | Nombre | Resultado |
| ---------------- | ------------------- | ---- | ----- | ------ | --------- |
| Visa             | 4509 9535 6623 3704 | 123  | 11/25 | APRO   | Aprobado  |
| Mastercard       | 5031 7557 3453 0604 | 123  | 11/25 | APRO   | Aprobado  |
| American Express | 3711 803032 57522   | 1234 | 11/25 | APRO   | Aprobado  |

#### Tarjetas Rechazadas

| Tarjeta    | Número              | CVV | Fecha | Nombre | Resultado                       |
| ---------- | ------------------- | --- | ----- | ------ | ------------------------------- |
| Visa       | 4168 8188 4444 7115 | 123 | 11/25 | OTHE   | Rechazado (insufficient_amount) |
| Mastercard | 5031 4332 1540 6351 | 123 | 11/25 | OTHE   | Rechazado (call_for_authorize)  |

#### Tarjetas Pendientes

| Tarjeta | Número              | CVV | Fecha | Nombre | Resultado              |
| ------- | ------------------- | --- | ----- | ------ | ---------------------- |
| Visa    | 4509 9535 6623 3704 | 123 | 11/25 | CONT   | Pendiente (in_process) |

### Argentina (ARS)

#### Tarjetas Aprobadas

| Tarjeta    | Número              | CVV | Fecha | Nombre | Resultado |
| ---------- | ------------------- | --- | ----- | ------ | --------- |
| Visa       | 4509 9535 6623 3704 | 123 | 11/25 | APRO   | Aprobado  |
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 | APRO   | Aprobado  |

### México (MXN)

#### Tarjetas Aprobadas

| Tarjeta    | Número              | CVV | Fecha | Nombre | Resultado |
| ---------- | ------------------- | --- | ----- | ------ | --------- |
| Visa       | 4075 5957 1648 3764 | 123 | 11/25 | APRO   | Aprobado  |
| Mastercard | 5474 9254 3267 0366 | 123 | 11/25 | APRO   | Aprobado  |

### Notas Importantes

- **CVV:** Puede ser cualquier número de 3 o 4 dígitos
- **Fecha de vencimiento:** Cualquier fecha futura
- **Nombre:** El nombre del titular determina el resultado del pago
  - `APRO` → Aprobado
  - `OTHE` → Rechazado
  - `CONT` → Pendiente

---

## Casos de Prueba

### CP-001: Pago Aprobado con Tarjeta de Crédito

**Objetivo:** Verificar flujo completo de pago exitoso

**Precondiciones:**

- Modo sandbox activado
- Usuario autenticado

**Pasos:**

1. Ir a `/admin/checkout`
2. Seleccionar plan "Pro" ($50.000 CLP)
3. Seleccionar pasarela "Mercado Pago"
4. Hacer clic en "Continuar con Mercado Pago"
5. En el checkout de MP, ingresar:
   - Tarjeta: 4509 9535 6623 3704
   - CVV: 123
   - Fecha: 11/25
   - Nombre: APRO
6. Completar pago

**Resultado Esperado:**

- ✅ Redirección a página de éxito
- ✅ Estado del pago: "succeeded"
- ✅ Webhook recibido y procesado
- ✅ Registro en tabla `payments`
- ✅ Registro en tabla `webhook_events`
- ✅ Si hay orden asociada, estado actualizado a "completed"

**Verificación en BD:**

```sql
SELECT * FROM payments
WHERE gateway = 'mercadopago'
ORDER BY created_at DESC
LIMIT 1;

SELECT * FROM webhook_events
WHERE gateway = 'mercadopago'
ORDER BY created_at DESC
LIMIT 1;
```

---

### CP-002: Pago Rechazado

**Objetivo:** Verificar manejo de pago rechazado

**Precondiciones:**

- Modo sandbox activado
- Usuario autenticado

**Pasos:**

1. Ir a `/admin/checkout`
2. Seleccionar monto: $10.000 CLP
3. Seleccionar pasarela "Mercado Pago"
4. Hacer clic en "Continuar con Mercado Pago"
5. En el checkout de MP, ingresar:
   - Tarjeta: 4168 8188 4444 7115
   - CVV: 123
   - Fecha: 11/25
   - Nombre: OTHE
6. Intentar completar pago

**Resultado Esperado:**

- ✅ Mensaje de error en MP
- ✅ Redirección a página de error
- ✅ Estado del pago: "failed"
- ✅ Webhook recibido y procesado
- ✅ Usuario puede reintentar el pago

**Verificación:**

```sql
SELECT status, gateway_transaction_id, metadata
FROM payments
WHERE gateway = 'mercadopago'
AND status = 'failed'
ORDER BY created_at DESC
LIMIT 1;
```

---

### CP-003: Pago Pendiente (Efectivo)

**Objetivo:** Verificar flujo de pago offline

**Precondiciones:**

- Modo sandbox activado
- Usuario autenticado

**Pasos:**

1. Ir a `/admin/checkout`
2. Seleccionar monto: $5.000 CLP
3. Seleccionar pasarela "Mercado Pago"
4. Hacer clic en "Continuar con Mercado Pago"
5. Seleccionar método de pago: "Efectivo"
6. Completar el flujo

**Resultado Esperado:**

- ✅ Redirección a página de pendiente
- ✅ Estado del pago: "pending"
- ✅ Instrucciones de pago mostradas al usuario
- ✅ Webhook recibido y procesado
- ✅ Comprobante de pago generado

---

### CP-004: Webhook Idempotencia

**Objetivo:** Verificar que webhooks duplicados no se procesen dos veces

**Precondiciones:**

- Webhook handler configurado
- Payment existente en BD

**Pasos:**

1. Crear un pago de prueba
2. Simular webhook desde el panel de MP
3. Enviar el mismo webhook 3 veces consecutivas

**Resultado Esperado:**

- ✅ Solo un registro en `webhook_events` con `processed = true`
- ✅ Estado del pago actualizado solo una vez
- ✅ Logs muestran "Already processed" para webhooks 2 y 3
- ✅ Respuesta HTTP 200 para todos los webhooks

**Verificación:**

```sql
SELECT COUNT(*) as count, gateway_event_id
FROM webhook_events
WHERE gateway = 'mercadopago'
GROUP BY gateway_event_id
HAVING COUNT(*) > 1;
-- Debe retornar 0 filas
```

---

### CP-005: Validación de Firma de Webhook

**Objetivo:** Verificar seguridad de webhooks

**Precondiciones:**

- `MERCADOPAGO_WEBHOOK_SECRET` configurado
- Servidor corriendo

**Pasos:**

1. Enviar webhook con firma inválida:

```bash
curl -X GET "http://localhost:3000/api/webhooks/mercadopago?topic=payment&id=123456" \
  -H "x-signature: ts=1234567890,v1=invalid_signature" \
  -H "x-request-id: test-request-id"
```

**Resultado Esperado:**

- ✅ HTTP 401 Unauthorized
- ✅ Webhook rechazado
- ✅ Log: "Webhook signature validation failed"
- ✅ No se procesa el pago

---

### CP-006: Timeout de Preferencia

**Objetivo:** Verificar expiración de preferencias de pago

**Precondiciones:**

- Preferencia con `expiration_date_to` configurado

**Pasos:**

1. Crear intento de pago con expiración de 5 minutos
2. Esperar 6 minutos
3. Intentar completar el pago

**Resultado Esperado:**

- ✅ Error en MP: "Preference expired"
- ✅ Usuario debe crear nuevo intento de pago

---

### CP-007: Múltiples Métodos de Pago

**Objetivo:** Verificar soporte para diferentes métodos de pago

**Precondiciones:**

- Modo sandbox activado

**Métodos a Probar:**

1. Tarjeta de crédito (Visa, Mastercard, Amex)
2. Tarjeta de débito
3. Efectivo (Servipag, etc.)
4. Transferencia bancaria

**Resultado Esperado:**

- ✅ Todos los métodos disponibles en el checkout
- ✅ Cada método procesa correctamente
- ✅ Estados correctos según el método

---

### CP-008: Reembolso (Manual)

**Objetivo:** Verificar proceso de reembolso

**Precondiciones:**

- Pago exitoso existente

**Pasos:**

1. Desde el panel de MP, procesar reembolso
2. Verificar que el webhook de reembolso se reciba

**Resultado Esperado:**

- ✅ Webhook con `action: "payment.updated"` y `status: "refunded"`
- ✅ Estado del pago actualizado a "refunded"
- ✅ Registro en logs

---

## Herramientas de Testing

### 1. Postman Collection

Importar la colección de Postman con todos los endpoints:

**Archivo:** `postman/MercadoPago-Opttius.postman_collection.json`

Endpoints incluidos:

- `POST /api/admin/payments/create-intent`
- `GET /api/webhooks/mercadopago`
- `GET /api/admin/payments/:id`

### 2. Scripts de Prueba Automatizados

```bash
# Ejecutar suite completa de tests de MercadoPago
npm run test:run -- src/__tests__/integration/api/payments-mercadopago.test.ts

# Ejecutar tests unitarios del gateway
npm run test:run -- src/__tests__/unit/lib/payments/mercadopago-gateway.test.ts

# Ejecutar tests del validador de webhooks
npm run test:run -- src/__tests__/unit/lib/payments/mercadopago-webhook-validator.test.ts

# Ejecutar todos los tests con cobertura
npm run test:coverage
```

### 3. ngrok para Testing Local

Para probar webhooks en desarrollo local:

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3000
ngrok http 3000

# Usar la URL generada en el panel de MP
# Ejemplo: https://abc123.ngrok.io/api/webhooks/mercadopago
```

### 4. Logs y Debugging

```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Filtrar logs de MercadoPago
tail -f logs/app.log | grep "Mercado Pago"

# Ver logs de webhooks
tail -f logs/app.log | grep "Webhook"

# Ver logs de errores
tail -f logs/app.log | grep "ERROR"
```

### 5. Simulador de Webhooks

Usar el simulador en el panel de MP:

1. Ir a **Tus integraciones > Webhooks > Simular**
2. Seleccionar URL (prueba o producción)
3. Tipo de evento: **payment**
4. Ingresar Data ID de un pago de prueba
5. Enviar prueba
6. Verificar respuesta y logs

---

## Troubleshooting

### Problema: Webhook no se recibe

**Síntomas:**

- Pago completado en MP
- Estado no se actualiza en Opttius
- No hay registros en `webhook_events`

**Diagnóstico:**

```bash
# Verificar que el endpoint esté accesible
curl -I https://app.opttius.com/api/webhooks/mercadopago

# Verificar logs del servidor
tail -f logs/app.log | grep "Webhook"

# Verificar configuración en panel de MP
```

**Soluciones:**

1. Verificar que la URL esté correcta en el panel de MP
2. Verificar que el servidor esté accesible públicamente
3. En desarrollo, usar ngrok
4. Verificar que no haya firewall bloqueando
5. Revisar logs para errores específicos

---

### Problema: Firma de webhook inválida

**Síntomas:**

- Webhook recibido pero rechazado
- Log: "Webhook signature validation failed"
- HTTP 401 en respuesta

**Diagnóstico:**

```bash
# Verificar que el secret esté configurado
echo $MERCADOPAGO_WEBHOOK_SECRET

# Verificar logs
tail -f logs/app.log | grep "signature"
```

**Soluciones:**

1. Verificar que `MERCADOPAGO_WEBHOOK_SECRET` esté configurado
2. Verificar que el secret coincida con el del panel de MP
3. Regenerar secret en el panel si es necesario
4. Reiniciar servidor después de cambiar el secret

---

### Problema: Pago no se actualiza después del webhook

**Síntomas:**

- Webhook recibido y procesado (HTTP 200)
- Estado del pago no cambia en BD

**Diagnóstico:**

```sql
-- Verificar que el payment exista
SELECT * FROM payments
WHERE gateway_payment_intent_id = 'preference_id_here';

-- Verificar webhooks recibidos
SELECT * FROM webhook_events
WHERE gateway = 'mercadopago'
ORDER BY created_at DESC
LIMIT 5;
```

**Soluciones:**

1. Verificar que el payment exista en la BD
2. Verificar que `gateway_payment_intent_id` coincida con el `preference_id`
3. Verificar que el `external_reference` coincida con el `order_id`
4. Revisar logs del webhook handler para errores
5. Verificar que el PaymentService esté funcionando correctamente

---

### Problema: Error "Preference creation failed"

**Síntomas:**

- Error al crear intento de pago
- Mensaje: "Mercado Pago error: ..."

**Diagnóstico:**

```bash
# Verificar credenciales
curl -X GET "https://api.mercadopago.com/v1/payment_methods" \
  -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN"

# Verificar logs
tail -f logs/app.log | grep "Preference"
```

**Soluciones:**

1. Verificar que las credenciales sean correctas
2. Verificar que el token sea de producción (no de prueba) si está en producción
3. Verificar que la cuenta de MP esté activa
4. Verificar que no haya límites de tasa excedidos
5. Revisar logs para detalles del error

---

### Problema: Botón de MP no se renderiza

**Síntomas:**

- Spinner infinito
- Error en consola del navegador

**Diagnóstico:**

```javascript
// Abrir consola del navegador (F12)
// Buscar errores relacionados con MercadoPago
```

**Soluciones:**

1. Verificar que `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` esté configurado
2. Verificar que el SDK de React esté instalado
3. Limpiar caché del navegador
4. Verificar que no haya bloqueadores de scripts
5. Revisar consola para errores específicos

---

### Problema: Tarjetas de prueba no funcionan

**Síntomas:**

- Tarjetas rechazadas en sandbox
- Errores inesperados

**Soluciones:**

1. Verificar que estés usando las tarjetas correctas para tu país
2. Verificar que el nombre del titular sea correcto (APRO, OTHE, etc.)
3. Verificar que la fecha de vencimiento sea futura
4. Usar usuarios de prueba creados en el panel
5. Verificar que el modo sandbox esté activado

---

## Checklist de Testing

### Antes de Pasar a Producción

- [ ] Todos los casos de prueba ejecutados y pasando
- [ ] Tests automatizados con cobertura > 80%
- [ ] Webhooks funcionando correctamente en sandbox
- [ ] Validación de firma implementada y probada
- [ ] Idempotencia verificada
- [ ] Manejo de errores probado
- [ ] Timeouts y reintentos probados
- [ ] Múltiples métodos de pago probados
- [ ] Flujo de reembolso probado
- [ ] Documentación actualizada
- [ ] Equipo capacitado en el flujo de pagos

---

## Recursos Adicionales

- [Documentación de Testing de MercadoPago](https://www.mercadopago.com/developers/es/docs/checkout-pro/test-integration)
- [Tarjetas de Prueba por País](https://www.mercadopago.com/developers/es/docs/checkout-pro/additional-content/test-cards)
- [Simulador de Webhooks](https://www.mercadopago.com/developers/es/docs/checkout-pro/additional-content/notifications/webhooks)
- [Panel de Desarrolladores](https://www.mercadopago.com/developers/panel/app)

---

**Versión:** 1.0  
**Última actualización:** Febrero 2026  
**Mantenido por:** Equipo de Desarrollo Opttius
