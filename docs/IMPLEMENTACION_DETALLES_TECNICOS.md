# Detalles Técnicos de Implementación

Este documento contiene los detalles técnicos específicos para implementar cada corrección y nueva funcionalidad.

---

## 1. Filtrar Usuarios por Organización

### Problema

El endpoint `/api/admin/admin-users` (GET) retorna todos los usuarios de todas las organizaciones, cuando debería filtrar por `organization_id` del usuario actual.

### Solución

**Archivo**: `src/app/api/admin/admin-users/route.ts`

**Cambios en función GET**:

```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRole } = (await supabase.rpc("get_admin_role", {
      user_id: user.id,
    } as GetAdminRoleParams)) as {
      data: GetAdminRoleResult | null;
      error: Error | null;
    };
    if (adminRole !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Obtener información del usuario actual para determinar si es root/dev o super admin
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
    const isRoot = currentAdminUser?.role === "root" || currentAdminUser?.role === "dev";

    // Verificar si es super admin (basado en admin_branch_access)
    const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", {
      user_id: user.id,
    });

    // Obtener organization_id del usuario actual
    const { data: userOrgId } = await supabase.rpc("get_user_organization_id", {
      user_id: user.id,
    });

    // Build the query - include branch access info
    let query = supabase.from("admin_users").select(`
        id,
        email,
        role,
        permissions,
        is_active,
        last_login,
        created_at,
        updated_at,
        organization_id,
        admin_branch_access (
          id,
          branch_id,
          role,
          is_primary,
          branches (
            id,
            name,
            code
          )
        )
      `);

    // Aplicar filtro por organización SOLO si no es root/dev ni super admin
    if (!isRoot && !isSuperAdmin && userOrgId) {
      query = query.eq("organization_id", userOrgId);
    }
    // Si es root/dev o super admin, no aplicar filtro (ver todos los usuarios)

    // Apply filters
    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    if (status && status !== "all") {
      const isActive = status === "active";
      query = query.eq("is_active", isActive);
    }

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    const { data: adminUsers, error } = await query.order("created_at", {
      ascending: false,
    });

    // ... resto del código sin cambios
```

### Testing

**Casos de prueba requeridos**:

1. **Admin regular con `organization_id`**:
   - Login como usuario de organización A
   - Verificar que solo ve usuarios de organización A
   - Verificar que NO ve usuarios de organización B

2. **Admin sin `organization_id`**:
   - Login como admin sin organización asignada
   - Verificar que NO ve usuarios (o error claro)
   - Verificar mensaje de error apropiado

3. **Super admin**:
   - Login como super admin (determinado por `admin_branch_access`)
   - Verificar que ve todos los usuarios de su organización
   - Verificar que puede ver todas las sucursales

4. **Root/dev**:
   - Login como root/dev
   - Verificar que ve todos los usuarios (independiente de `organization_id`)
   - Verificar que puede ver todas las organizaciones

5. **Root/dev con `organization_id` asignado**:
   - Login como root con `organization_id` asignado
   - Verificar que `organization_id` es ignorado
   - Verificar que ve todos los usuarios

6. **Employee**:
   - Login como employee
   - Verificar que solo ve usuarios de su sucursal
   - Verificar que NO puede ver usuarios de otras sucursales

---

## 2. Crear Registro de Usuarios con Organización Heredada

### Nueva API Route

