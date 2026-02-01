"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Página de detalle de ticket de ayuda
 * Redirige a la página de detalle de tickets SaaS existente
 */
export default function HelpTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  useEffect(() => {
    // Redirigir a la página de detalle de tickets SaaS
    router.replace(`/admin/saas-management/support/tickets/${ticketId}`);
  }, [ticketId, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    </div>
  );
}
