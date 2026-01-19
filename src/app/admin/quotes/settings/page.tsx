"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings,
  Save,
  Loader2,
  DollarSign,
  Eye,
  Package,
  Percent,
  Calendar,
  FileText,
  X,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useBranch } from '@/hooks/useBranch';
import { getBranchHeader } from '@/lib/utils/branch';
import { BranchSelector } from '@/components/admin/BranchSelector';

interface QuoteSettings {
  treatment_prices: {
    anti_reflective: number;
    blue_light_filter: number;
    uv_protection: number;
    scratch_resistant: number;
    anti_fog: number;
    photochromic: number;
    polarized: number;
    tint: number;
  };
  lens_type_base_costs: {
    single_vision: number;
    bifocal: number;
    trifocal: number;
    progressive: number;
    reading: number;
    computer: number;
    sports: number;
  };
  lens_material_multipliers: {
    cr39: number;
    polycarbonate: number;
    high_index_1_67: number;
    high_index_1_74: number;
    trivex: number;
    glass: number;
  };
  default_labor_cost: number;
  default_tax_percentage: number;
  default_expiration_days: number;
  default_margin_percentage: number;
  labor_cost_includes_tax?: boolean;
  lens_cost_includes_tax?: boolean;
  treatments_cost_includes_tax?: boolean;
  volume_discounts: Array<{ min_amount: number; discount_percentage: number }>;
  currency: string;
  terms_and_conditions?: string;
  notes_template?: string;
}

