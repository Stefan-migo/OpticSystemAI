import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { appLogger as logger } from "@/lib/logger";

const DEMO_ORG_ID =
  process.env.NEXT_PUBLIC_DEMO_ORG_ID || "00000000-0000-0000-0000-000000000001";

/**
 * POST /api/onboarding/assign-demo
 *
 * Asigna la organización demo al usuario actual.
 * Esto permite que el usuario explore el sistema con datos pre-cargados.
 *
 * Returns:
 * - { success: boolean, organizationId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseServiceRole = createServiceRoleClient();

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que el usuario no tenga ya una organización asignada
    const { data: existingAdminUser } = await supabaseServiceRole
      .from("admin_users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (existingAdminUser?.organization_id) {
      // Si ya tiene organización y no es la demo, no permitir cambio
      if (existingAdminUser.organization_id !== DEMO_ORG_ID) {
        return NextResponse.json(
          {
            error: "Ya tienes una organización asignada",
            organizationId: existingAdminUser.organization_id,
          },
          { status: 400 },
        );
      }
      // Si ya tiene la demo asignada, devolver éxito
      return NextResponse.json({
        success: true,
        organizationId: DEMO_ORG_ID,
        alreadyAssigned: true,
      });
    }

    // Verificar que la organización demo existe
    const { data: demoOrg, error: orgError } = await supabaseServiceRole
      .from("organizations")
      .select("id, name")
      .eq("id", DEMO_ORG_ID)
      .single();

    if (orgError || !demoOrg) {
      logger.error("Demo organization not found", orgError);
      return NextResponse.json(
        { error: "La organización demo no está disponible" },
        { status: 500 },
      );
    }

    // Crear/actualizar admin_users con organization_id de demo
    const { data: adminUser, error: adminError } = await supabaseServiceRole
      .from("admin_users")
      .upsert(
        {
          id: user.id,
          email: user.email,
          role: "store_manager",
          organization_id: DEMO_ORG_ID,
          is_active: true,
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single();

    if (adminError || !adminUser) {
      logger.error("Error assigning demo organization", adminError);
      return NextResponse.json(
        {
          error: "Error al asignar organización demo",
          details: adminError?.message,
        },
        { status: 500 },
      );
    }

    // Obtener la primera sucursal de la demo para asignar acceso
    const { data: demoBranch } = await supabaseServiceRole
      .from("branches")
      .select("id")
      .eq("organization_id", DEMO_ORG_ID)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (demoBranch) {
      // Crear admin_branch_access para la sucursal demo
      const { error: accessError } = await supabaseServiceRole
        .from("admin_branch_access")
        .upsert(
          {
            admin_user_id: user.id,
            branch_id: demoBranch.id,
            role: "manager",
            is_primary: true,
          },
          {
            onConflict: "admin_user_id,branch_id",
          },
        );

      if (accessError) {
        logger.warn("Error creating branch access (non-critical)", accessError);
        // No crítico, el usuario puede tener acceso después
      }
    }

    logger.info("Demo organization assigned successfully", {
      userId: user.id,
      organizationId: DEMO_ORG_ID,
    });

    return NextResponse.json({
      success: true,
      organizationId: DEMO_ORG_ID,
      organization: {
        id: demoOrg.id,
        name: demoOrg.name,
      },
    });
  } catch (error) {
    logger.error("Error in POST /api/onboarding/assign-demo", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
