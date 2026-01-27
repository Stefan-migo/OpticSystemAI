# Documentación Completa del Sistema - OpticSystemAI

**Versión:** 2.0  
**Fecha:** 2025-01-27  
**Tipo:** Documentación Técnica y Funcional

---

## 📋 Tabla de Contenidos

1. [Visión General del Sistema](#visión-general-del-sistema)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Módulos Principales](#módulos-principales)
4. [Sistema de Autenticación y Autorización](#sistema-de-autenticación-y-autorización)
5. [Sistema Multi-Sucursal (Branches)](#sistema-multi-sucursal-branches)
6. [APIs y Endpoints](#apis-y-endpoints)
7. [Base de Datos](#base-de-datos)
8. [Integraciones Externas](#integraciones-externas)
9. [Sistema de IA y Chatbot](#sistema-de-ia-y-chatbot)
10. [Componentes y UI](#componentes-y-ui)
11. [Configuración y Despliegue](#configuración-y-despliegue)

---

## Visión General del Sistema

### Descripción

OpticSystemAI es un sistema completo de gestión para ópticas y laboratorios ópticos. Proporciona funcionalidad integral para administrar clientes, citas, presupuestos, trabajos de laboratorio, productos ópticos, ventas, y operaciones multi-sucursal.

### Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Estilos:** Tailwind CSS, Radix UI, Framer Motion
- **Estado:** React Context, TanStack Query
- **Validación:** Zod, React Hook Form
- **IA:** Vercel AI SDK (OpenAI, Anthropic, Google Gemini, DeepSeek)
- **Pagos:** MercadoPago SDK
- **Email:** Resend
- **Testing:** Vitest, Testing Library

### Características Principales

- ✅ Gestión completa de clientes con historial médico
- ✅ Sistema de citas con calendario interactivo
- ✅ Presupuestos con expiración automática
- ✅ Trabajos de laboratorio con seguimiento de estados
- ✅ Punto de venta (POS) integrado
- ✅ Sistema multi-sucursal con control de acceso
- ✅ Chatbot IA con tool calling
- ✅ Notificaciones en tiempo real
- ✅ Analytics y reportes
- ✅ Sistema de soporte con tickets

---

## Arquitectura Técnica

### Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Panel de administración
│   ├── api/               # API Routes
│   ├── login/             # Autenticación
│   └── profile/           # Perfil de usuario
├── components/            # Componentes React
│   ├── admin/            # Componentes específicos de admin
│   └── ui/               # Componentes UI reutilizables
├── lib/                  # Utilidades y lógica de negocio
│   ├── ai/              # Sistema de IA
│   ├── api/             # Middleware y validación
│   ├── email/           # Sistema de emails
│   └── notifications/   # Sistema de notificaciones
├── contexts/             # React Contexts
├── hooks/               # Custom React Hooks
├── types/               # Definiciones TypeScript
└── utils/               # Utilidades generales
```

### Patrones Arquitectónicos

**1. Server Components + Client Components**

- Server Components para datos estáticos y SEO
- Client Components para interactividad y estado

**2. API Routes Pattern**

- Endpoints RESTful en `/api/admin/*`
- Middleware de autenticación y validación
- Manejo centralizado de errores

**3. Context API para Estado Global**

- `AuthContext`: Autenticación y perfil de usuario
- `BranchContext`: Gestión de sucursales
- `LikeContext`: Sistema de favoritos

**4. Custom Hooks**

- `useAuth`: Manejo de autenticación
- `useBranch`: Gestión de sucursal actual
- `useChatSession`: Gestión de sesiones de chat

**5. Type Safety**

- TypeScript estricto
- Tipos generados desde Supabase
- Validación con Zod en runtime

---

## Módulos Principales

### 1. Dashboard (`/admin`)

**Propósito:** Vista general del sistema con KPIs y métricas clave.

**Funcionalidades:**

- Métricas en tiempo real (ventas, trabajos, presupuestos, citas)
- Gráficos de ingresos y tendencias
- Resumen de actividades recientes
- Accesos rápidos a módulos principales

**Componentes Clave:**

- `src/app/admin/page.tsx`: Página principal del dashboard
- `src/app/api/admin/dashboard/route.ts`: API de métricas

**KPIs Monitoreados:**

- Órdenes pendientes y totales
- Ingresos (diarios, semanales, mensuales)
- Stock bajo
- Trabajos de laboratorio (pendientes, en proceso)
- Presupuestos pendientes
- Citas del día

---

### 2. Gestión de Clientes (`/admin/customers`)

**Propósito:** Administración completa de clientes y sus datos médicos.

**Funcionalidades:**

- **CRUD Completo:** Crear, leer, actualizar, eliminar clientes
- **Búsqueda Inteligente:** Por RUT (con/sin formato), nombre, email, teléfono
- **Perfiles Médicos:** Información oftalmológica completa
- **Recetas:** Gestión de recetas médicas con especificaciones detalladas
- **Historial:** Citas, presupuestos, trabajos y compras asociadas
- **Clientes No Registrados:** Sistema para agendar sin registro previo

**Estructura de Datos:**

- `profiles`: Información personal y médica
- `prescriptions`: Recetas oftalmológicas (esfera, cilindro, eje, adición)
- `appointments`: Citas asociadas
- `quotes`: Presupuestos del cliente
- `lab_work_orders`: Trabajos de laboratorio

**APIs:**

- `GET /api/admin/customers`: Listar clientes (con paginación y filtros)
- `POST /api/admin/customers`: Crear cliente
- `GET /api/admin/customers/[id]`: Detalle de cliente
- `PUT /api/admin/customers/[id]`: Actualizar cliente
- `GET /api/admin/customers/search`: Búsqueda avanzada
- `GET /api/admin/customers/[id]/prescriptions`: Recetas del cliente
- `POST /api/admin/customers/[id]/prescriptions`: Crear receta

**Utilidades Especiales:**

- Formateo automático de RUT chileno (`xx.xxx.xxx-x`)
- Búsqueda parcial de RUT
- Validación de RUT con dígito verificador

---

### 3. Sistema de Citas (`/admin/appointments`)

**Propósito:** Gestión completa de citas y agenda con calendario interactivo.

**Funcionalidades:**

- **Calendario Visual:** Vista semanal y mensual con slots de tiempo
- **Gestión de Estados:** Crear, editar, cancelar, completar citas
- **Clientes No Registrados:** Agendar citas sin crear cliente
- **Configuración Flexible:** Horarios de trabajo, duración de slots, días bloqueados
- **Verificación Automática:** Disponibilidad en tiempo real
- **Tipos de Cita:** Examen de vista, consulta, ajuste, entrega, reparación, seguimiento, emergencia

**Estructura:**

- `appointments`: Tabla principal de citas
- `schedule_settings`: Configuración de horarios y disponibilidad

**APIs:**

- `GET /api/admin/appointments`: Listar citas (con filtros de fecha)
- `POST /api/admin/appointments`: Crear cita
- `GET /api/admin/appointments/[id]`: Detalle de cita
- `PUT /api/admin/appointments/[id]`: Actualizar cita
- `DELETE /api/admin/appointments/[id]`: Cancelar cita
- `GET /api/admin/appointments/availability`: Verificar disponibilidad
- `GET /api/admin/schedule-settings`: Configuración de horarios
- `PUT /api/admin/schedule-settings`: Actualizar configuración

**Características Técnicas:**

- Verificación de disponibilidad mediante RPC de Supabase
- Slots de tiempo configurables
- Bloqueo de días específicos
- Soporte para múltiples sucursales

---

### 4. Sistema de Presupuestos (`/admin/quotes`)

**Propósito:** Creación y gestión de presupuestos detallados para clientes.

**Funcionalidades:**

- **Presupuestos Detallados:** Marcos, lentes, tratamientos, mano de obra
- **Estados:** Borrador, enviado, aceptado, rechazado, expirado
- **Expiración Automática:** Configuración de tiempo de validez
- **Conversión a Trabajos:** Convertir presupuestos aceptados en trabajos
- **Envío por Email:** Enviar presupuestos directamente a clientes
- **Impresión/PDF:** Generar documentos imprimibles

**Estructura:**

- `quotes`: Tabla principal de presupuestos
- `quote_items`: Items del presupuesto (productos, servicios)
- `quote_settings`: Configuración global de presupuestos

**APIs:**

- `GET /api/admin/quotes`: Listar presupuestos
- `POST /api/admin/quotes`: Crear presupuesto
- `GET /api/admin/quotes/[id]`: Detalle de presupuesto
- `PUT /api/admin/quotes/[id]`: Actualizar presupuesto
- `POST /api/admin/quotes/[id]/send`: Enviar por email
- `POST /api/admin/quotes/[id]/convert`: Convertir a trabajo
- `PUT /api/admin/quotes/[id]/status`: Cambiar estado
- `GET /api/admin/quote-settings`: Configuración
- `PUT /api/admin/quote-settings`: Actualizar configuración

**Flujo de Trabajo:**

1. Crear presupuesto (borrador)
2. Agregar items (marcos, lentes, tratamientos)
3. Enviar al cliente (cambia a "enviado")
4. Cliente acepta/rechaza
5. Si acepta: convertir a trabajo de laboratorio

---

### 5. Trabajos de Laboratorio (`/admin/work-orders`)

**Propósito:** Seguimiento completo del ciclo de vida de trabajos de laboratorio.

**Funcionalidades:**

- **Estados Detallados:** Ordenado, enviado a laboratorio, en proceso, listo, recibido, montado, control de calidad, entregado
- **Timeline Visual:** Indicador visual del estado actual y progreso
- **Historial de Cambios:** Registro completo de cambios de estado
- **Asignación de Personal:** Asignar trabajos a miembros del equipo
- **Relación con Presupuestos:** Vinculación con presupuestos originales

**Estructura:**

- `lab_work_orders`: Tabla principal de trabajos
- `lab_work_order_status_history`: Historial de cambios de estado

**APIs:**

- `GET /api/admin/work-orders`: Listar trabajos
- `POST /api/admin/work-orders`: Crear trabajo
- `GET /api/admin/work-orders/[id]`: Detalle de trabajo
- `PUT /api/admin/work-orders/[id]`: Actualizar trabajo
- `PUT /api/admin/work-orders/[id]/status`: Cambiar estado

**Estados del Trabajo:**

1. **Ordenado:** Trabajo creado desde presupuesto
2. **Enviado a Laboratorio:** Enviado a laboratorio externo
3. **En Proceso:** En fabricación
4. **Listo:** Completado en laboratorio
5. **Recibido:** Recibido en la óptica
6. **Montado:** Lentes montados en marco
7. **Control de Calidad:** Verificación final
8. **Entregado:** Entregado al cliente

---

### 6. Punto de Venta - POS (`/admin/pos`)

**Propósito:** Sistema de punto de venta integrado para ventas rápidas.

**Funcionalidades:**

- **Ventas Rápidas:** Interfaz optimizada para ventas
- **Búsqueda de Clientes:** Por RUT, nombre, email o teléfono
- **Carga de Presupuestos:** Cargar presupuestos existentes al carrito
- **Órdenes Completas:** Marco, lente, tratamientos y mano de obra
- **Múltiples Métodos de Pago:** Efectivo, tarjeta de débito, tarjeta de crédito, cuotas
- **Cálculo Automático:** IVA, descuentos y totales

**APIs:**

- `POST /api/admin/pos/process-sale`: Procesar venta

**Flujo de Venta:**

1. Buscar/seleccionar cliente
2. Agregar productos al carrito
3. Aplicar descuentos (opcional)
4. Seleccionar método de pago
5. Procesar pago
6. Generar orden y recibo

---

### 7. Caja Registradora (`/admin/cash-register`)

**Propósito:** Gestión de cajas registradoras y cierres de turno.

**Funcionalidades:**

- **Apertura de Caja:** Inicializar caja con monto inicial
- **Cierre de Caja:** Cerrar turno con conteo de efectivo
- **Historial de Cierres:** Ver cierres anteriores
- **Reportes:** Resumen de ventas por turno
- **Gestión de Órdenes:** Ver órdenes del turno actual

**APIs:**

- `GET /api/admin/cash-register/closures`: Listar cierres
- `POST /api/admin/cash-register/close`: Cerrar caja
- `GET /api/admin/cash-register/closures/[id]`: Detalle de cierre

---

### 8. Gestión de Productos (`/admin/products`)

**Propósito:** Catálogo completo de productos ópticos con inventario.

**Funcionalidades:**

- **CRUD Completo:** Crear, editar, eliminar productos
- **Categorías:** Organización por categorías
- **Especificaciones Ópticas:** Tipo de marco, material, medidas, forma, color
- **Especificaciones de Lente:** Tipo, material, índice de refracción, tratamientos
- **Control de Inventario:** Stock, SKU, códigos de barras
- **Importación Masiva:** Importar productos desde CSV/JSON
- **Opciones Personalizables:** Campos configurables por tipo de producto

**Estructura:**

- `products`: Tabla principal de productos
- `product_options`: Opciones personalizables (campos dinámicos)
- `categories`: Categorías de productos

**APIs:**

- `GET /api/admin/products`: Listar productos (con paginación y filtros)
- `POST /api/admin/products`: Crear producto
- `GET /api/admin/products/[id]`: Detalle de producto
- `PUT /api/admin/products/[id]`: Actualizar producto
- `DELETE /api/admin/products/[id]`: Eliminar producto
- `GET /api/admin/products/search`: Búsqueda de productos
- `POST /api/admin/products/bulk`: Operaciones masivas
- `POST /api/admin/products/import`: Importar desde CSV
- `POST /api/admin/products/import-json`: Importar desde JSON
- `GET /api/admin/products/template`: Descargar plantilla CSV
- `GET /api/admin/product-options`: Opciones de productos
- `PUT /api/admin/product-options/[fieldKey]`: Actualizar opción

**Tipos de Productos:**

- Marcos (armazones)
- Lentes (cristales)
- Accesorios
- Servicios (mano de obra, tratamientos)

---

### 9. Gestión de Órdenes (`/admin/orders`)

**Propósito:** Administración de pedidos y ventas realizadas.

**Funcionalidades:**

- **Listado de Órdenes:** Con filtros por estado, fecha, cliente
- **Detalle Completo:** Ver todos los detalles de una orden
- **Gestión de Estados:** Cambiar estado de órdenes
- **Notificaciones:** Notificar cambios de estado a clientes
- **Historial:** Ver historial completo de cambios

**Estructura:**

- `orders`: Tabla principal de órdenes
- `order_items`: Items de cada orden

**APIs:**

- `GET /api/admin/orders`: Listar órdenes
- `GET /api/admin/orders/[id]`: Detalle de orden
- `PUT /api/admin/orders/[id]`: Actualizar orden
- `POST /api/admin/orders/[id]/notify`: Enviar notificación

**Estados de Orden:**

- Pendiente
- Confirmada
- En preparación
- Enviada
- Entregada
- Cancelada

---

### 10. Sistema de Soporte (`/admin/support`)

**Propósito:** Gestión de tickets de soporte y atención al cliente.

**Funcionalidades:**

- **Tickets:** Crear, asignar, responder tickets
- **Categorías:** Organización por categorías
- **Plantillas:** Respuestas predefinidas
- **Estados:** Abierto, en progreso, resuelto, cerrado
- **Historial:** Mensajes y cambios de estado

**APIs:**

- `GET /api/admin/support/tickets`: Listar tickets
- `POST /api/admin/support/tickets`: Crear ticket
- `GET /api/admin/support/tickets/[id]`: Detalle de ticket
- `PUT /api/admin/support/tickets/[id]`: Actualizar ticket
- `POST /api/admin/support/tickets/[id]/messages`: Agregar mensaje
- `GET /api/admin/support/categories`: Categorías
- `GET /api/admin/support/templates`: Plantillas

---

### 11. Analytics (`/admin/analytics`)

**Propósito:** Dashboard de analytics con métricas y reportes.

**Funcionalidades:**

- **Métricas en Tiempo Real:** Ventas, ingresos, productos más vendidos
- **Gráficos:** Visualización de tendencias
- **Reportes:** Exportación de datos
- **Filtros:** Por fecha, sucursal, categoría

**APIs:**

- `GET /api/admin/analytics/dashboard`: Datos del dashboard

---

### 12. Sistema de Notificaciones (`/admin/notifications`)

**Propósito:** Sistema de notificaciones en tiempo real para administradores.

**Funcionalidades:**

- **Notificaciones en Tiempo Real:** Nuevos clientes, presupuestos, cambios de estado
- **Tipos de Notificación:** Clientes, presupuestos, trabajos, citas, ventas
- **Configuración:** Activar/desactivar tipos de notificación
- **Prioridades:** Sistema de prioridades
- **Marcar como Leído:** Gestión de estado de lectura

**Estructura:**

- `admin_notifications`: Tabla de notificaciones
- `notification_settings`: Configuración por usuario

**APIs:**

- `GET /api/admin/notifications`: Listar notificaciones
- `PUT /api/admin/notifications/[id]`: Marcar como leído
- `GET /api/admin/notifications/settings`: Configuración
- `PUT /api/admin/notifications/settings`: Actualizar configuración

---

### 13. Chatbot IA (`/admin/chat`)

**Propósito:** Agente de IA que permite gestionar el sistema mediante lenguaje natural.

**Funcionalidades:**

- **Tool Calling:** Operaciones autónomas de base de datos
- **Múltiples Proveedores:** OpenAI, Anthropic, Google Gemini, DeepSeek
- **Fallback Automático:** Cambio automático de proveedor si falla
- **Memoria de Sesión:** Contexto mantenido durante la conversación
- **Operaciones Soportadas:**
  - Buscar y gestionar productos
  - Gestionar pedidos
  - Gestionar clientes
  - Proporcionar analytics
  - Gestionar soporte
  - Gestionar citas
  - Gestionar presupuestos

**Estructura:**

- `src/lib/ai/agent/`: Lógica del agente
- `src/lib/ai/tools/`: Herramientas disponibles para el agente
- `src/lib/ai/providers/`: Integraciones con proveedores LLM
- `src/lib/ai/memory/`: Sistema de memoria y contexto

**APIs:**

- `POST /api/admin/chat`: Enviar mensaje al chatbot
- `GET /api/admin/chat/sessions`: Listar sesiones
- `GET /api/admin/chat/messages`: Historial de mensajes
- `GET /api/admin/chat/history`: Historial completo
- `GET /api/admin/chat/providers`: Proveedores disponibles
- `GET /api/admin/chat/tools`: Herramientas disponibles

**Herramientas del Agente:**

- `search_products`: Buscar productos
- `update_product_stock`: Actualizar inventario
- `get_orders`: Obtener órdenes
- `update_order_status`: Actualizar estado de orden
- `get_customer`: Obtener información de cliente
- `get_dashboard_stats`: Obtener estadísticas
- `create_support_ticket`: Crear ticket de soporte
- `get_appointments`: Obtener citas
- `create_quote`: Crear presupuesto

---

### 14. Gestión de Sucursales (`/admin/branches`)

**Propósito:** Administración de múltiples sucursales (solo super admin).

**Funcionalidades:**

- **CRUD de Sucursales:** Crear, editar, eliminar sucursales
- **Vista Global:** Ver datos de todas las sucursales
- **Vista por Sucursal:** Filtrar datos por sucursal específica
- **Asignación de Usuarios:** Asignar administradores a sucursales
- **Estadísticas por Sucursal:** Métricas individuales

**APIs:**

- `GET /api/admin/branches`: Listar sucursales
- `POST /api/admin/branches`: Crear sucursal
- `GET /api/admin/branches/[id]`: Detalle de sucursal
- `PUT /api/admin/branches/[id]`: Actualizar sucursal
- `DELETE /api/admin/branches/[id]`: Eliminar sucursal
- `GET /api/admin/branches/[id]/stats`: Estadísticas de sucursal
- `GET /api/admin/branches/global/stats`: Estadísticas globales

---

### 15. Gestión de Administradores (`/admin/admin-users`)

**Propósito:** Administración de usuarios administradores y sus permisos.

**Funcionalidades:**

- **CRUD de Administradores:** Crear, editar, eliminar admins
- **Roles:** Admin, Super Admin
- **Asignación de Sucursales:** Asignar admins a sucursales específicas
- **Gestión de Permisos:** Control de acceso granular

**APIs:**

- `GET /api/admin/admin-users`: Listar administradores
- `POST /api/admin/admin-users`: Crear administrador
- `GET /api/admin/admin-users/[id]`: Detalle de administrador
- `PUT /api/admin/admin-users/[id]`: Actualizar administrador
- `DELETE /api/admin/admin-users/[id]`: Eliminar administrador
- `PUT /api/admin/admin-users/[id]/branch-access`: Asignar sucursales

---

### 16. Configuración del Sistema (`/admin/system`)

**Propósito:** Configuración general del sistema y parámetros.

**Funcionalidades:**

- **Configuración General:** Parámetros del sistema
- **Plantillas de Email:** Gestión de plantillas
- **Configuración de Envíos:** Zonas y tarifas de envío
- **Webhooks:** Configuración de webhooks
- **SEO:** Configuración SEO
- **Backups:** Gestión de backups
- **Mantenimiento:** Modo de mantenimiento

**APIs:**

- `GET /api/admin/system/config`: Configuración general
- `PUT /api/admin/system/config`: Actualizar configuración
- `GET /api/admin/system/email-templates`: Plantillas de email
- `POST /api/admin/system/email-templates`: Crear plantilla
- `GET /api/admin/system/email-templates/[id]`: Detalle de plantilla
- `PUT /api/admin/system/email-templates/[id]`: Actualizar plantilla
- `POST /api/admin/system/email-templates/[id]/test`: Probar plantilla
- `GET /api/admin/system/shipping/zones`: Zonas de envío
- `GET /api/admin/system/shipping/rates`: Tarifas de envío
- `GET /api/admin/system/webhooks/status`: Estado de webhooks
- `POST /api/admin/system/webhooks/test`: Probar webhook
- `GET /api/admin/system/seo/config`: Configuración SEO
- `GET /api/admin/system/backups`: Listar backups
- `POST /api/admin/system/maintenance`: Modo mantenimiento
- `GET /api/admin/system/health`: Estado del sistema

---

## Sistema de Autenticación y Autorización

### Autenticación

- **Proveedor:** Supabase Auth
- **Métodos:** Email/Password
- **Sesiones:** Persistencia automática con refresh tokens
- **Seguridad:** Row Level Security (RLS) en base de datos

### Autorización

- **Roles:**
  - **Usuario Regular:** Acceso a perfil y compras
  - **Admin:** Acceso completo al panel de administración
  - **Super Admin:** Acceso a gestión de sucursales y administradores

### Verificación de Permisos

- **Función RPC:** `is_admin(user_id)` - Verifica si usuario es admin
- **Función RPC:** `is_super_admin(user_id)` - Verifica si es super admin
- **Middleware:** Verificación en cada API route
- **Componente:** `AdminLayout` verifica permisos antes de renderizar

### Tablas Relacionadas

- `auth.users`: Usuarios de Supabase Auth
- `profiles`: Perfiles extendidos de usuarios
- `admin_users`: Usuarios con permisos de administrador

---

## Sistema Multi-Sucursal (Branches)

### Concepto

El sistema soporta múltiples sucursales con aislamiento de datos y control de acceso.

### Funcionalidad

- **Vista Global:** Super admins pueden ver datos de todas las sucursales
- **Vista por Sucursal:** Filtrar datos por sucursal específica
- **Asignación:** Admins pueden estar asignados a sucursales específicas
- **Aislamiento:** RLS asegura que cada sucursal solo vea sus datos

### Implementación

- **Context:** `BranchContext` gestiona la sucursal actual
- **Hook:** `useBranch()` para acceder al contexto
- **Middleware:** Headers `X-Branch-Id` en requests API
- **Base de Datos:** Campo `branch_id` en tablas relevantes

### Tablas con Soporte Multi-Sucursal

- `products`
- `orders`
- `customers`
- `appointments`
- `quotes`
- `lab_work_orders`
- `cash_register_closures`

---

## APIs y Endpoints

### Estructura de APIs

Todas las APIs están bajo `/api/admin/*` y requieren autenticación.

### Middleware Común

- **Autenticación:** Verifica token de sesión
- **Autorización:** Verifica permisos de admin
- **Validación:** Valida request body con Zod
- **Manejo de Errores:** Respuestas estandarizadas
- **Branch Context:** Inyecta contexto de sucursal

### Patrón de Respuesta

```typescript
// Éxito
{
  success: true,
  data: {...}
}

// Error
{
  success: false,
  error: "Mensaje de error"
}
```

### Endpoints Principales

- **Dashboard:** `/api/admin/dashboard`
- **Clientes:** `/api/admin/customers/*`
- **Citas:** `/api/admin/appointments/*`
- **Presupuestos:** `/api/admin/quotes/*`
- **Trabajos:** `/api/admin/work-orders/*`
- **Productos:** `/api/admin/products/*`
- **Órdenes:** `/api/admin/orders/*`
- **Soporte:** `/api/admin/support/*`
- **Notificaciones:** `/api/admin/notifications/*`
- **Chat:** `/api/admin/chat/*`
- **Sucursales:** `/api/admin/branches/*`
- **Sistema:** `/api/admin/system/*`

---

## Base de Datos

### Esquema Principal

#### Tablas de Usuarios y Autenticación

- `auth.users`: Usuarios de Supabase Auth
- `profiles`: Perfiles extendidos
- `admin_users`: Administradores
- `admin_user_branch_access`: Asignación de admins a sucursales

#### Tablas de Clientes

- `profiles`: Información de clientes
- `prescriptions`: Recetas oftalmológicas
- `appointments`: Citas

#### Tablas de Productos y Ventas

- `products`: Catálogo de productos
- `product_options`: Opciones personalizables
- `categories`: Categorías
- `orders`: Órdenes de venta
- `order_items`: Items de órdenes

#### Tablas de Presupuestos y Trabajos

- `quotes`: Presupuestos
- `quote_items`: Items de presupuestos
- `lab_work_orders`: Trabajos de laboratorio
- `lab_work_order_status_history`: Historial de estados

#### Tablas de Sistema

- `branches`: Sucursales
- `admin_notifications`: Notificaciones
- `notification_settings`: Configuración de notificaciones
- `schedule_settings`: Configuración de horarios
- `quote_settings`: Configuración de presupuestos
- `system_config`: Configuración general

#### Tablas de Soporte

- `support_tickets`: Tickets de soporte
- `support_ticket_messages`: Mensajes de tickets
- `support_categories`: Categorías de soporte
- `support_templates`: Plantillas de respuestas

#### Tablas de Caja

- `cash_register_closures`: Cierres de caja

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS que:

- Restringen acceso según rol de usuario
- Filtran por sucursal cuando aplica
- Permiten operaciones según permisos

### Funciones RPC

- `is_admin(user_id)`: Verificar si es admin
- `is_super_admin(user_id)`: Verificar si es super admin
- `check_appointment_availability(...)`: Verificar disponibilidad
- `get_available_time_slots(...)`: Obtener slots disponibles
- `normalize_rut_for_search(rut_text)`: Normalizar RUT
- `search_customers_by_rut(rut_search_term)`: Buscar por RUT

---

## Integraciones Externas

### MercadoPago

- **Propósito:** Procesamiento de pagos
- **SDK:** `@mercadopago/sdk-react`
- **Funcionalidades:** Pagos con tarjeta, efectivo, cuotas
- **Configuración:** Variables de entorno `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`

### Resend

- **Propósito:** Envío de emails
- **Funcionalidades:** Envío de presupuestos, notificaciones
- **Configuración:** Variable `RESEND_API_KEY`

### Supabase

- **Auth:** Autenticación de usuarios
- **Database:** PostgreSQL con RLS
- **Storage:** Almacenamiento de archivos
- **Realtime:** Actualizaciones en tiempo real

---

## Sistema de IA y Chatbot

### Arquitectura

- **Framework:** Vercel AI SDK
- **Proveedores:** OpenAI, Anthropic, Google Gemini, DeepSeek
- **Tool Calling:** Operaciones autónomas de base de datos
- **Memoria:** Sistema de memoria con embeddings

### Componentes

- **Agent:** `src/lib/ai/agent/` - Lógica principal del agente
- **Tools:** `src/lib/ai/tools/` - Herramientas disponibles
- **Providers:** `src/lib/ai/providers/` - Integraciones LLM
- **Memory:** `src/lib/ai/memory/` - Sistema de memoria
- **Embeddings:** `src/lib/ai/embeddings/` - Generación de embeddings

### Flujo de Conversación

1. Usuario envía mensaje
2. Agente procesa con LLM
3. LLM decide qué herramientas usar
4. Se ejecutan herramientas (operaciones de BD)
5. Resultado se envía de vuelta al LLM
6. LLM genera respuesta final

### Configuración

Variables de entorno para cada proveedor:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `DEEPSEEK_API_KEY`
- `AI_DEFAULT_PROVIDER`
- `AI_DEFAULT_MODEL`

---

## Componentes y UI

### Componentes Admin

Ubicación: `src/components/admin/`

**Componentes Principales:**

- `AdminLayout`: Layout principal del panel
- `AdminSidebar`: Barra lateral de navegación
- `AdminNotificationDropdown`: Dropdown de notificaciones
- `BranchSelector`: Selector de sucursal
- `Chatbot`: Componente del chatbot IA
- `AppointmentCalendar`: Calendario de citas
- `CreateAppointmentForm`: Formulario de citas
- `CreateQuoteForm`: Formulario de presupuestos
- `CreateWorkOrderForm`: Formulario de trabajos
- Y muchos más...

### Componentes UI

Ubicación: `src/components/ui/`

Componentes reutilizables basados en Radix UI:

- `Button`, `Input`, `Select`, `Dialog`, `Dropdown`, `Tabs`, etc.

### Estilos

- **Framework:** Tailwind CSS
- **Tema:** Sistema de temas con `next-themes`
- **Componentes:** Radix UI para accesibilidad
- **Animaciones:** Framer Motion

---

## Configuración y Despliegue

### Variables de Entorno

Archivo: `.env.local`

**Requeridas:**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

**Opcionales:**

```env
RESEND_API_KEY=
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
DEEPSEEK_API_KEY=
```

### Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Servidor producción
npm run lint         # Linting
npm run type-check   # Verificación TypeScript
npm run test         # Tests
npm run supabase:start   # Iniciar Supabase local
npm run supabase:stop    # Detener Supabase local
npm run supabase:reset   # Resetear base de datos
```

### Supabase Local

El proyecto usa Supabase local para desarrollo:

- **Puerto API:** 54321
- **Puerto DB:** 54322
- **Puerto Studio:** 54323
- **Puerto Mailpit:** 54324

### Migraciones

Las migraciones están en `supabase/migrations/` y se aplican automáticamente con `supabase:reset`.

---

## Flujos de Trabajo Principales

### Flujo de Venta Completo

1. Cliente busca/selecciona producto
2. Se crea presupuesto (opcional)
3. Cliente acepta presupuesto
4. Se convierte a trabajo de laboratorio
5. Se procesa trabajo
6. Se crea orden de venta
7. Se procesa pago
8. Se entrega producto

### Flujo de Cita

1. Cliente solicita cita
2. Sistema verifica disponibilidad
3. Se crea cita (con o sin cliente registrado)
4. Cliente asiste
5. Se realiza examen/consulta
6. Se crea receta (si aplica)
7. Se crea presupuesto
8. Continúa flujo de venta

### Flujo de Trabajo de Laboratorio

1. Presupuesto aceptado
2. Se crea trabajo (estado: "Ordenado")
3. Se envía a laboratorio (estado: "Enviado")
4. Laboratorio procesa (estado: "En Proceso")
5. Trabajo completado (estado: "Listo")
6. Se recibe en óptica (estado: "Recibido")
7. Se monta (estado: "Montado")
8. Control de calidad (estado: "Control de Calidad")
9. Se entrega (estado: "Entregado")

---

## Seguridad

### Autenticación

- Tokens JWT de Supabase
- Refresh automático de tokens
- Sesiones persistentes

### Autorización

- Verificación de roles en cada request
- RLS en base de datos
- Middleware de validación en APIs

### Validación

- Validación de inputs con Zod
- Sanitización de datos
- Protección CSRF

### Seguridad de Datos

- Encriptación en tránsito (HTTPS)
- RLS para aislamiento de datos
- Validación de permisos en cada operación

---

## Performance y Optimización

### Frontend

- Server Components para reducir JavaScript
- Code splitting automático
- Lazy loading de componentes
- Optimización de imágenes con Next.js Image

### Backend

- Queries optimizadas con índices
- Paginación en listados
- Caching con React Query
- Realtime subscriptions solo cuando necesario

### Base de Datos

- Índices en campos de búsqueda frecuente
- RLS eficiente
- Funciones RPC optimizadas

---

## Testing

### Configuración

- **Framework:** Vitest
- **Librerías:** Testing Library, Jest DOM
- **Coverage:** Vitest Coverage

### Estructura de Tests

```
src/__tests__/
├── unit/          # Tests unitarios
├── integration/   # Tests de integración
└── setup.ts       # Configuración
```

### Scripts

```bash
npm run test           # Ejecutar tests
npm run test:watch     # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # UI de tests
```

---

## Mantenimiento y Mejoras Futuras

### Roadmap

- ✅ Fase 0-4: Estabilización y refactorización (completadas)
- ⏳ Fase 5: Mejoras de mantenibilidad
- ⏳ Fase 6: Testing completo
- ⏳ SaaS 0: Arquitectura multi-tenancy
- ⏳ SaaS 1: Billing y suscripciones

### Mejoras Planificadas

- Sistema de suscripciones
- Multi-tenancy completo
- Tests E2E
- Optimizaciones de performance
- Mejoras de UX

---

## Conclusión

Este documento proporciona una visión completa del sistema OpticSystemAI, cubriendo todos los módulos principales, arquitectura técnica, y flujos de trabajo. El sistema está diseñado para ser escalable, mantenible y extensible, con una base sólida para futuras mejoras y expansión a SaaS.

Para más detalles sobre implementación específica, consultar el código fuente y la documentación inline.

---

**Última Actualización:** 2025-01-27  
**Mantenido por:** Equipo de Desarrollo OpticSystemAI
