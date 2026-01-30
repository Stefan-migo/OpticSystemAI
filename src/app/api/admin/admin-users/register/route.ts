import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { appLogger as logger } from "@/lib/logger";
import type {
  GetAdminRoleParams,
  GetAdminRoleResult,
} from "@/types/supabase-rpc";

// Helper function to get default permissions by role
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      role = "admin",
      branch_id,
    } = body;

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

    // Verificar que el usuario actual tiene permisos para crear usuarios
    const { data: adminRole } = (await supabase.rpc("get_admin_role", {
      user_id: currentUser.id,
    } as GetAdminRoleParams)) as {
      data: GetAdminRoleResult | null;
      error: Error | null;
    };

    // Verificar permisos según rol del usuario actual
    const { data: currentAdminUser } = await supabaseServiceRole
      .from("admin_users")
      .select("role, organization_id")
      .eq("id", currentUser.id)
      .single();

    const isRoot =
      currentAdminUser?.role === "root" || currentAdminUser?.role === "dev";
    const isSuperAdmin = currentAdminUser?.role === "super_admin";
    const isAdmin = adminRole === "admin";

    // Validar que el usuario tiene permisos para crear usuarios
    if (!isRoot && !isSuperAdmin && !isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Validar que el rol a crear es permitido
    // Root/dev puede crear cualquier rol
    // Super admin puede crear: admin, employee, super_admin (de su org)
    // Admin puede crear: admin, employee
    if (!isRoot) {
      const allowedRoles = isSuperAdmin
        ? ["admin", "employee", "super_admin"]
        : ["admin", "employee"];

      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          { error: `No tienes permisos para crear usuarios con rol ${role}` },
          { status: 403 },
        );
      }
    }

    // Obtener organization_id del usuario actual (excepto root/dev)
    let organizationId: string | null = null;
    if (!isRoot) {
      if (!currentAdminUser?.organization_id) {
        return NextResponse.json(
          { error: "No tienes una organización asignada" },
          { status: 400 },
        );
      }
      organizationId = currentAdminUser.organization_id;
    }
    // Root/dev puede crear usuarios sin organization_id (para otros root/dev)

    // Validar inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
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

    // Crear admin_user con organization_id heredado (o null para root/dev)
    const { data: newAdmin, error: adminError } = await supabaseServiceRole
      .from("admin_users")
      .insert({
        id: newAuthUser.user.id,
        email,
        role: role,
        permissions: getDefaultPermissions(role),
        is_active: true,
        organization_id: organizationId, // HEREDADO o null para root/dev
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
    if (branch_id && organizationId) {
      // Verificar que la sucursal pertenece a la organización
      const { data: branch } = await supabaseServiceRole
        .from("branches")
        .select("id, organization_id")
        .eq("id", branch_id)
        .eq("organization_id", organizationId)
        .single();

      if (!branch) {
        // No hacer rollback, solo log warning
        logger.warn(
          `Branch ${branch_id} does not belong to organization ${organizationId}`,
        );
      } else {
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
      }
    } else if (
      role !== "root" &&
      role !== "dev" &&
      role !== "super_admin" &&
      organizationId
    ) {
      // Si no hay branch_id y el rol requiere sucursal (admin, employee)
      // registrar pero sin acceso aún - el usuario puede asignar sucursal después
      logger.info(
        `User ${newAdmin.id} created without branch access. Can be assigned later.`,
      );
    }

    // Si es super_admin, crear acceso global (branch_id = null)
    if (role === "super_admin") {
      const { error: accessError } = await supabaseServiceRole
        .from("admin_branch_access")
        .insert({
          admin_user_id: newAdmin.id,
          branch_id: null,
          role: "manager",
          is_primary: true,
        });

      if (accessError) {
        logger.warn(
          "Error assigning super admin access (non-critical)",
          accessError,
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
          role: role,
          organization_id: organizationId,
          branch_id: branch_id || null,
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
        role: newAdmin.role,
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
