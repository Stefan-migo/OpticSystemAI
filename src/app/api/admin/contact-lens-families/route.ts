import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";
import {
  createContactLensFamilySchema,
  updateContactLensFamilySchema,
} from "@/lib/api/validation/zod-schemas";
import {
  parseAndValidateBody,
  parseAndValidateQuery,
  validationErrorResponse,
} from "@/lib/api/validation/zod-helpers";
import { ValidationError } from "@/lib/api/errors";
import { z } from "zod";

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

    // Get user's organization_id for filtering
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    const userOrganizationId = (
      adminUser as {
        organization_id?: string;
        role?: string;
      }
    )?.organization_id;
    const isSuperAdmin =
      (adminUser as { role?: string })?.role === "super_admin";

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("include_inactive") === "true";

    // Build query
    let query = supabase
      .from("contact_lens_families")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by organization_id (multi-tenancy isolation)
    if (!isSuperAdmin && userOrganizationId) {
      query = query.eq("organization_id", userOrganizationId);
    }

    // Filter by active status if needed
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: families, error } = await query;

    if (error) {
      logger.error("Error fetching contact lens families", error);
      return NextResponse.json(
        { error: "Error al cargar familias de lentes de contacto" },
        { status: 500 },
      );
    }

    return NextResponse.json({ families: families || [] });
  } catch (error) {
    logger.error("Error in contact lens families API GET", error);
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

    // Get user's organization_id
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const userOrganizationId = (
      adminUser as {
        organization_id?: string;
      }
    )?.organization_id;

    if (!userOrganizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Validate body
    const body = await parseAndValidateBody(
      request,
      createContactLensFamilySchema,
    );

    // Insert contact lens family with organization_id
    const { data: family, error } = await supabase
      .from("contact_lens_families")
      .insert({
        ...body,
        organization_id: userOrganizationId,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating contact lens family", error);
      return NextResponse.json(
        { error: "Error al crear familia de lentes de contacto" },
        { status: 500 },
      );
    }

    return NextResponse.json({ family }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof z.ZodError) {
      return validationErrorResponse(error);
    }
    logger.error("Error in contact lens families API POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