export default function QuoteSettingsPage() {
  const { currentBranchId, isSuperAdmin, branches, isLoading: branchLoading } = useBranch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<QuoteSettings | null>(null);

  useEffect(() => {
    if (!branchLoading) {
      fetchSettings();
    }
  }, [currentBranchId, branchLoading]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...getBranchHeader(currentBranchId)
      };
      const response = await fetch('/api/admin/quote-settings', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...getBranchHeader(currentBranchId)
      };
      const response = await fetch('/api/admin/quote-settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateTreatmentPrice = (treatment: string, price: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      treatment_prices: {
        ...settings.treatment_prices,
        [treatment]: price
      }
    });
  };

  const updateLensTypeCost = (type: string, cost: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      lens_type_base_costs: {
        ...settings.lens_type_base_costs,
        [type]: cost
      }
    });
  };

  const updateMaterialMultiplier = (material: string, multiplier: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      lens_material_multipliers: {
        ...settings.lens_material_multipliers,
        [material]: multiplier
      }
    });
  };

  const addVolumeDiscount = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      volume_discounts: [
        ...settings.volume_discounts,
        { min_amount: 0, discount_percentage: 0 }
      ]
    });
  };

  const updateVolumeDiscount = (index: number, field: 'min_amount' | 'discount_percentage', value: number) => {
    if (!settings) return;
    const updated = [...settings.volume_discounts];
    updated[index] = { ...updated[index], [field]: value };
    setSettings({
      ...settings,
      volume_discounts: updated
    });
  };

  const removeVolumeDiscount = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      volume_discounts: settings.volume_discounts.filter((_, i) => i !== index)
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-azul-profundo" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-tierra-media">Error al cargar configuración</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const treatmentLabels: Record<string, string> = {
    anti_reflective: 'Anti-reflejante',
    blue_light_filter: 'Filtro Luz Azul',
    uv_protection: 'Protección UV',
    scratch_resistant: 'Anti-rayas',
    anti_fog: 'Anti-empañamiento',
    photochromic: 'Fotocromático',
    polarized: 'Polarizado',
    tint: 'Tinte'
  };

  const lensTypeLabels: Record<string, string> = {
    single_vision: 'Monofocal',
    bifocal: 'Bifocal',
    trifocal: 'Trifocal',
    progressive: 'Progresivo',
    reading: 'Lectura',
    computer: 'Computadora',
    sports: 'Deportes'
  };

  const materialLabels: Record<string, string> = {
    cr39: 'CR-39',
    polycarbonate: 'Policarbonato',
    high_index_1_67: 'Alto Índice 1.67',
    high_index_1_74: 'Alto Índice 1.74',
    trivex: 'Trivex',
    glass: 'Vidrio'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-azul-profundo">Configuración de Presupuestos</h1>
          <p className="text-tierra-media mt-2">
            Personaliza los precios de tratamientos, costos de lentes y otros parámetros del sistema de presupuestos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <BranchSelector 
              branches={branches} 
              currentBranchId={currentBranchId}
            />
          )}
          <Link href="/admin/quotes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Presupuestos
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Treatment Prices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Precios de Tratamientos y Recubrimientos
          </CardTitle>
          <CardDescription>
            Configura los precios de los tratamientos aplicables a los lentes (en CLP)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(settings.treatment_prices).map(([key, price]) => (
              <div key={key}>
                <Label>{treatmentLabels[key] || key}</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => updateTreatmentPrice(key, parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lens Type Base Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Costos Base por Tipo de Lente
          </CardTitle>
          <CardDescription>
            Configura los costos base para cada tipo de lente (en CLP)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(settings.lens_type_base_costs).map(([key, cost]) => (
              <div key={key}>
                <Label>{lensTypeLabels[key] || key}</Label>
                <Input
                  type="number"
                  value={cost}
                  onChange={(e) => updateLensTypeCost(key, parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Material Multipliers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Percent className="h-5 w-5 mr-2" />
            Multiplicadores por Material de Lente
          </CardTitle>
          <CardDescription>
            Configura los multiplicadores que se aplican al costo base según el material del lente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(settings.lens_material_multipliers).map(([key, multiplier]) => (
              <div key={key}>
                <Label>{materialLabels[key] || key}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={multiplier}
                  onChange={(e) => updateMaterialMultiplier(key, parseFloat(e.target.value) || 1.0)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validity Period Settings */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Tiempo de Validez de Presupuestos
          </CardTitle>
          <CardDescription>
            Configura el tiempo límite de validez para los presupuestos. Los presupuestos expirarán automáticamente después de este período.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-semibold">Días de Validez por Defecto</Label>
              <p className="text-sm text-tierra-media mb-2">
                Los presupuestos nuevos usarán este número de días como período de validez
              </p>
              <Input
                type="number"
                min="1"
                value={settings.default_expiration_days}
                onChange={(e) => setSettings({ ...settings, default_expiration_days: parseInt(e.target.value) || 30 })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Los presupuestos expirarán automáticamente después de {settings.default_expiration_days} días desde su creación
              </p>
            </div>
            <div className="flex items-center justify-center p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-sm text-tierra-media mb-1">Estado de Expiración</p>
                <p className="text-lg font-semibold text-blue-600">
                  Los presupuestos se marcarán automáticamente como "Expirado" cuando la fecha de expiración haya pasado
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Costo de Mano de Obra por Defecto</Label>
              <Input
                type="number"
                value={settings.default_labor_cost}
                onChange={(e) => setSettings({ ...settings, default_labor_cost: parseFloat(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Porcentaje de Impuesto por Defecto</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.default_tax_percentage}
                onChange={(e) => setSettings({ ...settings, default_tax_percentage: parseFloat(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Margen de Ganancia por Defecto (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.default_margin_percentage}
                onChange={(e) => setSettings({ ...settings, default_margin_percentage: parseFloat(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t">
            <Label className="text-base font-semibold mb-4 block">Configuración de IVA</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="labor_cost_includes_tax"
                  checked={settings.labor_cost_includes_tax ?? true}
                  onChange={(e) => setSettings({ ...settings, labor_cost_includes_tax: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-azul-profundo focus:ring-azul-profundo"
                />
                <Label htmlFor="labor_cost_includes_tax" className="text-sm font-normal cursor-pointer">
                  El costo de mano de obra incluye IVA
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="lens_cost_includes_tax"
                  checked={settings.lens_cost_includes_tax ?? true}
                  onChange={(e) => setSettings({ ...settings, lens_cost_includes_tax: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-azul-profundo focus:ring-azul-profundo"
                />
                <Label htmlFor="lens_cost_includes_tax" className="text-sm font-normal cursor-pointer">
                  El costo de lentes incluye IVA
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="treatments_cost_includes_tax"
                  checked={settings.treatments_cost_includes_tax ?? true}
                  onChange={(e) => setSettings({ ...settings, treatments_cost_includes_tax: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-azul-profundo focus:ring-azul-profundo"
                />
                <Label htmlFor="treatments_cost_includes_tax" className="text-sm font-normal cursor-pointer">
                  El costo de tratamientos incluye IVA
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume Discounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Descuentos por Volumen
          </CardTitle>
          <CardDescription>
            Configura descuentos automáticos según el monto total del presupuesto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.volume_discounts.map((discount, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <Label>Monto Mínimo (CLP)</Label>
                  <Input
                    type="number"
                    value={discount.min_amount}
                    onChange={(e) => updateVolumeDiscount(index, 'min_amount', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label>Descuento (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={discount.discount_percentage}
                    onChange={(e) => updateVolumeDiscount(index, 'discount_percentage', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVolumeDiscount(index)}
                  className="mt-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addVolumeDiscount}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Descuento por Volumen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Términos y Condiciones / Plantilla de Notas
          </CardTitle>
          <CardDescription>
            Configura texto por defecto para términos y condiciones y notas en los presupuestos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Términos y Condiciones por Defecto</Label>
            <Textarea
              value={settings.terms_and_conditions || ''}
              onChange={(e) => setSettings({ ...settings, terms_and_conditions: e.target.value })}
              rows={6}
              className="mt-1"
              placeholder="Ingresa los términos y condiciones por defecto para los presupuestos..."
            />
          </div>
          <div>
            <Label>Plantilla de Notas</Label>
            <Textarea
              value={settings.notes_template || ''}
              onChange={(e) => setSettings({ ...settings, notes_template: e.target.value })}
              rows={4}
              className="mt-1"
              placeholder="Ingresa una plantilla de notas por defecto..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

