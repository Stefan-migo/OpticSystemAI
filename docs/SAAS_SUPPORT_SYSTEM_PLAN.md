# 🎧 Plan de Implementación: Sistema de Soporte SaaS

**Fecha Creación:** 2026-01-30  
**Estado:** 📋 Plan Documentado - Listo para Implementación  
**Prioridad:** 🟡 MEDIA

---

## 📊 Análisis de la Situación Actual

### ✅ Lo que Existe Actualmente

#### 1. **Sistema de Soporte para Ópticas** (Clientes → Ópticas)

- **Ubicación:** `/admin/support`
- **Tablas:** `support_tickets`, `support_messages`, `support_categories`, `support_templates`
- **Propósito:** Permite que clientes de las ópticas creen tickets de soporte
- **Flujo:** Cliente → Óptica (dentro de una organización)
- **Estado:** ✅ Implementado y funcionando

#### 2. **Panel de Búsqueda Rápida** (SaaS Management)

- **Ubicación:** `/admin/saas-management/support`
- **Funcionalidad:** Búsqueda rápida de organizaciones y usuarios
- **Propósito:** Herramienta para root/dev para encontrar organizaciones/usuarios rápidamente
- **Estado:** ✅ Implementado básico (solo búsqueda)

### ❌ Lo que NO Existe

#### 1. **Sistema de Soporte SaaS** (Ópticas → Opttius)

- **Propósito:** Permite que organizaciones/usuarios contacten a Opttius para soporte técnico
- **Flujo:** Organización → Opttius (root/dev)
- **Estado:** ❌ No implementado

#### 2. **Gestión de Tickets SaaS**

- **Propósito:** Root/dev puede gestionar tickets de soporte de organizaciones
- **Estado:** ❌ No implementado

#### 3. **Portal de Soporte Público**

- **Ubicación:** `/support` (público)
- **Propósito:** Página pública donde organizaciones pueden crear tickets sin login
- **Estado:** ❌ No existe (404 actualmente)

---

## 🎯 Objetivos del Sistema de Soporte SaaS

### Objetivos Principales

1. **Permitir que organizaciones soliciten soporte técnico**
   - Crear tickets desde el panel admin de la organización
   - Crear tickets desde portal público `/support`
   - Seguimiento de tickets en tiempo real

2. **Permitir que root/dev gestione tickets eficientemente**
   - Ver todos los tickets del sistema
   - Asignar tickets
   - Responder a tickets
   - Cerrar/resolver tickets
   - Ver historial completo

3. **Mejorar experiencia de soporte**
   - Categorización de tickets
   - Priorización automática
   - Notificaciones por email
   - Respuestas rápidas con templates

---

## 🏗️ Arquitectura Propuesta

### Modelo de Datos

#### Nueva Tabla: `saas_support_tickets`

```sql
CREATE TABLE public.saas_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL, -- Format: SAAS-YYYYMMDD-XXXXX

  -- Relación con organización/usuario
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,

  -- Información del solicitante
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  requester_role TEXT, -- 'super_admin', 'admin', 'employee'

  -- Detalles del ticket
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'technical',      -- Problemas técnicos
    'billing',        -- Facturación/suscripciones
    'feature_request', -- Solicitud de funcionalidades
    'bug_report',     -- Reporte de bugs
    'account',        -- Gestión de cuenta
    'other'           -- Otros
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',              -- Abierto, sin asignar
    'assigned',          -- Asignado a root/dev
    'in_progress',       -- En progreso
    'waiting_customer',  -- Esperando respuesta del cliente
    'resolved',          -- Resuelto
    'closed'             -- Cerrado
  )),

  -- Asignación
  assigned_to UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,

  -- Resolución
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,

  -- Métricas
  first_response_at TIMESTAMPTZ,
  last_response_at TIMESTAMPTZ,
  response_time_minutes INTEGER, -- Tiempo hasta primera respuesta
  resolution_time_minutes INTEGER, -- Tiempo hasta resolución

  -- Satisfacción del cliente
  customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating >= 1 AND customer_satisfaction_rating <= 5),
  customer_feedback TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Información adicional (versión, navegador, etc.)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_saas_support_tickets_organization ON public.saas_support_tickets(organization_id);
CREATE INDEX idx_saas_support_tickets_status ON public.saas_support_tickets(status);
CREATE INDEX idx_saas_support_tickets_priority ON public.saas_support_tickets(priority);
CREATE INDEX idx_saas_support_tickets_assigned_to ON public.saas_support_tickets(assigned_to);
CREATE INDEX idx_saas_support_tickets_created_at ON public.saas_support_tickets(created_at DESC);
CREATE INDEX idx_saas_support_tickets_ticket_number ON public.saas_support_tickets(ticket_number);
```

