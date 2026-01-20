"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Settings,
  FileText,
  Download,
  Upload,
  ChevronDown,
  Trash2,
  Edit,
} from "lucide-react";

interface ProductActionsProps {
  selectedProducts: string[];
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkOperation: () => void;
  onJsonExport: () => void;
  onJsonImport: () => void;
}

export default function ProductActions({
  selectedProducts,
  onClearSelection,
  onBulkDelete,
  onBulkOperation,
  onJsonExport,
  onJsonImport,
}: ProductActionsProps) {
  return (
    <>
      {/* Header Actions */}
      <div className="flex space-x-2">
        <Link href="/admin/products/options">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Opciones
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              JSON
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onJsonExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Productos
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                window.open("/api/admin/products/json-template", "_blank")
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onJsonImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Productos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link href="/admin/products/add">
          <Button className="group btn-enhanced px-6 py-3 lg:px-8 lg:py-4 text-white font-semibold text-sm lg:text-base w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Agregar Producto
          </Button>
        </Link>
      </div>

      {/* Selection Actions */}
      {selectedProducts.length > 0 && (
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">
                  {selectedProducts.length} productos seleccionados
                </Badge>
                <Button variant="outline" size="sm" onClick={onClearSelection}>
                  Limpiar selección
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button variant="destructive" onClick={onBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
                <Button onClick={onBulkOperation}>
                  <Edit className="h-4 w-4 mr-2" />
                  Operaciones Masivas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
