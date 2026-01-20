"use client";

import { useQuery } from "@tanstack/react-query";
import { getBranchHeader } from "@/lib/utils/branch";

interface Product {
  id: string;
  price: number;
  status: string;
  inventory_quantity: number;
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  totalValue: number;
}

interface FetchStatsParams {
  currentBranchId: string | null;
  isGlobalView: boolean;
  isSuperAdmin: boolean;
}

const fetchProductStats = async ({
  currentBranchId,
  isGlobalView,
  isSuperAdmin,
}: FetchStatsParams): Promise<ProductStats> => {
  const params = new URLSearchParams({
    limit: "10000",
    include_archived: "true",
  });

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (currentBranchId) {
    headers["x-branch-id"] = currentBranchId;
  } else if (isGlobalView && isSuperAdmin) {
    headers["x-branch-id"] = "global";
  }

  const response = await fetch(`/api/admin/products?${params}`, { headers });

  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }

  const data = await response.json();
  const allProducts = (data.products || []) as Product[];

  return {
    totalProducts: allProducts.length,
    activeProducts: allProducts.filter(
      (p) => p.status === "active" || !p.status,
    ).length,
    lowStockCount: allProducts.filter((p) => (p.inventory_quantity || 0) <= 5)
      .length,
    totalValue: allProducts.reduce(
      (sum, p) => sum + (p.price || 0) * (p.inventory_quantity || 0),
      0,
    ),
  };
};

export function useProductStats(params: FetchStatsParams) {
  const query = useQuery({
    queryKey: ["productStats", params.currentBranchId, params.isGlobalView],
    queryFn: () => fetchProductStats(params),
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    stats: query.data || {
      totalProducts: 0,
      activeProducts: 0,
      lowStockCount: 0,
      totalValue: 0,
    },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