#### Nueva Tabla: `saas_support_messages`

```sql
CREATE TABLE public.saas_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.saas_support_tickets(id) ON DELETE CASCADE NOT NULL,

  -- Contenido del mensaje
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- true para notas internas (no visibles al cliente)
  is_from_customer BOOLEAN DEFAULT false, -- true si viene del cliente

  -- Información del remitente
  sender_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,

  -- Adjuntos
  attachments JSONB DEFAULT '[]', -- Array de URLs y metadata

  -- Tipo de mensaje
  message_type TEXT DEFAULT 'message' CHECK (message_type IN (
    'message',        -- Mensaje normal
    'note',          -- Nota interna
    'status_change', -- Cambio de estado
    'assignment',    -- Asignación
    'resolution'     -- Resolución
  )),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_saas_support_messages_ticket ON public.saas_support_messages(ticket_id, created_at DESC);
```

#### Nueva Tabla: `saas_support_templates`

```sql
CREATE TABLE public.saas_support_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  category TEXT, -- Categoría relacionada

  -- Variables disponibles (e.g., {{ticket_number}}, {{organization_name}})
  variables JSONB DEFAULT '[]',

  -- Uso
  usage_count INTEGER DEFAULT 0,

  -- Estado
  is_active BOOLEAN DEFAULT true,

  -- Creador
  created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE public.saas_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_support_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para saas_support_tickets
-- Organizaciones pueden ver sus propios tickets
CREATE POLICY "Organizations can view own tickets"
ON public.saas_support_tickets
FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM public.admin_users
    WHERE id = auth.uid()
    LIMIT 1
  )
);

-- Organizaciones pueden crear tickets
CREATE POLICY "Organizations can create tickets"
ON public.saas_support_tickets
FOR INSERT
WITH CHECK (
  organization_id = (
    SELECT organization_id FROM public.admin_users
    WHERE id = auth.uid()
    LIMIT 1
  )
);

-- Root/dev puede ver todos los tickets
CREATE POLICY "Root users can view all tickets"
ON public.saas_support_tickets
FOR SELECT
USING (public.is_root_user(auth.uid()));

-- Root/dev puede gestionar todos los tickets
CREATE POLICY "Root users can manage all tickets"
ON public.saas_support_tickets
FOR ALL
USING (public.is_root_user(auth.uid()))
WITH CHECK (public.is_root_user(auth.uid()));

-- Políticas similares para saas_support_messages y saas_support_templates
```

---

## 🚀 Plan de Implementación

### Sprint 1: Base de Datos y APIs Backend (3-4 días)

#### Tareas:

1. ✅ Crear migración con tablas `saas_support_tickets`, `saas_support_messages`, `saas_support_templates`
2. ✅ Implementar políticas RLS
3. ✅ Crear función para generar `ticket_number` único
4. ✅ Crear API `/api/admin/saas-management/support/tickets`:
   - GET: Listar tickets con filtros (organización, estado, prioridad, categoría)
   - POST: Crear nuevo ticket
