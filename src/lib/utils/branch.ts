/**
 * Utility functions for branch operations
 */

export interface BranchFilter {
  branchId: string | null
  isGlobalView: boolean
  isSuperAdmin: boolean
}

/**
 * Get branch filter for API requests
 */
export function getBranchFilter(
  branchId: string | null,
  isGlobalView: boolean,
  isSuperAdmin: boolean
): BranchFilter {
  return {
    branchId: isGlobalView && isSuperAdmin ? null : branchId,
    isGlobalView,
    isSuperAdmin,
  }
}

/**
 * Format branch name for display
 */
export function formatBranchName(branch: { name: string; code: string } | null): string {
  if (!branch) {
    return 'Vista Global'
  }
  return `${branch.name} (${branch.code})`
}

/**
 * Get branch header for API requests
 */
export function getBranchHeader(branchId: string | null): Record<string, string> {
  if (branchId === null) {
    return { 'x-branch-id': 'global' }
  }
  return { 'x-branch-id': branchId }
}

/**
 * Get branch query param for API requests
 */
export function getBranchQueryParam(branchId: string | null): string {
  if (branchId === null) {
    return 'branch_id=global'
  }
  return `branch_id=${branchId}`
}
