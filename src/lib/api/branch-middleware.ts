import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export interface BranchContext {
  branchId: string | null;
  isGlobalView: boolean;
  isSuperAdmin: boolean;
  accessibleBranches: Array<{
    id: string;
    name: string;
    code: string;
    role: string;
    isPrimary: boolean;
  }>;
}

/**
 * Extract branch_id from request (header, query param, or user context)
 */
export async function getBranchFromRequest(
  request: NextRequest,
): Promise<string | null> {
  // Try header first
  const headerBranchId = request.headers.get("x-branch-id");
  if (headerBranchId) {
    return headerBranchId;
  }

  // Try query parameter
  const { searchParams } = new URL(request.url);
  const queryBranchId = searchParams.get("branch_id");
  if (queryBranchId) {
    return queryBranchId;
  }

  return null;
}

/**
 * Get branch context for the current user
 */
export async function getBranchContext(
  request: NextRequest,
  userId: string,
): Promise<BranchContext> {
  const supabase = await createClient();

  // Check if user is super admin
  const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", {
    user_id: userId,
  });

  // Get user's accessible branches
  const { data: branches, error } = await supabase.rpc("get_user_branches", {
    user_id: userId,
  });

  if (error) {
    console.error("Error fetching user branches:", error);
    return {
      branchId: null,
      isGlobalView: false,
      isSuperAdmin: false,
      accessibleBranches: [],
    };
  }

  const accessibleBranches = (branches || []).map((b: any) => ({
    id: b.branch_id,
    name: b.branch_name,
    code: b.branch_code,
    role: b.role,
    isPrimary: b.is_primary,
  }));

  // Get requested branch from request
  const requestedBranchId = await getBranchFromRequest(request);

  // Determine current branch
  let branchId: string | null = null;
  let isGlobalView = false;

  if (isSuperAdmin) {
    // Super admin can use global view or specific branch
    if (requestedBranchId === "global" || requestedBranchId === null) {
      isGlobalView = true;
      branchId = null;
    } else if (requestedBranchId) {
      branchId = requestedBranchId;
      isGlobalView = false;
    } else {
      // Default to global view for super admin
      isGlobalView = true;
      branchId = null;
    }
  } else {
    // Regular admin must use a specific branch
    if (requestedBranchId) {
      // Validate access
      const hasAccess = accessibleBranches.some(
        (b: { id: string }) => b.id === requestedBranchId,
      );
      if (hasAccess) {
        branchId = requestedBranchId;
      } else {
        // Use primary branch if access denied
        const primaryBranch = accessibleBranches.find(
          (b: { isPrimary?: boolean }) => b.isPrimary,
        );
        branchId = primaryBranch?.id || accessibleBranches[0]?.id || null;
      }
    } else {
      // Use primary branch or first available
      const primaryBranch = accessibleBranches.find(
        (b: { isPrimary?: boolean }) => b.isPrimary,
      );
      branchId = primaryBranch?.id || accessibleBranches[0]?.id || null;
    }
  }

  return {
    branchId,
    isGlobalView,
    isSuperAdmin: isSuperAdmin || false,
    accessibleBranches,
  };
}

/**
 * Validate that user can access a specific branch
 */
export async function validateBranchAccess(
  userId: string,
  branchId: string | null,
): Promise<boolean> {
  if (branchId === null) {
    // Only super admin can access global view
    const supabase = await createClient();
    const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", {
      user_id: userId,
    });
    return isSuperAdmin || false;
  }

  const supabase = await createClient();
  const { data: canAccess } = await supabase.rpc("can_access_branch", {
    user_id: userId,
    p_branch_id: branchId,
  });

  return canAccess || false;
}

/**
 * Add branch filter to a Supabase query
 */
export function addBranchFilter(
  query: any,
  branchId: string | null,
  isSuperAdmin: boolean,
) {
  if (isSuperAdmin && branchId === null) {
    // Super admin in global view sees everything (including products without branch_id)
    return query;
  }

  if (branchId) {
    // Filter by specific branch - exclude products without branch_id (legacy)
    return query.eq("branch_id", branchId);
  }

  // No branch selected and not super admin - return empty result
  // This should not happen in normal flow, but return empty to be safe
  return query.eq("branch_id", "00000000-0000-0000-0000-000000000000"); // Non-existent UUID to return empty
}
