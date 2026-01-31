import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
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
      // Silently return 401 - this is expected when user is not authenticated
      // Don't log as error since this happens during initial page load
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: isAdmin, error: adminCheckError } = await supabase.rpc(
      "is_admin",
      { user_id: user.id },
    );
    if (adminCheckError) {
      logger.error("Admin check error", adminCheckError);
      return NextResponse.json(
        { error: "Admin verification failed" },
        { status: 500 },
      );
    }
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Root/super admin only sees SaaS-related notifications (Gestión SaaS Opttius)
    const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", {
      user_id: user.id,
    });

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const unreadOnly = url.searchParams.get("unread_only") === "true";
    const type = url.searchParams.get("type");

    const isRoot = !!isSuperAdmin;

    // Root: only SaaS (target_admin_role=root or assigned SaaS ticket). No óptica notifications.
    // Non-root: only own + broadcast-to-all (exclude root-only). Then filter by branch when possible.
    let query = supabase
      .from("admin_notifications")
      .select("*", { count: "exact" })
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (isRoot) {
      const baseFilter = `target_admin_role.eq.root,and(target_admin_id.eq.${user.id},related_entity_type.eq.saas_support_ticket)`;
      query = query.or(baseFilter);
    } else {
      // Exclude root-only: (target_admin_id = me) OR (target_admin_id null AND target_admin_role null)
      const visibilityFilter = `target_admin_id.eq.${user.id},and(target_admin_id.is.null,target_admin_role.is.null)`;
      query = query.or(visibilityFilter);

      // Each óptica only sees notifications for their org: branch_id null (legacy) or branch_id in user's branches
      const { data: userBranches } = await supabase.rpc("get_user_branches", {
        user_id: user.id,
      });
      const branchIds = (userBranches || [])
        .map((r: { branch_id: string }) => r.branch_id)
        .filter(Boolean);
      if (branchIds.length > 0) {
        query = query.or(
          `branch_id.is.null,branch_id.in.(${branchIds.join(",")})`,
        );
      }
      // If user has no branches (edge case), only show branch_id null
      else {
        query = query.is("branch_id", null);
      }
    }

    // Apply filters
    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      logger.error("Error fetching notifications", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    // Unread count with same filters
    let unreadCount: number;
    if (isRoot) {
      const baseFilter = `target_admin_role.eq.root,and(target_admin_id.eq.${user.id},related_entity_type.eq.saas_support_ticket)`;
      const { count: rootUnread } = await supabase
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .or(baseFilter)
        .eq("is_archived", false)
        .eq("is_read", false);
      unreadCount = rootUnread ?? 0;
    } else {
      const visibilityFilter = `target_admin_id.eq.${user.id},and(target_admin_id.is.null,target_admin_role.is.null)`;
      let countQuery = supabase
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .or(visibilityFilter)
        .eq("is_archived", false)
        .eq("is_read", false);
      const { data: userBranches } = await supabase.rpc("get_user_branches", {
        user_id: user.id,
      });
      const branchIds = (userBranches || [])
        .map((r: { branch_id: string }) => r.branch_id)
        .filter(Boolean);
      if (branchIds.length > 0) {
        countQuery = countQuery.or(
          `branch_id.is.null,branch_id.in.(${branchIds.join(",")})`,
        );
      } else {
        countQuery = countQuery.is("branch_id", null);
      }
      const { count: nonRootUnread } = await countQuery;
      unreadCount = nonRootUnread ?? 0;
    }

    return NextResponse.json({
      notifications: notifications || [],
      count: count || 0,
      unreadCount,
    });
  } catch (error) {
    logger.error("Error in notifications API GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error("Auth error in notifications PATCH", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: isAdmin, error: adminCheckError } = await supabase.rpc(
      "is_admin",
      { user_id: user.id },
    );
    if (adminCheckError) {
      logger.error("Admin check error", adminCheckError);
      return NextResponse.json(
        { error: "Admin verification failed" },
        { status: 500 },
      );
    }
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { notificationId, markAllRead } = await request.json();

    if (markAllRead) {
      // Mark all notifications as read
      await supabase.rpc("mark_all_notifications_read");

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (notificationId) {
      // Mark specific notification as read
      await supabase.rpc("mark_notification_read", {
        notification_id: notificationId,
      });

      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    logger.error("Error updating notification", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