5. ✅ Crear API `/api/admin/saas-management/support/tickets/[id]`:
   - GET: Obtener detalles del ticket
   - PATCH: Actualizar ticket (estado, asignación, etc.)
6. ✅ Crear API `/api/admin/saas-management/support/tickets/[id]/messages`:
   - GET: Obtener mensajes del ticket
   - POST: Crear nuevo mensaje
7. ✅ Crear API `/api/admin/saas-management/support/templates`:
   - GET: Listar templates
   - POST: Crear template
   - PATCH: Actualizar template

**Archivos a crear:**

- `supabase/migrations/20260131000011_create_saas_support_system.sql`
- `src/app/api/admin/saas-management/support/tickets/route.ts`
- `src/app/api/admin/saas-management/support/tickets/[id]/route.ts`
- `src/app/api/admin/saas-management/support/tickets/[id]/messages/route.ts`
- `src/app/api/admin/saas-management/support/templates/route.ts`

---

### Sprint 2: Portal Público `/support` (2-3 días)

#### Tareas:

1. ✅ Crear página pública `/support`:
   - Formulario para crear ticket sin login
   - Campos: nombre, email, organización (opcional), categoría, asunto, descripción
   - Validación de email
   - Captcha (opcional pero recomendado)
2. ✅ Crear API pública `/api/support/create-ticket`:
   - POST: Crear ticket desde portal público
   - Validación de datos
   - Envío de email de confirmación
3. ✅ Crear página `/support/ticket/[ticketNumber]`:
   - Ver estado del ticket (público, con código de acceso)
   - Agregar mensajes al ticket
   - Ver historial de mensajes

**Archivos a crear:**

- `src/app/support/page.tsx`
- `src/app/support/ticket/[ticketNumber]/page.tsx`
- `src/app/api/support/create-ticket/route.ts`
- `src/app/api/support/ticket/[ticketNumber]/route.ts`

---

### Sprint 3: Panel de Gestión para Root/Dev (3-4 días)

#### Tareas:

1. ✅ Mejorar `/admin/saas-management/support`:
   - Lista de tickets con filtros avanzados
   - Vista de tabla con columnas: ticket #, organización, categoría, prioridad, estado, asignado, creado
   - Acciones rápidas: asignar, cambiar estado, ver detalles
2. ✅ Crear página `/admin/saas-management/support/tickets/[id]`:
   - Vista detallada del ticket
   - Historial de mensajes
   - Formulario para responder
   - Acciones: asignar, cambiar estado, resolver, cerrar
   - Usar templates para respuestas rápidas
3. ✅ Crear componente de gestión de templates:
   - Listar templates
   - Crear/editar templates
   - Usar template en respuesta

**Archivos a modificar:**

- `src/app/admin/saas-management/support/page.tsx` (mejorar con lista de tickets)
- `src/app/admin/saas-management/support/tickets/[id]/page.tsx` (nuevo)

**Archivos a crear:**

- `src/components/admin/saas-support/TicketList.tsx`
- `src/components/admin/saas-support/TicketDetail.tsx`
- `src/components/admin/saas-support/MessageThread.tsx`
- `src/components/admin/saas-support/TemplateSelector.tsx`

---

### Sprint 4: Panel para Organizaciones (2-3 días)

#### Tareas:

1. ✅ Crear página `/admin/support` (para organizaciones):
   - Lista de tickets de la organización
   - Crear nuevo ticket
   - Ver detalles de ticket
   - Responder a tickets
2. ✅ Integrar con menú de admin:
   - Agregar "Soporte" al menú lateral
   - Mostrar badge con tickets abiertos

**Archivos a crear:**

- `src/app/admin/support/page.tsx`
- `src/app/admin/support/tickets/[id]/page.tsx`
- `src/components/admin/support/CreateTicketForm.tsx`
- `src/components/admin/support/OrganizationTicketList.tsx`

---

### Sprint 5: Notificaciones y Mejoras (2-3 días)

