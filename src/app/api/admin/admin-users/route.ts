import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getBranchContext } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const supabase = await createClient();

    // Check admin authorization (only admins can manage admin users)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRole } = await supabase.rpc("get_admin_role", {
      user_id: user.id,
    });
    if (adminRole !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Build the query - include branch access info
    let query = supabase.from("admin_users").select(`
        id,
        email,
        role,
        permissions,
        is_active,
        last_login,
        created_at,
        updated_at,
        admin_branch_access (
          id,
          branch_id,
          role,
          is_primary,
          branches (
            id,
            name,
            code
          )
        )
      `);

    // Apply filters
    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    if (status && status !== "all") {
      const isActive = status === "active";
      query = query.eq("is_active", isActive);
    }

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    const { data: adminUsers, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      logger.error("Error fetching admin users", error);
      return NextResponse.json(
        { error: "Failed to fetch admin users" },
        { status: 500 },
      );
    }

    // Get activity stats for each admin user
    const { data: activityStats } = await supabase
      .from("admin_activity_log")
      .select("admin_user_id, created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ); // Last 30 days

    const activityMap =
      activityStats?.reduce((acc: any, activity) => {
        if (!acc[activity.admin_user_id]) {
          acc[activity.admin_user_id] = 0;
        }
        acc[activity.admin_user_id]++;
        return acc;
      }, {}) || {};

    // Get profiles for full names
    const adminIds = adminUsers?.map((admin) => admin.id) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone")
      .in("id", adminIds);

    const profilesMap =
      profiles?.reduce((acc: any, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {}) || {};

    // Enhance admin users with analytics and branch info
    const adminUsersWithStats =
      adminUsers?.map((admin: any) => {
        const branchAccess = admin.admin_branch_access || [];
        const isSuperAdmin = branchAccess.some(
          (access: any) => access.branch_id === null,
        );
        const branches = branchAccess
          .filter((access: any) => access.branch_id !== null)
          .map((access: any) => ({
            id: access.branch_id,
            name: access.branches?.name || "N/A",
            code: access.branches?.code || "N/A",
            is_primary: access.is_primary,
          }));

        const profile = profilesMap[admin.id];
        const fullName = profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
            null
          : null;

        return {
          ...admin,
          is_super_admin: isSuperAdmin,
          branches: branches,
          analytics: {
            activityCount30Days: activityMap[admin.id] || 0,
            lastActivity: admin.last_login,
            fullName: fullName,
          },
          profiles: profile
            ? {
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone,
              }
            : null,
        };
      }) || [];

    return NextResponse.json({ adminUsers: adminUsersWithStats });
  } catch (error) {
    logger.error("Error in admin users API GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      role,
      permissions,
      is_active = true,
      is_super_admin = false,
      branch_ids = [],
    } = body;

    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRole } = await supabase.rpc("get_admin_role", {
      user_id: user.id,
    });
    if (adminRole !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get branch context to check if requester is super admin
    const branchContext = await getBranchContext(request, user.id);

    // Only super admins can create super admins
    if (is_super_admin && !branchContext.isSuperAdmin) {
      return NextResponse.json(
        {
          error:
            "Solo los super administradores pueden otorgar permisos de super administrador",
        },
        { status: 403 },
      );
    }

    // Validate: if not super admin, must have at least one branch
    if (!is_super_admin && (!branch_ids || branch_ids.length === 0)) {
      return NextResponse.json(
        {
          error: "Debe asignar al menos una sucursal al administrador",
        },
        { status: 400 },
      );
    }

    // Validate input
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Set role to 'admin' (simplified system)
    const finalRole = "admin";

    // Check if user exists in profiles table (linked to auth.users)
    const { data: existingUser, error: userCheckError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (userCheckError) {
      logger.error("Error checking user existence", userCheckError);
      return NextResponse.json(
        {
          error: "Error verifying user. Please try again.",
        },
        { status: 500 },
      );
    }

    if (!existingUser) {
      return NextResponse.json(
        {
          error:
            "User must be registered first. The user needs to sign up before being granted admin access.",
        },
        { status: 400 },
      );
    }

    // Check if user is already an admin
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from("admin_users")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (adminCheckError) {
      logger.error("Error checking admin existence", adminCheckError);
      return NextResponse.json(
        {
          error: "Error verifying admin status. Please try again.",
        },
        { status: 500 },
      );
    }

    if (existingAdmin) {
      return NextResponse.json(
        { error: "User is already an admin" },
        { status: 400 },
      );
    }

    // Default permissions for admin role (full access)
    const defaultPermissions = getDefaultPermissions("admin");
    const finalPermissions = permissions || defaultPermissions;

    // Create admin user
    const { data: newAdmin, error: createError } = await supabase
      .from("admin_users")
      .insert({
        id: existingUser.id,
        email: existingUser.email,
        role: finalRole,
        permissions: finalPermissions,
        is_active,
      })
      .select(
        `
        id,
        email,
        role,
        permissions,
        is_active,
        created_at,
        updated_at
      `,
      )
      .single();

    if (createError) {
      logger.error("Error creating admin user", createError);
      return NextResponse.json(
        {
          error: "Failed to create admin user",
          details: createError.message,
        },
        { status: 500 },
      );
    }

    // Assign branch access
    if (is_super_admin) {
      // Create super admin access (branch_id = null)
      const { error: accessError } = await supabase
        .from("admin_branch_access")
        .insert({
          admin_user_id: newAdmin.id,
          branch_id: null,
          role: "manager",
          is_primary: true,
        });

      if (accessError) {
        logger.error("Error assigning super admin access", accessError);
        // Rollback admin user creation
        await supabase.from("admin_users").delete().eq("id", newAdmin.id);
        return NextResponse.json(
          {
            error: "Failed to assign super admin access",
            details: accessError.message,
          },
          { status: 500 },
        );
      }
    } else {
      // Assign branch access for each branch
      if (branch_ids && branch_ids.length > 0) {
        const accessRecords = branch_ids.map(
          (branchId: string, index: number) => ({
            admin_user_id: newAdmin.id,
            branch_id: branchId,
            role: "manager",
            is_primary: index === 0, // First branch is primary
          }),
        );

        const { error: accessError } = await supabase
          .from("admin_branch_access")
          .insert(accessRecords);

        if (accessError) {
          logger.error("Error assigning branch access", accessError);
          // Rollback admin user creation
          await supabase.from("admin_users").delete().eq("id", newAdmin.id);
          return NextResponse.json(
            {
              error: "Failed to assign branch access",
              details: accessError.message,
            },
            { status: 500 },
          );
        }
      }
    }

    // Log admin activity (don't fail if logging fails)
    try {
      await supabase.rpc("log_admin_activity", {
        action: "create_admin_user",
        resource_type: "admin_user",
        resource_id: newAdmin.id,
        details: {
          new_admin_email: email,
          role: "admin",
          is_super_admin,
          branch_ids: is_super_admin ? null : branch_ids,
          created_by: user.email,
        },
      });
    } catch (logError) {
      logger.warn("Error logging admin activity (non-critical)", logError);
      // Continue anyway, logging failure shouldn't block admin creation
    }

    return NextResponse.json({ adminUser: newAdmin });
  } catch (error) {
    logger.error("Error in create admin user API", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper function to get default permissions for admin role
function getDefaultPermissions(role: string) {
  // Simplified: all admins have full access
  return {
    orders: ["read", "create", "update", "delete"],
    products: ["read", "create", "update", "delete"],
    customers: ["read", "create", "update", "delete"],
    analytics: ["read"],
    settings: ["read", "create", "update", "delete"],
    admin_users: ["read", "create", "update", "delete"],
    support: ["read", "create", "update", "delete"],
    bulk_operations: ["read", "create", "update", "delete"],
  };
}
