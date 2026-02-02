"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useBranch } from "@/hooks/useBranch";
import { getBranchHeader } from "@/lib/utils/branch";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { currentBranchId } = useBranch();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const headers = {
        ...getBranchHeader(currentBranchId),
      };

      const response = await fetch(`/api/admin/orders/${orderId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al cargar la orden");
      }
    } catch (error: any) {
      console.error("Error fetching order:", error);
      toast.error("Error al cargar la orden");
    } finally {
      setLoading(false);
    }
  };

  const paymentMethodLabel =
    order?.mp_payment_method === "cash"
      ? "Efectivo"
      : order?.mp_payment_method === "debit"
        ? "Débito"
        : order?.mp_payment_method === "credit"
          ? "Crédito"
          : order?.mp_payment_method === "card"
            ? "Tarjeta"
            : order?.mp_payment_method === "transfer"
              ? "Transferencia"
              : order?.mp_payment_method || "N/A";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex gap-2">
          <Link href="/admin/orders">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Órdenes
            </Button>
          </Link>
          <Link href="/admin/cash-register">
            <Button variant="outline">Caja</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No se encontró la orden
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex gap-2">
        <Link href="/admin/orders">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Órdenes
          </Button>
        </Link>
        <Link href="/admin/cash-register">
          <Button variant="outline">Caja</Button>
        </Link>
      </div>

      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orden #{order.order_number}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {formatDateTime(order.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  order.status === "completed"
                    ? "default"
                    : order.status === "cancelled"
                      ? "destructive"
                      : "outline"
                }
              >
                {order.status === "completed" && "Completada"}
                {order.status === "cancelled" && "Anulada"}
                {order.status === "processing" && "Procesando"}
              </Badge>
              <Badge
                variant={
                  order.payment_status === "paid"
                    ? "default"
                    : order.payment_status === "partial"
                      ? "secondary"
                      : "outline"
                }
              >
                {order.payment_status === "paid" && "Pagada"}
                {order.payment_status === "partial" && "Parcial"}
                {order.payment_status === "pending" && "Pendiente"}
                {order.payment_status === "refunded" && "Reembolsada"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cancellation Reason */}
      {order.status === "cancelled" && order.cancellation_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">
                  Motivo de Anulación
                </p>
                <p className="text-red-800 mt-1">{order.cancellation_reason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-medium">
                {order.customer_name || order.email || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{order.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Método de Pago</p>
              <p className="font-medium">{paymentMethodLabel}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Montos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="font-medium">
                {formatCurrency(order.subtotal ?? order.total_amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="font-semibold text-lg">
                {formatCurrency(order.total_amount)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      {order.order_items && order.order_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Artículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.order_items.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.total_price)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