#### Tareas:

1. ✅ Implementar notificaciones por email:
   - Email de confirmación al crear ticket
   - Email cuando se asigna ticket
   - Email cuando hay nueva respuesta
   - Email cuando se resuelve ticket
2. ✅ Implementar métricas y dashboard:
   - Tickets abiertos
   - Tiempo promedio de respuesta
   - Tiempo promedio de resolución
   - Tasa de satisfacción
3. ✅ Implementar búsqueda avanzada:
   - Buscar por ticket number
   - Buscar por organización
   - Buscar por contenido de mensajes

---

## 📋 Estructura de Archivos Final

```
src/
├── app/
│   ├── support/                          # Portal público
│   │   ├── page.tsx                      # Crear ticket público
│   │   └── ticket/
│   │       └── [ticketNumber]/
│   │           └── page.tsx              # Ver ticket público
│   ├── admin/
│   │   ├── support/                      # Panel para organizaciones
│   │   │   ├── page.tsx                  # Lista de tickets de la org
│   │   │   └── tickets/
│   │   │       └── [id]/
│   │   │           └── page.tsx          # Detalle de ticket
│   │   └── saas-management/
│   │       └── support/
│   │           ├── page.tsx              # Lista de todos los tickets (root/dev)
│   │           └── tickets/
│   │               └── [id]/
│   │                   └── page.tsx      # Detalle de ticket (root/dev)
│   └── api/
│       ├── support/                      # APIs públicas
│       │   ├── create-ticket/
│       │   │   └── route.ts
│       │   └── ticket/
│       │       └── [ticketNumber]/
│       │           └── route.ts
│       └── admin/
│           └── saas-management/
│               └── support/
│                   ├── tickets/
│                   │   ├── route.ts      # GET, POST
│                   │   └── [id]/
│                   │       ├── route.ts  # GET, PATCH
│                   │       └── messages/
│                   │           └── route.ts  # GET, POST
│                   └── templates/
│                       └── route.ts      # GET, POST, PATCH
├── components/
│   └── admin/
│       ├── saas-support/                 # Componentes para root/dev
│       │   ├── TicketList.tsx
│       │   ├── TicketDetail.tsx
│       │   ├── MessageThread.tsx
│       │   └── TemplateSelector.tsx
│       └── support/                      # Componentes para organizaciones
│           ├── CreateTicketForm.tsx
│           └── OrganizationTicketList.tsx
└── supabase/
    └── migrations/
        └── 20260131000011_create_saas_support_system.sql
```

---

## ✅ Checklist de Implementación

### Base de Datos

- [ ] Crear migración con tablas
- [ ] Implementar políticas RLS
- [ ] Crear función para generar ticket_number
- [ ] Crear índices para búsqueda eficiente
- [ ] Crear triggers para actualizar `updated_at`

### APIs Backend

- [ ] API para listar tickets (root/dev)
- [ ] API para crear ticket (público y desde organización)
- [ ] API para obtener detalles de ticket
- [ ] API para actualizar ticket
- [ ] API para listar mensajes
- [ ] API para crear mensaje
- [ ] API para gestionar templates
- [ ] Validación con Zod en todas las APIs
- [ ] Protección con `requireRoot()` donde corresponda

### Portal Público

- [ ] Página `/support` con formulario
- [ ] Página `/support/ticket/[ticketNumber]` para ver ticket
- [ ] Validación de formulario
- [ ] Envío de email de confirmación
- [ ] Manejo de errores

### Panel Root/Dev

- [ ] Lista de tickets con filtros
- [ ] Vista detallada de ticket
- [ ] Formulario de respuesta
- [ ] Selector de templates
- [ ] Acciones: asignar, cambiar estado, resolver
- [ ] Métricas y estadísticas

### Panel Organizaciones

