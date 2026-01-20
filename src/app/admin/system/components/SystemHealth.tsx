"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { HealthMetric, HealthStatus } from "../hooks/useSystemHealth";

interface SystemHealthProps {
  healthMetrics: HealthMetric[];
  healthStatus: HealthStatus | null;
  onRefresh: () => void;
  onClearMemory: () => void;
  refreshing: boolean;
  clearingMemory: boolean;
}

const formatMetricValue = (value: number, unit?: string) => {
  if (unit === "megabytes") {
    return `${value.toFixed(1)} MB`;
  }
  if (unit === "percentage") {
    return `${value.toFixed(1)}%`;
  }
  if (unit === "seconds") {
    return `${value.toFixed(2)}s`;
  }
  if (unit === "count") {
    return Math.round(value).toString();
  }
  return value.toString();
};

const translateMetricName = (name: string): string => {
  const translations: Record<string, string> = {
    database_response_time: "Tiempo de Respuesta de Base de Datos",
    total_users: "Total de Usuarios",
    active_admin_users: "Administradores Activos",
    admin_activity_24h: "Actividad Admin (24h)",
    memory_usage: "Uso de Memoria",
    database_records: "Registros en Base de Datos",
  };

  return (
    translations[name] ||
    name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

const getMetricResolution = (metric: HealthMetric): string => {
  const resolutions: Record<string, string> = {
    database_response_time:
      "Verificar conexión a la base de datos y optimizar consultas lentas.",
    total_users:
      "Este es un límite de advertencia. El sistema puede manejar más usuarios.",
    active_admin_users:
      "Revisar si hay administradores inactivos que deberían ser eliminados.",
    admin_activity_24h:
      "Monitorear actividad inusual. Puede indicar uso intensivo del sistema.",
    memory_usage:
      "Usar el botón 'Limpiar Memoria' para liberar memoria de forma segura.",
    database_records:
      "Considerar archivar datos antiguos o optimizar la base de datos.",
  };

  return (
    resolutions[metric.metric_name] ||
    "Revisar la configuración del sistema y contactar al administrador si persiste."
  );
};

export default function SystemHealth({
  healthMetrics,
  healthStatus,
  onRefresh,
  onClearMemory,
  refreshing,
  clearingMemory,
}: SystemHealthProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Health Metrics */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Métricas de Salud
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthMetrics.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-tierra-media mx-auto mb-4 opacity-50" />
              <p className="text-sm text-tierra-media mb-4">
                No hay métricas de salud disponibles
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-3 w-3 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Recolectar Métricas
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthMetrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell className="capitalize">
                      {translateMetricName(metric.metric_name)}
                    </TableCell>
                    <TableCell>
                      {formatMetricValue(
                        metric.metric_value,
                        metric.metric_unit,
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={metric.is_healthy ? "default" : "destructive"}
                      >
                        {metric.is_healthy ? "Saludable" : "Problema"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Critical Issues */}
      {healthStatus &&
        (healthStatus.critical_metrics.length > 0 ||
          healthStatus.warning_metrics.length > 0) && (
          <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Problemas Detectados
                </div>
                {healthStatus.critical_metrics.some(
                  (m) => m.metric_name === "memory_usage",
                ) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearMemory}
                    disabled={clearingMemory}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${clearingMemory ? "animate-spin" : ""}`}
                    />
                    Limpiar Memoria
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthStatus.critical_metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-red-700 dark:text-red-400">
                            Crítico
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            Requiere Acción
                          </Badge>
                        </div>
                        <p className="font-medium text-red-800 dark:text-red-300 mb-1">
                          {translateMetricName(metric.metric_name)}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                          Valor actual:{" "}
                          <span className="font-semibold">
                            {formatMetricValue(
                              metric.metric_value,
                              metric.metric_unit,
                            )}
                          </span>
                          {metric.threshold_critical && (
                            <span className="ml-2 text-xs">
                              (Límite crítico:{" "}
                              {formatMetricValue(
                                metric.threshold_critical,
                                metric.metric_unit,
                              )}
                              )
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/30 p-2 rounded mt-2">
                          <strong>Resolución:</strong>{" "}
                          {getMetricResolution(metric)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {healthStatus.warning_metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                              Advertencia
                            </span>
                          </div>
                          {metric.metric_name === "memory_usage" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={onClearMemory}
                              disabled={clearingMemory}
                              className="h-7 text-xs"
                            >
                              <RefreshCw
                                className={`h-3 w-3 mr-1 ${clearingMemory ? "animate-spin" : ""}`}
                              />
                              Limpiar
                            </Button>
                          )}
                        </div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                          {translateMetricName(metric.metric_name)}
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          Valor actual:{" "}
                          <span className="font-semibold">
                            {formatMetricValue(
                              metric.metric_value,
                              metric.metric_unit,
                            )}
                          </span>
                          {metric.threshold_warning && (
                            <span className="ml-2 text-xs">
                              (Límite de advertencia:{" "}
                              {formatMetricValue(
                                metric.threshold_warning,
                                metric.metric_unit,
                              )}
                              )
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
