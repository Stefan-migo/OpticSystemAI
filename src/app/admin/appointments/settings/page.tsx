"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft,
  Save,
  Settings,
  Clock,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/hooks/useBranch';
import { getBranchHeader } from '@/lib/utils/branch';
import { useAuthContext } from '@/contexts/AuthContext';

interface DayConfig {
  enabled: boolean;
  start_time: string;
  end_time: string;
  lunch_start: string | null;
  lunch_end: string | null;
}

interface ScheduleSettings {
  slot_duration_minutes: number;
  default_appointment_duration: number;
  buffer_time_minutes: number;
  working_hours: {
    monday: DayConfig;
    tuesday: DayConfig;
    wednesday: DayConfig;
    thursday: DayConfig;
    friday: DayConfig;
    saturday: DayConfig;
    sunday: DayConfig;
  };
  blocked_dates: string[];
  min_advance_booking_hours: number;
  max_advance_booking_days: number;
}

export default function ScheduleSettingsPage() {
  const { user, authLoading } = useAuthContext();
  const router = useRouter();
  const { currentBranchId, isLoading: branchLoading } = useBranch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const [newBlockedDate, setNewBlockedDate] = useState('');

  const fetchSettings = useCallback(async () => {
    if (!user || authLoading) return;
    
    try {
      setLoading(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...getBranchHeader(currentBranchId)
      };
      const response = await fetch('/api/admin/schedule-settings', { headers });
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
  }, [currentBranchId, user, authLoading]);

  useEffect(() => {
    if (!branchLoading && !authLoading && user) {
      fetchSettings();
    }
  }, [branchLoading, authLoading, user, fetchSettings]);

  const updateDayConfig = (day: keyof ScheduleSettings['working_hours'], field: keyof DayConfig, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      working_hours: {
        ...settings.working_hours,
        [day]: {
          ...settings.working_hours[day],
          [field]: value
        }
      }
    });
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || !settings) return;
    
    if (settings.blocked_dates.includes(newBlockedDate)) {
      toast.error('Esta fecha ya está bloqueada');
      return;
    }

    setSettings({
      ...settings,
      blocked_dates: [...settings.blocked_dates, newBlockedDate].sort()
    });
    setNewBlockedDate('');
  };

  const removeBlockedDate = (date: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      blocked_dates: settings.blocked_dates.filter(d => d !== date)
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getBranchHeader(currentBranchId)
      };
      const response = await fetch('/api/admin/schedule-settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar configuración');
      }

      toast.success('Configuración guardada exitosamente');
      router.push('/admin/appointments');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const dayLabels: Record<keyof ScheduleSettings['working_hours'], string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Cargando...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Error</h1>
            <p className="text-tierra-media">No se pudo cargar la configuración</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Configuración de Horarios</h1>
            <p className="text-tierra-media">Personaliza los horarios de trabajo y disponibilidad</p>
          </div>
        </div>
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

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Duración de Slot (minutos)</Label>
              <Input
                type="number"
                min="5"
                max="60"
                step="5"
                value={settings.slot_duration_minutes}
                onChange={(e) => setSettings({
                  ...settings,
                  slot_duration_minutes: parseInt(e.target.value) || 15
                })}
              />
              <p className="text-xs text-tierra-media mt-1">
                Intervalo de tiempo para los slots (ej: 15 minutos)
              </p>
            </div>
            <div>
              <Label>Duración por Defecto (minutos)</Label>
              <Input
                type="number"
                min="15"
                max="240"
                step="15"
                value={settings.default_appointment_duration}
                onChange={(e) => setSettings({
                  ...settings,
                  default_appointment_duration: parseInt(e.target.value) || 30
                })}
              />
              <p className="text-xs text-tierra-media mt-1">
                Duración predeterminada de las citas
              </p>
            </div>
            <div>
              <Label>Tiempo de Buffer (minutos)</Label>
              <Input
                type="number"
                min="0"
                max="30"
                step="5"
                value={settings.buffer_time_minutes}
                onChange={(e) => setSettings({
                  ...settings,
                  buffer_time_minutes: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-tierra-media mt-1">
                Tiempo entre citas
              </p>
            </div>
            <div>
              <Label>Reserva Mínima (horas antes)</Label>
              <Input
                type="number"
                min="0"
                max="48"
                value={settings.min_advance_booking_hours}
                onChange={(e) => setSettings({
                  ...settings,
                  min_advance_booking_hours: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-tierra-media mt-1">
                Mínimo de horas de anticipación
              </p>
            </div>
            <div>
              <Label>Reserva Máxima (días antes)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={settings.max_advance_booking_days}
                onChange={(e) => setSettings({
                  ...settings,
                  max_advance_booking_days: parseInt(e.target.value) || 90
                })}
              />
              <p className="text-xs text-tierra-media mt-1">
                Máximo de días de anticipación
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Horarios de Trabajo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(settings.working_hours) as Array<keyof ScheduleSettings['working_hours']>).map((day) => {
            const dayConfig = settings.working_hours[day];
            
            return (
              <div key={day} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">{dayLabels[day]}</Label>
                  <Switch
                    checked={dayConfig.enabled}
                    onCheckedChange={(checked) => updateDayConfig(day, 'enabled', checked)}
                  />
                </div>
                
                {dayConfig.enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Hora de Inicio</Label>
                      <Input
                        type="time"
                        value={dayConfig.start_time}
                        onChange={(e) => updateDayConfig(day, 'start_time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Hora de Fin</Label>
                      <Input
                        type="time"
                        value={dayConfig.end_time}
                        onChange={(e) => updateDayConfig(day, 'end_time', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Inicio Almuerzo</Label>
                      <Input
                        type="time"
                        value={dayConfig.lunch_start || ''}
                        onChange={(e) => updateDayConfig(day, 'lunch_start', e.target.value || null)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <Label>Fin Almuerzo</Label>
                      <Input
                        type="time"
                        value={dayConfig.lunch_end || ''}
                        onChange={(e) => updateDayConfig(day, 'lunch_end', e.target.value || null)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Blocked Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Fechas Bloqueadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              className="flex-1"
            />
            <Button type="button" onClick={addBlockedDate}>
              Agregar
            </Button>
          </div>
          
          {settings.blocked_dates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {settings.blocked_dates.map((date) => (
                <div
                  key={date}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-medium">
                    {new Date(date).toLocaleDateString('es-CL')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlockedDate(date)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-tierra-media">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay fechas bloqueadas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
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
    </div>
  );
}

