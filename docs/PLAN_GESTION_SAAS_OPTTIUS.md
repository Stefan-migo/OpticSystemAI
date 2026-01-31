# Plan de Implementación: Gestión SaaS Opttius y Correcciones

## Resumen Ejecutivo

Este documento detalla el plan completo para:

1. Crear un nuevo tipo de usuario "root/dev" con acceso a la sección "Gestión SaaS Opttius"
2. Implementar la nueva sección de gestión completa del SaaS
3. Corregir el filtrado de usuarios por organización en Administradores
4. Agregar funcionalidad para registrar nuevos usuarios con organización heredada
5. Corregir los gráficos por defecto en Analíticas
6. Corregir el mensaje de "iniciar sesión" en Onboarding
7. Implementar estructura completa de roles: root/dev, super_admin, admin, employee

**Estado**: ✅ **APROBADO PARA IMPLEMENTACIÓN** (con mejoras recomendadas integradas)

---

## 1. Análisis del Sistema Actual

### 1.1 Arquitectura Multi-Tenant

El sistema utiliza un modelo multi-tenant con las siguientes características:

- **Tabla `organizations`**: Almacena las organizaciones (ópticas)
- **Tabla `admin_users`**: Usuarios administrativos con campo `organization_id`
- **Tabla `subscriptions`**: Suscripciones asociadas a organizaciones
- **Tabla `subscription_tiers`**: Tiers de suscripción (basic, pro, premium)
- **RLS (Row Level Security)**: Filtra datos por `organization_id` usando la función `get_user_organization_id()`

### 1.2 Estructura de Roles del Sistema

El sistema implementará la siguiente jerarquía de roles:

```
┌─────────────────────────────────────────────────────────────┐
│ ROOT/DEV                                                    │
│ - Acceso: Gestión completa del SaaS (multi-tenant)         │
│ - Scope: Todas las organizaciones                          │
│ - Uso: Administración de la plataforma                     │
│ - organization_id: NULL (no pertenece a ninguna org)       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ SUPER ADMIN                                                 │
│ - Acceso: Una organización, todas las sucursales           │
│ - Scope: Vista global y vista por sucursal                 │
│ - Uso: Gerente general / Dueño de óptica                   │
│ - Determinado por: admin_branch_access con branch_id=NULL  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ ADMIN                                                       │
│ - Acceso: Una sola sucursal                                │
│ - Scope: Solo su sucursal asignada                         │
│ - Uso: Gerente de sucursal / Administrador local           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ EMPLOYEE (Vendedor/Empleado)                               │
│ - Acceso: Una sola sucursal, sin permisos de administración│
│ - Scope: Solo operaciones diarias                          │
│ - Uso: Vendedor, recepcionista, técnico óptico            │
└─────────────────────────────────────────────────────────────┘
```

**Nota Importante**:

- **Super Admin** se determina por `admin_branch_access` con `branch_id = null`, NO por el campo `role` en `admin_users`
- **Root/Dev** se determina por el campo `role` en `admin_users` y tiene acceso global al SaaS
- Esta separación permite que super_admin gestione multi-sucursal dentro de su organización, mientras root/dev gestiona el SaaS completo

### 1.3 Problemas Identificados

#### Problema 1: Usuarios mezclados entre organizaciones

- **Ubicación**: `/api/admin/admin-users/route.ts` (GET)
- **Causa**: El query no filtra por `organization_id`, mostrando todos los usuarios de todas las organizaciones
- **Impacto**: Los usuarios ven administradores de otras organizaciones

#### Problema 2: Falta de tipo de usuario "root/dev"

- **Causa**: Solo existe el rol "admin" simplificado
- **Necesidad**: Crear un nuevo rol "root" o "dev" que tenga acceso a gestión del SaaS completo

#### Problema 3: Gráficos por defecto incorrectos

- **Ubicación**: `src/app/admin/analytics/page.tsx`
- **Causa**: Los gráficos por defecto están en "area" cuando deberían ser "column" (barras)
- **Alternativa**: Debe ser "line" (puntos y líneas), no "area"
- **Nota**: Verificar tipos TypeScript para incluir "line" si es necesario

