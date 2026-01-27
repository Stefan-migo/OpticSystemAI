"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  Eye,
  Plus,
  ArrowRight,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import businessConfig from "@/config/business";
import { DashboardSearch } from "@/components/admin/DashboardSearch";
import { useBranch } from "@/hooks/useBranch";
import { formatCurrency, formatDateTime } from "@/lib/utils";

// Colors from the brand palette
const COLORS = {
  primary: "#8B5A3C",
  secondary: "#B17A47",
  accent: "#D4A574",
  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#ef4444",
  info: "#60a5fa",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
];

interface DashboardData {
  kpis: {
    products: {
      total: number;
      lowStock: number;
      outOfStock: number;
    };
    orders: {
      total: number;
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    };
    revenue: {
      current: number;
      previous: number;
      change: number;
      currency: string;
    };
    customers: {
      total: number;
      new: number;
      returning: number;
    };
    appointments?: {
      today: number;
      scheduled: number;
      confirmed: number;
      pending: number;
    };
    workOrders?: {
      new: number;
      inProgress: number;
      completed: number;
      pending: number;
      total: number;
    };
    quotes?: {
      total: number;
      pending: number;
      converted: number;
    };
  };
  todayAppointments: any[];
  lowStockProducts: any[];
  charts: {
    revenueTrend: any[];
    ordersStatus: any;
    topProducts: any[];
  };
}

const defaultDashboardData: DashboardData = {
  kpis: {
    revenue: {
      current: 0,
      previous: 0,
      change: 0,
      currency: "CLP",
    },
    orders: {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    },
    products: {
      total: 0,
      lowStock: 0,
      outOfStock: 0,
    },
    customers: {
      total: 0,
      new: 0,
      returning: 0,
    },
    appointments: {
      today: 0,
      scheduled: 0,
      confirmed: 0,
      pending: 0,
    },
    workOrders: {
      new: 0,
      total: 0,
      inProgress: 0,
      pending: 0,
      completed: 0,
    },
    quotes: {
      total: 0,
      pending: 0,
      converted: 0,
    },
  },
  todayAppointments: [],
  lowStockProducts: [],
  charts: {
    revenueTrend: [],
    ordersStatus: {},
    topProducts: [],
  },
};

