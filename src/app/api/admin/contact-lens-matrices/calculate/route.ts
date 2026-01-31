import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";

/**
 * POST /api/admin/contact-lens-matrices/calculate
 * Calculates contact lens price based on family, sphere, cylinder, axis, and optional addition
 *
 * Body:
 * - contact_lens_family_id: UUID of the contact lens family (required)
 * - sphere: Sphere value (required)
 * - cylinder: Cylinder value (default: 0)
 * - axis: Axis value for toric lenses (optional)
 * - addition: Addition value for multifocal lenses (optional)
 */
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

    // Parse body
    const body = await request.json();
    const {
      contact_lens_family_id,
      sphere,
      cylinder = 0,
      axis = null,
      addition = null,
    } = body;

    // Validate required parameters
    if (!contact_lens_family_id) {
      return NextResponse.json(
        { error: "contact_lens_family_id is required" },
        { status: 400 },
      );
    }

    if (sphere === undefined || sphere === null) {
      return NextResponse.json(
        { error: "sphere is required" },
        { status: 400 },
      );
    }

    // Validate sphere is a number
    const sphereNum = parseFloat(sphere);
    if (isNaN(sphereNum)) {
      return NextResponse.json(
        { error: "sphere must be a valid number" },
        { status: 400 },
      );
    }

    // Validate cylinder is a number if provided
    const cylinderNum =
      cylinder !== null && cylinder !== undefined ? parseFloat(cylinder) : 0;
    if (isNaN(cylinderNum)) {
      return NextResponse.json(
        { error: "cylinder must be a valid number" },
        { status: 400 },
      );
    }

    // Validate axis is an integer between 0-180 if provided
    const axisInt = axis !== null && axis !== undefined ? parseInt(axis) : null;
    if (axisInt !== null && (isNaN(axisInt) || axisInt < 0 || axisInt > 180)) {
      return NextResponse.json(
        { error: "axis must be an integer between 0 and 180" },
        { status: 400 },
      );
    }

    // Validate addition is a number if provided
    const additionNum =
      addition !== null && addition !== undefined ? parseFloat(addition) : null;
    if (additionNum !== null && isNaN(additionNum)) {
      return NextResponse.json(
        { error: "addition must be a valid number" },
        { status: 400 },
      );
    }

    // Call the SQL function to calculate contact lens price
    const { data: calculation, error } = await supabase.rpc(
      "calculate_contact_lens_price",
      {
        p_contact_lens_family_id: contact_lens_family_id,
        p_sphere: sphereNum,
        p_cylinder: cylinderNum,
        p_axis: axisInt,
        p_addition: additionNum,
        p_organization_id: userOrganizationId || null,
      },
    );

    if (error) {
      logger.error("Error calculating contact lens price", error);
      return NextResponse.json(
        {
          error: "Error al calcular el precio del lente de contacto",
          details: error.message,
        },
        { status: 500 },
      );
    }

    // Si no hay resultado: configuración de la familia (matrices) o la receta no cae en ningún rango
    if (!calculation || calculation.length === 0) {
      return NextResponse.json(
        {
          error:
            "No se encontró una matriz de precios para esta familia y receta. Comprueba que existan matrices de precios para esta familia (Productos → Lentes de contacto → Matrices) y que los valores de la receta (esfera, cilindro, eje, adición) entren en algún rango configurado.",
          code: "NO_PRICE_MATRIX_MATCH",
        },
        { status: 422 },
      );
    }

    // The RPC function returns an array, get the first result
    const result = Array.isArray(calculation) ? calculation[0] : calculation;

    return NextResponse.json({
      calculation: {
        price: parseFloat(result.price),
        cost: parseFloat(result.cost),
        base_curve: result.base_curve ? parseFloat(result.base_curve) : null,
        diameter: result.diameter ? parseFloat(result.diameter) : null,
      },
    });
  } catch (error) {
    logger.error("Error in contact lens price calculation API", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