**Archivo**: `src/app/api/admin/admin-users/register/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { appLogger as logger } from "@/lib/logger";
import type {
  GetAdminRoleParams,
  GetAdminRoleResult,
} from "@/types/supabase-rpc";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role = "admin" } = body;

    const supabase = await createClient();
    const supabaseServiceRole = createServiceRoleClient();

    // Verificar autenticación
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que el usuario actual es admin
    const { data: adminRole } = (await supabase.rpc("get_admin_role", {
      user_id: currentUser.id,
    } as GetAdminRoleParams)) as {
      data: GetAdminRoleResult | null;
      error: Error | null;
    };
    if (adminRole !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Obtener organization_id del usuario actual
    const { data: currentAdminUser } = await supabaseServiceRole
      .from("admin_users")
      .select("organization_id")
      .eq("id", currentUser.id)
      .single();

    if (!currentAdminUser?.organization_id) {
      return NextResponse.json(
        { error: "No tienes una organización asignada" },
        { status: 400 },
      );
    }

    const organizationId = currentAdminUser.organization_id;

    // Validar inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 },
      );
    }

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabaseServiceRole
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "El usuario ya existe. Usa la opción 'Crear Administrador' en su lugar.",
        },
        { status: 400 },
      );
    }

    // Crear usuario en auth.users usando service role
    const { data: newAuthUser, error: createAuthError } =
      await supabaseServiceRole.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

    if (createAuthError || !newAuthUser.user) {
      logger.error("Error creating auth user", createAuthError);
      return NextResponse.json(
        { error: "Error al crear usuario", details: createAuthError?.message },
        { status: 500 },
      );
    }

    // Crear perfil
    const { error: profileError } = await supabaseServiceRole
      .from("profiles")
      .insert({
        id: newAuthUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
      });

    if (profileError) {
      logger.error("Error creating profile", profileError);
      // Intentar eliminar el usuario de auth si falla el perfil
      await supabaseServiceRole.auth.admin.deleteUser(newAuthUser.user.id);
      return NextResponse.json(
        { error: "Error al crear perfil", details: profileError.message },
        { status: 500 },
      );
    }

    // Crear admin_user con organization_id heredado
    const { data: newAdmin, error: adminError } = await supabaseServiceRole
      .from("admin_users")
      .insert({
        id: newAuthUser.user.id,
        email,
        role: role,
        permissions: getDefaultPermissions(role),
        is_active: true,
        organization_id: organizationId, // HEREDADO
      })
      .select()
      .single();

    if (adminError) {
      logger.error("Error creating admin user", adminError);
      // Rollback: eliminar usuario y perfil
      await supabaseServiceRole.auth.admin.deleteUser(newAuthUser.user.id);
      await supabaseServiceRole
        .from("profiles")
        .delete()
        .eq("id", newAuthUser.user.id);
      return NextResponse.json(
        { error: "Error al crear administrador", details: adminError.message },
        { status: 500 },
      );
    }

    // MEJORA: Asignación de sucursal opcional (no automática)
    // Si se proporciona branch_id en el body, asignar acceso
    // Si no se proporciona y hay sucursales, permitir selección manual después
    const { branch_id } = body;

    if (branch_id) {
      // Verificar que la sucursal pertenece a la organización
      const { data: branch } = await supabaseServiceRole
        .from("branches")
        .select("id, organization_id")
        .eq("id", branch_id)
        .eq("organization_id", organizationId)
        .single();

      if (!branch) {
        return NextResponse.json(
          { error: "La sucursal no pertenece a tu organización" },
          { status: 400 },
        );
      }

      // Asignar acceso a la sucursal especificada
      const { error: accessError } = await supabaseServiceRole
        .from("admin_branch_access")
        .insert({
          admin_user_id: newAdmin.id,
          branch_id: branch_id,
          role: role === "employee" ? "employee" : "manager",
          is_primary: true,
        });

      if (accessError) {
        logger.warn(
          "Error assigning branch access (non-critical)",
          accessError,
        );
        // No hacer rollback, el usuario ya está creado
      }
    } else {
      // Si no hay branch_id y el rol requiere sucursal (admin, employee)
      // y hay sucursales disponibles, registrar pero sin acceso aún
      // El usuario puede asignar sucursal después
      if (role !== "root" && role !== "dev" && role !== "super_admin") {
        logger.info(
          `User ${newAdmin.id} created without branch access. Can be assigned later.`,
        );
      }
    }

    // Log actividad
    try {
      await supabaseServiceRole.rpc("log_admin_activity", {
        action: "register_user_with_org",
        resource_type: "admin_user",
        resource_id: newAdmin.id,
        details: {
          new_user_email: email,
          organization_id: organizationId,
          created_by: currentUser.email,
        },
      });
    } catch (logError) {
      logger.warn("Error logging activity (non-critical)", logError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newAdmin.id,
        email: newAdmin.email,
        organization_id: newAdmin.organization_id,
      },
    });
  } catch (error) {
    logger.error("Error in register user API", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function getDefaultPermissions(role: string) {
  // Permisos por defecto según rol
  const rolePermissions: Record<string, any> = {
    root: {
      orders: ["read", "create", "update", "delete"],
      products: ["read", "create", "update", "delete"],
      customers: ["read", "create", "update", "delete"],
      analytics: ["read"],
      settings: ["read", "create", "update", "delete"],
      admin_users: ["read", "create", "update", "delete"],
      support: ["read", "create", "update", "delete"],
      bulk_operations: ["read", "create", "update", "delete"],
      saas_management: ["read", "create", "update", "delete"],
    },
    dev: {
      // Igual que root
      orders: ["read", "create", "update", "delete"],
      products: ["read", "create", "update", "delete"],
      customers: ["read", "create", "update", "delete"],
      analytics: ["read"],
      settings: ["read", "create", "update", "delete"],
      admin_users: ["read", "create", "update", "delete"],
      support: ["read", "create", "update", "delete"],
      bulk_operations: ["read", "create", "update", "delete"],
      saas_management: ["read", "create", "update", "delete"],
    },
    super_admin: {
      orders: ["read", "create", "update", "delete"],
      products: ["read", "create", "update", "delete"],
      customers: ["read", "create", "update", "delete"],
      analytics: ["read"],
      settings: ["read", "create", "update", "delete"],
      admin_users: ["read", "create", "update", "delete"],
      support: ["read", "create", "update", "delete"],
      bulk_operations: ["read", "create", "update", "delete"],
      branches: ["read", "create", "update", "delete"],
    },
    admin: {
      orders: ["read", "create", "update", "delete"],
      products: ["read", "create", "update", "delete"],
      customers: ["read", "create", "update", "delete"],
      analytics: ["read"],
      settings: ["read", "update"], // No puede eliminar config críticas
      admin_users: ["read"], // Solo ver, no crear/modificar
      support: ["read", "create", "update"],
      bulk_operations: ["read", "create"],
      appointments: ["read", "create", "update", "delete"],
      quotes: ["read", "create", "update", "delete"],
      work_orders: ["read", "create", "update", "delete"],
    },
    employee: {
      // Acceso operativo sin administración
      orders: ["read", "create", "update"], // No puede eliminar órdenes
      products: ["read"], // Solo lectura de catálogo
      customers: ["read", "create", "update"], // No puede eliminar clientes
      analytics: [], // Sin acceso a analytics
      settings: [], // Sin acceso a configuración
      admin_users: [], // Sin acceso a usuarios
      support: ["read", "create"], // Puede crear tickets, no resolver
      bulk_operations: [], // Sin operaciones masivas
      appointments: ["read", "create", "update"], // Puede agendar, no eliminar
      quotes: ["read", "create", "update"], // Puede crear presupuestos
      work_orders: ["read", "update"], // Puede actualizar estado, no crear/eliminar
      pos: ["read", "create"], // Acceso completo a POS para ventas
    },
  };

  return rolePermissions[role] || rolePermissions.admin;
}
```