- [ ] Lista de tickets de la organización
- [ ] Crear nuevo ticket
- [ ] Ver detalles de ticket
- [ ] Responder a tickets
- [ ] Integración con menú admin

### Notificaciones

- [ ] Email de confirmación al crear ticket
- [ ] Email cuando se asigna ticket
- [ ] Email cuando hay nueva respuesta
- [ ] Email cuando se resuelve ticket

### Testing

- [ ] Tests unitarios para funciones de utilidad
- [ ] Tests de integración para APIs
- [ ] Tests E2E para flujos críticos

---

## 🎯 Prioridades

### 🔴 Alta Prioridad (MVP)

1. Base de datos y APIs básicas
2. Portal público `/support` para crear tickets
3. Panel root/dev para gestionar tickets
4. Notificaciones básicas por email

### 🟡 Media Prioridad

1. Panel para organizaciones
2. Templates de respuestas
3. Métricas y dashboard

### 🟢 Baja Prioridad

1. Búsqueda avanzada
2. Integración con sistema de soporte existente
3. Exportación de reportes

---

## 📝 Notas Adicionales

- **Diferenciación:** El sistema de soporte SaaS es diferente al sistema de soporte de ópticas:
  - Soporte SaaS: Organización → Opttius (root/dev)
  - Soporte Ópticas: Cliente → Óptica (dentro de organización)
- **Seguridad:** Todos los tickets deben estar aislados por organización
- **Escalabilidad:** Considerar implementar sistema de colas para emails si el volumen crece
- **Integración:** En el futuro, considerar integrar con sistema de chat en vivo

---

**Última Actualización:** 2026-01-30  
**Versión:** 2.0.0 - Implementación Completa

---

## ✅ Estado de Implementación

### Sprint 1: Base de Datos y APIs Backend ✅ COMPLETADO

- ✅ Migración `20260131000011_create_saas_support_system.sql` creada
- ✅ Tablas `saas_support_tickets`, `saas_support_messages`, `saas_support_templates` creadas
- ✅ Políticas RLS implementadas
- ✅ Función `generate_saas_ticket_number()` creada
- ✅ Triggers para `updated_at` automático
- ✅ API `/api/admin/saas-management/support/tickets` (GET, POST)
- ✅ API `/api/admin/saas-management/support/tickets/[id]` (GET, PATCH)
- ✅ API `/api/admin/saas-management/support/tickets/[id]/messages` (GET, POST)
- ✅ API `/api/admin/saas-management/support/templates` (GET, POST)
- ✅ API `/api/admin/saas-management/support/templates/[id]` (PATCH)
- ✅ Schemas de validación Zod implementados

### Sprint 2: Portal Público `/support` ✅ COMPLETADO

- ✅ Página pública `/support` con formulario completo
- ✅ API pública `/api/support/create-ticket` (POST)
- ✅ Página `/support/ticket/[ticketNumber]` para ver tickets públicos
- ✅ API `/api/support/ticket/[ticketNumber]` (GET, POST)
- ✅ Middleware actualizado para permitir acceso público
- ✅ Validación completa de formularios
- ✅ Manejo de errores

### Sprint 3: Panel de Gestión para Root/Dev ✅ COMPLETADO

- ✅ Página `/admin/saas-management/support` mejorada con:
  - Lista de tickets con filtros avanzados
  - Búsqueda rápida de organizaciones/usuarios (mantenida)
  - Tabs para alternar entre tickets, métricas y búsqueda
  - Paginación completa
- ✅ Página `/admin/saas-management/support/tickets/[id]` con:
  - Vista detallada del ticket
  - Historial de mensajes (incluyendo internos)
  - Formulario para responder
  - Selector de templates
  - Acciones rápidas: cambiar estado, prioridad, asignar
  - Métricas de tiempo de respuesta

### Sprint 4: Panel para Organizaciones ✅ COMPLETADO

