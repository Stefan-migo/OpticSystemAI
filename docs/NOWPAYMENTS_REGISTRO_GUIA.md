# Guía de Registro en NOWPayments - Paso a Paso

**Fecha:** 3 de Febrero, 2026  
**Versión:** 1.0  
**Tiempo Estimado:** 15-30 minutos (sin KYC) / 1-3 días (con KYC)

---

## 📋 Resumen

Esta guía te llevará paso a paso por el proceso de registro en NOWPayments para habilitar pagos con criptomonedas en tu plataforma Opttius.

### ¿Qué es NOWPayments?

NOWPayments es una pasarela de pagos que permite aceptar más de 300 criptomonedas diferentes, incluyendo:

- Bitcoin (BTC)
- Ethereum (ETH)
- USDT (Tether)
- USDC (USD Coin)
- Litecoin (LTC)
- Y muchas más...

### Requisitos Previos

- ✅ Correo electrónico válido
- ✅ Información de tu negocio
- ✅ Billetera de criptomonedas para recibir pagos
- ⏳ Documentos de identificación (para KYC en producción)
- ⏳ Documentos del negocio (para KYC en producción)

---

## 🚀 Proceso de Registro

### Paso 1: Crear Cuenta en NOWPayments

#### 1.1 Acceder al Sitio Web

1. Abre tu navegador y ve a: **https://nowpayments.io**
2. Haz clic en el botón **"Sign Up"** o **"Get Started"** en la esquina superior derecha

#### 1.2 Completar Formulario de Registro

Ingresa la siguiente información:

```
📧 Email: tu-email@empresa.com
🔒 Contraseña: [Crea una contraseña segura]
✅ Confirmar Contraseña: [Repite la contraseña]
```

**Recomendaciones de Seguridad:**

- Usa una contraseña de al menos 12 caracteres
- Incluye mayúsculas, minúsculas, números y símbolos
- No uses la misma contraseña que en otros servicios
- Considera usar un gestor de contraseñas

#### 1.3 Verificar Email

1. Revisa tu bandeja de entrada
2. Busca el email de NOWPayments (revisa spam si no lo ves)
3. Haz clic en el enlace de verificación
4. Serás redirigido al dashboard de NOWPayments

---

### Paso 2: Configurar Perfil de Negocio

#### 2.1 Información Básica

Una vez dentro del dashboard:

1. Ve a **Settings** → **Profile**
2. Completa la información:

```
🏢 Nombre del Negocio: Opttius
🌐 Sitio Web: https://tu-dominio.com
📍 País: [Tu país]
📞 Teléfono: [Tu número de contacto]
```

#### 2.2 Tipo de Negocio

Selecciona el tipo que mejor describa tu negocio:

- ✅ **SaaS / Software as a Service**
- Descripción: "Plataforma de gestión para ópticas"

---

### Paso 3: Configurar Billetera de Pagos

#### 3.1 Seleccionar Criptomoneda Principal

NOWPayments te permite recibir pagos en la criptomoneda que prefieras:

**Opciones Recomendadas:**

1. **USDT (Tether)** - Stablecoin vinculada al dólar
   - ✅ Menos volatilidad
   - ✅ Fácil de convertir a fiat
   - ⚠️ Requiere seleccionar red (ERC20, TRC20, etc.)

2. **USDC (USD Coin)** - Otra stablecoin confiable
   - ✅ Regulada y auditada
   - ✅ Estable en precio

3. **Bitcoin (BTC)** - La criptomoneda original
   - ✅ Más aceptada
   - ⚠️ Mayor volatilidad

#### 3.2 Agregar Dirección de Billetera

1. Ve a **Settings** → **Payout Settings**
2. Selecciona la criptomoneda que elegiste
3. Ingresa tu dirección de billetera

**⚠️ IMPORTANTE:**

- Verifica 3 veces que la dirección sea correcta
- Usa la red correcta (ERC20, TRC20, BEP20, etc.)
- Envía un pago de prueba pequeño primero

**¿No tienes billetera?**

Opciones recomendadas:

- **Binance**: https://www.binance.com (Exchange con billetera integrada)
- **Coinbase**: https://www.coinbase.com (Fácil de usar para principiantes)
- **Trust Wallet**: https://trustwallet.com (Billetera móvil)
- **MetaMask**: https://metamask.io (Para Ethereum y tokens ERC20)

---

### Paso 4: Obtener API Keys

#### 4.1 Sandbox (Desarrollo)

Para testing y desarrollo:

1. Ve a **Settings** → **API Keys**
2. Busca la sección **"Sandbox"**
3. Haz clic en **"Generate Sandbox API Key"**
4. Copia y guarda la clave de forma segura

```bash
# Ejemplo de API Key Sandbox
NOWPAYMENTS_SANDBOX_API_KEY=sandbox_abc123def456...
```

#### 4.2 Production (Producción)

⚠️ **Nota:** Las API keys de producción requieren completar KYC (ver Paso 6)

Una vez aprobado el KYC:

1. Ve a **Settings** → **API Keys**
2. Busca la sección **"Production"**
3. Haz clic en **"Generate API Key"**
4. Copia y guarda la clave