### Nueva Página de Registro

**Archivo**: `src/app/admin/admin-users/register/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.email || !formData.password) {
      setError("Email y contraseña son requeridos");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/admin-users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar usuario");
      }

      toast.success("Usuario registrado exitosamente");
      router.push("/admin/admin-users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/admin-users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-azul-profundo">
            Registrar Nuevo Usuario
          </h1>
          <p className="text-tierra-media">
            El usuario será registrado con tu organización actual
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>
            Completa los datos para registrar un nuevo usuario en tu organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                minLength={8}
              />
              <p className="text-sm text-tierra-media mt-1">
                Mínimo 8 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                minLength={8}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrar Usuario
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Agregar Botón en Admin Users Page

**Archivo**: `src/app/admin/admin-users/page.tsx`

Agregar botón en el header:

```typescript
<Link href="/admin/admin-users/register">
  <Button variant="outline">
    <UserPlus className="h-4 w-4 mr-2" />
    Registrar Nuevo Usuario
  </Button>
</Link>
```

---

## 3. Corregir Gráficos en Analíticas

**Archivo**: `src/app/admin/analytics/page.tsx`

**Cambios**:

```typescript
// MEJORA: Cambiar tipos TypeScript para incluir "line" en lugar de "area"
// Verificar si existe EnhancedLineChart o usar EnhancedAreaChart con configuración de línea