- ✅ Página `/admin/support` con:
  - Lista de tickets de la organización
  - Estadísticas (total, abiertos, en progreso, resueltos)
  - Filtros avanzados
  - Crear nuevo ticket
  - Paginación
- ✅ Página `/admin/support/tickets/[id]` con:
  - Vista detallada del ticket
  - Historial de mensajes (solo públicos)
  - Formulario para responder
  - Información del ticket
- ✅ Integración con menú:
  - Badge con conteo de tickets abiertos
  - Item "Soporte" en menú lateral

### Sprint 5: Notificaciones y Mejoras ✅ COMPLETADO

- ✅ Templates de email para SaaS Support creados (`src/lib/email/templates/saas-support.ts`)
- ✅ Notificaciones por email implementadas:
  - Email de confirmación al crear ticket
  - Email cuando hay nueva respuesta del equipo
  - Email cuando se asigna ticket a root/dev
  - Email cuando se resuelve ticket
- ✅ Integración con Resend (mismo sistema que soporte de ópticas)
- ✅ API de métricas `/api/admin/saas-management/support/metrics` creada
- ✅ Componente `SupportMetrics` creado
- ✅ Tab de métricas agregado al panel de soporte

### Tests ✅ COMPLETADO

- ✅ Tests unitarios para `requireRoot()` middleware
- ✅ Tests unitarios para `isRootUser()` helper
- ✅ Tests de integración para APIs de soporte SaaS
- ✅ Helper `createTestRootUser()` agregado a test-setup

---

## 📧 Notificaciones por Email

### Templates Implementados

1. **sendSaasTicketCreatedEmail**: Enviado cuando se crea un ticket
2. **sendSaasNewResponseEmail**: Enviado cuando el equipo responde
3. **sendSaasTicketAssignedEmail**: Enviado cuando se asigna un ticket a root/dev
4. **sendSaasTicketResolvedEmail**: Enviado cuando se resuelve un ticket

### Configuración

- **Proveedor**: Resend (mismo que soporte de ópticas)
- **From Email**: Configurado en `RESEND_FROM_EMAIL`
- **Reply To**: `soporte@opttius.com`
- **Branding**: OPTTIUS (diferente al de ópticas)

### Integración

Las notificaciones se envían de forma no bloqueante (non-blocking) en:

- Creación de tickets (públicos y desde organizaciones)
- Creación de mensajes del equipo de soporte
- Asignación de tickets
- Resolución de tickets

---

## 📊 Métricas y Dashboard

### API de Métricas

**Endpoint**: `GET /api/admin/saas-management/support/metrics`

**Métricas Disponibles**:

- Total de tickets
- Distribución por estado
- Distribución por prioridad
- Distribución por categoría
- Tiempo promedio de respuesta
- Tiempo promedio de resolución
- Satisfacción promedio del cliente
- Tickets creados por día (últimos 30 días)
- Top organizaciones por número de tickets

**Filtros Opcionales**:

- `start_date`: Filtrar desde fecha
- `end_date`: Filtrar hasta fecha

### Componente de Métricas

**Ubicación**: `src/components/admin/saas-support/SupportMetrics.tsx`

**Características**:

- Métricas clave en cards
- Gráficos de distribución
- Top organizaciones
- Métricas de performance

---

## 🧪 Tests Implementados

### Tests Unitarios

**Archivo**: `src/__tests__/unit/lib/api/root-middleware.test.ts`

**Cobertura**:

- ✅ `requireRoot()` permite root user
- ✅ `requireRoot()` permite dev user
- ✅ `requireRoot()` rechaza non-root users
- ✅ `requireRoot()` rechaza usuarios no autenticados
- ✅ `isRootUser()` retorna true para root/dev
- ✅ `isRootUser()` retorna false para admin
- ✅ Manejo de errores

### Tests de Integración

**Archivo**: `src/__tests__/integration/api/saas-management/support-tickets.test.ts`

**Cobertura**:

