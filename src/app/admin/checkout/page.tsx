"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Checkout de pago</h1>
      {success && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              Pago completado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              El pago se procesó correctamente. La pasarela te redirigió de
              vuelta. Revisa el estado en el dashboard de pagos o en la tabla de
              pagos.
            </p>
          </CardContent>
        </Card>
      )}
      <CheckoutForm />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando checkout…</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
