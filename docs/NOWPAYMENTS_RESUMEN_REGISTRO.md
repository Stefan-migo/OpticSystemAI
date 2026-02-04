# NOWPayments - Resumen Rápido de Registro

## ⚡ Versión Express (5 Minutos)

### Sí, necesitas registrarte en NOWPayments

**¿Por qué?**

- Para obtener tus API Keys
- Para configurar tu billetera de pagos
- Para recibir las criptomonedas de tus clientes

---

## 🎯 Proceso en 3 Pasos

### 1️⃣ Crear Cuenta (2 minutos)

```
1. Ve a: https://nowpayments.io
2. Haz clic en "Sign Up"
3. Ingresa email y contraseña
4. Verifica tu email
```

### 2️⃣ Obtener API Keys (2 minutos)

```
1. Inicia sesión en NOWPayments
2. Ve a Settings → API Keys
3. Copia tu "Sandbox API Key"
4. Ve a Settings → IPN Settings
5. Copia tu "IPN Secret"
```

### 3️⃣ Configurar en Opttius (1 minuto)

```bash
# Ejecutar desde tu proyecto
node scripts/setup-nowpayments.js

# O agregar manualmente a .env.local:
NOWPAYMENTS_SANDBOX_MODE=true
NOWPAYMENTS_SANDBOX_API_KEY=tu_key_aqui
NOWPAYMENTS_IPN_SECRET=tu_secret_aqui
```

---

## 📋 Dos Modos de Operación

### 🧪 Modo Sandbox (Para Desarrollo)

✅ **Ventajas:**

- No requiere KYC
- Disponible inmediatamente
- Pagos simulados
- Gratis para testing

❌ **Limitaciones:**

- No procesa pagos reales
- Solo para desarrollo

**Perfecto para:** Desarrollo, testing, demos

### 💰 Modo Producción (Para Clientes Reales)

✅ **Ventajas:**

- Procesa pagos reales
- Recibe criptomonedas
- Sin límites de transacciones

⚠️ **Requisitos:**

- Verificación KYC (1-7 días)
- Documentos de identidad
- Documentos del negocio
- Billetera de criptomonedas

**Perfecto para:** Producción, clientes reales

---

## 🚀 Inicio Rápido

### Para Empezar HOY (Sandbox)

```bash
# 1. Registrarse en NOWPayments
https://nowpayments.io/signup

# 2. Obtener Sandbox API Key
Dashboard → Settings → API Keys → Sandbox

# 3. Configurar en tu proyecto
node scripts/setup-nowpayments.js

# 4. Iniciar desarrollo
npm run tunnel  # Para webhooks locales
npm run dev     # Iniciar app

# 5. Probar
http://localhost:3000/checkout
```

### Para Producción (Requiere KYC)

```bash
# 1. Completar KYC en NOWPayments
Dashboard → Settings → Verification

# 2. Esperar aprobación (1-7 días)

# 3. Obtener Production API Key
Dashboard → Settings → API Keys → Production

# 4. Configurar billetera de payout
Dashboard → Settings → Payout Settings

# 5. Actualizar .env.local
NOWPAYMENTS_SANDBOX_MODE=false
NOWPAYMENTS_API_KEY=tu_production_key
```

---

## 🎓 Documentación Completa

Para más detalles, consulta:

📖 **Guía Completa de Registro**: `docs/NOWPAYMENTS_REGISTRO_GUIA.md`

- Proceso paso a paso con capturas
- Configuración de billetera
- Proceso KYC detallado
- Solución de problemas

🚀 **Quick Start**: `docs/CRYPTO_PAYMENTS_QUICKSTART.md`

- Configuración en 5 minutos
- Testing local
- Verificación de instalación

🧪 **Testing Guide**: `docs/CRYPTO_PAYMENTS_TESTING_GUIDE.md`

- Casos de prueba
- Simulación de pagos
- Validación de webhooks

📋 **Deployment Checklist**: `docs/CRYPTO_PAYMENTS_DEPLOYMENT_CHECKLIST.md`

- Checklist pre-producción
- Pasos de deployment
- Monitoreo y alertas

---

## ❓ Preguntas Frecuentes

### ¿Cuánto cuesta NOWPayments?

**Fees:**

- Transacciones: 0.5% - 1%
- Sin costos de setup
- Sin costos mensuales

### ¿Cuánto tarda el registro?

**Sandbox:** Inmediato (5 minutos)
**Producción:** 1-7 días (por KYC)

### ¿Necesito una billetera de criptomonedas?

**Para Sandbox:** No
**Para Producción:** Sí

**Opciones recomendadas:**

- Binance (Exchange)
- Coinbase (Principiantes)
- Trust Wallet (Móvil)
- MetaMask (Web)

### ¿Qué criptomonedas puedo aceptar?

**300+ criptomonedas**, incluyendo:

- Bitcoin (BTC)
- Ethereum (ETH)
- USDT (Tether)
- USDC (USD Coin)
- Litecoin (LTC)
- Y muchas más...

### ¿Puedo probar sin KYC?

**Sí!** El modo Sandbox no requiere KYC y está disponible inmediatamente.

---

## 🆘 Necesitas Ayuda?

### Soporte NOWPayments

- **Email**: support@nowpayments.io
- **Chat**: Disponible en dashboard
- **Telegram**: @NOWPayments_support

### Documentación Técnica

- **API Docs**: https://documenter.getpostman.com/view/7907941/S1a32n38
- **Status**: https://status.nowpayments.io

---

## ✅ Checklist Mínimo

### Para Desarrollo (HOY)

- [ ] Cuenta creada
- [ ] Email verificado
- [ ] Sandbox API Key obtenida
- [ ] IPN Secret obtenido
- [ ] Configurado en .env.local
- [ ] Pago de prueba exitoso

### Para Producción (1-7 días)

- [ ] KYC iniciado
- [ ] Documentos enviados
- [ ] KYC aprobado
- [ ] Billetera configurada
- [ ] Production API Key obtenida
- [ ] Pago real de prueba

---

**Tiempo Total:**

- **Sandbox**: 5-10 minutos ⚡
- **Producción**: 1-7 días (por KYC) ⏳

**¡Empieza ahora con Sandbox y solicita KYC en paralelo!** 🚀