const [salesChartType, setSalesChartType] = useState<"column" | "line">(
  "column", // Cambiado de "area"
);
const [workOrdersChartType, setWorkOrdersChartType] = useState<
  "column" | "line"
>("column"); // Cambiado de "area"
const [quotesChartType, setQuotesChartType] = useState<"column" | "line">(
  "column", // Cambiado de "area"
);

// Nota: Si no existe EnhancedLineChart, usar EnhancedAreaChart con:
// showGrid={true} y configuración de línea en lugar de área
```

**Cambiar los botones de alternancia**:

```typescript
// En lugar de "Área" y "Columnas", usar "Barras" y "Líneas"
<Button
  variant={salesChartType === "column" ? "default" : "outline"}
  size="sm"
  onClick={() => setSalesChartType("column")}
  className="h-7 px-3 text-xs"
>
  <BarChart3 className="h-3 w-3 mr-1" />
  Barras
</Button>
<Button
  variant={salesChartType === "line" ? "default" : "outline"}
  size="sm"
  onClick={() => setSalesChartType("line")}
  className="h-7 px-3 text-xs"
>
  <LineChartIcon className="h-3 w-3 mr-1" />
  Líneas
</Button>
```

**Actualizar renderizado de gráficos**:

```typescript
{salesChartType === "column" ? (
  <EnhancedColumnChart
    data={analytics.trends.sales}
    title="Evolución de Ingresos"
    color="#9DC65D"
    formatValue={formatPrice}
    height={300}
  />
) : (
  <EnhancedAreaChart // O crear EnhancedLineChart si existe
    data={analytics.trends.sales}
    title="Evolución de Ingresos"
    color="#9DC65D"
    formatValue={formatPrice}
    showGrid={true}
    height={300}
  />
)}
```

**Nota**: Si no existe `EnhancedLineChart`, usar `EnhancedAreaChart` con configuración de línea, o crear el componente.

---

## 4. Corregir Mensaje en Onboarding

**Archivo**: `src/app/onboarding/choice/page.tsx`

**Eliminar o modificar el footer**:

```typescript
{/* Eliminar este bloque completo */}
{/*
<div className="mt-8 text-center">
  <p className="text-sm text-gray-500">
    ¿Ya tienes una cuenta?{" "}
    <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
      Inicia sesión
    </Link>
  </p>
</div>
*/}

// O reemplazar con:
<div className="mt-8 text-center">
  <p className="text-sm text-gray-500">
    ¿Necesitas ayuda?{" "}
    <Link href="/support" className="text-blue-600 hover:text-blue-700 font-medium">
      Contacta soporte
    </Link>
  </p>
</div>
```

---

## 5. Migración para Rol Root/Dev y Employee

**Archivo**: `supabase/migrations/YYYYMMDDHHMMSS_create_root_role_and_employee.sql`

**⚠️ IMPORTANTE**: Esta migración debe ejecutarse después de validar que no hay datos incompatibles.

```sql
-- Migration: Add root, dev, and employee roles for SaaS management
-- This migration adds support for:
-- - root/dev users: Full SaaS management access (multi-tenant)
-- - employee users: Operational access without admin permissions

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

-- ===== UPDATE ADMIN_USERS ROLE CONSTRAINT =====
ALTER TABLE public.admin_users
DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE public.admin_users
ADD CONSTRAINT admin_users_role_check
CHECK (role IN ('root', 'dev', 'super_admin', 'admin', 'employee'));

-- ===== CREATE FUNCTION TO CHECK IF USER IS ROOT/DEV =====
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

-- ===== CREATE FUNCTION TO CHECK IF USER IS EMPLOYEE =====
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

COMMENT ON FUNCTION public.is_employee IS 'Check if user has employee role (operational access only, no admin permissions)';

