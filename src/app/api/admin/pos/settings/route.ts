import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getBranchContext } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";
import { withRateLimit, rateLimitConfigs } from "@/lib/api/middleware";
import { z } from "zod";

const posSettingsSchema = z.object({
  min_deposit_percent: z.number().min(0).max(100).optional(),
  min_deposit_amount: z.number().min(0).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    return await (withRateLimit(rateLimitConfigs.general) as any)(
      request,
      async () => {
        const supabase = await createClient();

        // Check admin authorization
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: isAdmin } = (await supabase.rpc("is_admin", {
          user_id: user.id,
        } as IsAdminParams)) as {
          data: IsAdminResult | null;
          error: Error | null;
        };
        if (!isAdmin) {
          return NextResponse.json(
            { error: "Admin access required" },
            { status: 403 },
          );
        }

        // Get branch context
        const branchContext = await getBranchContext(request, user.id);

        // Validate branch access for non-super admins
        if (!branchContext.isSuperAdmin && !branchContext.branchId) {
          return NextResponse.json(
            {
              error:
                "Debe seleccionar una sucursal para ver la configuración del POS",
            },
            { status: 400 },
          );
        }

        // Get POS settings for the branch
        let query = supabase
          .from("pos_settings")
          .select("*")
          .eq("branch_id", branchContext.branchId!);

        const { data: settings, error: settingsError } =
          await query.maybeSingle();

        if (settingsError && settingsError.code !== "PGRST116") {
          // PGRST116 = not found, which is OK
          logger.error("Error fetching POS settings", settingsError);
          return NextResponse.json(
            { error: "Error al obtener configuración" },
            { status: 500 },
          );
        }

        // Return default settings if not found
        if (!settings) {
          return NextResponse.json({
            settings: {
              min_deposit_percent: 50.0,
              min_deposit_amount: null,
            },
          });
        }

        return NextResponse.json({
          settings: {
            min_deposit_percent: settings.min_deposit_percent,
            min_deposit_amount: settings.min_deposit_amount,
          },
        });
      },
    );
  } catch (error) {
    logger.error("Error in POS settings GET API", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await (withRateLimit(rateLimitConfigs.modification) as any)(
      request,
      async () => {
        const supabase = await createClient();

        // Check admin authorization
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: isAdmin } = (await supabase.rpc("is_admin", {
          user_id: user.id,
        } as IsAdminParams)) as {
          data: IsAdminResult | null;
          error: Error | null;
        };
        if (!isAdmin) {
          return NextResponse.json(
            { error: "Admin access required" },
            { status: 403 },
          );
        }

        // Get branch context
        const branchContext = await getBranchContext(request, user.id);

        // Validate branch access for non-super admins
        if (!branchContext.isSuperAdmin && !branchContext.branchId) {
          return NextResponse.json(
            {
              error:
                "Debe seleccionar una sucursal para actualizar la configuración del POS",
            },
            { status: 400 },
          );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = posSettingsSchema.parse(body);

        // Check if settings exist
        const { data: existingSettings } = await supabase
          .from("pos_settings")
          .select("id")
          .eq("branch_id", branchContext.branchId!)
          .maybeSingle();

        let result;
        if (existingSettings) {
          // Update existing settings
          const { data: updatedSettings, error: updateError } = await supabase
            .from("pos_settings")
            .update({
              min_deposit_percent: validatedData.min_deposit_percent,
              min_deposit_amount: validatedData.min_deposit_amount,
              updated_at: new Date().toISOString(),
            })
            .eq("branch_id", branchContext.branchId!)
            .select()
            .single();

          if (updateError) {
            logger.error("Error updating POS settings", updateError);
            return NextResponse.json(
              { error: "Error al actualizar configuración" },
              { status: 500 },
            );
          }

          result = updatedSettings;
        } else {
          // Create new settings
          const { data: newSettings, error: insertError } = await supabase
            .from("pos_settings")
            .insert({
              branch_id: branchContext.branchId!,
              min_deposit_percent: validatedData.min_deposit_percent || 50.0,
              min_deposit_amount: validatedData.min_deposit_amount || null,
            })
            .select()
            .single();

          if (insertError) {
            logger.error("Error creating POS settings", insertError);
            return NextResponse.json(
              { error: "Error al crear configuración" },
              { status: 500 },
            );
          }

          result = newSettings;
        }

        logger.info("POS settings updated successfully", {
          branchId: branchContext.branchId,
          settings: result,
        });

        return NextResponse.json({
          success: true,
          settings: {
            min_deposit_percent: result.min_deposit_percent,
            min_deposit_amount: result.min_deposit_amount,
          },
        });
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    logger.error("Error in POS settings PUT API", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
