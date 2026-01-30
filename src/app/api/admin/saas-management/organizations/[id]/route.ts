import { NextRequest, NextResponse } from "next/server";
import { requireRoot } from "@/lib/api/root-middleware";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { appLogger as logger } from "@/lib/logger";
import { AuthorizationError } from "@/lib/api/errors";

/**
 * GET /api/admin/saas-management/organizations/[id]
 * Obtener detalles completos de una organización
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireRoot(request);
    const supabaseServiceRole = createServiceRoleClient();

    const { id } = params;

    // Obtener organización (sin relaciones complejas para evitar errores)
    const { data: organization, error } = await supabaseServiceRole
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !organization) {
      logger.error("Error fetching organization", error);
      return NextResponse.json(
        { error: "Organization not found", details: error?.message },
        { status: 404 },
      );
    }

    // Obtener suscripción activa
    const { data: subscription } = await supabaseServiceRole
      .from("subscriptions")
      .select(
        "id, status, current_period_start, current_period_end, cancel_at, canceled_at, stripe_subscription_id, stripe_customer_id, created_at, updated_at",
      )
      .eq("organization_id", id)
      .eq("status", "active")
      .maybeSingle();

    // Obtener owner si existe
    let owner = null;
    if (organization.owner_id) {
      const { data: ownerProfile } = await supabaseServiceRole
        .from("profiles")
        .select("id, email, first_name, last_name, phone")
        .eq("id", organization.owner_id)
        .maybeSingle();

      if (ownerProfile) {
        owner = ownerProfile;
      }
    }

    // Obtener estadísticas
    const [usersResult, branchesResult, ordersResult, productsResult] =
      await Promise.all([
        supabaseServiceRole
          .from("admin_users")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", id),
        supabaseServiceRole
          .from("branches")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", id),
        supabaseServiceRole
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", id),
        supabaseServiceRole
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", id),
      ]);

    const stats = {
      totalUsers: usersResult.count || 0,
      activeUsers:
        (
          await supabaseServiceRole
            .from("admin_users")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", id)
            .eq("is_active", true)
        ).count || 0,
      branches: branchesResult.count || 0,
      orders: ordersResult.count || 0,
      products: productsResult.count || 0,
    };

    // Obtener usuarios recientes (sin relaciones complejas)
    const { data: recentUsersData } = await supabaseServiceRole
      .from("admin_users")
      .select("id, email, role, is_active, last_login, created_at")
      .eq("organization_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Enriquecer usuarios recientes con perfiles
    const recentUsers = await Promise.all(
      (recentUsersData || []).map(async (user: any) => {
        const { data: profile } = await supabaseServiceRole
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        return {
          ...user,
          profiles: profile || null,
        };
      }),
    );

    // Obtener sucursales
    const { data: branches } = await supabaseServiceRole
      .from("branches")
      .select("*")
      .eq("organization_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      organization: {
        ...organization,
        subscription: subscription || null,
        owner: owner || null,
        stats,
        recentUsers: recentUsers || [],
        branches: branches || [],
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    logger.error("Error fetching organization details", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/saas-management/organizations/[id]
 * Actualizar organización
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireRoot(request);
    const supabaseServiceRole = createServiceRoleClient();

    const { id } = params;
    const body = await request.json();
    const { name, slug, owner_id, subscription_tier, status, metadata } = body;

    // Verificar que la organización existe
    const { data: existingOrg } = await supabaseServiceRole
      .from("organizations")
      .select("id, slug")
      .eq("id", id)
      .single();

    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Preparar updates
    const updates: any = {};

    if (name !== undefined) updates.name = name;
    if (slug !== undefined) {
      // Validar formato de slug
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          {
            error:
              "El slug solo puede contener letras minúsculas, números y guiones",
          },
          { status: 400 },
        );
      }

      // Verificar que el slug no está en uso por otra organización
      if (slug !== existingOrg.slug) {
        const { data: slugExists } = await supabaseServiceRole
          .from("organizations")
          .select("id")
          .eq("slug", slug)
          .neq("id", id)
          .maybeSingle();

        if (slugExists) {
          return NextResponse.json(
            { error: "El slug ya está en uso" },
            { status: 400 },
          );
        }
      }

      updates.slug = slug;
    }
    if (owner_id !== undefined) updates.owner_id = owner_id;
    if (subscription_tier !== undefined) {
      if (!["basic", "pro", "premium"].includes(subscription_tier)) {
        return NextResponse.json({ error: "Tier inválido" }, { status: 400 });
      }
      updates.subscription_tier = subscription_tier;
    }
    if (status !== undefined) {
      if (!["active", "suspended", "cancelled"].includes(status)) {
        return NextResponse.json({ error: "Status inválido" }, { status: 400 });
      }
      updates.status = status;
    }
    if (metadata !== undefined) updates.metadata = metadata;

    // Actualizar
    const { data: updatedOrg, error: updateError } = await supabaseServiceRole
      .from("organizations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating organization", updateError);
      return NextResponse.json(
        {
          error: "Failed to update organization",
          details: updateError.message,
        },
        { status: 500 },
      );
    }

    logger.info(`Organization updated: ${id}`);

    return NextResponse.json({ organization: updatedOrg });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    logger.error("Error updating organization", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/saas-management/organizations/[id]
 * Eliminar organización (soft delete cambiando status a cancelled)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireRoot(request);
    const supabaseServiceRole = createServiceRoleClient();

    const { id } = params;

    // Soft delete: cambiar status a cancelled
    const { data: updatedOrg, error } = await supabaseServiceRole
      .from("organizations")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (error || !updatedOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    logger.info(`Organization cancelled: ${id}`);

    return NextResponse.json({ organization: updatedOrg });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    logger.error("Error deleting organization", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
