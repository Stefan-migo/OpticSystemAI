"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  AlertTriangle,
  Download,
  Upload,
  Package,
  Settings,
} from "lucide-react";

interface QuickActionsProps {
  onShowLowStock: () => void;
  onJsonExport: () => void;
  onJsonImport: () => void;
  onShowCategories?: () => void;
  hasLowStock: boolean;
  lowStockCount?: number;
}

export default function QuickActions({
  onShowLowStock,
  onJsonExport,
  onJsonImport,
  onShowCategories,
  hasLowStock,
  lowStockCount = 0,
}: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Agregar Nuevo Producto */}
      <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-azul-profundo">
        <CardContent className="p-4">
          <Link href="/admin/products/add" className="block">
            <div className="flex flex-col items-center justify-center text-center space-y-2 min-h-[100px]">
              <div className="p-3 rounded-full bg-azul-profundo/10 group-hover:bg-azul-profundo/20 transition-colors">
                <Plus className="h-6 w-6 text-azul-profundo" />
              </div>
              <div>
                <p className="text-sm font-semibold text-azul-profundo">
                  Nuevo Producto
                </p>
                <p className="text-xs text-tierra-media mt-1">
                  Agregar producto
                </p>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Ver Stock Bajo */}
      <Card
        className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-red-200 dark:border-red-800 hover:border-red-400"
        onClick={onShowLowStock}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center text-center space-y-2 min-h-[100px]">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                Stock Bajo
              </p>
              {hasLowStock && lowStockCount > 0 && (
                <p className="text-xs font-bold text-red-500 mt-1">
                  {lowStockCount} productos
                </p>
              )}
              <p className="text-xs text-tierra-media mt-1">Ver productos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exportar Productos */}
      <Card
        className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-verde-suave/30 hover:border-verde-suave"
        onClick={onJsonExport}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center text-center space-y-2 min-h-[100px]">
            <div className="p-3 rounded-full bg-verde-suave/10 group-hover:bg-verde-suave/20 transition-colors">
              <Download className="h-6 w-6 text-verde-suave" />
            </div>
            <div>
              <p className="text-sm font-semibold text-verde-suave">Exportar</p>
              <p className="text-xs text-tierra-media mt-1">Descargar JSON</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Importar Productos */}
      <Card
        className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-dorado/30 hover:border-dorado"
        onClick={onJsonImport}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center text-center space-y-2 min-h-[100px]">
            <div className="p-3 rounded-full bg-dorado/10 group-hover:bg-dorado/20 transition-colors">
              <Upload className="h-6 w-6 text-dorado" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dorado">Importar</p>
              <p className="text-xs text-tierra-media mt-1">Cargar JSON</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestión de Categorías */}
      <Card
        className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-gray-300 dark:border-gray-600 hover:border-azul-profundo"
        onClick={onShowCategories}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center text-center space-y-2 min-h-[100px]">
            <div className="p-3 rounded-full bg-azul-profundo/10 group-hover:bg-azul-profundo/20 transition-colors">
              <Package className="h-6 w-6 text-azul-profundo" />
            </div>
            <div>
              <p className="text-sm font-semibold text-azul-profundo">
                Categorías
              </p>
              <p className="text-xs text-tierra-media mt-1">Gestionar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opciones de Producto */}
      <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 border-gray-300 dark:border-gray-600 hover:border-azul-profundo">
        <CardContent className="p-4">
          <Link href="/admin/products/options" className="block">
            <div className="flex flex-col items-center justify-center text-center space-y-2 min-h-[100px]">
              <div className="p-3 rounded-full bg-azul-profundo/10 group-hover:bg-azul-profundo/20 transition-colors">
                <Settings className="h-6 w-6 text-azul-profundo" />
              </div>
              <div>
                <p className="text-sm font-semibold text-azul-profundo">
                  Opciones
                </p>
                <p className="text-xs text-tierra-media mt-1">Configurar</p>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