```bash
# Ejemplo de API Key Production
NOWPAYMENTS_API_KEY=prod_xyz789ghi012...
```

---

### Paso 5: Configurar IPN (Webhooks)

#### 5.1 Obtener IPN Secret

1. Ve a **Settings** → **IPN Settings**
2. Busca **"IPN Secret Key"**
3. Copia el secret (o genera uno nuevo)

```bash
# Ejemplo de IPN Secret
NOWPAYMENTS_IPN_SECRET=ipn_secret_abc123xyz789...
```

#### 5.2 Configurar URL de Callback

**Para Desarrollo Local:**

1. Inicia ngrok en tu máquina:

   ```bash
   npm run tunnel
   ```

2. Copia la URL HTTPS que te da ngrok (ej: `https://abc123.ngrok-free.app`)

3. En NOWPayments, configura:
   ```
   IPN Callback URL: https://abc123.ngrok-free.app/api/webhooks/nowpayments
   ```

**Para Producción:**

```
IPN Callback URL: https://tu-dominio.com/api/webhooks/nowpayments
```

#### 5.3 Habilitar Notificaciones IPN

1. Marca la casilla **"Enable IPN"**
2. Selecciona los eventos que quieres recibir:
   - ✅ Payment Created
   - ✅ Payment Finished
   - ✅ Payment Failed
   - ✅ Payment Expired
   - ✅ Payment Partially Paid

3. Haz clic en **"Save"**

---

### Paso 6: Verificación KYC (Know Your Customer)

⚠️ **Requerido para Producción**

El proceso KYC es necesario para usar NOWPayments en producción y procesar pagos reales.

#### 6.1 Documentos Requeridos

**Documentos Personales:**

- Pasaporte o DNI/Cédula de Identidad
- Selfie sosteniendo tu documento
- Comprobante de domicilio (recibo de servicios, extracto bancario)

**Documentos del Negocio:**

- Registro mercantil o documento de constitución
- Licencia de negocio (si aplica)
- Comprobante de dirección del negocio
- Información sobre el modelo de negocio

#### 6.2 Proceso de Verificación

1. Ve a **Settings** → **Verification**
2. Haz clic en **"Start Verification"**
3. Sigue el asistente paso a paso:
   - Información personal
   - Documentos de identidad
   - Información del negocio
   - Documentos del negocio

4. Sube los documentos solicitados
5. Envía para revisión

#### 6.3 Tiempos de Aprobación

- **Verificación Personal**: 1-3 días hábiles
- **Verificación de Negocio**: 3-7 días hábiles
- **Casos Complejos**: Hasta 14 días

**Mientras tanto:**

- Puedes usar el modo Sandbox sin restricciones
- Recibirás notificaciones por email sobre el estado
- Puedes contactar soporte si hay demoras

---

## 🔧 Configuración en Opttius

### Paso 7: Configurar Variables de Entorno

#### 7.1 Usando el Script Automático

```bash
# Ejecutar desde la raíz del proyecto
node scripts/setup-nowpayments.js
```

El script te guiará interactivamente:

1. Seleccionar modo (Sandbox/Production)
2. Ingresar API Key
3. Probar conexión
4. Ingresar IPN Secret
5. Configurar webhook URL
6. Guardar en `.env.local`

#### 7.2 Configuración Manual

Edita tu archivo `.env.local`:

```bash
# NOWPayments Configuration

# Modo Sandbox (para desarrollo)
NOWPAYMENTS_SANDBOX_MODE=true
NOWPAYMENTS_SANDBOX_API_KEY=tu_sandbox_api_key_aqui
NOWPAYMENTS_IPN_SECRET=tu_ipn_secret_aqui

# Modo Producción (cuando tengas KYC aprobado)
# NOWPAYMENTS_SANDBOX_MODE=false
# NOWPAYMENTS_API_KEY=tu_production_api_key_aqui
# NOWPAYMENTS_IPN_SECRET=tu_ipn_secret_aqui

# URL base para webhooks
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
```

---

## ✅ Verificar Instalación

### Paso 8: Probar la Integración

#### 8.1 Iniciar Aplicación

```bash
# Iniciar túnel (solo para desarrollo local)
npm run tunnel

# Iniciar aplicación
npm run dev
```

#### 8.2 Verificar Endpoint de Webhook

```bash
# Debe responder con status: ok
curl http://localhost:3000/api/webhooks/nowpayments
```

Respuesta esperada:

```json
{
  "status": "ok",
  "message": "NOWPayments webhook endpoint is active"
}
```

#### 8.3 Crear Pago de Prueba

1. Ve a http://localhost:3000/checkout
2. Selecciona un plan
3. Elige método de pago **"Cripto"**
4. Haz clic en **"Pagar con Cripto"**
5. Deberías ser redirigido a la página de invoice de NOWPayments

#### 8.4 Simular Pago en Sandbox

1. En el dashboard de NOWPayments Sandbox
2. Ve a **Payments** → **All Payments**
3. Busca tu pago reciente
4. Haz clic en **"Simulate Payment"**
5. Selecciona estado: **"Finished"**
6. Verifica que el webhook se reciba en tu aplicación

