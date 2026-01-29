"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useBranch } from "@/hooks/useBranch";
import { getBranchHeader } from "@/lib/utils/branch";
import { BranchSelector } from "@/components/admin/BranchSelector";
import { Loader2, Save, Settings } from "lucide-react";

export default function POSSettingsPage() {
  const {
    currentBranchId,
    isSuperAdmin,
    branches,
    isLoading: branchLoading,
  } = useBranch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minDepositPercent, setMinDepositPercent] = useState<number>(50);
  const [minDepositAmount, setMinDepositAmount] = useState<string>("");

  const isGlobalView = !currentBranchId && isSuperAdmin;

  useEffect(() => {
    if (!branchLoading) {
      fetchSettings();
    }
  }, [currentBranchId, branchLoading]);

  const fetchSettings = async () => {
    if (isGlobalView) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const headers: HeadersInit = {
        ...getBranchHeader(currentBranchId),
      };

      const response = await fetch("/api/admin/pos/settings", {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setMinDepositPercent(data.settings.min_deposit_percent || 50);
          setMinDepositAmount(
            data.settings.min_deposit_amount
              ? data.settings.min_deposit_amount.toString()
              : "",
          );
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al cargar configuración");
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (isGlobalView) {
      toast.error("Debe seleccionar una sucursal para configurar el POS");
      return;
    }

    // Validate
    if (minDepositPercent < 0 || minDepositPercent > 100) {
      toast.error("El porcentaje de depósito debe estar entre 0 y 100");
      return;
    }

    if (minDepositAmount && parseFloat(minDepositAmount) < 0) {
      toast.error("El monto mínimo de depósito debe ser positivo");
      return;
    }

    setSaving(true);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...getBranchHeader(currentBranchId),
      };

      const response = await fetch("/api/admin/pos/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          min_deposit_percent: minDepositPercent,
          min_deposit_amount: minDepositAmount
            ? parseFloat(minDepositAmount)
            : null,
        }),
      });

      if (response.ok) {
        toast.success("Configuración guardada exitosamente");
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al guardar configuración");
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  if (branchLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isGlobalView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Configuración del POS
            </h1>
            <p className="text-gray-600 mt-1">
              Personaliza la configuración del punto de venta
            </p>
          </div>
          {isSuperAdmin && <BranchSelector />}
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-center">
              Por favor, seleccione una sucursal para configurar el POS
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Configuración del POS
          </h1>
          <p className="text-gray-600 mt-1">
            Personaliza la configuración del punto de venta para esta sucursal
          </p>
        </div>
        {isSuperAdmin && <BranchSelector />}
      </div>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Depósito Mínimo
          </CardTitle>
          <CardDescription>
            Configura el depósito mínimo requerido para procesar trabajos. El
            sistema usará el mayor valor entre el porcentaje y el monto fijo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="min_deposit_percent">
              Porcentaje Mínimo de Depósito (%)
            </Label>
            <Input
              id="min_deposit_percent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={minDepositPercent}
              onChange={(e) =>
                setMinDepositPercent(parseFloat(e.target.value) || 0)
              }
              placeholder="50.00"
            />
            <p className="text-sm text-gray-500">
              Porcentaje del total de la orden que se requiere como depósito
              mínimo. Por ejemplo, 50.00 significa que se requiere el 50% del
              total.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_deposit_amount">
              Monto Mínimo Fijo de Depósito (Opcional)
            </Label>
            <Input
              id="min_deposit_amount"
              type="number"
              min="0"
              step="0.01"
              value={minDepositAmount}
              onChange={(e) => setMinDepositAmount(e.target.value)}
              placeholder="Dejar vacío para usar solo porcentaje"
            />
            <p className="text-sm text-gray-500">
              Monto fijo mínimo de depósito. Si se establece, el sistema usará
              el mayor valor entre el porcentaje calculado y este monto fijo.
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