#### Problema 4: Mensaje incorrecto en Onboarding

- **Ubicación**: `src/app/onboarding/choice/page.tsx`
- **Causa**: Muestra "¿Ya tienes una cuenta? Inicia sesión" cuando el usuario ya está autenticado
- **Impacto**: Confusión del usuario

---

## 2. Plan de Implementación

### Fase 1: Correcciones Críticas (Prioridad Alta)

#### 2.1 Filtrar Usuarios por Organización en Administradores

**Archivo**: `src/app/api/admin/admin-users/route.ts`

**Cambios necesarios**:

1. Obtener `organization_id` del usuario actual usando `get_user_organization_id()`
2. Filtrar la query de `admin_users` por `organization_id`
3. Excepciones:
   - Super admins pueden ver todos los usuarios (determinados por `is_super_admin()`)
   - Root/dev users pueden ver todos los usuarios (independiente de `organization_id`)

**Lógica de Prioridad**:

```typescript
// Orden de verificación recomendado:
// 1. Root/dev tiene máxima prioridad (gestión SaaS)
// 2. Super admin (gestión multi-sucursal dentro de su organización)
// 3. Admin regular (solo su organización)
// 4. Employee (solo su sucursal)
```

**Implementación**:

```typescript
// Obtener información del usuario actual
const { data: currentAdminUser, error: currentAdminError } = await supabase
  .from("admin_users")
  .select("role, organization_id")
  .eq("id", user.id)
  .single();

if (currentAdminError) {
  logger.error("Error fetching current admin user", currentAdminError);
  return NextResponse.json(
    { error: "Failed to verify user permissions" },
    { status: 500 },
  );
}

// Verificar si es root/dev (tiene acceso a todas las organizaciones)
const isRoot =
  currentAdminUser?.role === "root" || currentAdminUser?.role === "dev";

// Verificar si es super admin (basado en admin_branch_access)
const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", {
  user_id: user.id,
});

// Obtener organization_id del usuario actual
const { data: userOrgId } = await supabase.rpc("get_user_organization_id", {
  user_id: user.id,
});

// Aplicar filtro por organización SOLO si no es root/dev ni super admin
if (!isRoot && !isSuperAdmin && userOrgId) {
  query = query.eq("organization_id", userOrgId);
}
// Si es root/dev o super admin, no aplicar filtro (ver todos los usuarios)
```

#### 2.2 Crear Registro de Usuarios con Organización Heredada

**Nueva subsección**: Dentro de `/admin/admin-users` agregar botón "Registrar Nuevo Usuario"

**Funcionalidad**:

1. Formulario para crear nuevo usuario (email, password, nombre, rol)
2. El usuario se registra automáticamente con la organización del usuario que lo crea
3. Se crea el registro en `auth.users` y `admin_users` con `organization_id` heredado
4. Asignación de sucursal: Opcional (permitir selección de sucursales en el formulario)
5. Manejar caso donde no hay sucursales aún
6. Opcional: Enviar email de bienvenida con credenciales

**Roles permitidos al crear**:

- Admin puede crear: `admin`, `employee`
- Super admin puede crear: `admin`, `employee`, `super_admin` (de su organización)
- Root/dev puede crear: cualquier rol

**Archivo nuevo**: `src/app/admin/admin-users/register/page.tsx`
**API nuevo**: `src/app/api/admin/admin-users/register/route.ts`

#### 2.3 Corregir Gráficos en Analíticas

**Archivo**: `src/app/admin/analytics/page.tsx`

**Cambios**:

- Cambiar `salesChartType` default de `"area"` a `"column"`
- Cambiar `workOrdersChartType` default de `"area"` a `"column"`
- Cambiar `quotesChartType` default de `"area"` a `"column"`
- Cambiar la alternativa de `"area"` a `"line"` (puntos y líneas)

#### 2.4 Corregir Mensaje en Onboarding

