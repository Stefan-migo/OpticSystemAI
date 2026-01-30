"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Package,
  ShoppingCart,
  Edit,
  Loader2,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  status: string;
  owner_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  stats: {
    totalUsers: number;
    activeUsers: number;
    branches: number;
    orders: number;
    products: number;
  };
  subscriptions?: Array<{
    id: string;
    status: string;
    current_period_start?: string;
    current_period_end?: string;
    stripe_subscription_id?: string;
  }>;
  owner?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  recentUsers?: Array<{
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    profiles?: {
      first_name?: string;
      last_name?: string;
    };
  }>;
  branches?: Array<{
    id: string;
    name: string;
    code: string;
    address_line_1?: string;
    city?: string;
  }>;
}

export default function OrganizationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [organization, setOrganization] = useState<OrganizationDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    slug: "",
    subscription_tier: "basic",
    status: "active",
  });

  useEffect(() => {
    fetchOrganizationDetails();
  }, [orgId]);

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/saas-management/organizations/${orgId}`,
      );

      if (!response.ok) {
        throw new Error("Error al cargar detalles de la organización");
      }

      const data = await response.json();
      setOrganization(data.organization);
      setEditData({
        name: data.organization.name,
        slug: data.organization.slug,
        subscription_tier: data.organization.subscription_tier,
        status: data.organization.status,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast.error("Error al cargar detalles");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setEditing(true);
    try {
      const response = await fetch(
        `/api/admin/saas-management/organizations/${orgId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar organización");
      }

      toast.success("Organización actualizada exitosamente");
      setShowEditDialog(false);
      fetchOrganizationDetails();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEditing(false);
    }
  };

  const handleAction = async (
    action: "suspend" | "activate" | "cancel" | "change_tier",
    value?: string,
  ) => {
    try {
      const response = await fetch(
        `/api/admin/saas-management/organizations/${orgId}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, value }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al realizar acción");
      }

      toast.success("Acción realizada exitosamente");
      fetchOrganizationDetails();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      suspended: "secondary",
      cancelled: "destructive",
    };

    const icons: Record<string, typeof CheckCircle2> = {
      active: CheckCircle2,
      suspended: Pause,
      cancelled: XCircle,
    };

    const Icon = icons[status] || CheckCircle2;

    return (
      <Badge variant={variants[status] || "default"}>
        <Icon className="h-3 w-3 mr-1" />
        {status === "active"
          ? "Activa"
          : status === "suspended"
            ? "Suspendida"
            : "Cancelada"}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      basic: "bg-gray-100 text-gray-800",
      pro: "bg-blue-100 text-blue-800",
      premium: "bg-purple-100 text-purple-800",
    };

    return (
      <Badge className={colors[tier] || colors.basic}>
        <Crown className="h-3 w-3 mr-1" />
        {tier === "basic"
          ? "Básico"
          : tier === "pro"
            ? "Pro"
            : tier === "premium"
              ? "Premium"
              : tier}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error: {error || "Organización no encontrada"}</p>
              <Link href="/admin/saas-management/organizations">
                <Button variant="outline" className="mt-4">
                  Volver a organizaciones
                </Button>
              </Link>
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
          <Link href="/admin/saas-management/organizations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-azul-profundo">
                {organization.name}
              </h1>
              {getStatusBadge(organization.status)}
              {getTierBadge(organization.subscription_tier)}
            </div>
            <p className="text-tierra-media mt-1">{organization.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {organization.status === "active" ? (
            <Button variant="outline" onClick={() => handleAction("suspend")}>
              <Pause className="h-4 w-4 mr-2" />
              Suspender
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleAction("activate")}>
              <Play className="h-4 w-4 mr-2" />
              Activar
            </Button>
          )}
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.stats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              de {organization.stats.totalUsers} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sucursales</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.stats.branches}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.stats.orders}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.stats.products}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripción</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {organization.subscriptions?.[0]?.status || "Sin suscripción"}
            </div>
            {organization.subscriptions?.[0]?.current_period_end && (
              <p className="text-xs text-muted-foreground">
                Vence:{" "}
                {formatDate(organization.subscriptions[0].current_period_end)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información detallada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información general */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Nombre
              </label>
              <p className="text-base">{organization.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Slug</label>
              <p className="text-base">{organization.slug}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Owner</label>
              {organization.owner ? (
                <div>
                  <p className="text-base">
                    {organization.owner.first_name}{" "}
                    {organization.owner.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {organization.owner.email}
                  </p>
                  {organization.owner.phone && (
                    <p className="text-sm text-gray-500">
                      {organization.owner.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-base text-gray-400">Sin owner asignado</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Creada
              </label>
              <p className="text-base">{formatDate(organization.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Última actualización
              </label>
              <p className="text-base">{formatDate(organization.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Sucursales */}
        <Card>
          <CardHeader>
            <CardTitle>
              Sucursales ({organization.branches?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {organization.branches && organization.branches.length > 0 ? (
              <div className="space-y-2">
                {organization.branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{branch.name}</p>
                      <p className="text-sm text-gray-500">{branch.code}</p>
                      {branch.address_line_1 && (
                        <p className="text-sm text-gray-500">
                          {branch.address_line_1}, {branch.city}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No hay sucursales registradas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usuarios recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {organization.recentUsers && organization.recentUsers.length > 0 ? (
            <div className="space-y-2">
              {organization.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {user.profiles?.first_name} {user.profiles?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{user.role}</Badge>
                      {user.is_active ? (
                        <Badge variant="default">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </div>
                  </div>
                  {user.last_login && (
                    <div className="text-sm text-gray-500">
                      Último acceso: {formatDate(user.last_login)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No hay usuarios registrados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Organización</DialogTitle>
            <DialogDescription>
              Modifica los datos de la organización
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={editData.name}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={editData.slug}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tier</label>
              <Select
                value={editData.subscription_tier}
                onValueChange={(value) =>
                  setEditData({ ...editData, subscription_tier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select
                value={editData.status}
                onValueChange={(value) =>
                  setEditData({ ...editData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="suspended">Suspendida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={editing}>
              {editing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
