"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface SubscriptionDetails {
  id: string;
  organization_id: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at?: string;
  canceled_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    subscription_tier: string;
    status: string;
    owner_id?: string;
    created_at: string;
  };
  daysUntilExpiry?: number;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
}

export default function SubscriptionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const subscriptionId = params.id as string;

  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subscriptionId) {
      fetchSubscriptionDetails();
    }
  }, [subscriptionId]);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/saas-management/subscriptions/${subscriptionId}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Suscripción no encontrada");
        }
        throw new Error("Error al cargar detalles de la suscripción");
      }

      const data = await response.json();
      const sub = data.subscription;

      // Calcular días hasta vencimiento
      let daysUntilExpiry: number | null = null;
      if (sub.current_period_end) {
        const endDate = new Date(sub.current_period_end);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      setSubscription({
        ...sub,
        daysUntilExpiry,
        isExpiringSoon:
          daysUntilExpiry !== null &&
          daysUntilExpiry <= 7 &&
          daysUntilExpiry >= 0,
        isExpired: daysUntilExpiry !== null && daysUntilExpiry < 0,
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching subscription details:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast.error(
        err instanceof Error
          ? err.message
          : "Error al cargar detalles de la suscripción",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (
    status: string,
    isExpiringSoon?: boolean,
    isExpired?: boolean,
  ) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      trialing: "secondary",
      past_due: "destructive",
      cancelled: "destructive",
      incomplete: "secondary",
    };

    const icons: Record<string, typeof CheckCircle2> = {
      active: CheckCircle2,
      trialing: Clock,
      past_due: AlertTriangle,
      cancelled: XCircle,
      incomplete: Clock,
    };

    const Icon = icons[status] || CheckCircle2;
    const variant = variants[status] || "default";

    let className = "";
    if (isExpired) {
      className = "bg-red-100 text-red-800";
    } else if (isExpiringSoon) {
      className = "bg-yellow-100 text-yellow-800";
    }

    return (
      <Badge variant={variant} className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {status === "active"
          ? "Activa"
          : status === "trialing"
            ? "Trial"
            : status === "past_due"
              ? "Vencida"
              : status === "cancelled"
                ? "Cancelada"
                : status === "incomplete"
                  ? "Incompleta"
                  : status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-tierra-media">
            Cargando detalles de la suscripción...
          </p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/saas-management/subscriptions")}
            title="Volver a suscripciones"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Error</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-red-600">
              {error || "Suscripción no encontrada"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/saas-management/subscriptions")}
            title="Volver a suscripciones"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">
              Detalles de la Suscripción
            </h1>
            <p className="text-tierra-media mt-2">
              Información completa de la suscripción
            </p>
          </div>
        </div>
      </div>

      {/* Información Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <CreditCard className="h-5 w-5" />
            Información de la Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Estado
              </label>
              <div className="mt-1">
                {getStatusBadge(
                  subscription.status,
                  subscription.isExpiringSoon,
                  subscription.isExpired,
                )}
              </div>
            </div>
            {subscription.daysUntilExpiry !== null && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Días hasta vencimiento
                </label>
                <p
                  className={`text-lg font-semibold ${
                    subscription.isExpired
                      ? "text-red-600"
                      : subscription.isExpiringSoon
                        ? "text-yellow-600"
                        : ""
                  }`}
                >
                  {subscription.daysUntilExpiry < 0
                    ? `Vencida hace ${Math.abs(subscription.daysUntilExpiry)} días`
                    : `${subscription.daysUntilExpiry} días`}
                </p>
              </div>
            )}
            {subscription.current_period_start && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Inicio del período
                </label>
                <p className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(subscription.current_period_start)}
                </p>
              </div>
            )}
            {subscription.current_period_end && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Fin del período
                </label>
                <p className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            )}
            {subscription.cancel_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Cancelación programada
                </label>
                <p className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(subscription.cancel_at)}
                </p>
              </div>
            )}
            {subscription.canceled_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Fecha de cancelación
                </label>
                <p className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(subscription.canceled_at)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información de Stripe */}
      {(subscription.stripe_subscription_id ||
        subscription.stripe_customer_id) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="h-5 w-5" />
              Información de Stripe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscription.stripe_subscription_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    ID de Suscripción Stripe
                  </label>
                  <p className="text-sm font-mono text-gray-600">
                    {subscription.stripe_subscription_id}
                  </p>
                </div>
              )}
              {subscription.stripe_customer_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    ID de Cliente Stripe
                  </label>
                  <p className="text-sm font-mono text-gray-600">
                    {subscription.stripe_customer_id}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organización */}
      {subscription.organization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Building2 className="h-5 w-5" />
              Organización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {subscription.organization.name}
                </p>
                <p className="text-sm text-gray-500">
                  Slug: {subscription.organization.slug}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge>{subscription.organization.subscription_tier}</Badge>
                  <Badge
                    variant={
                      subscription.organization.status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {subscription.organization.status}
                  </Badge>
                </div>
              </div>
              <Link
                href={`/admin/saas-management/organizations/${subscription.organization.id}`}
              >
                <Button variant="outline" size="sm">
                  Ver organización
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Clock className="h-5 w-5" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Fecha de creación
              </label>
              <p className="text-lg">{formatDate(subscription.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Última actualización
              </label>
              <p className="text-lg">{formatDate(subscription.updated_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                ID de la Suscripción
              </label>
              <p className="text-sm font-mono text-gray-600">
                {subscription.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