**Archivo**: `src/app/onboarding/choice/page.tsx`

**Cambio**: Eliminar o modificar el footer que dice "¿Ya tienes una cuenta? Inicia sesión" ya que el usuario ya está autenticado.

---

### Fase 2: Nuevo Sistema Root/Dev y Gestión SaaS (Prioridad Media-Alta)

#### 2.5 Crear Rol Root/Dev en Base de Datos

**Migración nueva**: `supabase/migrations/YYYYMMDDHHMMSS_create_root_role.sql`

**Cambios**:

1. Validar que no hay roles inválidos antes de cambiar constraint
2. Actualizar constraint de `admin_users.role` para incluir todos los roles: 'root', 'dev', 'super_admin', 'admin', 'employee'
3. Crear función `is_root_user(user_id)` similar a `is_super_admin`
4. Crear función `is_employee(user_id)` para verificar rol employee
5. Actualizar TODAS las políticas RLS para incluir root/dev y employee
6. Crear usuario root inicial (script separado)

**Estructura de Migración**:

```sql
-- ===== VALIDACIÓN PREVIA =====
-- Validar que no hay roles inválidos antes de cambiar constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE role NOT IN ('admin', 'super_admin', 'root', 'dev', 'employee')
  ) THEN
    RAISE EXCEPTION 'Found invalid roles. Please migrate data first.';
  END IF;
END $$;

-- ===== ACTUALIZAR CONSTRAINT =====
ALTER TABLE public.admin_users
DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE public.admin_users
ADD CONSTRAINT admin_users_role_check
CHECK (role IN ('root', 'dev', 'super_admin', 'admin', 'employee'));

-- ===== FUNCIÓN PARA VERIFICAR ROOT/DEV =====
CREATE OR REPLACE FUNCTION public.is_root_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = user_id
    AND role IN ('root', 'dev')
    AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION public.is_root_user IS 'Check if user has root or dev role for SaaS management access';

-- ===== FUNCIÓN PARA VERIFICAR EMPLOYEE =====
CREATE OR REPLACE FUNCTION public.is_employee(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = user_id
    AND role = 'employee'
    AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION public.is_employee IS 'Check if user has employee role (operational access only)';

-- ===== OPCIONAL: MIGRAR SUPER_ADMINS EXISTENTES =====
-- (Comentado por defecto, descomentar si se requiere)
/*
UPDATE public.admin_users
SET role = 'root'
WHERE id IN (
  SELECT admin_user_id FROM public.admin_branch_access
  WHERE branch_id IS NULL
)
AND role = 'admin';
*/
```

**⚠️ IMPORTANTE**: Esta migración debe actualizar TODAS las políticas RLS existentes, no solo las de `admin_users` y `organizations`. Ver sección 2.5.1 para detalles.

#### 2.6 Crear Sección "Gestión SaaS Opttius"

**Ruta nueva**: `/admin/saas-management`

**Estructura de la sección**:

```
/admin/saas-management
├── /dashboard          # Dashboard principal con métricas
├── /organizations      # Gestión de organizaciones
├── /users              # Gestión global de usuarios
├── /subscriptions      # Gestión de suscripciones
├── /tiers              # Gestión de tiers de suscripción
├── /support            # Soporte y resolución de problemas
└── /analytics          # Analíticas del sistema completo
```

**Funcionalidades por subsección**:

##### 2.6.1 Dashboard (`/admin/saas-management/dashboard`)

- Métricas generales:
  - Total de organizaciones activas
  - Total de usuarios activos
  - Total de suscripciones activas
  - Ingresos mensuales/anuales
  - Crecimiento de organizaciones
  - Tasa de conversión de trials
- Gráficos:
  - Organizaciones por tier
  - Crecimiento temporal de organizaciones
  - Distribución geográfica (si hay datos)
  - Churn rate

##### 2.6.2 Organizaciones (`/admin/saas-management/organizations`)

- Listar todas las organizaciones con filtros:
  - Por tier
  - Por estado (active, suspended, cancelled)
  - Por fecha de creación
  - Por nombre/slug
