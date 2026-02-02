# Integración MercadoPago - Opttius

## 📚 Documentación Completa

Esta carpeta contiene toda la documentación necesaria para la integración de MercadoPago como pasarela de pago en Opttius.

---

## 📖 Documentos Disponibles

### 1. [INTEGRACION_MERCADOPAGO_DEFINITIVA.md](./INTEGRACION_MERCADOPAGO_DEFINITIVA.md)

**Documentación principal y guía de implementación completa**

Contiene:

- ✅ Arquitectura de la integración
- ✅ Requisitos previos y configuración
- ✅ Implementación paso a paso (Backend + Frontend)
- ✅ Configuración de webhooks
- ✅ Suite de tests completa
- ✅ Guía de seguridad
- ✅ Checklist de producción
- ✅ Troubleshooting

**Audiencia:** Desarrolladores, Tech Leads, DevOps

---

### 2. [MERCADOPAGO_TESTING_GUIDE.md](./MERCADOPAGO_TESTING_GUIDE.md)

**Guía completa de testing y QA**

Contiene:

- ✅ Tarjetas de prueba por país
- ✅ Casos de prueba detallados
- ✅ Herramientas de testing
- ✅ Scripts de automatización
- ✅ Troubleshooting específico de testing

**Audiencia:** QA Engineers, Desarrolladores

---

### 3. [MercadoPagoIntegracion.md](./MercadoPagoIntegracion.md)

**Documentación oficial de MercadoPago**

Documentación completa proporcionada por MercadoPago sobre su API y SDK.

**Audiencia:** Referencia técnica

---

## 🚀 Quick Start

### Para Desarrolladores

1. **Leer primero:**
   - [INTEGRACION_MERCADOPAGO_DEFINITIVA.md](./INTEGRACION_MERCADOPAGO_DEFINITIVA.md) - Secciones 1-4

2. **Configurar ambiente:**

   ```bash
   # Copiar variables de entorno
   cp .env.example .env.local

   # Configurar credenciales de MercadoPago (sandbox)
   MERCADOPAGO_SANDBOX_MODE=true
   MP_ACCESS_TOKEN_SANDBOX=TEST-your-token
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_SANDBOX=TEST-your-public-key
   ```

3. **Instalar dependencias:**

   ```bash
   npm install
   ```

4. **Aplicar migraciones:**

   ```bash
   npm run supabase:push
   ```

5. **Ejecutar en desarrollo:**

   ```bash
   npm run dev
   ```

6. **Probar integración:**
   - Ir a http://localhost:3000/admin/checkout
   - Usar tarjetas de prueba de [MERCADOPAGO_TESTING_GUIDE.md](./MERCADOPAGO_TESTING_GUIDE.md)

---

### Para QA

1. **Leer primero:**
   - [MERCADOPAGO_TESTING_GUIDE.md](./MERCADOPAGO_TESTING_GUIDE.md) - Completo

2. **Configurar ambiente de pruebas:**
   - Solicitar acceso al ambiente de sandbox
   - Obtener credenciales de prueba

3. **Ejecutar casos de prueba:**
   - Seguir los casos de prueba documentados (CP-001 a CP-008)
   - Documentar resultados en Jira/Notion

4. **Reportar issues:**
   - Usar template de bug report
   - Incluir logs y screenshots

---

### Para DevOps

1. **Leer primero:**
   - [INTEGRACION_MERCADOPAGO_DEFINITIVA.md](./INTEGRACION_MERCADOPAGO_DEFINITIVA.md) - Sección 6 (Producción)

2. **Configurar variables de entorno en producción:**

   ```bash
   # Vercel/Railway/etc.
   MERCADOPAGO_SANDBOX_MODE=false
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-production-token
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-production-public-key
   MERCADOPAGO_WEBHOOK_SECRET=production-webhook-secret
   ```

3. **Configurar webhooks:**
   - URL: `https://app.opttius.com/api/webhooks/mercadopago`
   - Eventos: Pagos
   - Copiar secret generado

4. **Configurar monitoreo:**
   - Alertas de errores de pago
   - Alertas de webhooks fallidos
   - Dashboard de métricas

---

