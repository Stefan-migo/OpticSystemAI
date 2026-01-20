"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Mail,
  Package,
  HardDrive,
  Users,
  Server,
  Database,
  BarChart3,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { SystemConfig as SystemConfigType } from "../hooks/useSystemConfig";

interface SystemConfigProps {
  configs: SystemConfigType[];
  onUpdateConfig: (key: string, value: any) => Promise<void>;
  isUpdating?: boolean;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    general: Settings,
    contact: Mail,
    ecommerce: Package,
    inventory: HardDrive,
    membership: Users,
    email: Mail,
    system: Server,
    database: Database,
    business: BarChart3,
  };

  return icons[category] || Settings;
};

const translateConfigKey = (key: string): string => {
  const translations: Record<string, string> = {
    // General
    site_name: "Nombre del Sitio",
    site_description: "Descripción del Sitio",

    // Contact
    address: "Dirección",
    contact_email: "Email de Contacto",
    phone_number: "Número de Teléfono",
    support_email: "Email de Soporte",

    // E-commerce
    currency: "Moneda",
    tax_rate: "Tasa de Impuesto (IVA)",
    shipping_cost: "Costo de Envío",
    free_shipping_threshold: "Umbral de Envío Gratis",

    // Inventory
    low_stock_threshold: "Umbral de Stock Bajo",
    auto_low_stock_alerts: "Alertas Automáticas de Stock",

    // Membership
    membership_trial_days: "Días de Prueba",
    membership_reminder_days: "Días de Recordatorio",

    // Email
    smtp_host: "Servidor SMTP",
    smtp_port: "Puerto SMTP",
    smtp_username: "Usuario SMTP",
    smtp_password: "Contraseña SMTP",

    // System
    maintenance_mode: "Modo Mantenimiento",
  };

  return (
    translations[key] ||
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

export default function SystemConfig({
  configs,
  onUpdateConfig,
  isUpdating = false,
}: SystemConfigProps) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showSensitive, setShowSensitive] = useState(false);

  const filteredConfigs = useMemo(() => {
    return configs.filter((config) => {
      if (categoryFilter !== "all" && config.category !== categoryFilter)
        return false;
      if (config.is_sensitive && !showSensitive) return false;
      return true;
    });
  }, [configs, categoryFilter, showSensitive]);

  const configsByCategory = useMemo(() => {
    return filteredConfigs.reduce((acc: any, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {});
  }, [filteredConfigs]);

  const categoryNames: Record<string, string> = {
    general: "General",
    contact: "Contacto",
    ecommerce: "E-commerce",
    inventory: "Inventario",
    membership: "Membresías",
    email: "Correo Electrónico",
    system: "Sistema",
    database: "Base de Datos",
    business: "Negocio",
  };

  const uniqueCategories = Array.from(new Set(configs.map((c) => c.category)));

  return (
    <div className="space-y-6">
      {/* Header con información */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Configuración del Sistema
            </div>
            <Badge variant="outline">
              {configs.length}{" "}
              {configs.length === 1 ? "configuración" : "configuraciones"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-tierra-media">
            Gestiona las configuraciones del sistema. Los cambios se aplican
            inmediatamente.
          </p>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">
                Filtrar por Categoría
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {categoryNames[category] ||
                        category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Opciones</Label>
              <Button
                variant="outline"
                onClick={() => setShowSensitive(!showSensitive)}
                className="w-full md:w-auto"
              >
                {showSensitive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar Configuraciones Sensibles
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Mostrar Configuraciones Sensibles
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuraciones por Categoría */}
      {Object.keys(configsByCategory).length === 0 ? (
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <CardContent className="p-12 text-center">
            <Settings className="h-12 w-12 text-tierra-media mx-auto mb-4 opacity-50" />
            <p className="text-tierra-media">
              No se encontraron configuraciones con los filtros seleccionados
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(configsByCategory).map(([category, categoryConfigs]) => {
          const Icon = getCategoryIcon(category);

          return (
            <Card
              key={category}
              className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-2" />
                    {categoryNames[category] ||
                      category.charAt(0).toUpperCase() + category.slice(1)}
                  </div>
                  <Badge variant="default">
                    {(categoryConfigs as SystemConfigType[]).length}{" "}
                    {(categoryConfigs as SystemConfigType[]).length === 1
                      ? "configuración"
                      : "configuraciones"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(categoryConfigs as SystemConfigType[]).map((config) => (
                    <div
                      key={config.id}
                      className="p-4 bg-admin-bg-tertiary border border-gray-200 dark:border-gray-700 rounded-lg hover:border-admin-accent-tertiary transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-azul-profundo">
                                {translateConfigKey(config.config_key)}
                              </h4>
                              {config.is_sensitive && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-yellow-50 border-yellow-200"
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  Sensible
                                </Badge>
                              )}
                              {config.is_public && (
                                <Badge variant="outline" className="text-xs">
                                  Público
                                </Badge>
                              )}
                            </div>
                            {config.description && (
                              <p className="text-sm text-tierra-media mt-1">
                                {config.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-end gap-4">
                          <div className="flex-1">
                            <Label className="text-xs text-tierra-media mb-1 block">
                              Valor
                            </Label>
                            {config.value_type === "boolean" ? (
                              <Select
                                value={config.config_value.toString()}
                                onValueChange={(value) =>
                                  onUpdateConfig(
                                    config.config_key,
                                    value === "true",
                                  )
                                }
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="w-full md:w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">
                                    Verdadero
                                  </SelectItem>
                                  <SelectItem value="false">Falso</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : config.value_type === "number" ? (
                              <Input
                                type="number"
                                value={config.config_value}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  onUpdateConfig(config.config_key, value);
                                }}
                                className="w-full md:w-[200px]"
                                disabled={isUpdating}
                              />
                            ) : (
                              <Input
                                type="text"
                                value={config.config_value}
                                onChange={(e) => {
                                  onUpdateConfig(
                                    config.config_key,
                                    e.target.value,
                                  );
                                }}
                                className="w-full md:w-[400px]"
                                disabled={isUpdating}
                              />
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-tierra-media">
                              Actualizado
                            </p>
                            <p className="text-xs font-medium">
                              {new Date(config.updated_at).toLocaleDateString(
                                "es-AR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
