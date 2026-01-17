"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { formatRUT } from '@/lib/utils/rut';
import { toast } from 'sonner';

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    rut: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Chile'
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Validate required fields
      if (!formData.first_name && !formData.last_name) {
        throw new Error('Al menos el nombre o apellido es requerido');
      }
      
      if (!formData.rut || formData.rut.trim() === '') {
        throw new Error('El RUT es requerido');
      }
      
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }

      const result = await response.json();
      
      console.log('📦 API Response:', result);
      
      if (!result.customer || !result.customer.id) {
        console.error('❌ Invalid response structure:', result);
        throw new Error('La respuesta del servidor no contiene información del cliente creado');
      }
      
      toast.success('Cliente creado exitosamente');
      router.push(`/admin/customers/${result.customer.id}`);
    } catch (err) {
      console.error('Error creating customer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al crear cliente';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Nuevo Cliente</h1>
            <p className="text-tierra-media">Crear un nuevo cliente en el sistema</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Creando...' : 'Crear Cliente'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-admin-bg-tertiary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nombre *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Apellido *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Apellido"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@ejemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            
            <div>
              <Label htmlFor="rut">RUT *</Label>
              <Input
                id="rut"
                value={formData.rut}
                onChange={(e) => {
                  const formatted = formatRUT(e.target.value);
                  handleInputChange('rut', formatted);
                }}
                onBlur={(e) => {
                  const formatted = formatRUT(e.target.value);
                  if (formatted !== e.target.value) {
                    handleInputChange('rut', formatted);
                  }
                }}
                placeholder="12.345.678-9 o 123456789"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Rol Único Tributario (requerido)</p>
            </div>

          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Dirección
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address_line_1">Dirección</Label>
              <Input
                id="address_line_1"
                value={formData.address_line_1}
                onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                placeholder="Calle y número"
              />
            </div>
            
            <div>
              <Label htmlFor="address_line_2">Dirección 2 (opcional)</Label>
              <Input
                id="address_line_2"
                value={formData.address_line_2}
                onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                placeholder="Departamento, piso, etc."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <Label htmlFor="state">Provincia</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Provincia"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="1234"
                />
              </div>
              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="País"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
          <CardHeader>
            <CardTitle>Notas Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Notas sobre el cliente..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
