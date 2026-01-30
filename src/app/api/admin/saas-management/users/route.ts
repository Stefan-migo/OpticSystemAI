import { NextRequest, NextResponse } from "next/server";
import { requireRoot } from "@/lib/api/root-middleware";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { appLogger as logger } from "@/lib/logger";
import { AuthorizationError } from "@/lib/api/errors";

/**
 * GET /api/admin/saas-management/users
 * Listar todos los usuarios del sistema con filtros (solo root/dev)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRoot(request);
    const supabaseServiceRole = createServiceRoleClient();

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organization_id");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Construir query base (simplificada para evitar problemas con relaciones complejas)
    let query = supabaseServiceRole
      .from("admin_users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (organizationId && organizationId !== "all") {
      query = query.eq("organization_id", organizationId);
    }

    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    if (status && status !== "all") {
      const isActive = status === "active";
      query = query.eq("is_active", isActive);
    }

    if (search) {
      // Buscar por email directamente en admin_users
      // Para nombres, necesitamos hacer una búsqueda separada
      query = query.or(`email.ilike.%${search}%`);
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      logger.error("Error fetching users", error);
      return NextResponse.json(
        { error: "Failed to fetch users", details: error.message },
        { status: 500 },
      );
    }

    // Enriquecer datos con información adicional (hacer queries separadas)
    const usersWithDetails = await Promise.all(
      (users || []).map(async (user: any) => {
        // Obtener perfil
        const { data: profile } = await supabaseServiceRole
          .from("profiles")
          .select("id, first_name, last_name, phone")
          .eq("id", user.id)
          .maybeSingle();

        // Obtener organización
        let organization = null;
        if (user.organization_id) {
          const { data: org } = await supabaseServiceRole
            .from("organizations")
            .select("id, name, slug")
            .eq("id", user.organization_id)
            .maybeSingle();
          organization = org;
        }

        // Obtener acceso a sucursales
        const { data: branchAccess } = await supabaseServiceRole
          .from("admin_branch_access")
          .select(
            `
            id,
            branch_id,
            branches (
              id,
              name,
              code
            )
          `,
          )
          .eq("admin_user_id", user.id);

        const isSuperAdmin =
          branchAccess?.some((access: any) => access.branch_id === null) ||
          false;

        const branches = (branchAccess || [])
          .filter((access: any) => access.branch_id !== null)
          .map((access: any) => ({
            id: access.branch_id,
            name: access.branches?.name || "N/A",
            code: access.branches?.code || "N/A",
          }));

        return {
          ...user,
          profiles: profile,
          organization,
          is_super_admin: isSuperAdmin,
          branches: branches,
          fullName: profile
            ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
              null
            : null,
        };
      }),
    );

    // Si hay búsqueda por nombre, filtrar después
    let filteredUsers = usersWithDetails;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = usersWithDetails.filter((user: any) => {
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        const nameMatch = user.fullName?.toLowerCase().includes(searchLower);
        return emailMatch || nameMatch;
      });
    }

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: search ? filteredUsers.length : count || 0,
        totalPages: search ? 1 : Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    logger.error("Error in users API GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
