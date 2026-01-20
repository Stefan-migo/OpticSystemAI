"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

interface ProductStatsProps {
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockCount: number;
    totalValue: number;
  };
  statsLabel: string;
  formatPrice: (amount: number) => string;
}

export default function ProductStats({
  stats,
  statsLabel,
  formatPrice,
}: ProductStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-azul-profundo" />
            <div className="ml-4">
              <p className="text-sm font-medium text-tierra-media">
                Total Productos
              </p>
              <p className="text-2xl font-bold text-azul-profundo">
                {stats.totalProducts}
              </p>
              <p className="text-xs text-tierra-media mt-1">{statsLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardContent className="p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-verde-suave" />
            <div className="ml-4">
              <p className="text-sm font-medium text-tierra-media">
                Productos Activos
              </p>
              <p className="text-2xl font-bold text-verde-suave">
                {stats.activeProducts}
              </p>
              <p className="text-xs text-tierra-media mt-1">{statsLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardContent className="p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-tierra-media">
                Stock Bajo
              </p>
              <p className="text-2xl font-bold text-red-500">
                {stats.lowStockCount}
              </p>
              <p className="text-xs text-tierra-media mt-1">{statsLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardContent className="p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-dorado" />
            <div className="ml-4">
              <p className="text-sm font-medium text-tierra-media">
                Valor Total
              </p>
              <p className="text-2xl font-bold text-dorado">
                {formatPrice(stats.totalValue)}
              </p>
              <p className="text-xs text-tierra-media mt-1">{statsLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