export default function AdminDashboard() {
  const { currentBranchId, isSuperAdmin, branches } = useBranch();
  const isGlobalView = !currentBranchId && isSuperAdmin;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData>(defaultDashboardData);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Add branch header if branch is selected, or 'global' if in global view
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (currentBranchId) {
        headers["x-branch-id"] = currentBranchId;
      } else if (isGlobalView && isSuperAdmin) {
        headers["x-branch-id"] = "global";
      }

      const response = await fetch("/api/admin/dashboard", { headers });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Error al cargar los datos del dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentBranchId, isGlobalView]);

  const getAppointmentStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge className="bg-blue-100 text-blue-700 text-xs border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Programada
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-700 text-xs border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmada
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-orange-100 text-orange-700 text-xs border-orange-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completada
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      case "no_show":
        return (
          <Badge className="bg-gray-100 text-gray-700 text-xs border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            No asistió
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-azul-profundo mb-2">
            Error al cargar el dashboard
          </p>
          <p className="text-tierra-media">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-azul-profundo">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-tierra-media">
            Panel de administración - Óptica
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pos">
            <Button className="group btn-enhanced px-6 py-3 lg:px-8 lg:py-4 text-white font-semibold text-sm lg:text-base w-full sm:w-auto">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Punto de Venta
            </Button>
          </Link>
          <Link href="/admin/appointments">
            <Button className="group btn-enhanced px-6 py-3 lg:px-8 lg:py-4 text-white font-semibold text-sm lg:text-base w-full sm:w-auto">
              <Calendar className="h-4 w-4 mr-2" />
              Ver Citas
            </Button>
          </Link>
          <Link href="/admin/work-orders">
            <Button className="group btn-enhanced px-6 py-3 lg:px-8 lg:py-4 text-white font-semibold text-sm lg:text-base w-full sm:w-auto">
              <Package className="h-4 w-4 mr-2" />
              Trabajos
            </Button>
          </Link>
        </div>
      </div>

      {/* Stock Alert Banner - Compact */}
      {data.lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-admin-bg-tertiary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-semibold text-azul-profundo text-sm">
                    {data.lowStockProducts.length} producto
                    {data.lowStockProducts.length !== 1 ? "s" : ""} con stock
                    bajo
                  </p>
                  <p className="text-xs text-tierra-media">
                    {data.lowStockProducts
                      .slice(0, 2)
                      .map((p) => p.name)
                      .join(", ")}
                    {data.lowStockProducts.length > 2 &&
                      ` y ${data.lowStockProducts.length - 2} más`}
                  </p>
                </div>
              </div>
              <Link href="/admin/products?filter=low_stock">
                <Button variant="outline" size="sm">
                  Ver Inventario
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      {(() => {
        const currentBranch = branches?.find((b) => b.id === currentBranchId);
        const statsLabel = isGlobalView
          ? "Todas las sucursales"
          : currentBranch
            ? `Sucursal: ${currentBranch.name}`
            : "Sucursal seleccionada";

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Revenue Card */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-azul-profundo flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-tierra-media truncate">
                      Ingresos del Mes
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-azul-profundo break-words">
                      {formatCurrency(data.kpis.revenue.current)}
                    </p>
                    <div
                      className={cn(
                        "flex items-center text-xs mt-1 gap-1",
                        data.kpis.revenue.change >= 0
                          ? "text-green-600"
                          : "text-red-600",
                      )}
                    >
                      {data.kpis.revenue.change >= 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            +{data.kpis.revenue.change.toFixed(1)}% vs anterior
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {data.kpis.revenue.change.toFixed(1)}% vs anterior
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {statsLabel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointments Card */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-6 w-6 md:h-8 md:w-8 text-azul-profundo flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-tierra-media truncate">
                      Citas Hoy
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-azul-profundo">
                      {data.kpis.appointments?.today || 0}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                      <span className="text-blue-600 truncate">
                        {data.kpis.appointments?.scheduled || 0} programadas
                      </span>
                      <span className="text-green-600 truncate">
                        {data.kpis.appointments?.confirmed || 0} confirmadas
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {statsLabel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Card - Only Active */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <Package className="h-6 w-6 md:h-8 md:w-8 text-azul-profundo flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-tierra-media truncate">
                      Productos Activos
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-azul-profundo">
                      {data.kpis.products.total}
                    </p>
                    <div className="flex items-center text-xs mt-1 gap-1">
                      {data.kpis.products.lowStock > 0 ? (
                        <>
                          <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                          <span className="text-red-500 truncate">
                            {data.kpis.products.lowStock} stock bajo
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <span className="text-green-600 truncate">
                            Stock saludable
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {statsLabel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customers Card */}
            <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-azul-profundo flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-tierra-media truncate">
                      Clientes
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-azul-profundo">
                      {data.kpis.customers.total}
                    </p>
                    <div className="flex items-center text-xs text-green-600 mt-1 gap-1">
                      <TrendingUp className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        +{data.kpis.customers.new} nuevos
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {statsLabel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle>Ingresos Últimos 7 Días</CardTitle>
            <p className="text-sm text-tierra-media">
              Evolución de ingresos diarios
            </p>
          </CardHeader>
          <CardContent>
            {data.charts.revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.charts.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("es-AR", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString("es-AR", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Ingresos"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    dot={{ fill: COLORS.success }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-center">
                <p className="text-tierra-media">
                  No hay datos de ingresos disponibles
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Orders Status Distribution */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle>Estado de Trabajos</CardTitle>
            <p className="text-sm text-tierra-media">Distribución por estado</p>
          </CardHeader>
          <CardContent>
            {data.kpis.workOrders && data.kpis.workOrders.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "En Progreso",
                        value: data.kpis.workOrders.inProgress,
                      },
                      {
                        name: "Pendientes",
                        value: data.kpis.workOrders.pending || 0,
                      },
                      {
                        name: "Completados",
                        value: data.kpis.workOrders.completed,
                      },
                    ].filter((item) => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name }: { name?: string }) => name || ""}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      {
                        name: "En Progreso",
                        value: data.kpis.workOrders?.inProgress || 0,
                      },
                      {
                        name: "Pendientes",
                        value: data.kpis.workOrders?.pending || 0,
                      },
                      {
                        name: "Completados",
                        value: data.kpis.workOrders?.completed || 0,
                      },
                    ]
                      .filter((item) => item.value > 0)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-center">
                <p className="text-tierra-media">No hay trabajos registrados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Chart */}
      {data.charts.topProducts.length > 0 && (
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <p className="text-sm text-tierra-media">Top 5 por ingresos</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.charts.topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "revenue")
                      return [formatCurrency(value), "Ingresos"];
                    return [value, "Cantidad"];
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Ingresos" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Today's Appointments & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Appointments - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-lg md:text-xl">
                  Citas de Hoy
                </CardTitle>
                <Link href="/admin/appointments">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start sm:self-auto"
                  >
                    Ver todas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.todayAppointments.length > 0 ? (
                  data.todayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-col p-3 rounded-lg hover:bg-[#AE000025] transition-colors border border-transparent hover:border-[#AE0000]/20"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Clock className="h-4 w-4 text-azul-profundo flex-shrink-0" />
                            <p className="font-medium text-azul-profundo text-sm truncate">
                              {formatTime(appointment.appointment_time)}
                            </p>
                            <span className="text-xs text-tierra-media">
                              ({appointment.duration_minutes} min)
                            </span>
                          </div>
                          {getAppointmentStatusBadge(appointment.status)}
                        </div>
                        <p className="text-sm font-medium text-azul-profundo mb-1 truncate">
                          {appointment.customer_name}
                        </p>
                        <p className="text-xs text-tierra-media mb-2 capitalize">
                          {appointment.appointment_type?.replace(/_/g, " ") ||
                            "Consulta"}
                        </p>
                        {appointment.notes && (
                          <p className="text-xs text-gray-600 italic truncate">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-center">
                    <div>
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-tierra-media">
                        No hay citas programadas para hoy.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl">
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Stock Alerts Section */}
              {data.lowStockProducts.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-700">
                      Alertas de Stock
                    </p>
                  </div>
                  <p className="text-xs text-red-600 mb-2">
                    {data.lowStockProducts.length} producto
                    {data.lowStockProducts.length !== 1 ? "s" : ""} requiere
                    {data.lowStockProducts.length === 1 ? "" : "n"} atención
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {data.lowStockProducts.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between text-xs bg-white p-2 rounded"
                      >
                        <span className="text-azul-profundo truncate flex-1 mr-2">
                          {product.name}
                        </span>
                        <Badge
                          variant="destructive"
                          className="text-xs flex-shrink-0"
                        >
                          {product.currentStock} un.
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {data.lowStockProducts.length > 5 && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                      +{data.lowStockProducts.length - 5} más
                    </p>
                  )}
                  <Link href="/admin/products?filter=low_stock">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Ver Todos
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}

              {/* Search Actions */}
              <DashboardSearch type="customer" placeholder="Buscar Cliente" />
              <DashboardSearch type="product" placeholder="Buscar Producto" />

              {/* Quick Action Buttons */}
              <Link href="/admin/quotes">
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 hover:bg-[#AE0000]/5 hover:border-[#AE0000] border-gray-300 transition-all duration-300"
                >
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Nuevo Presupuesto</span>
                </Button>
              </Link>
              <Link href="/admin/appointments">
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 hover:bg-[#AE0000]/5 hover:border-[#AE0000] border-gray-300 transition-all duration-300"
                >
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Agenda y Citas</span>
                </Button>
              </Link>
              <Link href="/admin/pos">
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 hover:bg-[#AE0000]/5 hover:border-[#AE0000] border-gray-300 transition-all duration-300"
                >
                  <ShoppingCart className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Punto de Venta</span>
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button
                  variant="outline"
                  className="w-full justify-start h-10 hover:bg-[#AE0000]/5 hover:border-[#AE0000] border-gray-300 transition-all duration-300"
                >
                  <Package className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Inventario</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
