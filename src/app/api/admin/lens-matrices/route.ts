import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";
import { createLensPriceMatrixSchema } from "@/lib/api/validation/zod-schemas";
import {
  parseAndValidateBody,
  parseAndValidateQuery,
  validationErrorResponse,
} from "@/lib/api/validation/zod-helpers";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: isAdmin } = (await supabase.rpc("is_admin", {
      user_id: user.id,
    } as IsAdminParams)) as { data: IsAdminResult | null; error: Error | null };
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get("family_id");
    const includeInactive = searchParams.get("include_inactive") === "true";

    // Build query
    let query = supabase
      .from("lens_price_matrices")
      .select(
        `
        *,
        lens_families (
          id,
          name,
          brand,
          lens_type,
          lens_material
        )
      `,
      )
      .order("created_at", { ascending: false });

    // Filter by family if provided
    if (familyId && familyId !== "all") {
      query = query.eq("lens_family_id", familyId);
    }

    // Filter by active status if needed
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: matrices, error } = await query;

    if (error) {
      logger.error("Error fetching lens price matrices", error);
      return NextResponse.json(
        { error: "Error al cargar matrices de precios" },
        { status: 500 },
      );
    }

    return NextResponse.json({ matrices: matrices || [] });
  } catch (error) {
    logger.error("Error in lens matrices API GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: isAdmin } = (await supabase.rpc("is_admin", {
      user_id: user.id,
    } as IsAdminParams)) as { data: IsAdminResult | null; error: Error | null };
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Validate body
    const body = await parseAndValidateBody(
      request,
      createLensPriceMatrixSchema,
    );

    // Insert price matrix
    const { data: matrix, error } = await supabase
      .from("lens_price_matrices")
      .insert(body)
      .select(
        `
        *,
        lens_families (
          id,
          name,
          brand,
          lens_type,
          lens_material
        )
      `,
      )
      .single();

    if (error) {
      logger.error("Error creating lens price matrix", error);
      return NextResponse.json(
        { error: "Error al crear matriz de precios" },
        { status: 500 },
      );
    }

    return NextResponse.json({ matrix }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      return validationErrorResponse(error);
    }
    logger.error("Error in lens matrices API POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
