"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Loader2,
  Calendar,
  AlertCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface SubscriptionStatusResult {
  status: string;
  isExpired: boolean;
  isTrialExpired: boolean;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  canceledAt: string | null;
  organizationId: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  trialing: "Prueba gratuita",
  expired: "Expirada",
  past_due: "Pago pendiente",
  cancelled: "Cancelada",
  incomplete: "Incompleta",
  none: "Sin suscripción",
};

export function SubscriptionManagementSection() {
  const [status, setStatus] = useState<SubscriptionStatusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscription-status");
      const data = await res.json();
      if (res.ok) {
        setStatus({
          ...data,
          trialEndsAt: data.trialEndsAt ?? null,
          currentPeriodStart: data.currentPeriodStart ?? null,
          currentPeriodEnd: data.currentPeriodEnd ?? null,
          cancelAt: data.cancelAt ?? null,
          canceledAt: data.canceledAt ?? null,
        });
      } else {
        setStatus(null);
      }
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCancel = async () => {
    if (
      !confirm(
        "¿Estás seguro de que deseas cancelar tu suscripción? Tendrás acceso hasta el fin del período actual.",
      )
    )
      return;
    setActionLoading("cancel");
    try {
      const res = await fetch("/api/admin/subscription/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cancelar");
      toast.success(data.message || "Suscripción cancelada");
      await fetchStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cancelar");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    setActionLoading("reactivate");
    try {
      const res = await fetch("/api/admin/subscription/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al reactivar");
      toast.success(data.message || "Suscripción reactivada");
      await fetchStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al reactivar");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!status || !status.organizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Suscripción
          </CardTitle>
          <CardDescription>Gestiona tu plan y método de pago</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No tienes una organización con suscripción asignada. Si acabas de
              registrarte, completa el onboarding para activar tu plan.
            </AlertDescription>
          </Alert>
          <Button asChild className="mt-4">
            <Link href="/onboarding/choice">
              <ArrowRight className="h-4 w-4 mr-2" />
              Ir a configuración
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusLabel = STATUS_LABELS[status.status] ?? status.status;
  const isActive = status.status === "active" || status.status === "trialing";
  const isCancelled = status.status === "cancelled";
  const isExpired = status.isExpired;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Estado de la suscripción
              </CardTitle>
              <CardDescription>
                Plan y fechas de tu organización
              </CardDescription>
            </div>
            <Badge
              variant={
                isActive ? "default" : isCancelled ? "secondary" : "destructive"
              }
              className="shrink-0"
            >
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.trialEndsAt && status.status === "trialing" && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Prueba gratuita hasta:{" "}
                <strong>{formatDate(status.trialEndsAt)}</strong>
              </span>
            </div>
          )}
          {status.currentPeriodStart && status.status === "active" && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Período actual desde:{" "}
                <strong>{formatDate(status.currentPeriodStart)}</strong>
              </span>
            </div>
          )}
          {status.currentPeriodEnd &&
            (status.status === "active" || status.status === "cancelled") && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Período actual hasta:{" "}
                  <strong>{formatDate(status.currentPeriodEnd)}</strong>
                </span>
              </div>
            )}
          {isCancelled && status.cancelAt && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Suscripción cancelada.</strong> Tendrás acceso completo
                hasta el <strong>{formatDate(status.cancelAt)}</strong> (fin del
                período pagado).
              </AlertDescription>
            </Alert>
          )}
          {isExpired && status.status !== "cancelled" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tu suscripción ha expirado. Renueva para seguir usando el
                servicio.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones</CardTitle>
          <CardDescription>
            Cambiar plan, método de pago o cancelar
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild variant="default">
            <Link href="/admin/checkout">
              <CreditCard className="h-4 w-4 mr-2" />
              {isActive || isCancelled
                ? "Cambiar plan o método de pago"
                : "Suscribirse o renovar"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>

          {isActive && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={!!actionLoading}
            >
              {actionLoading === "cancel" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Cancelar suscripción
            </Button>
          )}

          {isCancelled && (
            <Button
              variant="outline"
              onClick={handleReactivate}
              disabled={!!actionLoading}
            >
              {actionLoading === "reactivate" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Reactivar suscripción
            </Button>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            Para cambiar el método de pago o el plan, usa el botón superior.
            {isCancelled && status.cancelAt && (
              <>
                {" "}
                La cancelación es efectiva el{" "}
                <strong>{formatDate(status.cancelAt)}</strong>. Hasta entonces,
                tendrás acceso completo.
              </>
            )}
            {!isCancelled && (
              <>
                {" "}
                La cancelación tiene efecto al final del período actual pagado.
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
