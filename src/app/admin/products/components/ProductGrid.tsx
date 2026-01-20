"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, AlertTriangle, Package, Star } from "lucide-react";
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
        <Package className="h-12 w-12 text-tierra-media mx-auto mb-4 opacity-50" />
        <p className="text-tierra-media text-lg">No se encontraron productos</p>
        <p className="text-tierra-media text-sm mt-2">
          Intenta ajustar los filtros de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const isLowStock = (product.inventory_quantity || 0) <= 5;
        const stockQuantity = product.inventory_quantity || 0;
        const hasImage =
          (product as any).featured_image || (product as any).gallery?.[0];

        return (
          <Card
            key={product.id}
            className="group relative flex flex-col transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: "var(--admin-bg-tertiary)" }}
          >
            {/* Checkbox - Top Right */}
            <div className="absolute top-3 right-3 z-10">
              <input
                type="checkbox"
                checked={selectedProducts.includes(product.id)}
                onChange={() => onSelectProduct(product.id)}
                className="w-5 h-5 rounded border-gray-300 cursor-pointer accent-azul-profundo"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Featured Badge - Top Left */}
            {(product.featured || product.is_featured) && (
              <div className="absolute top-3 left-3 z-10">
                <Badge className="bg-dorado text-azul-profundo shadow-md">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Destacado
                </Badge>
              </div>
            )}

            {/* Product Image or Placeholder */}
            <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
              {hasImage ? (
                <img
                  src={
                    (product as any).featured_image ||
                    (product as any).gallery[0]
                  }
                  alt={product.name || product.title || "Producto"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                </div>
              )}
              {/* Status Badge Overlay */}
              <div className="absolute bottom-2 right-2">
                {getStatusBadge(product.status || "active")}
              </div>
            </div>

            <CardHeader className="pb-3 pt-4">
              {/* Product Name */}
              <CardTitle className="text-base font-semibold text-azul-profundo line-clamp-2 min-h-[3rem] mb-2">
                {product.name || product.title}
              </CardTitle>

              {/* Category Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {product.categories?.name ||
                    product.category?.name ||
                    (typeof product.category === "string"
                      ? product.category
                      : "") ||
                    "Sin categoría"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between pt-0 space-y-4">
              {/* Price and Stock Section */}
              <div className="space-y-3">
                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs text-tierra-media mb-1">Precio</p>
                    <p className="text-2xl font-bold text-verde-suave">
                      {formatPrice(product.price || 0)}
                    </p>
                  </div>
                </div>

                {/* Stock Info */}
                <div className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <Package
                      className={`h-4 w-4 ${
                        isLowStock ? "text-red-500" : "text-verde-suave"
                      }`}
                    />
                    <span className="text-sm text-tierra-media">Stock:</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm font-semibold ${
                        isLowStock ? "text-red-500" : "text-verde-suave"
                      }`}
                    >
                      {stockQuantity}
                    </span>
                    {isLowStock && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  asChild
                >
                  <Link href={`/admin/products/${product.slug}`}>
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Ver
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  asChild
                >
                  <Link href={`/admin/products/edit/${product.id}`}>
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onDelete(product)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
