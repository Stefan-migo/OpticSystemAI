import { NextRequest, NextResponse } from "next/server";
import { requireRoot } from "@/lib/api/root-middleware";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { appLogger as logger } from "@/lib/logger";
import { AuthorizationError } from "@/lib/api/errors";

/**
 * GET /api/admin/saas-management/subscriptions
 * Listar todas las suscripciones con filtros (solo root/dev)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRoot(request);
    const supabaseServiceRole = createServiceRoleClient();

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organization_id");
    const status = searchParams.get("status");
    const tier = searchParams.get("tier");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Construir query base
    let query = supabaseServiceRole
      .from("subscriptions")
      .select(
        `
        *,
        organization:organizations (
          id,
          name,
          slug,
          subscription_tier,
          status
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (organizationId && organizationId !== "all") {
      query = query.eq("organization_id", organizationId);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Si hay filtro por tier, primero obtener IDs de organizaciones con ese tier
    if (tier && tier !== "all") {
      const { data: orgsWithTier, error: orgError } = await supabaseServiceRole
        .from("organizations")
        .select("id")
        .eq("subscription_tier", tier);

      if (orgError) {
        logger.error("Error fetching organizations by tier", orgError);
        return NextResponse.json(
          { error: "Failed to filter by tier", details: orgError.message },
          { status: 500 },
        );
      }

      if (orgsWithTier && orgsWithTier.length > 0) {
        const orgIds = orgsWithTier.map((o: any) => o.id);
        query = query.in("organization_id", orgIds);
      } else {
        // No hay organizaciones con ese tier, retornar vacío
        return NextResponse.json({
          subscriptions: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data: subscriptions, error, count } = await query;

    if (error) {
      logger.error("Error fetching subscriptions", error);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions", details: error.message },
        { status: 500 },
      );
    }

    // Calcular días hasta vencimiento
    const subscriptionsWithDetails = (subscriptions || []).map((sub: any) => {
      let daysUntilExpiry: number | null = null;
      if (sub.current_period_end) {
        const endDate = new Date(sub.current_period_end);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        ...sub,
        daysUntilExpiry,
        isExpiringSoon:
          daysUntilExpiry !== null &&
          daysUntilExpiry <= 7 &&
          daysUntilExpiry >= 0,
        isExpired: daysUntilExpiry !== null && daysUntilExpiry < 0,
      };
    });

    return NextResponse.json({
      subscriptions: subscriptionsWithDetails,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    logger.error("Error in subscriptions API GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
