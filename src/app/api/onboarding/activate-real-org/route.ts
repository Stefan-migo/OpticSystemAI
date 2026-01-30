import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { appLogger as logger } from "@/lib/logger";
import {
  parseAndValidateBody,
  ValidationError,
  validationErrorResponse,
} from "@/lib/api/validation/zod-helpers";
import { activateRealOrgSchema } from "@/lib/api/validation/organization-schemas";

const DEMO_ORG_ID =
  process.env.NEXT_PUBLIC_DEMO_ORG_ID || "00000000-0000-0000-0000-000000000001";

/**
 * POST /api/onboarding/activate-real-org
 *
 * Activa la organización real del usuario desde modo demo.
 * Crea la nueva organización y cambia el organization_id del usuario.
 *
 * Body:
 * - name: string (requerido) - Nombre de la organización
 * - slug: string (requerido) - Identificador único URL-friendly
 * - branchName: string (opcional) - Nombre de la primera sucursal
 *
 * Returns:
 * - { organization: {...}, branch: {...} }
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

    // Validar body
    let validatedBody;
    try {
      validatedBody = await parseAndValidateBody(
        request,
        activateRealOrgSchema,
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    const { name, slug, branchName } = validatedBody;

    // Verificar que el usuario actualmente tiene la organización demo asignada
    const { data: currentAdminUser } = await supabaseServiceRole
      .from("admin_users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!currentAdminUser || currentAdminUser.organization_id !== DEMO_ORG_ID) {
      return NextResponse.json(
        {
          error: "Solo puedes activar tu organización real desde modo demo",
        },
        { status: 400 },
      );
    }

    // Verificar que el slug no exista
    const { data: existingOrg } = await supabaseServiceRole
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: "Ese identificador ya está en uso. Elige otro." },
        { status: 400 },
      );
    }

    // Crear nueva organización
    const { data: newOrganization, error: orgError } = await supabaseServiceRole
      .from("organizations")
      .insert({
        name,
        slug,
        owner_id: user.id,
        subscription_tier: "basic", // Default tier
        status: "active",
      })
      .select()
      .single();

    if (orgError || !newOrganization) {
      logger.error("Error creating organization", orgError);
      return NextResponse.json(
        { error: "Error al crear la organización", details: orgError?.message },
        { status: 500 },
      );
    }

    const organizationId = newOrganization.id;

    // Actualizar admin_users con la nueva organization_id
    const { data: adminUser, error: adminError } = await supabaseServiceRole
      .from("admin_users")
      .update({
        organization_id: organizationId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (adminError || !adminUser) {
      logger.error("Error updating admin_users", adminError);
      // Rollback: eliminar organización creada
      await supabaseServiceRole
        .from("organizations")
        .delete()
        .eq("id", organizationId);
      return NextResponse.json(
        {
          error: "Error al actualizar organización del usuario",
          details: adminError?.message,
        },
        { status: 500 },
      );
    }

    // Crear primera sucursal (siempre se crea una, por defecto "Sucursal Principal")
    const finalBranchName = branchName || "Sucursal Principal";
    const branchCode = `${slug.toUpperCase().substring(0, 8)}-001`;

    const { data: newBranch, error: branchError } = await supabaseServiceRole
      .from("branches")
      .insert({
        name: finalBranchName,
        code: branchCode,
        organization_id: organizationId,
        is_active: true,
      })
      .select()
      .single();

    let branch = null;
    if (branchError || !newBranch) {
      logger.error("Error creating branch", branchError);
    } else {
      branch = newBranch;

      // Crear admin_branch_access
      const { error: accessError } = await supabaseServiceRole
        .from("admin_branch_access")
        .insert({
          admin_user_id: user.id,
          branch_id: newBranch.id,
          role: "manager",
          is_primary: true,
        });

      if (accessError) {
        logger.error("Error creating branch access", accessError);
      }
    }

    // Crear subscription inicial
    const { error: subscriptionError } = await supabaseServiceRole
      .from("subscriptions")
      .insert({
        organization_id: organizationId,
        status: "trialing",
      });

    if (subscriptionError) {
      logger.warn(
        "Error creating subscription (non-critical)",
        subscriptionError,
      );
    }

    logger.info("Real organization activated successfully", {
      organizationId,
      userId: user.id,
      slug,
    });

    return NextResponse.json({
      organization: {
        id: newOrganization.id,
        name: newOrganization.name,
        slug: newOrganization.slug,
        subscription_tier: newOrganization.subscription_tier,
      },
      branch: branch
        ? {
            id: branch.id,
            name: branch.name,
            code: branch.code,
          }
        : null,
    });
  } catch (error) {
    logger.error("Error in POST /api/onboarding/activate-real-org", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
