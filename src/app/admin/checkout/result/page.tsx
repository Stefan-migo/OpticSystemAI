"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

export default function CheckoutResultPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");

  useEffect(() => {
    if (success === "1" || status === "approved") {
      setPaymentStatus("success");
    } else if (success === "0" || status === "rejected") {
      setPaymentStatus("failed");
    } else if (success === "pending" || status === "pending") {
      setPaymentStatus("pending");
    } else {
      setPaymentStatus("unknown");
    }
    setLoading(false);
  }, [success, status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {paymentStatus === "success" && (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Pago Exitoso
              </>
            )}
            {paymentStatus === "failed" && (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                Pago Rechazado
              </>
            )}
            {paymentStatus === "pending" && (
              <>
                <Clock className="h-6 w-6 text-yellow-600" />
                Pago Pendiente
              </>
            )}
            {paymentStatus === "unknown" && <>Estado del pago</>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentStatus === "success" && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
              <AlertDescription className="text-green-800 dark:text-green-200">
                Tu pago ha sido procesado exitosamente. Recibirás un correo de
                confirmación en breve.
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === "failed" && (
            <Alert variant="destructive">
              <AlertDescription>
                Tu pago no pudo ser procesado. Por favor, intenta nuevamente o
                contacta a soporte.
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === "pending" && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Tu pago está pendiente de confirmación. Te notificaremos cuando
                se complete.
              </AlertDescription>
            </Alert>
          )}

          {orderId && (
            <div className="text-sm text-muted-foreground">
              <strong>ID de Orden:</strong> {orderId}
            </div>
          )}

          {paymentId && (
            <div className="text-sm text-muted-foreground">
              <strong>ID de Pago:</strong> {paymentId}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button asChild>
              <Link href="/admin">Volver al Dashboard</Link>
            </Button>
            {paymentStatus === "failed" && (
              <Button variant="outline" asChild>
                <Link href="/admin/checkout">Reintentar pago</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
