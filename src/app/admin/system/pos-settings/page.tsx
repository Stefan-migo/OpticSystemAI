"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect: Configuración POS está en Sistema > Boletas y Facturas.
 * Esta ruta redirige a la pestaña correspondiente.
 */
export default function POSSettingsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/system?tab=billing");
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-sm text-muted-foreground">
        Redirigiendo a Boletas y Facturas...
      </p>
    </div>
  );
}
