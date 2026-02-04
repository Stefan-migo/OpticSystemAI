import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { appLogger as logger } from "@/lib/logger";

/**
 * GET /api/admin/saas-management/payments
 * Obtiene la configuración de todas las pasarelas
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar que es super_admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      adminUser?.role !== "super_admin" &&
      adminUser?.role !== "root" &&
      adminUser?.role !== "dev"
    ) {
      logger.warn("Acceso denegado a SaaS Payments", {
        userId: user.id,
        userEmail: user.email,
        role: adminUser?.role || "sin-registro",
      });
      return NextResponse.json(
        {
          error: "Prohibido: Se requiere rol de Super Admin, Root o Dev",
          debug: { role: adminUser?.role || "no-role" },
        },
        { status: 403 },
      );
    }

    const { data: gateways, error } = await supabase
      .from("payment_gateways_config")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ gateways });
  } catch (error) {
    logger.error("Error al obtener config de pasarelas", error as Error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/saas-management/payments
 * Actualiza el estado de una pasarela
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, is_enabled, display_order, name, description } = body;

    if (!id)
      return NextResponse.json(
        { error: "ID de pasarela requerido" },
        { status: 400 },
      );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      adminUser?.role !== "super_admin" &&
      adminUser?.role !== "root" &&
      adminUser?.role !== "dev"
    ) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("payment_gateways_config")
      .update({
        is_enabled,
        display_order,
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    logger.info("Configuración de pasarela actualizada", {
      gateway: data.gateway_id,
      enabled: data.is_enabled,
    });

    return NextResponse.json({ success: true, gateway: data });
  } catch (error) {
    logger.error("Error al actualizar pasarela", error as Error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