-- ===== UPDATE RLS POLICIES FOR ADMIN_USERS =====
-- Root users can view all admin users
CREATE POLICY "Root users can view all admin users"
ON public.admin_users
FOR SELECT
USING (
  public.is_root_user(auth.uid())
  OR
  -- Existing policies still apply
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.id = auth.uid()
    AND au.is_active = true
  )
);

-- Root users can manage all admin users
CREATE POLICY "Root users can manage all admin users"
ON public.admin_users
FOR ALL
USING (public.is_root_user(auth.uid()))
WITH CHECK (public.is_root_user(auth.uid()));

-- ===== UPDATE RLS POLICIES FOR ORGANIZATIONS =====
-- Root users can view all organizations
DROP POLICY IF EXISTS "Root users can view all organizations" ON public.organizations;
CREATE POLICY "Root users can view all organizations"
ON public.organizations
FOR SELECT
USING (
  public.is_root_user(auth.uid())
  OR
  -- Existing policy
  id = (
    SELECT organization_id FROM public.admin_users
    WHERE id = auth.uid()
    LIMIT 1
  )
  OR EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  )
);

-- Root users can manage all organizations
DROP POLICY IF EXISTS "Root users can manage all organizations" ON public.organizations;
CREATE POLICY "Root users can manage all organizations"
ON public.organizations
FOR ALL
USING (public.is_root_user(auth.uid()))
WITH CHECK (public.is_root_user(auth.uid()));

-- ===== IMPORTANTE: ACTUALIZAR TODAS LAS POLÍTICAS RLS =====
-- ⚠️ Esta migración debe actualizar TODAS las políticas RLS existentes
-- No solo admin_users y organizations, sino también:
-- - orders, quotes, lab_work_orders, appointments
-- - products, customers, branches
-- - subscriptions, payments
-- - Y todas las demás tablas con RLS
--
-- Patrón recomendado para cada tabla:
-- 1. Root/dev: Acceso completo (sin filtro)
-- 2. Super admin: Acceso a su organización (get_user_organization_id)
-- 3. Admin/Employee: Acceso a su organización/sucursal
--
-- Ejemplo para tabla orders:
-- CREATE POLICY "Root users can view all orders"
-- ON public.orders FOR SELECT
-- USING (
--   public.is_root_user(auth.uid())
--   OR (public.is_super_admin(auth.uid()) AND organization_id = public.get_user_organization_id())
--   OR organization_id = public.get_user_organization_id()
-- );

-- ===== OPCIONAL: MIGRAR SUPER_ADMINS EXISTENTES =====
-- (Comentado por defecto, descomentar si se requiere migrar super_admins a root)
/*
UPDATE public.admin_users
SET role = 'root'
WHERE id IN (
  SELECT admin_user_id FROM public.admin_branch_access
  WHERE branch_id IS NULL
)
AND role = 'admin';
*/

-- ===== COMMENTS =====
COMMENT ON FUNCTION public.is_root_user IS 'Returns true if user has root or dev role, granting full SaaS management access';
COMMENT ON FUNCTION public.is_employee IS 'Returns true if user has employee role, granting operational access only';
```

---

## 6. Middleware de Protección Root

**Archivo**: `src/lib/api/root-middleware.ts`

```typescript
import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { AuthorizationError } from "@/lib/api/errors";
import { appLogger as logger } from "@/lib/logger";

