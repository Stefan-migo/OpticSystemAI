import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { NotificationService } from "@/lib/notifications/notification-service";
import { formatRUT } from "@/lib/utils/rut";
import { getBranchContext, addBranchFilter } from "@/lib/api/branch-middleware";
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

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customer_id");
    const staffId = searchParams.get("staff_id");
    const requestedBranchId = searchParams.get("branch_id"); // Allow explicit branch_id override

    // Determine which branch to filter by
    // If branch_id is explicitly requested (for global view), use it
    // Otherwise use the branch context
    const branchIdToFilter = requestedBranchId || branchContext.branchId;

    // First, fetch basic appointment data (including guest customer fields)
    let query = supabase
      .from("appointments")
      .select(
        "*, guest_first_name, guest_last_name, guest_rut, guest_email, guest_phone",
      )
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    // Apply branch filter
    // If branch_id is explicitly requested, use it even if in global view
    if (requestedBranchId) {
      query = query.eq("branch_id", requestedBranchId);
    } else {
      query = addBranchFilter(
        query,
        branchContext.branchId,
        branchContext.isSuperAdmin,
      );
    }

    if (startDate) {
      query = query.gte("appointment_date", startDate);
    }

    if (endDate) {
      query = query.lte("appointment_date", endDate);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    if (staffId) {
      query = query.eq("assigned_to", staffId);
    }

    const { data: appointments, error } = await query;

    if (error) {
      logger.error("Error fetching appointments", error);
      return NextResponse.json(
        {
          error: "Failed to fetch appointments",
          details: error.message,
        },
        { status: 500 },
      );
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        appointments: [],
      });
    }

    // Fetch related data manually
    const customerIds = [
      ...new Set(appointments.map((a) => a.customer_id).filter(Boolean)),
    ];
    const staffIds = [
      ...new Set(appointments.map((a) => a.assigned_to).filter(Boolean)),
    ];
    const prescriptionIds = [
      ...new Set(appointments.map((a) => a.prescription_id).filter(Boolean)),
    ];
    const orderIds = [
      ...new Set(appointments.map((a) => a.order_id).filter(Boolean)),
    ];

    // Fetch customers
    const { data: customers } =
      customerIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, first_name, last_name, email, phone")
            .in("id", customerIds)
        : { data: [] };

    // Fetch staff
    const { data: staff } =
      staffIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", staffIds)
        : { data: [] };

    // Fetch prescriptions
    const { data: prescriptions } =
      prescriptionIds.length > 0
        ? await supabase
            .from("prescriptions")
            .select("id, prescription_date, prescription_type")
            .in("id", prescriptionIds)
        : { data: [] };

    // Fetch orders
    const { data: orders } =
      orderIds.length > 0
        ? await supabase
            .from("orders")
            .select("id, order_number")
            .in("id", orderIds)
        : { data: [] };

    // Map appointments with related data
    const appointmentsWithRelations = appointments.map((appointment) => ({
      ...appointment,
      customer:
        customers?.find((c) => c.id === appointment.customer_id) || null,
      assigned_staff:
        staff?.find((s) => s.id === appointment.assigned_to) || null,
      prescription:
        prescriptions?.find((p) => p.id === appointment.prescription_id) ||
        null,
      order: orders?.find((o) => o.id === appointment.order_id) || null,
    }));

    return NextResponse.json({
      appointments: appointmentsWithRelations,
    });
  } catch (error) {
    logger.error("Error in appointments API GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Get branch context to assign branch_id to appointment
    const branchContext = await getBranchContext(request, user.id);

    logger.debug("Branch context for appointment creation", {
      branchId: branchContext.branchId,
      isSuperAdmin: branchContext.isSuperAdmin,
      isGlobalView: branchContext.isGlobalView,
    });

    // Validate branch access for non-super admins
    if (!branchContext.isSuperAdmin && !branchContext.branchId) {
      logger.warn("No branch selected for non-super admin");
      return NextResponse.json(
        {
          error: "Debe seleccionar una sucursal para crear citas",
        },
        { status: 400 },
      );
    }

    // For super admins in global view, we need to get branch_id from the request body if provided
    const body = await request.json();

    // If branch_id is provided in body, use it (for super admins)
    const finalBranchId = body.branch_id || branchContext.branchId;

    // Final validation: ensure we have a branch_id (required by database)
    if (!finalBranchId) {
      logger.warn("No branch_id available for appointment creation");
      return NextResponse.json(
        {
          error: "Debe especificar una sucursal para crear la cita",
        },
        { status: 400 },
      );
    }

    // Normalize time format (ensure HH:MM:SS)
    let normalizedTime = body.appointment_time;
    if (normalizedTime) {
      // Remove any extra characters and ensure proper format
      normalizedTime = normalizedTime.trim();

      if (normalizedTime.length === 5 && normalizedTime.includes(":")) {
        // If time is HH:MM, add :00 seconds
        normalizedTime = normalizedTime + ":00";
      } else if (
        normalizedTime.length === 8 &&
        normalizedTime.match(/^\d{2}:\d{2}:\d{2}$/)
      ) {
        // Already in HH:MM:SS format, keep as is
        normalizedTime = normalizedTime;
      } else if (normalizedTime.length > 8) {
        // If longer than HH:MM:SS, truncate to first 8 characters
        normalizedTime = normalizedTime.substring(0, 8);
      }
    }

    if (!normalizedTime || !normalizedTime.match(/^\d{2}:\d{2}:\d{2}$/)) {
      logger.warn("Invalid time format", {
        received: body.appointment_time,
        normalized: normalizedTime,
      });
      return NextResponse.json(
        {
          error: "Formato de hora inválido",
          code: "INVALID_TIME_FORMAT",
          received: body.appointment_time,
          normalized: normalizedTime,
        },
        { status: 400 },
      );
    }

    logger.debug("Checking availability", {
      date: body.appointment_date,
      time: normalizedTime,
      originalTime: body.appointment_time,
      duration: body.duration_minutes || 30,
    });

    // Check availability using the function
    // Ensure time is in correct format for PostgreSQL TIME type
    const timeForRPC = normalizedTime.substring(0, 8); // Ensure HH:MM:SS format (max 8 chars)

    logger.debug("Calling RPC with", {
      p_date: body.appointment_date,
      p_time: timeForRPC,
      p_duration_minutes: body.duration_minutes || 30,
      p_appointment_id: null,
      p_staff_id: body.assigned_to || null,
    });

    // Try calling the RPC function
    let isAvailable = false;
    let availabilityError = null;

    try {
      // Only check availability if branch_id is set (required for non-super admins)
      // For super admins in global view, skip availability check or use a default branch
      const rpcParams: any = {
        p_date: body.appointment_date,
        p_time: timeForRPC,
        p_duration_minutes: body.duration_minutes || 30,
        p_appointment_id: null,
        p_staff_id: body.assigned_to || null,
      };

      // Always add branch_id (required for availability check)
      rpcParams.p_branch_id = finalBranchId;

      const rpcResult = await supabaseServiceRole.rpc(
        "check_appointment_availability",
        rpcParams,
      );

      // Supabase RPC returns { data, error } structure
      isAvailable = rpcResult.data;
      availabilityError = rpcResult.error;

      logger.debug("RPC Result", {
        data: rpcResult.data,
        dataType: typeof rpcResult.data,
        error: rpcResult.error,
        hasData: rpcResult.data !== null && rpcResult.data !== undefined,
      });
    } catch (err: any) {
      logger.error("Exception calling RPC", err);
      availabilityError = err;
    }

    if (availabilityError) {
      logger.error("Error checking availability", availabilityError);
      return NextResponse.json(
        {
          error: "Error checking availability",
          details: availabilityError.message || availabilityError.toString(),
        },
        { status: 500 },
      );
    }

    logger.debug("Availability check result", { isAvailable });
    logger.debug("Check parameters", {
      p_date: body.appointment_date,
      p_time: timeForRPC,
      p_duration_minutes: body.duration_minutes || 30,
      p_appointment_id: null,
      p_staff_id: body.assigned_to || null,
    });

    // Handle boolean result - Supabase might return it as a string 't'/'f' or boolean
    let available = false;
    if (typeof isAvailable === "boolean") {
      available = isAvailable;
    } else if (typeof isAvailable === "string") {
      available =
        isAvailable === "t" || isAvailable === "true" || isAvailable === "1";
    } else if (isAvailable !== null && isAvailable !== undefined) {
      available = Boolean(isAvailable);
    }

    logger.debug("Final availability", {
      raw: isAvailable,
      processed: available,
      type: typeof isAvailable,
    });

    if (!available) {
      logger.warn("Slot not available", {
        date: body.appointment_date,
        time: normalizedTime,
        timeForRPC,
        duration: body.duration_minutes,
        rawResult: isAvailable,
      });

      return NextResponse.json(
        {
          error: "El horario seleccionado no está disponible",
          code: "SLOT_NOT_AVAILABLE",
          details: {
            date: body.appointment_date,
            time: normalizedTime,
            duration: body.duration_minutes,
            rawAvailabilityResult: isAvailable,
          },
        },
        { status: 400 },
      );
    }

    // Handle guest customer (non-registered) - store data directly in appointment
    let customerId = body.customer_id || null;
    let guestData = null;

    if (body.guest_customer) {
      const guest = body.guest_customer;

      // Validate required fields
      if (!guest.first_name || !guest.last_name || !guest.rut) {
        return NextResponse.json(
          {
            error:
              "Nombre, apellido y RUT son obligatorios para clientes no registrados",
          },
          { status: 400 },
        );
      }

      // Format RUT to standard format
      const formattedRUT = formatRUT(guest.rut);

      // Store guest data directly in appointment (no customer creation)
      guestData = {
        guest_first_name: guest.first_name.trim(),
        guest_last_name: guest.last_name.trim(),
        guest_rut: formattedRUT,
        guest_email: guest.email?.trim() || null,
        guest_phone: guest.phone?.trim() || null,
      };

      logger.debug(
        "Creating appointment with guest customer (not registered)",
        guestData,
      );
    }

    // Create appointment
    const appointmentData: any = {
      customer_id: customerId, // NULL for guest customers
      appointment_date: body.appointment_date,
      appointment_time: normalizedTime,
      duration_minutes: body.duration_minutes || 30,
      appointment_type: body.appointment_type || "consultation",
      status: body.status || "scheduled",
      assigned_to: body.assigned_to || null,
      notes: body.notes || null,
      reason: body.reason || null,
      prescription_id: body.prescription_id || null,
      order_id: body.order_id || null,
      follow_up_required: body.follow_up_required || false,
      follow_up_date: body.follow_up_date || null,
      created_by: user.id,
      branch_id: finalBranchId, // Always include branch_id (required by database)
    };

    // Add guest customer data if present
    if (guestData) {
      Object.assign(appointmentData, guestData);
    }

    logger.debug("Inserting appointment with data", { appointmentData });

    // Insert appointment first without the customer relation (to avoid issues with NULL customer_id)
    const { data: appointment, error: appointmentError } =
      await supabaseServiceRole
        .from("appointments")
        .insert(appointmentData)
        .select("*")
        .single();

    if (appointmentError) {
      logger.error("Error creating appointment", appointmentError, {
        errorDetails: JSON.stringify(appointmentError, null, 2),
        appointmentData: JSON.stringify(appointmentData, null, 2),
      });
      return NextResponse.json(
        {
          error: "Failed to create appointment",
          details: appointmentError.message,
          code: appointmentError.code,
          hint: appointmentError.hint,
        },
        { status: 500 },
      );
    }

    logger.info("Appointment created successfully", {
      appointmentId: appointment.id,
    });

    // Fetch customer separately if customer_id exists
    let customer = null;
    if (appointment.customer_id) {
      const { data: customerData } = await supabaseServiceRole
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .eq("id", appointment.customer_id)
        .maybeSingle();
      customer = customerData;
    }

    // Add customer to appointment object
    const appointmentWithCustomer = {
      ...appointment,
      customer,
    };

    // Create notification for new appointment (non-blocking)
    if (appointmentWithCustomer) {
      // Get customer name from registered customer or guest data
      let customerName = "Cliente";
      if (appointmentWithCustomer.customer) {
        customerName =
          `${appointmentWithCustomer.customer.first_name || ""} ${appointmentWithCustomer.customer.last_name || ""}`.trim() ||
          appointmentWithCustomer.customer.email ||
          "Cliente";
      } else if (
        appointmentWithCustomer.guest_first_name &&
        appointmentWithCustomer.guest_last_name
      ) {
        customerName =
          `${appointmentWithCustomer.guest_first_name} ${appointmentWithCustomer.guest_last_name}`.trim();
      }

      NotificationService.notifyNewAppointment(
        appointmentWithCustomer.id,
        customerName,
        appointmentWithCustomer.appointment_date,
        appointmentWithCustomer.appointment_time,
      ).catch((err) => logger.error("Error creating notification", err));
    }

    return NextResponse.json(
      {
        success: true,
        appointment: appointmentWithCustomer,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Error in appointments POST API", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