---

## 📊 Dashboard de NOWPayments

### Funcionalidades Principales

#### Payments (Pagos)

- Ver todos los pagos recibidos
- Filtrar por estado, fecha, moneda
- Exportar reportes

#### Analytics (Analíticas)

- Volumen de transacciones
- Criptomonedas más usadas
- Tasas de conversión
- Gráficos de tendencias

#### Payouts (Retiros)

- Configurar retiros automáticos
- Ver historial de retiros
- Configurar umbrales mínimos

#### Settings (Configuración)

- API Keys
- IPN Settings
- Payout Settings
- Security Settings

---

## 🔒 Seguridad y Mejores Prácticas

### Protección de API Keys

✅ **HACER:**

- Guardar API keys en variables de entorno
- Usar diferentes keys para sandbox y producción
- Rotar keys periódicamente
- Limitar acceso a las keys

❌ **NO HACER:**

- Commitear keys en Git
- Compartir keys por email o chat
- Usar keys de producción en desarrollo
- Hardcodear keys en el código

### Verificación de Webhooks

✅ **Siempre verificar:**

- Firma HMAC-SHA512 del webhook
- Origen de la petición
- Validez de los datos recibidos

### Monitoreo

✅ **Configurar alertas para:**

- Pagos fallidos
- Webhooks no recibidos
- Errores de API
- Actividad inusual

---

## 🆘 Solución de Problemas

### Problema: No recibo el email de verificación

**Solución:**

1. Revisa la carpeta de spam
2. Verifica que el email esté escrito correctamente
3. Solicita reenvío desde la página de login
4. Contacta soporte: support@nowpayments.io

### Problema: API Key no funciona

**Solución:**

1. Verifica que estés usando la key correcta (sandbox vs production)
2. Verifica que `NOWPAYMENTS_SANDBOX_MODE` coincida con el tipo de key
3. Regenera la API key si es necesario
4. Verifica que no haya espacios extra al copiar

### Problema: Webhooks no llegan

**Solución:**

1. Verifica que ngrok esté corriendo (desarrollo local)
2. Verifica que la URL de callback esté correcta
3. Verifica que IPN esté habilitado en settings
4. Revisa los logs de tu aplicación
5. Usa el simulador de pagos en sandbox para testing

### Problema: KYC rechazado

**Solución:**

1. Lee cuidadosamente el motivo del rechazo
2. Asegúrate de que los documentos sean legibles
3. Verifica que la información coincida
4. Sube documentos actualizados
5. Contacta soporte para aclaraciones

---

## 📞 Soporte y Recursos

### Contacto NOWPayments

- **Email**: support@nowpayments.io
- **Chat en vivo**: Disponible en el dashboard
- **Telegram**: @NOWPayments_support
- **Horario**: 24/7

### Documentación Oficial

- **API Docs**: https://documenter.getpostman.com/view/7907941/S1a32n38
- **FAQ**: https://nowpayments.io/faq
- **Blog**: https://nowpayments.io/blog
- **Status Page**: https://status.nowpayments.io

### Documentación Opttius

- **Quick Start**: `docs/CRYPTO_PAYMENTS_QUICKSTART.md`
- **Testing Guide**: `docs/CRYPTO_PAYMENTS_TESTING_GUIDE.md`
- **Deployment**: `docs/CRYPTO_PAYMENTS_DEPLOYMENT_CHECKLIST.md`
- **Technical Docs**: `src/lib/payments/nowpayments/README.md`

---

## 📝 Checklist de Registro Completo

### Desarrollo (Sandbox)

- [ ] Cuenta creada en NOWPayments
- [ ] Email verificado
- [ ] Perfil de negocio completado
- [ ] Sandbox API Key obtenida
- [ ] IPN Secret obtenido
- [ ] Webhook URL configurada (ngrok)
- [ ] Variables de entorno configuradas
- [ ] Pago de prueba exitoso
- [ ] Webhook recibido correctamente

### Producción

- [ ] KYC iniciado
- [ ] Documentos personales enviados
- [ ] Documentos del negocio enviados
- [ ] KYC aprobado
- [ ] Billetera de payout configurada
- [ ] Production API Key obtenida
- [ ] Webhook URL de producción configurada
- [ ] Pago real de prueba (monto pequeño)
- [ ] Monitoreo configurado
- [ ] Alertas configuradas

---

## 🎯 Próximos Pasos

Una vez completado el registro:

1. **Desarrollo**:
   - Prueba exhaustivamente en sandbox
   - Simula diferentes escenarios (éxito, fallo, expiración)
   - Verifica que los webhooks funcionen correctamente

2. **Pre-Producción**:
   - Completa el proceso KYC
   - Configura billetera de producción
   - Actualiza variables de entorno a producción

3. **Producción**:
   - Realiza pago de prueba pequeño
   - Monitorea primeras transacciones
   - Documenta cualquier issue
   - Escala gradualmente

---

**Última Actualización:** 3 de Febrero, 2026  
**Versión:** 1.0  
**Autor:** Equipo Opttius

¡Éxito con tu integración de pagos con criptomonedas! 🚀💰
