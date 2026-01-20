"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Mail,
  Bell,
  Activity,
  Database,
  Shield,
  Monitor,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { HealthStatus } from "../hooks/useSystemHealth";

interface SystemOverviewProps {
  healthStatus: HealthStatus | null;
  onTabChange: (tab: string) => void;
  getHealthStatusBadge: (status: string) => React.ReactNode;
}

export default function SystemOverview({
  healthStatus,
  onTabChange,
  getHealthStatusBadge,
}: SystemOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onTabChange("config")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onTabChange("email")}
              >
                <Mail className="h-4 w-4 mr-2" />
                Plantillas Email
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onTabChange("notifications")}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onTabChange("health")}
              >
                <Activity className="h-4 w-4 mr-2" />
                Salud del Sistema
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onTabChange("maintenance")}
              >
                <Database className="h-4 w-4 mr-2" />
                Mantenimiento
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => onTabChange("maintenance")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Seguridad
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-tierra-media">
                  Estado General
                </span>
                {healthStatus && getHealthStatusBadge(healthStatus.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-tierra-media">Advertencias</span>
                <span className="font-semibold text-yellow-600">
                  {healthStatus?.warnings || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-tierra-media">
                  Problemas Críticos
                </span>
                <span className="font-semibold text-red-600">
                  {healthStatus?.criticals || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-tierra-media">
                  Última Verificación
                </span>
                <span className="text-sm font-medium">
                  {healthStatus?.last_check
                    ? new Date(healthStatus.last_check).toLocaleTimeString(
                        "es-AR",
                      )
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