- Acciones por organización:
  - Ver detalles completos
  - Editar información
  - Cambiar tier
  - Suspender/Activar
  - Ver usuarios asociados
  - Ver sucursales
  - Ver suscripción
  - Ver actividad reciente
  - Exportar datos
- Crear nueva organización manualmente
- Bulk actions:
  - Cambiar tier masivo
  - Suspender masivo
  - Enviar notificaciones masivas

##### 2.6.3 Usuarios (`/admin/saas-management/users`)

- Listar todos los usuarios del sistema
- Filtros:
  - Por organización
  - Por rol
  - Por estado (activo/inactivo)
  - Por última actividad
- Acciones:
  - Ver perfil completo
  - Editar permisos
  - Cambiar organización
  - Activar/Desactivar
  - Resetear contraseña
  - Ver actividad
  - Ver logs de acceso

##### 2.6.4 Suscripciones (`/admin/saas-management/subscriptions`)

- Listar todas las suscripciones
- Filtros:
  - Por estado (active, past_due, cancelled, trialing)
  - Por tier
  - Por organización
- Acciones:
  - Ver detalles de suscripción
  - Modificar suscripción
  - Cancelar suscripción
  - Reactivar suscripción
  - Ver historial de pagos
  - Sincronizar con Stripe
- Alertas:
  - Suscripciones próximas a vencer
  - Pagos fallidos
  - Trials próximos a expirar

##### 2.6.5 Tiers (`/admin/saas-management/tiers`)

- Listar tiers existentes
- Editar tiers:
  - Precios
  - Límites (branches, users, customers, products)
  - Features habilitadas
- Crear nuevo tier
- Ver estadísticas por tier:
  - Organizaciones por tier
  - Ingresos por tier
  - Conversiones entre tiers

##### 2.6.6 Soporte (`/admin/saas-management/support`)

- Panel de resolución de problemas:
  - Buscar organización/usuario por email, nombre, slug
  - Ver estado completo de una organización
  - Acciones rápidas:
    - Resetear contraseña de usuario
    - Asignar organización a usuario
    - Cambiar tier manualmente
    - Suspender/Activar organización
    - Ver logs de errores
  - Historial de acciones de soporte
  - Tickets de soporte (si se implementa)

##### 2.6.7 Analíticas (`/admin/saas-management/analytics`)

- Métricas agregadas del sistema:
  - Crecimiento de organizaciones
  - Retención de usuarios
  - Ingresos por período
  - Distribución de tiers
  - Actividad por organización
  - Uso de features por tier
- Exportación de reportes

#### 2.7 Middleware de Protección Root/Dev

**Archivo nuevo**: `src/lib/api/root-middleware.ts`

**Funcionalidad**:

- Verificar si el usuario tiene rol root/dev
- Redirigir si no tiene acceso
- Usar en todas las rutas de `/admin/saas-management`
- Considerar caching para performance (TTL corto)

**Implementación**:

```typescript
import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { AuthorizationError } from "@/lib/api/errors";
import { appLogger as logger } from "@/lib/logger";

/**
 * Require root or dev role for access
 * Throws AuthorizationError if user is not root/dev
 *
 * Performance: Uses service role client to bypass RLS for verification
 * Consider caching result with short TTL if called frequently
 */
export async function requireRoot(request: NextRequest): Promise<{
  userId: string;
  user: { id: string; email?: string };
}> {
  const supabase = await createClient();
  const supabaseServiceRole = createServiceRoleClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthorizationError("Unauthorized");
  }

  // Check if user is root/dev using service role to bypass RLS
  const { data: adminUser, error: adminError } = await supabaseServiceRole
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminError) {
    logger.error("Error checking root status", adminError);
    throw new AuthorizationError("Unable to verify root status");
  }

  const isRoot = adminUser?.role === "root" || adminUser?.role === "dev";

  if (!isRoot) {
    throw new AuthorizationError("Root access required");
  }

  logger.debug(`Root access verified for user ${user.id}`);

  return {
    userId: user.id,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}
```

