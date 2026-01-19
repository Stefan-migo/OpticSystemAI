import { useBranchContext } from '@/contexts/BranchContext'

/**
 * Hook to access branch context
 * Provides convenient access to current branch and branch operations
 */
export function useBranch() {
  const context = useBranchContext()

  return {
    ...context,
    currentBranchId: context.currentBranch?.id || null,
    currentBranchName: context.currentBranch?.name || (context.isGlobalView ? 'Vista Global' : 'Sin sucursal'),
    canSwitchBranch: context.branches.length > 1 || context.isSuperAdmin,
    hasMultipleBranches: context.branches.length > 1,
  }
}
