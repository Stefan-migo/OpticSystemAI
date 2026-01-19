import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { getBranchContext } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc("is_admin", {
      user_id: user.id,
    });
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    // Get quote settings for current branch (or default if no branch selected)
    let query = supabase.from("quote_settings").select("*");

    if (branchContext.branchId) {
      query = query.eq("branch_id", branchContext.branchId);
    } else {
      // If no branch selected or global view, get default settings (branch_id IS NULL)
      query = query.is("branch_id", null);
    }

    const { data: settings, error } = await query.limit(1).maybeSingle();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      logger.error("Error fetching quote settings", error);
      return NextResponse.json(
        {
          error: "Failed to fetch quote settings",
          details: error.message,
        },
        { status: 500 },
      );
    }

    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        settings: {
          treatment_prices: {
            anti_reflective: 15000,
            blue_light_filter: 20000,
            uv_protection: 10000,
            scratch_resistant: 12000,
            anti_fog: 8000,
            photochromic: 35000,
            polarized: 25000,
            tint: 15000,
          },
          lens_type_base_costs: {
            single_vision: 30000,
            bifocal: 45000,
            trifocal: 55000,
            progressive: 60000,
            reading: 25000,
            computer: 35000,
            sports: 40000,
          },
          lens_material_multipliers: {
            cr39: 1.0,
            polycarbonate: 1.2,
            high_index_1_67: 1.5,
            high_index_1_74: 2.0,
            trivex: 1.3,
            glass: 0.9,
          },
          default_labor_cost: 15000,
          default_tax_percentage: 19.0,
          default_expiration_days: 30,
          default_margin_percentage: 0,
          labor_cost_includes_tax: true,
          lens_cost_includes_tax: true,
          treatments_cost_includes_tax: true,
          volume_discounts: [],
          currency: "CLP",
          terms_and_conditions: null,
          notes_template: null,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    logger.error("Error in quote settings API GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseServiceRole = createServiceRoleClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc("is_admin", {
      user_id: user.id,
    });
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    // Check if settings exist for this branch
    let existingQuery = supabaseServiceRole.from("quote_settings").select("id");

    if (branchContext.branchId) {
      existingQuery = existingQuery.eq("branch_id", branchContext.branchId);
    } else {
      existingQuery = existingQuery.is("branch_id", null);
    }

    const { data: existingSettings } = await existingQuery
      .limit(1)
      .maybeSingle();

    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (body.treatment_prices !== undefined)
      updateData.treatment_prices = body.treatment_prices;
    if (body.lens_type_base_costs !== undefined)
      updateData.lens_type_base_costs = body.lens_type_base_costs;
    if (body.lens_material_multipliers !== undefined)
      updateData.lens_material_multipliers = body.lens_material_multipliers;
    if (body.default_labor_cost !== undefined)
      updateData.default_labor_cost = body.default_labor_cost;
    if (body.default_tax_percentage !== undefined)
      updateData.default_tax_percentage = body.default_tax_percentage;
    if (body.default_expiration_days !== undefined)
      updateData.default_expiration_days = body.default_expiration_days;
    if (body.default_margin_percentage !== undefined)
      updateData.default_margin_percentage = body.default_margin_percentage;
    if (body.labor_cost_includes_tax !== undefined)
      updateData.labor_cost_includes_tax = body.labor_cost_includes_tax;
    if (body.lens_cost_includes_tax !== undefined)
      updateData.lens_cost_includes_tax = body.lens_cost_includes_tax;
    if (body.treatments_cost_includes_tax !== undefined)
      updateData.treatments_cost_includes_tax =
        body.treatments_cost_includes_tax;
    if (body.volume_discounts !== undefined)
      updateData.volume_discounts = body.volume_discounts;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.terms_and_conditions !== undefined)
      updateData.terms_and_conditions = body.terms_and_conditions;
    if (body.notes_template !== undefined)
      updateData.notes_template = body.notes_template;

    let result;
    if (existingSettings) {
      // Update existing
      const { data, error } = await supabaseServiceRole
        .from("quote_settings")
        .update(updateData)
        .eq("id", existingSettings.id)
        .select()
        .single();

      if (error) {
        logger.error("Error updating quote settings", error);
        return NextResponse.json(
          {
            error: "Failed to update quote settings",
            details: error.message,
          },
          { status: 500 },
        );
      }

      result = data;
    } else {
      // Insert new with branch_id
      const insertData = {
        ...updateData,
        branch_id: branchContext.branchId || null,
      };

      const { data, error } = await supabaseServiceRole
        .from("quote_settings")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error("Error creating quote settings", error);
        return NextResponse.json(
          {
            error: "Failed to create quote settings",
            details: error.message,
          },
          { status: 500 },
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      settings: result,
    });
  } catch (error) {
    logger.error("Error in quote settings PUT API", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
