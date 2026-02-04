import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { getBranchContext } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";

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

    const { data: isAdmin } = (await supabase.rpc("is_admin", {
      user_id: user.id,
    } as IsAdminParams)) as { data: IsAdminResult | null; error: Error | null };
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    // Get schedule settings for current branch (or default if no branch selected)
    let query = supabase.from("schedule_settings").select("*");

    if (branchContext.branchId) {
      query = query.eq("branch_id", branchContext.branchId);
    } else {
      // If no branch selected or global view, get default settings (branch_id IS NULL)
      query = query.is("branch_id", null);
    }

    const { data: settings, error } = await query.limit(1).maybeSingle();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      logger.error("Error fetching schedule settings:", {
        error,
        branchId: branchContext.branchId,
      });
      return NextResponse.json(
        {
          error: "Failed to fetch schedule settings",
          details: error.message,
        },
        { status: 500 },
      );
    }

    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        settings: {
          slot_duration_minutes: 15,
          default_appointment_duration: 30,
          buffer_time_minutes: 0,
          working_hours: {
            monday: {
              enabled: true,
              start_time: "09:00",
              end_time: "18:00",
              lunch_start: null,
              lunch_end: null,
            },
            tuesday: {
              enabled: true,
              start_time: "09:00",
              end_time: "18:00",
              lunch_start: null,
              lunch_end: null,
            },
            wednesday: {
              enabled: true,
              start_time: "09:00",
              end_time: "18:00",
              lunch_start: null,
              lunch_end: null,
            },
            thursday: {
              enabled: true,
              start_time: "09:00",
              end_time: "18:00",
              lunch_start: null,
              lunch_end: null,
            },
            friday: {
              enabled: true,
              start_time: "09:00",
              end_time: "18:00",
              lunch_start: null,
              lunch_end: null,
            },
            saturday: {
              enabled: false,
              start_time: "09:00",
              end_time: "13:00",
              lunch_start: null,
              lunch_end: null,
            },
            sunday: {
              enabled: false,
              start_time: "09:00",
              end_time: "13:00",
              lunch_start: null,
              lunch_end: null,
            },
          },
          blocked_dates: [],
          min_advance_booking_hours: 2,
          max_advance_booking_days: 90,
          staff_specific_settings: {},
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    logger.error("Error in schedule settings API:", { error });
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

    const { data: isAdmin } = (await supabase.rpc("is_admin", {
      user_id: user.id,
    } as IsAdminParams)) as { data: IsAdminResult | null; error: Error | null };
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    const body = await request.json();

    // Check if settings exist for this branch
    const { data: existingSettings } = await supabaseServiceRole
      .from("schedule_settings")
      .select("id")
      .eq("branch_id", branchContext.branchId)
      .maybeSingle();

    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (body.slot_duration_minutes !== undefined)
      updateData.slot_duration_minutes = body.slot_duration_minutes;
    if (body.default_appointment_duration !== undefined)
      updateData.default_appointment_duration =
        body.default_appointment_duration;
    if (body.buffer_time_minutes !== undefined)
      updateData.buffer_time_minutes = body.buffer_time_minutes;
    if (body.working_hours !== undefined)
      updateData.working_hours = body.working_hours;
    if (body.blocked_dates !== undefined)
      updateData.blocked_dates = body.blocked_dates;
    if (body.min_advance_booking_hours !== undefined)
      updateData.min_advance_booking_hours = body.min_advance_booking_hours;
    if (body.max_advance_booking_days !== undefined)
      updateData.max_advance_booking_days = body.max_advance_booking_days;
    if (body.staff_specific_settings !== undefined)
      updateData.staff_specific_settings = body.staff_specific_settings;

    let result;

    // GLOBAL UPDATE LOGIC for Super Admins
    if (!branchContext.branchId && branchContext.isSuperAdmin) {
      logger.info("Global Schedule settings update initiated", {
        organizationId: branchContext.organizationId,
      });

      // 1. Update organization-level settings (using branch_id NULL but with organization_id)
      const { data: orgSettings, error: orgError } = await supabaseServiceRole
        .from("schedule_settings")
        .upsert(
          {
            organization_id: branchContext.organizationId,
            branch_id: null,
            ...updateData,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          },
          { onConflict: "organization_id" },
        )
        .select()
        .single();

      if (orgError) {
        logger.error(
          "Error updating global organization schedule settings",
          orgError,
        );
        return NextResponse.json(
          { error: "Error al actualizar configuración global de horarios" },
          { status: 500 },
        );
      }

      // 2. Sync ALL branches of the organization
      const { data: branches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", branchContext.organizationId!);

      if (branches && branches.length > 0) {
        const branchIds = branches.map((b) => b.id);

        for (const bId of branchIds) {
          await supabaseServiceRole.from("schedule_settings").upsert(
            {
              branch_id: bId,
              organization_id: branchContext.organizationId,
              ...updateData,
              updated_at: new Date().toISOString(),
              updated_by: user.id,
            },
            { onConflict: "branch_id" },
          );
        }
      }

      result = orgSettings;
    } else if (branchContext.branchId) {
      // BRANCH-SPECIFIC UPDATE
      if (existingSettings) {
        // Update existing
        const { data, error } = await supabaseServiceRole
          .from("schedule_settings")
          .update({
            ...updateData,
            organization_id: branchContext.organizationId,
          })
          .eq("id", existingSettings.id)
          .select()
          .single();

        if (error) {
          logger.error("Error updating schedule settings:", {
            error,
            branchId: branchContext.branchId,
            settingsId: existingSettings.id,
          });
          return NextResponse.json(
            {
              error: "Failed to update schedule settings",
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
          organization_id: branchContext.organizationId,
          branch_id: branchContext.branchId,
        };

        const { data, error } = await supabaseServiceRole
          .from("schedule_settings")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          logger.error("Error creating schedule settings:", {
            error,
            branchId: branchContext.branchId,
          });
          return NextResponse.json(
            {
              error: "Failed to create schedule settings",
              details: error.message,
            },
            { status: 500 },
          );
        }

        result = data;
      }
    } else {
      return NextResponse.json(
        { error: "Debe seleccionar una sucursal o ser super administrador" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      settings: result,
    });
  } catch (error) {
    logger.error("Error in schedule settings PUT API:", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