/**
 * Require root or dev role for access
 * Throws AuthorizationError if user is not root/dev
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

**Uso en rutas API**:

```typescript
import { requireRoot } from "@/lib/api/root-middleware";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireRoot(request);
    // ... resto del código
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
```

---

## 7. Script para Crear Usuario Root

**Archivo**: `scripts/create-root-user.js`

```javascript
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRootUser() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];
  const firstName = args[2] || "Root";
  const lastName = args[3] || "User";

  if (!email || !password) {
    console.error(
      "Usage: node create-root-user.js <email> <password> [firstName] [lastName]",
    );
    process.exit(1);
  }

  try {
    // Create auth user
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

    if (authError) {
      throw authError;
    }

    console.log("✅ Auth user created:", authUser.user.id);

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authUser.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
    });

    if (profileError) {
      throw profileError;
    }

    console.log("✅ Profile created");

    // Create admin_user with root role
    const { error: adminError } = await supabase.from("admin_users").insert({
      id: authUser.user.id,
      email,
      role: "root",
      permissions: {
        orders: ["read", "create", "update", "delete"],
        products: ["read", "create", "update", "delete"],
        customers: ["read", "create", "update", "delete"],
        analytics: ["read"],
        settings: ["read", "create", "update", "delete"],
        admin_users: ["read", "create", "update", "delete"],
        support: ["read", "create", "update", "delete"],
        bulk_operations: ["read", "create", "update", "delete"],
        saas_management: ["read", "create", "update", "delete"],
      },
      is_active: true,
      organization_id: null, // Root users don't belong to an organization
    });

    if (adminError) {
      throw adminError;
    }

    console.log("✅ Root user created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Role: root`);
    console.log("\nYou can now login with these credentials.");
  } catch (error) {
    console.error("❌ Error creating root user:", error);
    process.exit(1);
  }
}

createRootUser();
```

**Uso**:

```bash
node scripts/create-root-user.js root@opttius.com SecurePassword123 Root Admin
```

---

## 8. Próximos Pasos

1. ✅ Implementar correcciones críticas (Fase 1)
2. ✅ Crear migración de base de datos para rol root
3. ✅ Crear middleware de protección
4. ✅ Implementar registro de usuarios con organización
5. ✅ Corregir gráficos y mensajes
6. Testing completo (E2E pendiente)
7. ✅ Continuar con Fase 2 (Gestión SaaS completa)
8. Phase SaaS 1: Billing (Stripe, Tier Enforcement)

---

## 9. Notas Post-Implementación (30-Ene-2026)

### 9.1 APIs de Gestión SaaS – Relaciones en Supabase

Las APIs que usaban `select()` con relaciones anidadas (ej. `owner:profiles!organizations_owner_id_fkey`, `organization:organizations(...)`) generaban errores 500. **Solución aplicada**:

- **Query principal**: Usar solo `select("*")` o campos directos de la tabla.
- **Datos relacionados**: Obtener en consultas separadas (organización, owner, perfiles, sucursales, etc.) y enriquecer la respuesta en el handler.

**Archivos afectados**:

- `src/app/api/admin/saas-management/organizations/route.ts` y `[id]/route.ts`
- `src/app/api/admin/saas-management/users/route.ts` y `[id]/route.ts`
- `src/app/api/admin/saas-management/subscriptions/route.ts` y `[id]/route.ts`
- `src/app/api/admin/saas-management/support/tickets/route.ts`

### 9.2 Páginas de Detalle Creadas

- **Usuarios**: `src/app/admin/saas-management/users/[id]/page.tsx` – Detalle de usuario (perfil, organización, sucursales, actividad).
- **Suscripciones**: `src/app/admin/saas-management/subscriptions/[id]/page.tsx` – Detalle de suscripción (período, Stripe, organización).

La página `organizations/[id]/page.tsx` ya existía; su API se simplificó de la misma forma.

### 9.3 UI y Navegación

- **Botón "Volver"**: Añadido en organizaciones, usuarios, suscripciones, tiers y soporte (vuelta a `/admin/saas-management/dashboard`).
- **Organizations page**: Import de `ArrowLeft` desde `lucide-react` (evitar `ReferenceError`).
- **Support page**: `SelectItem` no puede tener `value=""` (Radix Select). Usar `value="all"` y estado inicial de filtros en `"all"`. Al llamar a la API de tickets, no enviar `status`, `priority` ni `category` cuando su valor es `"all"`.

### 9.4 Referencia de Documentación

- Plan completo y estado: `docs/PLAN_GESTION_SAAS_OPTTIUS.md` (sección 10).
- Resumen ejecutivo: `docs/RESUMEN_EJECUTIVO_CORRECCIONES.md`.
- Estado del proyecto: `docs/ESTADO_ACTUAL_PROYECTO.md`.
- Soporte SaaS: `docs/SAAS_SUPPORT_SYSTEM_PLAN.md`.
- Testing SaaS: `docs/SAAS_TESTING_PLAN.md`.
