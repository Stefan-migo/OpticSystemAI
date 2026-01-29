import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";
import { createLensFamilySchema } from "@/lib/api/validation/zod-schemas";
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
    const includeInactive = searchParams.get("include_inactive") === "true";

    // Build query
    let query = supabase.from("lens_families").select("*").order("created_at", {
      ascending: false,
    });

    // Filter by active status if needed
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: families, error } = await query;

    if (error) {
      logger.error("Error fetching lens families", error);
      return NextResponse.json(
        { error: "Error al cargar familias de lentes" },
        { status: 500 },
      );
    }

    return NextResponse.json({ families: families || [] });
  } catch (error) {
    logger.error("Error in lens families API GET", error);
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
    const body = await parseAndValidateBody(request, createLensFamilySchema);

    // Insert lens family
    const { data: family, error } = await supabase
      .from("lens_families")
      .insert(body)
      .select()
      .single();

    if (error) {
      logger.error("Error creating lens family", error);
      return NextResponse.json(
        { error: "Error al crear familia de lentes" },
        { status: 500 },
      );
    }

    return NextResponse.json({ family }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      return validationErrorResponse(error);
    }
    logger.error("Error in lens families API POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