## 🏗️ Arquitectura

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Frontend (Next.js) │
│  - CheckoutForm     │
│  - MercadoPagoButton│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Backend API        │
│  - create-intent    │
│  - webhook handler  │
└──────┬──────────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌──────────────┐
│ MercadoPago │    │  Supabase DB │
│   Gateway   │    │  - payments  │
│             │    │  - webhooks  │
└─────────────┘    └──────────────┘
```

---

## 📋 Checklist de Implementación

### Backend ✅

- [x] Gateway implementado (`src/lib/payments/mercadopago/gateway.ts`) con metadata y back_urls a `/admin/checkout/result`
- [x] Validador de webhooks (`src/lib/payments/mercadopago/webhook-validator.ts`)
- [x] Webhook handler GET/POST con validación de firma (`src/app/api/webhooks/mercadopago/route.ts`)
- [x] API create-intent (`src/app/api/admin/payments/create-intent/route.ts`)
- [x] Migraciones de BD (`supabase/migrations/20260206000000_add_mercadopago_metadata.sql`)

### Frontend ✅

- [x] Componente MercadoPagoButton (`src/components/checkout/MercadoPagoButton.tsx`)
- [x] CheckoutForm actualizado con flujo MercadoPago (preferenceId → botón o approvalUrl)
- [x] Página de resultado (`src/app/admin/checkout/result/page.tsx`)

### Testing ✅

- [x] Tests unitarios del gateway (mapStatus) - `src/__tests__/unit/lib/payments/mercadopago-gateway.test.ts`
- [x] Tests del webhook validator - `src/__tests__/unit/lib/payments/mercadopago-webhook-validator.test.ts`
- [ ] Tests de integración E2E (requieren servidor y credenciales)
- [ ] Tests E2E - **PENDIENTE**

### Documentación ✅

- [x] Documentación principal (INTEGRACION_MERCADOPAGO_DEFINITIVA.md)
- [x] Guía de testing (MERCADOPAGO_TESTING_GUIDE.md)
- [x] README de navegación (MERCADOPAGO_README.md)

### Producción

- [ ] Credenciales de producción configuradas - **PENDIENTE**
- [ ] Webhooks de producción configurados - **PENDIENTE**
- [ ] Monitoreo configurado - **PENDIENTE**
- [ ] Alertas configuradas - **PENDIENTE**

---

## 🔗 Enlaces Útiles

### MercadoPago

- [Panel de Desarrolladores](https://www.mercadopago.com/developers/panel/app)
- [Documentación Oficial](https://www.mercadopago.com/developers/es/docs)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [SDK React](https://github.com/mercadopago/sdk-react)
- [Soporte](https://www.mercadopago.com/ayuda)

### Opttius

- [Repositorio](https://github.com/opttius/opttius-app)
- [Documentación Interna](./DOCUMENTATION_INDEX.md)
- [Plan de Producción](./PLAN_PRODUCCION_TAREAS_PENDIENTES.md)

---

## 🆘 Soporte

### Problemas con MercadoPago

- **Documentación:** [MercadoPago Docs](https://www.mercadopago.com/developers)
- **Soporte MP:** https://www.mercadopago.com/ayuda
- **Comunidad:** [MercadoPago Developers](https://www.mercadopago.com/developers/es/community)

### Problemas con la Integración

- **Troubleshooting:** Ver sección en [INTEGRACION_MERCADOPAGO_DEFINITIVA.md](./INTEGRACION_MERCADOPAGO_DEFINITIVA.md#troubleshooting)
- **Testing Issues:** Ver [MERCADOPAGO_TESTING_GUIDE.md](./MERCADOPAGO_TESTING_GUIDE.md#troubleshooting)
- **Soporte Interno:** soporte@opttius.com

---

## 📝 Notas Importantes

### Seguridad

- ⚠️ **NUNCA** exponer el Access Token en el frontend
- ⚠️ **SIEMPRE** validar la firma de los webhooks en producción
- ⚠️ **SIEMPRE** usar HTTPS en producción
- ⚠️ **NUNCA** commitear credenciales en el repositorio

### Ambiente Sandbox

- ✅ Usar credenciales de prueba (TEST-\*)
- ✅ Usar tarjetas de prueba documentadas
- ✅ Crear usuarios de prueba en el panel
- ✅ Verificar que `MERCADOPAGO_SANDBOX_MODE=true`

### Producción

- ✅ Usar credenciales de producción (APP_USR-\*)
- ✅ Configurar webhooks con URL HTTPS
- ✅ Configurar monitoreo y alertas
- ✅ Verificar que `MERCADOPAGO_SANDBOX_MODE=false`

---

## 🔄 Actualizaciones

| Fecha      | Versión | Cambios                                                                                                                                                                           |
| ---------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-06 | 1.0     | Documentación inicial completa                                                                                                                                                    |
| 2026-02-02 | 1.1     | Implementación completada: gateway metadata, webhook validator, CheckoutForm con MercadoPagoButton, página resultado, tests unitarios (10 tests), env.example y docs actualizados |

---

## 👥 Contribuidores

- **Equipo de Desarrollo Opttius**
- **Senior Software Engineer** (Documentación y arquitectura)

---

**Última actualización:** Febrero 2026  
**Mantenido por:** Equipo de Desarrollo Opttius