- ✅ Creación de tickets desde organizaciones
- ✅ Listado de tickets (multi-tenancy)
- ✅ Root puede ver todos los tickets
- ✅ Organizaciones solo ven sus tickets
- ✅ Filtros por estado, prioridad, categoría
- ✅ Paginación
- ✅ Actualización de tickets (solo root)
- ✅ Creación de mensajes
- ✅ Mensajes internos solo visibles para root
- ✅ Validación de permisos

### Helpers de Test

**Archivo**: `src/__tests__/integration/helpers/test-setup.ts`

**Nuevas Funciones**:

- ✅ `createTestRootUser()`: Crea usuario root/dev para tests
- ✅ `cleanupRootUser()`: Limpia usuario root después de tests

---

## 📝 Archivos Creados/Modificados

### Migraciones

- ✅ `supabase/migrations/20260131000011_create_saas_support_system.sql`

### APIs Backend

- ✅ `src/app/api/admin/saas-management/support/tickets/route.ts`
- ✅ `src/app/api/admin/saas-management/support/tickets/[id]/route.ts`
- ✅ `src/app/api/admin/saas-management/support/tickets/[id]/messages/route.ts`
- ✅ `src/app/api/admin/saas-management/support/templates/route.ts`
- ✅ `src/app/api/admin/saas-management/support/templates/[id]/route.ts`
- ✅ `src/app/api/admin/saas-management/support/metrics/route.ts`
- ✅ `src/app/api/support/create-ticket/route.ts`
- ✅ `src/app/api/support/ticket/[ticketNumber]/route.ts`

### Páginas Frontend

- ✅ `src/app/support/page.tsx`
- ✅ `src/app/support/ticket/[ticketNumber]/page.tsx`
- ✅ `src/app/admin/support/page.tsx`
- ✅ `src/app/admin/support/tickets/[id]/page.tsx`
- ✅ `src/app/admin/saas-management/support/page.tsx` (mejorada)
- ✅ `src/app/admin/saas-management/support/tickets/[id]/page.tsx`

### Componentes

- ✅ `src/components/admin/saas-support/SupportMetrics.tsx`

### Templates de Email

- ✅ `src/lib/email/templates/saas-support.ts`

### Validación

- ✅ `src/lib/api/validation/zod-schemas.ts` (schemas agregados)

### Tests

- ✅ `src/__tests__/unit/lib/api/root-middleware.test.ts`
- ✅ `src/__tests__/integration/api/saas-management/support-tickets.test.ts`
- ✅ `src/__tests__/integration/helpers/test-setup.ts` (funciones agregadas)

### Configuración

- ✅ `src/middleware.ts` (ruta `/support` agregada)
- ✅ `src/app/admin/layout.tsx` (badge de tickets abiertos agregado)

---

## 🔄 Diferencias con Sistema de Soporte de Ópticas

| Característica     | Soporte Ópticas     | Soporte SaaS             |
| ------------------ | ------------------- | ------------------------ |
| **Flujo**          | Cliente → Óptica    | Organización → Opttius   |
| **Tablas**         | `support_tickets`   | `saas_support_tickets`   |
| **Branding Email** | DA LUZ CONSCIENTE   | OPTTIUS                  |
| **Acceso Root**    | No                  | Sí (gestión completa)    |
| **Portal Público** | No                  | Sí (`/support`)          |
| **Templates**      | `support_templates` | `saas_support_templates` |

---

## 🚀 Próximos Pasos (Futuro)

### Opcional - WhatsApp Integration

- Investigar integración con WhatsApp Business API o Twilio
- Crear servicio de mensajería WhatsApp
- Integrar con sistema de tickets

### Mejoras Futuras

- Dashboard avanzado con gráficos interactivos
- Exportación de reportes
- Integración con sistema de chat en vivo
- Notificaciones push
- SLA tracking automático

---

**Última Actualización:** 2026-01-30  
**Versión:** 2.0.0 - Implementación Completa
