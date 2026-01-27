import { useBranchContext } from "@/contexts/BranchContext";

/**
 * Hook para acceder al contexto de sucursales (branches)
 *
 * Proporciona acceso conveniente a la sucursal actual y operaciones relacionadas.
 * Este hook es esencial para la funcionalidad multi-sucursal de la aplicación.
 *
 * @returns Objeto con información y utilidades de sucursales:
 * - `currentBranchId`: ID de la sucursal actual (null si no hay sucursal seleccionada)
 * - `currentBranchName`: Nombre de la sucursal actual o 'Vista Global' / 'Sin sucursal'
 * - `currentBranch`: Objeto completo de la sucursal actual
 * - `branches`: Array de todas las sucursales disponibles
 * - `isSuperAdmin`: Si el usuario es super administrador
 * - `isGlobalView`: Si está en vista global (sin sucursal específica)
 * - `canSwitchBranch`: Si el usuario puede cambiar de sucursal
 * - `hasMultipleBranches`: Si hay múltiples sucursales disponibles
 * - `switchBranch`: Función para cambiar de sucursal
 * - `refreshBranches`: Función para refrescar la lista de sucursales
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { currentBranchId, isSuperAdmin, switchBranch } = useBranch()
 *
 *   if (isSuperAdmin) {
 *     // Mostrar selector de sucursales
 *   }
 *
 *   // Usar currentBranchId en queries
 *   const { data } = useQuery({
 *     queryKey: ['products', currentBranchId],
 *     // ...
 *   })
 * }
 * ```
 *
 * @see {@link BranchContext} Para más detalles sobre el contexto de sucursales
 */
export function useBranch() {
  const context = useBranchContext();

  return {
    ...context,
    currentBranchId: context.currentBranch?.id || null,
    currentBranchName:
      context.currentBranch?.name ||
      (context.isGlobalView ? "Vista Global" : "Sin sucursal"),
    canSwitchBranch: context.branches.length > 1 || context.isSuperAdmin,
    hasMultipleBranches: context.branches.length > 1,
  };
}
