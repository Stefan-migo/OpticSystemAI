# Flujo de Onboarding y Alta de Nuevos Usuarios SaaS

**Proyecto:** Opttius  
**Versión:** 1.0  
**Fecha:** 2026-01-28  
**Objetivo:** Documentar de forma explícita y detallada todo el proceso necesario para dar de alta un nuevo usuario en el sistema SaaS, incluyendo la creación/asignación de organización (óptica), UI/UX y elementos técnicos faltantes.

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Estado Actual vs. Requerido](#2-estado-actual-vs-requerido)
3. [Modelo de Datos Relevante](#3-modelo-de-datos-relevante)
4. [Flujos de Usuario](#4-flujos-de-usuario)
5. [Elementos Faltantes (Detalle)](#5-elementos-faltantes-detalle)
6. [Especificación de UI/UX](#6-especificación-de-uiux)
7. [APIs a Implementar](#7-apis-a-implementar)
8. [Secuencia de Implementación](#8-secuencia-de-implementación)
9. [Checklist de Implementación](#9-checklist-de-implementación)
10. [Referencias](#10-referencias)

---

## 1. Resumen Ejecutivo

### Problema

En la documentación actual (PAYMENT_GATEWAYS_IMPLEMENTATION_GUIDE, PLAN_MEJORAS_ESTRUCTURALES, PROGRESO_MEJORAS, SAAS_IMPLEMENTATION_PLAN) **no está explicitado**:

- Cómo se maneja un **usuario nuevo** que se suscribe al SaaS.
- Cómo se **crea** una organización (óptica) y se **asigna** a ese usuario.
- Qué **UI/UX** existe para el flujo: registro → crear óptica → configurar óptica → usar la plataforma.

El modelo de datos (organizations, admin_users.organization_id, RLS) sí está implementado, pero el **proceso** y la **interfaz** para dar de alta un nuevo tenant no están definidos.

### Objetivo de este documento

Definir de forma **exhaustiva** cada elemento necesario para lograr el alta de un nuevo usuario en el sistema SaaS, de modo que un desarrollador pueda implementar el flujo completo sin ambigüedades.

### Resultado esperado

Tras implementar lo descrito aquí:

- Un usuario nuevo puede **registrarse**, **crear o unirse a una óptica**, **configurarla** y **acceder al panel de administración** con su organización ya asignada.
- La asignación óptica ↔ usuario queda explícita en base de datos (`admin_users.organization_id`) y el RLS garantiza el aislamiento de datos.

---

## 2. Estado Actual vs. Requerido

### 2.1 Lo que ya existe

| Elemento                              | Estado    | Ubicación / Notas                                                                                             |
| ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| Tabla `organizations`                 | ✅ Existe | `supabase/migrations/20260128000000_create_organizations_and_subscriptions.sql`                               |
| Tabla `subscriptions`                 | ✅ Existe | Idem                                                                                                          |
| Tabla `subscription_tiers`            | ✅ Existe | Idem, con datos Basic/Pro/Premium                                                                             |
| Columna `admin_users.organization_id` | ✅ Existe | Añadida en misma migración, FK a organizations                                                                |
| Columna `branches.organization_id`    | ✅ Existe | Idem                                                                                                          |
| Función `get_user_organization_id()`  | ✅ Existe | Usada en RLS y APIs                                                                                           |
| RLS por organización                  | ✅ Existe | organizations, subscriptions, y tablas de datos (customers, orders, etc.)                                     |
| Página de signup                      | ✅ Existe | `src/app/signup/page.tsx` — solo crea usuario en Auth, **no** organización ni admin_users con organization_id |
| Script manual grant-admin             | ✅ Existe | `scripts/sql-utils/grant-admin-access.sql` — no establece `organization_id`                                   |
| API organization limits               | ✅ Existe | `src/app/api/admin/organization/limits/route.ts`                                                              |

### 2.2 Lo que falta (resumen)

| Elemento                               | Descripción                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Flujo de signup SaaS**               | Decisión: ¿signup crea solo Auth user y luego onboarding crea org, o signup + pago crean org en un solo flujo?                       |
| **Creación de organización**           | API y lógica para crear `organizations` (nombre, slug, tier, owner_id).                                                              |
| **Asignación usuario ↔ organización** | Lógica que, tras crear la organización, inserte/actualice `admin_users` con `organization_id` y `role` adecuado.                     |
| **Onboarding UI**                      | Pantallas y rutas para: “Crear tu óptica”, “Configurar primera sucursal”, “Resumen / Ir al panel”.                                   |
| **Guard de organización**              | Comprobar si el usuario tiene `organization_id`; si no, redirigir a onboarding en lugar de a `/admin`.                               |
| **Integración Stripe ↔ organización** | Tras pago exitoso (checkout session o subscription), crear organización y asignar usuario (si el flujo es pago primero).             |
| **Invitar usuario a óptica existente** | Flujo para que un admin invite a otro usuario: invitación por email, aceptación, inserción en admin_users con mismo organization_id. |
| **Super admin: crear organización**    | Pantalla/API para que super_admin cree una organización y asigne un owner.                                                           |

Este documento detalla cada uno de estos elementos.

---

## 3. Modelo de Datos Relevante

### 3.1 Tablas involucradas

#### `auth.users` (Supabase Auth)

- Creado por el signup (email, password).
- No tiene noción de organización; el vínculo es vía `admin_users`.

#### `public.organizations`

| Columna                | Tipo        | Descripción                                                |
| ---------------------- | ----------- | ---------------------------------------------------------- |
| id                     | UUID        | PK                                                         |
| name                   | TEXT        | Nombre de la óptica (ej. "Óptica Centro")                  |
| slug                   | TEXT        | Identificador único URL-friendly (ej. "optica-centro")     |
| owner_id               | UUID        | FK a auth.users — usuario que creó la organización (owner) |
| subscription_tier      | TEXT        | 'basic', 'pro', 'premium'                                  |
| status                 | TEXT        | 'active', 'suspended', 'cancelled'                         |
| metadata               | JSONB       | Datos adicionales                                          |
| created_at, updated_at | TIMESTAMPTZ |                                                            |

#### `public.admin_users`

| Columna         | Tipo    | Descripción                                                                                         |
| --------------- | ------- | --------------------------------------------------------------------------------------------------- |
| id              | UUID    | PK, FK a auth.users                                                                                 |
| email           | TEXT    |                                                                                                     |
| role            | TEXT    | 'super_admin', 'store_manager', 'customer_support', 'content_manager'                               |
| organization_id | UUID    | FK a organizations — **determina la óptica del usuario**; NULL en super_admin o usuario sin asignar |
| is_active       | BOOLEAN |                                                                                                     |
| ...             |         | created_at, updated_at, etc.                                                                        |

- **Regla de negocio:** Para que un usuario “vea” datos de una óptica, debe tener `organization_id` no nulo (o ser super_admin). La función `get_user_organization_id()` devuelve este valor y las políticas RLS lo usan.

#### `public.branches`

| Columna         | Tipo | Descripción                                                   |
| --------------- | ---- | ------------------------------------------------------------- |
| id              | UUID | PK                                                            |
| name            | TEXT | Nombre de la sucursal                                         |
| code            | TEXT | Código único (ej. "SUC-001")                                  |
| organization_id | UUID | FK a organizations — la sucursal pertenece a una organización |
| ...             |      | address, phone, etc.                                          |

#### `public.admin_branch_access`

- Relaciona `admin_user_id` con `branch_id` y rol (manager, staff, viewer).
- Para que un usuario trabaje en una sucursal, debe tener una fila aquí; la sucursal debe ser de su organización.

#### `public.subscriptions`

- Una fila por organización (organization_id), con stripe_subscription_id, status, current_period_start/end, etc.

### 3.2 Cadena de asignación usuario → óptica

```
auth.users (id)
    ↓
admin_users (id = auth.users.id, organization_id = organizations.id)
    ↓
organizations (id)
    ↓
branches (organization_id)
```

- **Usuario sin organization_id:** No puede acceder a datos de negocio (customers, orders, etc.) porque RLS filtra por `get_user_organization_id()`. Debe ser redirigido a onboarding o a “crear/unirse a organización”.
- **Usuario con organization_id:** Solo ve datos de su organización. Puede tener acceso a una o varias sucursales vía `admin_branch_access`.

---

## 4. Flujos de Usuario

### 4.1 Flujo A: Nuevo usuario se suscribe (self-signup) — dueño de una óptica nueva

**Actor:** Persona que quiere usar el sistema para su óptica (nueva).

**Secuencia deseada:**

1. Usuario visita la app (landing o página de precios).
2. Clic en “Registrarse” o “Comenzar” → va a **signup**.
3. **Signup:** Introduce email, contraseña, nombre; se crea cuenta en `auth.users`. Opcional: también se crea/actualiza `profiles`.
4. **Decisión de producto:**
   - **Opción A (sin pago inicial):** Tras signup, redirigir a **onboarding**: “Crear tu óptica”. Ahí se crea la organización (nombre, slug), se asigna al usuario (admin_users con organization_id) y, si se desea, se crea la primera sucursal. Luego redirigir a “Elegir plan” o directamente a `/admin` (con trial o plan free).
   - **Opción B (pago primero):** Tras signup, redirigir a “Elegir plan” → Checkout Stripe → tras pago exitoso (webhook o redirect), crear organización, asignar usuario, redirigir a onboarding “Configurar tu óptica” (nombre, slug, primera sucursal) y luego a `/admin`.
5. **Onboarding “Configurar óptica”:** Pantalla(s) para: nombre de la óptica, slug (único), opcionalmente primera sucursal (nombre, dirección). Al guardar: crear `organizations`, actualizar/insertar `admin_users` con `organization_id` y `role` (ej. store_manager), y si se definió sucursal, crear `branches` y `admin_branch_access`.
6. **Redirección final:** A `/admin` (dashboard). El usuario ya tiene `organization_id`; las APIs y RLS funcionan con su organización.

**Puntos críticos:**

- Quién crea la organización: **backend** (API llamada desde onboarding o desde webhook de Stripe).
- Cuándo se asigna `admin_users.organization_id`: **en el mismo momento** en que se crea la organización (o inmediatamente después), para el usuario que está completando el onboarding (owner).
- Primera sucursal: puede crearse en el mismo flujo de onboarding o dejarse para después; si el tier “basic” permite 1 sucursal, tiene sentido crear una en el onboarding.

### 4.2 Flujo B: Usuario invitado a una óptica existente

**Actor:** Admin/owner de una óptica que invita a otro usuario (ej. empleado).

**Secuencia deseada:**

1. Admin entra en “Usuarios” o “Equipo” en el panel.
2. Clic en “Invitar usuario”. Introduce email (y opcionalmente rol/sucursal).
3. Backend: si el email ya existe en `auth.users`, se puede crear/actualizar `admin_users` con el mismo `organization_id` y rol, y enviar email “Ya tienes acceso a [Óptica]”. Si no existe, se puede:
   - Crear “invitación pendiente” (tabla `organization_invitations`: email, organization_id, role, token, expires_at) y enviar link de invitación por email.
4. Usuario invitado recibe email con link (ej. `/invite/accept?token=...`).
5. Al abrir el link: si no tiene cuenta, redirigir a **signup** (con email prefijado); si ya tiene cuenta, pedir login. Tras autenticación, backend valida token, crea/actualiza `admin_users` con `organization_id` de la invitación y opcionalmente `admin_branch_access`, marca invitación como usada.
6. Redirigir a `/admin`. El usuario ya tiene `organization_id`; ve solo datos de esa organización.

**Puntos críticos:**

- No se crea organización nueva; se reutiliza la existente.
- La asignación es: insertar/actualizar `admin_users` con `organization_id` de la óptica que invitó.
- Tabla de invitaciones (opcional pero recomendable): `organization_invitations` para tokens y expiración.

### 4.3 Flujo C: Super admin crea organización y asigna owner

**Actor:** Super admin (soporte o instalación manual).

**Secuencia deseada:**

1. Super admin accede a una ruta restringida (ej. `/admin/system/organizations` o `/admin/super/organizations`).
2. Clic en “Crear organización”. Formulario: nombre, slug, tier, email del owner (usuario que ya debe existir en `auth.users`).
3. Backend (API con verificación `role = super_admin`): crea `organizations`, busca usuario por email, inserta/actualiza `admin_users` con ese `organization_id` y role (ej. store_manager). Opcional: crear primera sucursal y subscription (Stripe o manual).
4. Se notifica al owner (email o manualmente) que ya tiene acceso a la óptica.

**Puntos críticos:**

- Solo super_admin puede usar esta API/pantalla.
- El owner debe existir en `auth.users` (puede haberse registrado antes sin organización).

### 4.4 Flujo C (Alternativa): Guided Sandbox (Demo) ⭐ IMPLEMENTAR ESTE FLUJO

**Actor:** Nuevo usuario que quiere explorar el sistema antes de configurar su propia óptica.

**Objetivo:** Reducir el "Cold Start Problem" (tablero vacío) permitiendo que el usuario explore el sistema con datos pre-cargados antes de configurar su propia óptica.

**Arquitectura:** El "Modo Demo" se implementa como una **Organización especial (Tenant)** que ya existe y a la cual se le da acceso temporal al usuario.

**Secuencia deseada:**

1. **Registro (Auth):** El usuario crea su cuenta (`auth.users`).
2. **Pantalla de Selección (The Fork):** Se presentan dos opciones:
   - **Botón A:** "Explorar con datos demo" (Recomendado) → Asigna temporalmente el `organization_id` de la "Óptica Semilla" (Seed Org).
   - **Botón B:** "Configurar mi óptica desde cero" → Flujo normal de onboarding (Flujo A).
3. **Experiencia Demo:** Si elige A:
   - Se le asigna temporalmente el `organization_id` de la "Óptica Semilla" (Seed Org).
   - El Dashboard se llena de gráficas, citas y órdenes de ejemplo.
   - El usuario puede explorar todas las funcionalidades con datos realistas.
4. **Conversión In-App:** Un banner superior persistente dice: _"Estás en modo demo. ¿Listo para empezar con tus propios datos?"_ → Botón: **"Activar mi Óptica"**.
5. **Onboarding Real:** Al hacer clic en "Activar mi Óptica":
   - El usuario completa los pasos del onboarding (Nombre, Slug, Sucursal).
   - Se crea su nueva organización real.
6. **Switch de Contexto:** El sistema cambia su `organization_id` del ID de la Demo al ID de su nueva organización real.

**Implementación Técnica:**

#### A. La "Organización Semilla" (Seed Organization)

- Crear mediante un script de migración una organización maestra llamada **"Óptica Demo Global"**.
- **Datos requeridos:** Al menos 20 clientes, 10 recetas, 15 órdenes de laboratorio (en diferentes estados) y 5 ventas recientes.
- **Finalidad:** Proporcionar los datos para las gráficas de `analytics` y el `dashboard`.
- **Variable de entorno:** `NEXT_PUBLIC_DEMO_ORG_ID` para que el frontend sepa cuándo mostrar el banner.

#### B. Gestión de Permisos (RLS)

Para evitar que los usuarios de la demo borren datos o configuren cosas críticas:

- Si `admin_users.organization_id == DEMO_ORG_ID`:
  - `SELECT`: Permitido en todas las tablas.
  - `INSERT/UPDATE`: Permitido solo en tablas de "acción" (ej. crear un presupuesto) para que el usuario pruebe el flujo.
  - `DELETE`: Denegado globalmente.

#### C. El Endpoint de Switch

Necesitamos un endpoint: `POST /api/onboarding/activate-real-org`.

**Lógica:**

1. Crea la nueva `organization` en la tabla (con el nombre y slug provisto).
2. Crea la primera `branch` (Casa Matriz) **atómicamente** (ver punto C en sección 5).
3. Actualiza el `admin_users.organization_id` del usuario actual con el nuevo ID.
4. Asigna el rol de `store_manager`.

**Implementación Frontend:**

#### A. La Pantalla de Bienvenida (`/welcome` o `/onboarding/choice`)

Dos tarjetas visuales claras:

- **Tarjeta Izquierda (Demo):** Usa una captura de pantalla del dashboard lleno de datos.
- **Tarjeta Derecha (Real):** Usa un icono de "Nuevo documento" o "Nueva tienda".

#### B. El Banner de Modo Demo

Un componente en el `layout.tsx` que solo se renderiza si el `organization_id` coincide con el de la demo.

- **Estilo:** Fondo llamativo (ej. `bg-amber-100` con texto `text-amber-900`).
- **Acción:** Un botón de "Empezar Trial Gratis" que dispare el modal o formulario de configuración real.

#### C. Estado de Carga (Loading States)

Al pasar de "Modo Demo" a "Modo Real", el sistema debe mostrar un loader que diga _"Preparando tu entorno de trabajo..."_ mientras el backend realiza las inserciones en las tablas de `organizations` y `branches`.

**Ventajas de este enfoque:**

1. **No duplica código:** No hay que crear un "frontend de juguete". El usuario usa el panel real, solo que visualizando datos de una organización específica.
2. **Usa el RLS existente:** Aprovecha la arquitectura multitenant que ya implementaron. Solo cambia el ID al que el usuario tiene acceso.
3. **Fácil de mantener:** Si añaden una nueva funcionalidad (ej. Módulo de Inventario), solo tienen que agregar un par de items de inventario a la "Organización Semilla" y automáticamente aparecerá en la demo.

**Checklist para el Lead Developer:**

- [ ] **Script de Seeding:** Crear `seed-demo-data.sql` con datos realistas de óptica.
- [ ] **Variable de Entorno:** Definir `NEXT_PUBLIC_DEMO_ORG_ID` para que el frontend sepa cuándo mostrar el banner.
- [ ] **Middleware Guard:** Asegurar que si el usuario no tiene organización asignada, la única ruta permitida sea la de elección (`/onboarding/choice`).
- [ ] **Botón de Salida:** Implementar la lógica para que el usuario pueda "salir" de la demo y volver a la configuración real si se arrepiente.

---

## 5. Elementos Faltantes (Detalle)

### 5.1 Modificación del flujo de signup

**Objetivo:** Tras un signup exitoso, dirigir al usuario al flujo correcto según tenga o no organización.

**Comportamiento actual:**  
`src/app/signup/page.tsx` llama a `signUp()` (Auth); tras éxito suele redirigir a login o a una página genérica. No crea organización ni fila en `admin_users` con `organization_id`.

**Comportamiento requerido:**

1. Tras signup exitoso en Auth:
   - Opción recomendada: **no** crear aún fila en `admin_users` (o crearla con `organization_id = NULL`).
   - Redirigir a una ruta de **onboarding** (ej. `/onboarding` o `/welcome`).
2. En esa ruta, comprobar si el usuario ya tiene `organization_id` (por si llegó por otro flujo). Si ya tiene, redirigir a `/admin`. Si no, mostrar el flujo “Crear tu óptica” o “Elegir plan”.

**Cambios concretos:**

- En `signup/page.tsx`: tras `signUp` exitoso, redirigir a `router.push('/onboarding')` (o la ruta que se defina).
- Opcional: crear fila en `admin_users` con `organization_id = NULL` y `role = 'store_manager'` para que `is_admin()` siga siendo true y pueda acceder a `/onboarding` (que debe estar protegida por “admin o usuario recién registrado sin organización”). Alternativa: tener una ruta pública `/onboarding` que solo muestre “Crear óptica” si el usuario está autenticado y no tiene organización.

### 5.2 API: Crear organización (POST)

**Objetivo:** Endpoint que cree una organización y asigne al usuario actual como owner y primer admin.

**Ruta sugerida:** `POST /api/admin/organizations` o `POST /api/onboarding/organizations` (si se quiere separar de admin clásico).

**Autenticación:** Requerida (session o JWT). El usuario debe estar en `auth.users`. No es necesario que ya esté en `admin_users` con organización (puede ser primer uso).

**Body (ejemplo):**

```json
{
  "name": "Óptica Centro",
  "slug": "optica-centro",
  "subscription_tier": "basic"
}
```

**Validación (Zod recomendado):**

- `name`: string, min 2, max 200.
- `slug`: string, formato [a-z0-9-], único en tabla organizations, max 100.
- `subscription_tier`: enum ['basic','pro','premium'].

**Lógica del endpoint:**

1. Obtener `userId` desde la sesión (auth.uid() o equivalente).
2. Validar body.
3. Comprobar que no exista otra organización con el mismo `slug`.
4. En una transacción (o secuencia atómica):
   - `INSERT INTO organizations (name, slug, owner_id, subscription_tier, status) VALUES (..., userId, ..., 'active')` → obtener `organization_id`.
   - `INSERT INTO admin_users (id, email, role, organization_id, is_active, ...) VALUES (userId, email, 'store_manager', organization_id, true, ...) ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, updated_at = NOW()`. El email puede obtenerse del perfil o de Auth.
   - Opcional: crear primera sucursal por defecto (ej. "Casa matriz") y una fila en `admin_branch_access` para ese usuario.
   - Opcional: crear fila en `subscriptions` con status 'trialing' o 'incomplete' según producto.
5. Devolver `{ organization_id, organization: { name, slug, subscription_tier } }`.

**Errores:**

- 400: validación fallida o slug duplicado.
- 401: no autenticado.

**RLS:** La política actual de organizations permite a super_admin hacer todo; para “cualquier usuario autenticado puede crear una organización” haría falta una política de INSERT que permita crear si `auth.uid() = owner_id`. Revisar migración de organizations para añadir policy de inserción para nuevo tenant si no existe.

### 5.3 Asignación usuario ↔ organización (admin_users.organization_id)

**Dónde se hace:**

- **Flujo A (self-signup):** En el endpoint de creación de organización (apartado 5.2): al crear la organización, se hace INSERT/UPDATE de `admin_users` con `organization_id` del nuevo registro.
- **Flujo B (invitación):** En el endpoint de “aceptar invitación” o “añadir usuario a organización”: se hace UPDATE/INSERT de `admin_users` con el `organization_id` de la invitación.
- **Flujo C (super admin):** En el endpoint de “crear organización” de super admin: tras crear la organización, UPDATE/INSERT de `admin_users` para el owner con ese `organization_id`.

**No** debe quedar ningún usuario “admin” que use el panel con `organization_id` NULL salvo super_admin (y quizá usuarios en estado “pendiente de elegir organización”). Por tanto, el guard de “tiene organization_id” es esencial para redirigir a onboarding.

### 5.4 Guard: redirección si no tiene organización

**Objetivo:** Que ningún usuario entre al panel `/admin` sin tener una organización asignada (salvo super_admin).

**Dónde implementar:**

- En el **layout** de `/admin` (`src/app/admin/layout.tsx`) o en un **middleware** que proteja `/admin/*`: tras comprobar que el usuario está autenticado y es admin (`is_admin()`), comprobar si tiene `organization_id` (o si es super_admin). Si no tiene organización y no es super_admin → redirigir a `/onboarding`.

**Cómo obtener organization_id en el cliente:**

- Opción 1: Al cargar el layout, llamar a un endpoint tipo `GET /api/admin/me` o `GET /api/admin/check-status` que devuelva `{ organizationId, role }`. Si `organizationId` es null y no es super_admin, redirigir a `/onboarding`.
- Opción 2: Incluir `organization_id` en la sesión o en un token si se usa JWT.

**Rutas que no deben redirigir:**

- `/onboarding`, `/login`, `/signup`, `/invite/accept` (y assets públicos). El middleware debe excluirlas.

### 5.5 Onboarding: primera sucursal (opcional en mismo flujo)

**Objetivo:** Permitir crear la primera sucursal durante el onboarding para no dejar la organización sin ninguna sucursal (el resto del sistema espera branches).

**Opciones:**

- **A)** En la misma pantalla “Crear tu óptica”, un segundo paso o sección: “Nombre de tu primera sucursal” (y opcionalmente dirección). Al enviar, API crea organización + sucursal + admin_branch_access.
- **B)** Tras crear la organización, redirigir a “Configurar sucursal” (`/onboarding/branch`) y desde ahí llamar a `POST /api/admin/branches` (que ya debe filtrar por organization_id del usuario).

**Datos mínimos de una sucursal:** name, code (puede generarse automáticamente, ej. "SUC-001"). Opcional: address, phone.

**Límite de tier:** Basic = 1 sucursal; al crear la primera en onboarding no se supera. El tier validator debe usarse en `POST /api/admin/branches`.

### 5.6 Integración Stripe: pago → crear organización

**Objetivo:** Si el producto es “pago primero y luego configuras”, tras un pago exitoso (Stripe Checkout Session o Subscription) crear la organización y asignar al usuario.

**Flujo sugerido:**

1. Usuario ya registrado (Auth) pero sin organización. En “Elegir plan” elige Basic/Pro/Premium y va a Stripe Checkout (Session con mode: subscription o one-time).
2. En la creación del Checkout Session (API), guardar en `metadata` o en el `client_reference_id` el `user_id` (o un token temporal que lo identifique).
3. Tras pago exitoso, Stripe redirige a `success_url` (ej. `/onboarding?session_id={CHECKOUT_SESSION_ID}`) o envía webhook `checkout.session.completed`.
4. En **onboarding** (página que recibe `session_id`): llamar a una API interna que, con el session_id, verifique el pago con Stripe, extraiga el user_id de metadata, cree la organización (con el tier del plan pagado), asigne el usuario (admin_users.organization_id) y cree la fila en `subscriptions` con stripe_subscription_id u otro dato devuelto por Stripe. Luego mostrar “Configura tu óptica” (nombre, slug, primera sucursal).
5. Alternativa: hacer todo en el **webhook** `checkout.session.completed`: crear organización, asignar usuario, crear subscription. Luego en onboarding solo se pide nombre/slug/sucursal y se hace UPDATE de la organización si hace falta.

**Detalle importante:** Hasta que no exista organización y `admin_users.organization_id`, el usuario no debe poder usar el panel; por eso el guard de “tiene organization_id” sigue siendo necesario.

### 5.7 Invitación a óptica existente (resumen de elementos)

- **Tabla sugerida:** `organization_invitations` (id, organization_id, email, role, token, expires_at, created_at). Token único para el link.
- **API:** `POST /api/admin/organizations/[id]/invite` (body: email, role). Genera token, guarda fila, envía email con link `/invite/accept?token=...`.
- **Página:** `app/invite/accept/page.tsx`. Lee token, si no hay sesión redirige a login/signup; si hay sesión, API `POST /api/invite/accept` (body: token) que valida token, actualiza/inserta admin_users con organization_id, marca invitación como usada, redirige a `/admin`.
- **Email:** Usar Resend (ya en proyecto) con plantilla “Has sido invitado a [nombre óptica]. Aceptar invitación: [link]”.

### 5.8 Super admin: crear organización (resumen)

- **API:** `POST /api/admin/super/organizations` (o bajo `/api/admin/organizations` con chequeo de role). Solo si `get_admin_role() = 'super_admin'`. Body: name, slug, subscription_tier, owner_email (usuario existente en auth.users).
- **Lógica:** Crear organizations; buscar usuario por owner_email; INSERT/UPDATE admin_users con organization_id y role. Opcional: crear primera sucursal y subscription.
- **UI:** Página bajo `/admin/system/organizations` o similar, solo visible para super_admin, con formulario y lista de organizaciones.

---

## 6. Especificación de UI/UX

### 6.1 Rutas propuestas

| Ruta                          | Acceso                                                  | Descripción                                                                              |
| ----------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `/signup`                     | Público                                                 | Registro; tras éxito → redirigir a `/onboarding`.                                        |
| `/onboarding`                 | Autenticado, sin organización (o con query post-pago)   | Wizard: Crear óptica (nombre, slug) [+ primera sucursal].                                |
| `/onboarding/plan`            | Opcional                                                | Elegir plan (Basic/Pro/Premium) y redirigir a Stripe Checkout.                           |
| `/onboarding/complete`        | Tras crear organización                                 | “Todo listo” y botón “Ir al panel” → `/admin`.                                           |
| `/admin`                      | Autenticado + admin + con organization_id o super_admin | Layout con guard: si no organization_id → redirect a `/onboarding`.                      |
| `/invite/accept`              | Público (con token)                                     | Aceptar invitación; si no logueado → login/signup; luego API accept y redirect `/admin`. |
| `/admin/system/organizations` | Super admin                                             | Lista y “Crear organización” (Flujo C).                                                  |

### 6.2 Pantalla: Onboarding — “Crear tu óptica”

**Objetivo:** Recoger nombre y slug de la organización y opcionalmente primera sucursal; al enviar, llamar a API de creación de organización y redirigir.

**Elementos:**

- Título: “Crea tu óptica” o “Configura tu negocio”.
- Campo **Nombre de la óptica** (requerido): texto, placeholder “Ej. Óptica Centro”.
- Campo **Identificador (slug)** (requerido): texto, placeholder “optica-centro”. Validación: solo minúsculas, números y guiones. Mostrar debajo: “Se usará en URLs. Debe ser único.” Opcional: generar slug automático desde el nombre (sustituir espacios por guiones, quitar acentos).
- Opcional: sección “Primera sucursal”: nombre (ej. “Casa matriz”), código (opcional, autogenerable).
- Botón “Crear y continuar”. Al enviar: llamar `POST /api/admin/organizations` (o `/api/onboarding/organizations`) con name, slug; si hay sucursal, después `POST /api/admin/branches` o incluir en el mismo payload si la API lo soporta.
- Manejo de errores: slug duplicado → mensaje “Ese identificador ya está en uso. Elige otro.”.
- Tras éxito: redirigir a `/onboarding/complete` o directamente a `/admin`.

**Validación en frontend:** Misma que en backend (Zod o schema compartido).

### 6.3 Pantalla: Onboarding complete

- Mensaje: “Tu óptica está lista. Ya puedes usar el panel de administración.”
- Botón principal: “Ir al panel” → `/admin`.

### 6.4 Guard en layout admin

- En `admin/layout.tsx` (o HOC): al montar, fetch `GET /api/admin/me` o `check-status` con organization_id.
- Si usuario autenticado y admin pero `organization_id === null` y no es super_admin → `router.replace('/onboarding')`.
- Evitar flash: mostrar loader hasta tener la respuesta.

### 6.5 Mensajes y copy sugeridos

- Signup (tras éxito): “Cuenta creada. Ahora configura tu óptica.”
- Onboarding título: “Dale un nombre a tu óptica”.
- Onboarding slug: “Identificador único (solo letras minúsculas, números y guiones)”.
- Error slug duplicado: “Ese identificador ya está en uso. Prueba con otro.”
- Onboarding complete: “¡Listo! Ya puedes empezar a usar el panel.”
- Invitación email: “Te han invitado a [Nombre Óptica]. Haz clic para aceptar: [link].”

---

## 7. APIs a Implementar

Resumen de endpoints a crear o extender:

| Método | Ruta                                                             | Descripción                                                                                   | Quién                                             |
| ------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| POST   | `/api/admin/organizations` o `/api/onboarding/organizations`     | Crear organización y asignar usuario actual como owner                                        | Usuario autenticado (sin org o recién registrado) |
| GET    | `/api/admin/me` o ampliar `check-status`                         | Devolver `{ organizationId, role }` para el usuario actual                                    | Admin autenticado                                 |
| POST   | `/api/admin/organizations/[id]/invite`                           | Crear invitación y enviar email                                                               | Admin de esa organización                         |
| GET    | `/api/invite/accept?token=...` (opcional, puede ser solo página) | —                                                                                             | —                                                 |
| POST   | `/api/invite/accept`                                             | Body: `{ token }`. Validar token, asignar organization_id al usuario, marcar invitación usada | Usuario autenticado                               |
| POST   | `/api/admin/super/organizations`                                 | Crear organización y asignar owner por email                                                  | Solo super_admin                                  |
| GET    | `/api/admin/super/organizations`                                 | Listar organizaciones                                                                         | Solo super_admin                                  |

Los endpoints de branches y organization/limits ya existen; asegurar que al crear la primera sucursal se use el `organization_id` del usuario (ya asignado tras onboarding).

---

## 8. Secuencia de Implementación

Orden sugerido para implementar sin romper el flujo actual:

1. **Guard y API de contexto**
   - Implementar o ampliar `GET /api/admin/me` (o check-status) para devolver `organization_id`.
   - En layout de `/admin`, si usuario tiene role admin pero `organization_id` null (y no es super_admin), redirigir a `/onboarding`.
   - Crear ruta `/onboarding` (página básica) para no dejar al usuario en 404.

2. **API crear organización**
   - Implementar `POST /api/admin/organizations` (o `/api/onboarding/organizations`) con validación, creación de organization y asignación en admin_users.
   - Añadir política RLS de INSERT en organizations si no existe (solo para owner_id = auth.uid()).

3. **UI onboarding**
   - Página `/onboarding` con formulario “Crear tu óptica” (nombre, slug).
   - Llamar a la API de creación; en éxito redirigir a `/admin` o `/onboarding/complete`.
   - Manejo de error (slug duplicado).

4. **Signup → onboarding**
   - En signup, tras registro exitoso redirigir a `/onboarding`.
   - Opcional: crear fila en admin_users con organization_id null al registrarse (para que is_admin sea true y pueda acceder a /onboarding); o definir que /onboarding sea accesible para cualquier autenticado sin org.

5. **Primera sucursal (opcional)**
   - En el mismo formulario de onboarding o en paso siguiente, datos de primera sucursal; al crear organización, llamar también a API de branches o incluir en un solo payload.

6. **Stripe (si aplica)**
   - Checkout Session con metadata (user_id); en success_url o webhook, crear organización y asignar usuario; luego onboarding solo para nombre/slug/sucursal si hace falta.

7. **Invitaciones**
   - Tabla organization_invitations; API invite y accept; página /invite/accept; email con Resend.

8. **Super admin**
   - API y UI para crear organización y asignar owner.

---

## 9. Checklist de Implementación

Usar este checklist al implementar; marcar cada ítem cuando esté hecho.

### Backend

- [ ] API `POST /api/admin/organizations` (o `/api/onboarding/organizations`) con validación (nombre, slug, tier).
- [ ] Creación de organización y asignación `admin_users.organization_id` en la misma transacción/lógica.
- [ ] Política RLS que permita INSERT en organizations cuando owner_id = auth.uid() (si se usa ese modelo).
- [ ] API `GET /api/admin/me` (o ampliación de check-status) que devuelva `organizationId` y `role`.
- [ ] Opcional: creación de primera sucursal y admin_branch_access en el flujo de creación de organización.
- [ ] API `POST /api/admin/organizations/[id]/invite` (body: email, role).
- [ ] Tabla `organization_invitations` y API `POST /api/invite/accept` (body: token).
- [ ] API `POST /api/admin/super/organizations` (solo super_admin) y opcional `GET /api/admin/super/organizations`.

### Frontend

- [ ] Redirección desde signup a `/onboarding` tras registro exitoso.
- [ ] Página `/onboarding` con formulario (nombre óptica, slug) y validación.
- [ ] Llamada a API de creación de organización desde onboarding; manejo de éxito y error (slug duplicado).
- [ ] Página `/onboarding/complete` con botón “Ir al panel”.
- [ ] Guard en layout de `/admin`: si usuario sin organization_id (y no super_admin), redirigir a `/onboarding`.
- [ ] Página `/invite/accept` (lectura de token, login/signup si hace falta, llamada a accept, redirect a `/admin`).
- [ ] Opcional: paso “Primera sucursal” en onboarding.
- [ ] Opcional: página `/admin/system/organizations` para super admin (lista + crear organización).

### Integración y producto

- [ ] Si hay pago inicial: Checkout Stripe con metadata y flujo success/webhook que cree organización y asigne usuario.
- [ ] Emails: invitación (Resend) con link a `/invite/accept?token=...`.
- [ ] Documentar en README o SETUP_GUIDE el flujo “nuevo usuario SaaS” y las variables de entorno necesarias.

### Testing

- [ ] Test E2E: signup → onboarding → crear óptica → acceso a /admin.
- [ ] Test E2E: invitación → aceptar → acceso a /admin con organization_id correcto.
- [ ] Test integración: POST organizaciones devuelve 401 sin auth, 400 con slug duplicado, 200 con datos válidos y organization_id asignado.

---

## 10. Referencias

- **Schema organizations y subscriptions:** `supabase/migrations/20260128000000_create_organizations_and_subscriptions.sql`
- **RLS multitenancy:** `supabase/migrations/20260128000001_extend_rls_for_multitenancy.sql`
- **admin_users y branches:** `supabase/migrations/20250116000000_setup_admin_users.sql`, `supabase/migrations/20251216000000_create_branches_system.sql`
- **Plan SaaS y billing:** `docs/SAAS_IMPLEMENTATION_PLAN.md`, `docs/PAYMENT_GATEWAYS_IMPLEMENTATION_GUIDE.md`
- **Plan de mejoras:** `docs/PLAN_MEJORAS_ESTRUCTURALES.md`, `docs/PROGRESO_MEJORAS.md`
- **Índice de documentación:** `docs/DOCUMENTATION_INDEX.md`

---

## 11. Plan Paso a Paso de Implementación Completa

Este plan detalla cada paso necesario para implementar completamente el proceso de onboarding al sistema, incluyendo el flujo "Guided Sandbox" (Demo) y los puntos críticos de validación.

### Fase 1: Preparación y Configuración Base (Semana 1)

#### 1.1 Script de Seeding para Organización Demo

**Objetivo:** Crear la organización semilla con datos realistas.

**Tareas:**

- [ ] Crear migración SQL: `supabase/migrations/YYYYMMDDHHMMSS_seed_demo_organization.sql`
- [ ] Insertar organización "Óptica Demo Global" con `id` conocido (ej. UUID fijo)
- [ ] Crear al menos 20 clientes de ejemplo
- [ ] Crear 10 recetas de ejemplo
- [ ] Crear 15 órdenes de laboratorio en diferentes estados
- [ ] Crear 5 ventas recientes
- [ ] Crear productos, categorías y otros datos necesarios para que el dashboard muestre información
- [ ] Definir variable de entorno `NEXT_PUBLIC_DEMO_ORG_ID` en `.env.local` y `.env.example`

**Archivos a crear:**

- `supabase/migrations/YYYYMMDDHHMMSS_seed_demo_organization.sql`
- Actualizar `.env.example` con `NEXT_PUBLIC_DEMO_ORG_ID`

#### 1.2 Políticas RLS para Modo Demo

**Objetivo:** Permitir lectura completa pero restringir escritura/eliminación en la organización demo.

**Tareas:**

- [ ] Crear función helper: `is_demo_organization(org_id UUID) RETURNS BOOLEAN`
- [ ] Modificar políticas RLS en tablas críticas para permitir SELECT si `organization_id = DEMO_ORG_ID`
- [ ] Restringir DELETE globalmente si `organization_id = DEMO_ORG_ID`
- [ ] Permitir INSERT/UPDATE solo en tablas de "acción" (presupuestos, citas) si `organization_id = DEMO_ORG_ID`
- [ ] Probar políticas con usuario asignado a demo org

**Archivos a modificar:**

- `supabase/migrations/YYYYMMDDHHMMSS_add_demo_rls_policies.sql`

### Fase 2: Backend - APIs Core (Semana 1-2)

#### 2.1 Endpoint de Verificación de Slug

**Objetivo:** Permitir validación en vivo del slug durante el onboarding.

**Tareas:**

- [ ] Crear `src/app/api/admin/organizations/check-slug/route.ts`
- [ ] Implementar GET que reciba `?slug=optica-centro`
- [ ] Consultar tabla `organizations` para verificar si existe
- [ ] Devolver `{ available: boolean, slug: string }`
- [ ] Agregar validación de formato (solo [a-z0-9-])
- [ ] Agregar tests unitarios

**Archivos a crear:**

- `src/app/api/admin/organizations/check-slug/route.ts`
- `src/__tests__/integration/api/organizations-check-slug.test.ts`

#### 2.2 Endpoint de Creación de Organización (con Sucursal Atómica)

**Objetivo:** Crear organización y primera sucursal de forma atómica.

**Tareas:**

- [ ] Crear `src/app/api/admin/organizations/route.ts` (POST)
- [ ] Validar body con Zod: `name`, `slug`, `subscription_tier`, `branchName` (opcional)
- [ ] Verificar que slug no exista (usar endpoint de check-slug internamente)
- [ ] Implementar transacción atómica:
  - Crear `organization`
  - Crear `branch` (nombre: `branchName || 'Casa Matriz'`, código: generar automáticamente)
  - Crear `admin_branch_access` para el usuario
  - Actualizar/insertar `admin_users` con `organization_id` y `role = 'store_manager'`
- [ ] Si falla cualquier paso, hacer rollback completo
- [ ] Devolver `{ organization, branch }`
- [ ] Agregar política RLS para INSERT en organizations (si `owner_id = auth.uid()`)
- [ ] Agregar tests de integración

**Archivos a crear:**

- `src/app/api/admin/organizations/route.ts`
- `src/lib/api/validation/organization-schemas.ts` (Zod schemas)
- `src/__tests__/integration/api/organizations.test.ts`

#### 2.3 Endpoint de Activación desde Demo

**Objetivo:** Permitir que usuarios en modo demo activen su organización real.

**Tareas:**

- [ ] Crear `src/app/api/onboarding/activate-real-org/route.ts` (POST)
- [ ] Validar que el usuario actual tenga `organization_id = DEMO_ORG_ID`
- [ ] Validar body: `name`, `slug`, `branchName` (opcional)
- [ ] Implementar transacción atómica (igual que 2.2)
- [ ] Actualizar `admin_users.organization_id` del usuario actual
- [ ] Devolver `{ organization, branch }`
- [ ] Agregar tests

**Archivos a crear:**

- `src/app/api/onboarding/activate-real-org/route.ts`
- `src/__tests__/integration/api/onboarding-activate.test.ts`

#### 2.4 Extender Endpoint de Estado del Usuario

**Objetivo:** Devolver información completa sobre el estado de organización del usuario.

**Tareas:**

- [ ] Modificar `src/app/api/admin/check-status/route.ts`
- [ ] Agregar consulta a `admin_users` para obtener `organization_id`
- [ ] Verificar si `organization_id === DEMO_ORG_ID`
- [ ] Devolver:
  ```json
  {
    "authenticated": boolean,
    "hasOrganization": boolean,
    "organizationId": string | null,
    "isDemoMode": boolean,
    "isSuperAdmin": boolean,
    "onboardingRequired": boolean
  }
  ```
- [ ] Actualizar tests existentes

**Archivos a modificar:**

- `src/app/api/admin/check-status/route.ts`
- `src/__tests__/integration/api/check-status.test.ts`

### Fase 3: Frontend - Pantallas de Onboarding (Semana 2)

#### 3.1 Pantalla de Elección (Demo vs Real)

**Objetivo:** Permitir al usuario elegir entre explorar demo o configurar desde cero.

**Tareas:**

- [ ] Crear `src/app/onboarding/choice/page.tsx`
- [ ] Diseñar dos tarjetas visuales:
  - Tarjeta Demo: Captura de dashboard con datos + botón "Explorar con datos demo"
  - Tarjeta Real: Icono nuevo + botón "Configurar mi óptica desde cero"
- [ ] Al elegir Demo:
  - Llamar API `POST /api/onboarding/assign-demo` (crear este endpoint)
  - Asignar `organization_id = DEMO_ORG_ID` al usuario
  - Redirigir a `/admin`
- [ ] Al elegir Real:
  - Redirigir a `/onboarding/create`
- [ ] Agregar validación: solo mostrar si usuario no tiene `organization_id`

**Archivos a crear:**

- `src/app/onboarding/choice/page.tsx`
- `src/app/api/onboarding/assign-demo/route.ts` (POST)
- `src/components/onboarding/ChoiceCards.tsx`

#### 3.2 Pantalla de Creación de Organización

**Objetivo:** Formulario para crear organización con validación en vivo del slug.

**Tareas:**

- [ ] Crear `src/app/onboarding/create/page.tsx`
- [ ] Campo "Nombre de la óptica" (requerido)
- [ ] Campo "Identificador (slug)" con:
  - Autogeneración automática desde el nombre (usar función helper)
  - Validación en vivo con debounce (500ms)
  - Indicadores visuales (check verde / X rojo / spinner)
  - Mensaje de error si slug ocupado
- [ ] Campo opcional "Nombre de primera sucursal" (default: "Casa Matriz")
- [ ] Botón "Crear y continuar"
- [ ] Llamar `POST /api/admin/organizations` al enviar
- [ ] Manejar errores (slug duplicado, validación)
- [ ] En éxito, redirigir a `/onboarding/complete` o `/admin`

**Archivos a crear:**

- `src/app/onboarding/create/page.tsx`
- `src/components/onboarding/CreateOrganizationForm.tsx`
- `src/lib/utils/slug-generator.ts` (función de generación de slug)
- `src/hooks/useSlugValidation.ts` (hook para validación en vivo)

#### 3.3 Pantalla de Completado

**Objetivo:** Confirmar que la organización fue creada exitosamente.

**Tareas:**

- [ ] Crear `src/app/onboarding/complete/page.tsx`
- [ ] Mensaje: "Tu óptica está lista. Ya puedes usar el panel de administración."
- [ ] Botón principal: "Ir al panel" → `/admin`
- [ ] Opcional: Mostrar resumen de lo creado (nombre org, sucursal)

**Archivos a crear:**

- `src/app/onboarding/complete/page.tsx`

#### 3.4 Banner de Modo Demo

**Objetivo:** Mostrar banner persistente cuando el usuario está en modo demo.

**Tareas:**

- [ ] Crear `src/components/onboarding/DemoModeBanner.tsx`
- [ ] Verificar si `organization_id === DEMO_ORG_ID` (usar hook o contexto)
- [ ] Estilo: `bg-amber-100` con texto `text-amber-900`
- [ ] Mensaje: "Estás en modo demo. ¿Listo para empezar con tus propios datos?"
- [ ] Botón: "Activar mi Óptica" → abre modal o redirige a `/onboarding/create`
- [ ] Integrar en `src/app/admin/layout.tsx` (solo mostrar si `isDemoMode === true`)

**Archivos a crear:**

- `src/components/onboarding/DemoModeBanner.tsx`
- `src/components/onboarding/ActivateOrgModal.tsx` (opcional, si se usa modal)

### Fase 4: Middleware y Guards (Semana 2)

#### 4.1 Middleware Global de Next.js

**Objetivo:** Redirigir usuarios sin organización a onboarding de forma global.

**Tareas:**

- [ ] Crear o modificar `src/middleware.ts`
- [ ] Verificar autenticación en rutas `/admin/*`
- [ ] Llamar `GET /api/admin/check-status` para obtener estado
- [ ] Si `onboardingRequired === true` y no es super_admin:
  - Redirigir a `/onboarding/choice`
- [ ] Excluir rutas: `/onboarding/*`, `/login`, `/signup`, `/invite/*`, `/api/*`
- [ ] Manejar casos edge (usuario no autenticado → `/login`)
- [ ] Agregar logging para debugging

**Archivos a crear/modificar:**

- `src/middleware.ts`

#### 4.2 Guard en Layout Admin

**Objetivo:** Verificar organización antes de renderizar contenido admin.

**Tareas:**

- [ ] Modificar `src/app/admin/layout.tsx`
- [ ] Agregar estado: `organizationStatus` (loading, hasOrg, needsOnboarding)
- [ ] Al montar, llamar `GET /api/admin/check-status`
- [ ] Si `onboardingRequired === true`:
  - Mostrar loader
  - Redirigir a `/onboarding/choice`
- [ ] Si `isDemoMode === true`:
  - Renderizar `DemoModeBanner`
- [ ] Evitar flash: mostrar loader hasta tener respuesta
- [ ] Manejar errores de red

**Archivos a modificar:**

- `src/app/admin/layout.tsx`

#### 4.3 Modificar Flujo de Signup

**Objetivo:** Redirigir a onboarding después del registro.

**Tareas:**

- [ ] Modificar `src/app/signup/page.tsx`
- [ ] Tras `signUp` exitoso:
  - En lugar de redirigir a `/login`, redirigir a `/onboarding/choice`
- [ ] Opcional: Crear fila en `admin_users` con `organization_id = NULL` y `role = 'store_manager'` para que `is_admin()` funcione
- [ ] Actualizar mensaje de éxito: "Cuenta creada. Ahora configura tu óptica."

**Archivos a modificar:**

- `src/app/signup/page.tsx`

### Fase 5: Testing y Validación (Semana 3)

#### 5.1 Tests de Integración

**Tareas:**

- [ ] Test: Crear organización con slug válido → debe crear org + branch + access
- [ ] Test: Crear organización con slug duplicado → debe fallar con 400
- [ ] Test: Verificar slug disponible → debe devolver `{ available: true }`
- [ ] Test: Verificar slug ocupado → debe devolver `{ available: false }`
- [ ] Test: Activar org desde demo → debe cambiar `organization_id` del usuario
- [ ] Test: Transacción atómica → si falla branch, debe hacer rollback de org
- [ ] Test: Middleware redirige usuario sin org a `/onboarding/choice`
- [ ] Test: Layout admin redirige si `onboardingRequired === true`

**Archivos a crear:**

- `src/__tests__/integration/api/organizations.test.ts`
- `src/__tests__/integration/api/onboarding.test.ts`
- `src/__tests__/integration/middleware.test.ts`

#### 5.2 Tests E2E

**Tareas:**

- [ ] Test E2E: Signup → `/onboarding/choice` → Elegir Demo → Ver dashboard con datos
- [ ] Test E2E: Signup → `/onboarding/choice` → Elegir Real → Crear org → Ver dashboard
- [ ] Test E2E: Usuario en demo → Clic "Activar mi Óptica" → Completar onboarding → Ver dashboard real
- [ ] Test E2E: Validación slug en vivo → Escribir slug ocupado → Ver error
- [ ] Test E2E: Usuario sin org intenta acceder a `/admin/dashboard` → Redirige a onboarding

**Archivos a crear:**

- `src/__tests__/e2e/onboarding-flow.test.ts`

### Fase 6: Documentación y Ajustes Finales (Semana 3)

#### 6.1 Documentación

**Tareas:**

- [ ] Actualizar `README.md` con flujo de onboarding
- [ ] Documentar variable `NEXT_PUBLIC_DEMO_ORG_ID` en `.env.example`
- [ ] Crear guía de usuario: "Cómo empezar con Opttius"
- [ ] Documentar APIs nuevas en comentarios JSDoc
- [ ] Actualizar `docs/DOCUMENTATION_INDEX.md` con referencia a este documento

#### 6.2 Ajustes Finales

**Tareas:**

- [ ] Revisar todos los mensajes de error y copy
- [ ] Verificar accesibilidad (a11y) en formularios
- [ ] Optimizar carga de imágenes en pantalla de elección
- [ ] Agregar analytics/tracking para conversión demo → real
- [ ] Revisar performance (lazy loading, code splitting)

### Checklist Final de Verificación

Antes de considerar la implementación completa, verificar:

**Backend:**

- [ ] Organización demo creada con datos realistas
- [ ] Políticas RLS funcionando para demo org
- [ ] API crear organización crea org + branch atómicamente
- [ ] API check-slug funciona con validación en vivo
- [ ] API activate-real-org cambia contexto correctamente
- [ ] Endpoint check-status devuelve información completa

**Frontend:**

- [ ] Pantalla `/onboarding/choice` muestra opciones claras
- [ ] Pantalla `/onboarding/create` con validación slug en vivo
- [ ] Banner demo aparece cuando corresponde
- [ ] Middleware redirige correctamente
- [ ] Layout admin verifica organización antes de renderizar
- [ ] Signup redirige a onboarding

**Testing:**

- [ ] Tests de integración pasando (100%)
- [ ] Tests E2E pasando
- [ ] No hay regresiones en funcionalidad existente

**UX:**

- [ ] Flujo intuitivo y claro
- [ ] Mensajes de error útiles
- [ ] Loading states apropiados
- [ ] No hay flashes de contenido incorrecto

---

**Última actualización:** 2026-01-29  
**Mantenedor:** Equipo de desarrollo — actualizar este documento cuando se implemente cada elemento o se cambie el flujo de producto.
