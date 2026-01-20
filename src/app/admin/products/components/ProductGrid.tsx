"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Product } from "../hooks/useProducts";

interface ProductGridProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onDelete: (product: Product) => void;
  formatPrice: (amount: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

export default function ProductGrid({
  products,
  selectedProducts,
  onSelectProduct,
  onDelete,
  formatPrice,
  getStatusBadge,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-tierra-media">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card
          key={product.id}
          className="transition-all duration-200 hover:shadow-md"
          style={{ backgroundColor: "var(--admin-bg-tertiary)" }}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => onSelectProduct(product.id)}
                    className="rounded border-gray-300"
                  />
                  <CardTitle className="text-lg text-azul-profundo line-clamp-2">
                    {product.name || product.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {product.categories?.name ||
                      product.category?.name ||
                      (typeof product.category === "string"
                        ? product.category
                        : "") ||
                      "Sin categoría"}
                  </Badge>
                </div>
              </div>
              {(product.featured || product.is_featured) && (
                <Badge className="bg-dorado text-azul-profundo ml-2">
                  Destacado
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-verde-suave">
                {formatPrice(product.price || 0)}
              </p>
              {getStatusBadge(product.status || "active")}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-tierra-media">Stock:</span>
              <span
                className={`font-medium ${
                  (product.inventory_quantity || 0) <= 5
                    ? "text-red-500"
                    : "text-verde-suave"
                }`}
              >
                {product.inventory_quantity || 0} unidades
                {(product.inventory_quantity || 0) <= 5 && (
                  <AlertTriangle className="h-4 w-4 inline ml-1" />
                )}
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/admin/products/${product.slug}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/admin/products/edit/${product.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(product)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