**Nota sobre Performance**:

- El middleware usa `createServiceRoleClient()` para verificar root, lo cual es correcto pero puede ser costoso si se llama frecuentemente
- Considerar caching del resultado con TTL corto (ej: 30 segundos) si es necesario
- O usar el cliente regular si las políticas RLS ya están configuradas correctamente

#### 2.8 Actualizar Layout de Admin

**Archivo**: `src/app/admin/layout.tsx`

**Cambios**:

- Agregar item de menú "Gestión SaaS Opttius" solo visible para root/dev
- Icono distintivo (ej: Settings, Shield, Database)
- Submenú con todas las subsecciones

---

### Fase 3: Mejoras y Optimizaciones (Prioridad Media)

#### 2.9 Scripts de Utilidad

1. **Crear usuario root inicial**:
   - `scripts/create-root-user.js`
   - Permite crear el primer usuario root

2. **Migrar usuarios existentes**:
   - Script para asignar `organization_id` a usuarios que no lo tienen
   - Script para limpiar usuarios huérfanos

3. **Backup y exportación**:
   - Script para exportar datos de una organización
   - Script para hacer backup completo del sistema

#### 2.10 Documentación

1. **Guía de uso de Gestión SaaS**:
   - `docs/SAAS_MANAGEMENT_GUIDE.md`
   - Documentar todas las funcionalidades

2. **Guía de roles y permisos**:
   - `docs/ROLES_AND_PERMISSIONS.md`
   - Explicar diferencias entre admin, super_admin, root, dev

3. **Guía de troubleshooting**:
   - `docs/TROUBLESHOOTING_GUIDE.md`
   - Problemas comunes y soluciones

---

## 3. Estructura de Archivos a Crear/Modificar

### Archivos Nuevos

```
src/
├── app/
│   ├── admin/
│   │   ├── saas-management/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (dashboard)
│   │   │   ├── organizations/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── subscriptions/
│   │   │   │   └── page.tsx
│   │   │   ├── tiers/
│   │   │   │   └── page.tsx
│   │   │   ├── support/
│   │   │   │   └── page.tsx
│   │   │   └── analytics/
│   │   │       └── page.tsx
│   │   └── admin-users/
│   │       └── register/
│   │           └── page.tsx
│   └── api/
│       ├── admin/
│       │   ├── admin-users/
│       │   │   └── register/
│       │   │       └── route.ts
│       │   └── saas-management/
│       │       ├── organizations/
│       │       │   └── route.ts
│       │       ├── users/
│       │       │   └── route.ts
│       │       ├── subscriptions/
│       │       │   └── route.ts
│       │       ├── tiers/
│       │       │   └── route.ts
│       │       ├── support/
│       │       │   └── route.ts
│       │       └── analytics/
│       │           └── route.ts
├── lib/
│   └── api/
│       └── root-middleware.ts
└── components/
    └── admin/
        └── saas-management/
            ├── OrganizationCard.tsx
            ├── UserCard.tsx
            ├── SubscriptionCard.tsx
            ├── SupportSearch.tsx
            └── MetricsCard.tsx

supabase/
└── migrations/
    └── YYYYMMDDHHMMSS_create_root_role.sql

scripts/
├── create-root-user.js
├── migrate-users-organization.js
└── export-organization-data.js

docs/
├── SAAS_MANAGEMENT_GUIDE.md
├── ROLES_AND_PERMISSIONS.md
└── TROUBLESHOOTING_GUIDE.md
```

### Archivos a Modificar

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx (agregar menú Gestión SaaS)
│   │   ├── admin-users/
│   │   │   └── page.tsx (agregar botón registrar usuario)
│   │   └── analytics/
│   │       └── page.tsx (cambiar defaults de gráficos)
│   └── onboarding/
│       └── choice/
│           └── page.tsx (eliminar mensaje iniciar sesión)
└── app/
    └── api/
        └── admin/
            └── admin-users/
                └── route.ts (filtrar por organization_id)
