"use client";

import { memo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Product } from "../hooks/useProducts";

interface ProductTableProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onSelectAll: () => void;
  onDelete: (product: Product) => void;
  formatPrice: (amount: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

function ProductTableComponent({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onDelete,
  formatPrice,
  getStatusBadge,
}: ProductTableProps) {
  const allSelected =
    products.length > 0 && selectedProducts.length === products.length;

  if (products.length === 0) {
    return (
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardContent>
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-tierra-media mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-azul-profundo mb-2">
              No se encontraron productos
            </h3>
            <p className="text-tierra-media">
              Ajusta los filtros o agrega nuevos productos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Productos ({products.length})
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-tierra-media">Seleccionar todos</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => onSelectProduct(product.id)}
                    className="rounded border-gray-300"
                  />
                </TableCell>

                <TableCell>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-tierra-media">
                      {product.slug}
                    </div>
                    {product.is_featured && (
                      <Badge variant="outline" className="text-xs">
                        Destacado
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {product.categories?.name || product.category?.name ? (
                    <Badge variant="outline">
                      {product.categories?.name || product.category?.name}
                    </Badge>
                  ) : (
                    <span className="text-tierra-media">Sin categoría</span>
                  )}
                </TableCell>

                <TableCell className="font-medium">
                  {formatPrice(product.price)}
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>{product.inventory_quantity}</span>
                    {product.inventory_quantity <= 5 && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </TableCell>

                <TableCell>{getStatusBadge(product.status)}</TableCell>

                <TableCell className="text-sm text-tierra-media">
                  {new Date(product.created_at).toLocaleDateString("es-AR")}
                </TableCell>

                <TableCell>
                  <div className="flex space-x-2">
                    <Link href={`/admin/products/${product.slug}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href={`/admin/products/edit/${product.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(product)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Memoize ProductTable to prevent unnecessary re-renders
export default memo(ProductTableComponent);
