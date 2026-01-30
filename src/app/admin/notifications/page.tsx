"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  Package,
  ShoppingCart,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  Shield,
  Info,
  RefreshCw,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

interface AdminNotification {
  id: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
  action_label?: string;
  metadata?: any;
  is_read: boolean;
  created_at: string;
}

const notificationIcons: Record<string, any> = {
  order_new: ShoppingCart,
  order_status_change: Package,
  low_stock: AlertTriangle,
  out_of_stock: AlertTriangle,
  support_ticket_new: MessageSquare,
  support_ticket_update: MessageSquare,
  payment_received: TrendingUp,
  system_alert: Shield,
  custom: Info,
};

const priorityColors: Record<string, string> = {
  low: "text-gray-500 bg-gray-100",
  medium: "text-blue-600 bg-blue-100",
  high: "text-orange-600 bg-orange-100",
  urgent: "text-red-600 bg-red-100",
};

const typeLabels: Record<string, string> = {
  order_new: "Nueva Orden",
  order_status_change: "Cambio de Estado",
  low_stock: "Stock Bajo",
  out_of_stock: "Sin Stock",
  support_ticket_new: "Nuevo Ticket",
  support_ticket_update: "Actualización Ticket",
  payment_received: "Pago Recibido",
  system_alert: "Alerta del Sistema",
  custom: "Personalizada",
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState({
    unreadOnly: false,
    type: "",
    priority: "",
  });
  const pageSize = 20;

  const fetchNotifications = async () => {
    if (!user || authLoading) {
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (currentPage * pageSize).toString(),
      });

      if (filters.unreadOnly) {
        params.append("unread_only", "true");
      }
      if (filters.type) {
        params.append("type", filters.type);
      }

      const response = await fetch(`/api/admin/notifications?${params}`);
      if (!response.ok) {
        if (response.status === 401) {
          return;
        }
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Error al cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotifications();
    }
  }, [user, authLoading, currentPage, filters]);

  const markAsRead = async (notificationId: string, actionUrl?: string) => {
    try {
      setMarkingAsRead(notificationId);
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) throw new Error("Failed to mark notification as read");

      // Update local state
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
      setUnreadCount(Math.max(0, unreadCount - 1));

      // Navigate if action URL provided
      if (actionUrl) {
        router.push(actionUrl);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Error al marcar la notificación");
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      // Update local state
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Error al marcar todas como leídas");
    } finally {
      setLoading(false);
    }
  };

  const getTimeSince = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );

    if (seconds < 60) return "Hace un momento";
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} días`;
    return new Date(date).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filters.priority && n.priority !== filters.priority) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-azul-profundo">
            Notificaciones
          </h1>
          <p className="text-sm md:text-base text-tierra-media">
            Gestiona todas tus notificaciones del sistema
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              disabled={loading}
              variant="outline"
              className="hover:bg-[#AE0000]/5 hover:border-[#AE0000]"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
          <Button
            onClick={fetchNotifications}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
            />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-admin-bg-tertiary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tierra-media">Total</p>
                <p className="text-2xl font-bold text-azul-profundo">
                  {totalCount}
                </p>
              </div>
              <Bell className="h-8 w-8 text-azul-profundo opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tierra-media">Sin Leer</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tierra-media">Leídas</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalCount - unreadCount}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-admin-bg-tertiary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-azul-profundo mb-2 block">
                Estado
              </label>
              <Select
                value={filters.unreadOnly ? "unread" : "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, unreadOnly: value === "unread" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unread">Solo sin leer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-azul-profundo mb-2 block">
                Tipo
              </label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, type: value === "all" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-azul-profundo mb-2 block">
                Prioridad
              </label>
              <Select
                value={filters.priority || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    priority: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="bg-admin-bg-tertiary">
        <CardHeader>
          <CardTitle>Notificaciones ({filteredNotifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-azul-profundo" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-azul-profundo mb-2">
                No hay notificaciones
              </p>
              <p className="text-sm text-tierra-media">
                {filters.unreadOnly || filters.type || filters.priority
                  ? "Intenta ajustar los filtros"
                  : "Te avisaremos cuando haya novedades"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => {
                    const Icon = notificationIcons[notification.type] || Info;
                    const isUnread = !notification.is_read;

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                          isUnread
                            ? "bg-[#AE000005] border-[#AE0000]/20"
                            : "bg-white border-gray-200",
                        )}
                        onClick={() =>
                          markAsRead(notification.id, notification.action_url)
                        }
                      >
                        <div className="flex gap-4">
                          {/* Icon */}
                          <div
                            className={cn(
                              "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                              priorityColors[notification.priority],
                            )}
                          >
                            <Icon className="h-6 w-6" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p
                                    className={cn(
                                      "text-base font-medium text-azul-profundo",
                                      isUnread && "font-semibold",
                                    )}
                                  >
                                    {notification.title}
                                  </p>
                                  {isUnread && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      Nuevo
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className="text-xs capitalize"
                                  >
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-tierra-media line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                              {markingAsRead === notification.id && (
                                <RefreshCw className="h-4 w-4 animate-spin text-azul-profundo" />
                              )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-tierra-media">
                                  {getTimeSince(notification.created_at)}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {typeLabels[notification.type] ||
                                    notification.type}
                                </Badge>
                              </div>
                              {notification.action_label && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-[#AE0000] hover:text-[#AE0000] hover:bg-[#AE0000]/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(
                                      notification.id,
                                      notification.action_url,
                                    );
                                  }}
                                >
                                  {notification.action_label} →
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-sm text-tierra-media">
                    Página {currentPage + 1} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.max(0, currentPage - 1))
                      }
                      disabled={currentPage === 0 || loading}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(
                          Math.min(totalPages - 1, currentPage + 1),
                        )
                      }
                      disabled={currentPage >= totalPages - 1 || loading}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