```

---

## 4. Orden de Implementación Recomendado

### Sprint 1: Correcciones Críticas (1-2 días)

1. ✅ Filtrar usuarios por organización en GET `/api/admin/admin-users`
2. ✅ Corregir gráficos por defecto en analíticas
3. ✅ Corregir mensaje en onboarding
4. ✅ Crear migración para rol root/dev
5. ✅ Crear middleware de protección root

### Sprint 2: Registro de Usuarios y Base de Gestión SaaS (2-3 días)

1. ✅ Crear subsección de registro de usuarios
2. ✅ API para registrar usuarios con organización heredada
3. ✅ Crear estructura base de `/admin/saas-management`
4. ✅ Dashboard básico con métricas principales
5. ✅ Actualizar layout con menú Gestión SaaS

### Sprint 3: Gestión de Organizaciones (2-3 días)

1. ✅ Listar organizaciones con filtros
2. ✅ Ver detalles de organización
3. ✅ Editar organización
4. ✅ Cambiar tier de organización
5. ✅ Suspender/Activar organización

### Sprint 4: Gestión de Usuarios y Suscripciones (2-3 días)

1. ✅ Listar usuarios globales con filtros
2. ✅ Ver detalles de usuario
3. ✅ Cambiar organización de usuario
4. ✅ Gestión de suscripciones
5. ✅ Sincronización con Stripe

### Sprint 5: Tiers, Soporte y Analíticas (2-3 días)

1. ✅ Gestión de tiers
2. ✅ Panel de soporte
3. ✅ Analíticas del sistema
4. ✅ Exportación de reportes

### Sprint 6: Testing y Documentación (1-2 días)

1. ✅ Testing completo
2. ✅ Documentación
3. ✅ Scripts de utilidad
4. ✅ Crear usuario root inicial

---

## 5. Consideraciones de Seguridad y Mejoras Recomendadas

### 5.1 Seguridad Básica

1. **Autenticación**: Todas las rutas de Gestión SaaS deben verificar rol root/dev
2. **Auditoría**: Registrar todas las acciones críticas en `admin_activity_log`
3. **Validación**: Validar todos los inputs en APIs
4. **Rate Limiting**: Implementar rate limiting en endpoints críticos
5. **Permisos**: Solo root puede modificar roles de otros usuarios
6. **Backup**: Antes de acciones destructivas, hacer backup automático

### 5.2 Políticas RLS Críticas

**⚠️ IMPORTANTE**: La migración debe actualizar TODAS las políticas RLS existentes, no solo las de `admin_users` y `organizations`.

**Tablas que requieren actualización de RLS**:

- `orders`
- `quotes`
- `lab_work_orders`
- `appointments`
- `products`
- `customers`
- `branches`
- `subscriptions`
- `payments`
- Y todas las demás tablas con RLS

**Patrón recomendado para políticas RLS**:

```sql
-- Ejemplo para tabla orders
CREATE POLICY "Root users can view all orders"
ON public.orders
FOR SELECT
USING (
  public.is_root_user(auth.uid())
  OR
  -- Super admin ve su organización
  (public.is_super_admin(auth.uid()) AND organization_id = public.get_user_organization_id())
  OR
  -- Admin/Employee ve su organización/sucursal
  organization_id = public.get_user_organization_id()
);
```

### 5.3 Validaciones y Casos Edge

**Casos de prueba requeridos para filtrado**:

1. Admin regular con `organization_id` → solo ve su org
2. Admin sin `organization_id` → no ve usuarios (o error claro)
3. Super admin → ve todos los usuarios de su organización
4. Root/dev → ve todos los usuarios (independiente de `organization_id`)
5. Root/dev con `organization_id` asignado → ve todos (`organization_id` ignorado)
6. Employee → solo ve usuarios de su sucursal

**Validaciones adicionales**:

- Root users NO deben tener `organization_id` asignado (o debe ser ignorado)
- Verificar que las políticas RLS permitan `organization_id = NULL` para root
- Validar que employee no puede realizar acciones destructivas (delete)

### 5.4 Registro de Usuarios con Organización

**Mejoras recomendadas**:

1. Hacer la asignación de sucursal opcional (no automática)
2. Permitir selección de sucursales en el formulario
3. Manejar el caso donde no hay sucursales aún
4. Validar permisos del usuario que crea (solo puede crear roles inferiores)

---

## 6. Métricas de Éxito

- ✅ Usuarios solo ven administradores de su organización
- ✅ Root/dev puede acceder a Gestión SaaS
- ✅ Gráficos muestran barras por defecto
- ✅ Onboarding no muestra mensaje de iniciar sesión
- ✅ Se puede registrar usuarios con organización heredada
- ✅ Gestión SaaS permite administrar todo el sistema

---

## 7. Próximos Pasos

1. Revisar y aprobar este plan
2. Crear issues/tickets para cada sprint
3. Comenzar con Sprint 1 (correcciones críticas)
4. Testing continuo durante desarrollo
5. Documentar mientras se implementa

---

## 8. Estructura Completa de Roles y Permisos

### 8.1 Jerarquía de Roles

| Rol             | Scope                                   | Acceso                           | Uso                              |
| --------------- | --------------------------------------- | -------------------------------- | -------------------------------- |
| **root/dev**    | Multi-tenant (todas las orgs)           | Gestión completa del SaaS        | Administración de plataforma     |
| **super_admin** | Una organización (todas las sucursales) | Gestión completa de organización | Gerente general / Dueño          |
| **admin**       | Una sucursal                            | Gestión completa de sucursal     | Gerente de sucursal              |
| **employee**    | Una sucursal                            | Solo operaciones (sin admin)     | Vendedor, recepcionista, técnico |

### 8.2 Permisos por Defecto por Rol

**Root/Dev**: Acceso completo a todo, incluyendo gestión SaaS
**Super Admin**: Acceso completo dentro de su organización
**Admin**: Acceso completo a su sucursal
**Employee**:

- ✅ POS (crear ventas)
- ✅ Clientes (read, create, update)
- ✅ Productos (read)
- ✅ Presupuestos (read, create, update)
- ✅ Citas (read, create, update)
- ✅ Trabajos (read, update estado)
- ❌ Analytics avanzados
- ❌ Configuración del sistema
- ❌ Gestión de usuarios
- ❌ Acciones destructivas (delete)

### 8.3 Determinación de Roles

- **Root/Dev**: Determinado por campo `role` en `admin_users`
- **Super Admin**: Determinado por `admin_branch_access` con `branch_id = null`
- **Admin/Employee**: Determinado por campo `role` en `admin_users` + acceso a sucursal específica

**Nota**: Un usuario puede ser super_admin (por `admin_branch_access`) Y tener un rol diferente en `admin_users`. La lógica de verificación debe considerar ambos.

## 9. Notas Adicionales

- El sistema actual usa `is_super_admin` basado en `admin_branch_access` con `branch_id = null`
- El nuevo rol root/dev será independiente y más poderoso que super_admin
- Super admin gestiona multi-sucursal dentro de su organización
- Root/dev gestiona el SaaS completo (multi-tenant)
- Considerar migrar super_admins existentes a root si es necesario (opcional, comentado en migración)
- La sección Gestión SaaS debe ser intuitiva y fácil de usar
- Considerar agregar búsqueda global en el futuro
- Implementar notificaciones para acciones críticas
- Employee role agregará valor significativo al producto (separación de responsabilidades, escalabilidad)

---

## 10. Implementación Completada y Correcciones Post-Implementación

**Fecha**: 30 de Enero, 2026

### 10.1 Estado de la Implementación

La Gestión SaaS Opttius está **implementada y operativa** con las siguientes secciones:

| Sección              | Ruta                                        | Estado | Notas                             |
| -------------------- | ------------------------------------------- | ------ | --------------------------------- |
| Dashboard            | `/admin/saas-management/dashboard`          | ✅     | Métricas y enlaces a subsecciones |
| Organizaciones       | `/admin/saas-management/organizations`      | ✅     | Listado, filtros, crear, acciones |
| Detalle Organización | `/admin/saas-management/organizations/[id]` | ✅     | Detalle, edición, stats           |
| Usuarios             | `/admin/saas-management/users`              | ✅     | Listado global, filtros, acciones |
| Detalle Usuario      | `/admin/saas-management/users/[id]`         | ✅     | Detalle completo del usuario      |
| Suscripciones        | `/admin/saas-management/subscriptions`      | ✅     | Listado, filtros, acciones        |
| Detalle Suscripción  | `/admin/saas-management/subscriptions/[id]` | ✅     | Detalle y organización            |
| Tiers                | `/admin/saas-management/tiers`              | ✅     | Edición de planes                 |
| Soporte              | `/admin/saas-management/support`            | ✅     | Búsqueda rápida + pestaña Tickets |

### 10.2 Correcciones Técnicas Aplicadas

#### APIs – Evitar relaciones complejas en Supabase

Las APIs que devolvían 500 al usar `select()` con relaciones anidadas (ej. `owner:profiles!organizations_owner_id_fkey`, `organization:organizations(...)`) se ajustaron para:

1. **Query principal**: Solo `select("*")` o campos directos de la tabla.
2. **Datos relacionados**: Obtener en consultas separadas (organización, owner, perfiles, sucursales, etc.) y enriquecer la respuesta en el handler.

**Archivos modificados**:

- `src/app/api/admin/saas-management/organizations/route.ts` – Listado sin join a `profiles`; owner y suscripción por consultas adicionales.
- `src/app/api/admin/saas-management/organizations/[id]/route.ts` – Detalle sin relaciones anidadas; organización, owner, usuarios recientes y sucursales por separado.
- `src/app/api/admin/saas-management/users/route.ts` – Listado simplificado; perfiles, organización y `admin_branch_access` enriquecidos después.
- `src/app/api/admin/saas-management/users/[id]/route.ts` – Detalle con datos relacionados obtenidos por separado.
- `src/app/api/admin/saas-management/subscriptions/route.ts` – Filtro por tier vía IDs de organizaciones; sin filtro por relación anidada.
- `src/app/api/admin/saas-management/subscriptions/[id]/route.ts` – Detalle sin join; organización en consulta aparte.
- `src/app/api/admin/saas-management/support/tickets/route.ts` – Listado de tickets sin relaciones anidadas; organización y usuarios enriquecidos después.

#### Páginas de detalle creadas

- `src/app/admin/saas-management/users/[id]/page.tsx` – Detalle de usuario (perfil, organización, sucursales, actividad).
- `src/app/admin/saas-management/subscriptions/[id]/page.tsx` – Detalle de suscripción (período, Stripe, organización).

#### UI y navegación

- **Botón "Volver"**: Añadido en organizaciones, usuarios, suscripciones, tiers y soporte (vuelta al dashboard de SaaS).
- **Import**: Corregido import de `ArrowLeft` en `src/app/admin/saas-management/organizations/page.tsx`.
- **Panel de Soporte**:
  - Filtros con valor por defecto `"all"` en lugar de `""` para cumplir con Radix Select (`SelectItem` no puede tener `value=""`).
  - Al llamar a la API de tickets no se envían los parámetros `status`, `priority` ni `category` cuando su valor es `"all"`.

### 10.3 Flujo de Usuario Root/Dev

- Login con usuario root → redirección a `/admin/saas-management/dashboard`.
- Tour de onboarding deshabilitado para usuarios root/dev.
- Root/dev no requiere organización ni onboarding; el layout de admin omite la verificación de organización para estos roles.

### 10.4 Documentación Relacionada

- **Soporte SaaS**: `docs/SAAS_SUPPORT_SYSTEM_PLAN.md` – Plan del sistema de tickets y soporte.
- **Testing SaaS**: `docs/SAAS_TESTING_PLAN.md` – Plan de pruebas para la gestión SaaS.
