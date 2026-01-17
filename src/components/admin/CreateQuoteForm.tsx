'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  User, 
  Eye, 
  Package, 
  Loader2,
  Calculator,
  Plus,
  X,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CreatePrescriptionForm from '@/components/admin/CreatePrescriptionForm';

interface CreateQuoteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialCustomerId?: string;
  initialPrescriptionId?: string;
}

export default function CreateQuoteForm({ 
  onSuccess, 
  onCancel,
  initialCustomerId,
  initialPrescriptionId
}: CreateQuoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quoteSettings, setQuoteSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Customer selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  
  // Prescription selection
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [showCreatePrescription, setShowCreatePrescription] = useState(false);
  
  // Frame selection
  const [frameSearch, setFrameSearch] = useState('');
  const [frameResults, setFrameResults] = useState<any[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<any>(null);
  const [searchingFrames, setSearchingFrames] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    frame_name: '',
    frame_brand: '',
    frame_model: '',
    frame_color: '',
    frame_size: '',
    frame_sku: '',
    frame_price: 0,
    lens_type: '',
    lens_material: '',
    lens_index: null as number | null,
    lens_treatments: [] as string[],
    lens_tint_color: '',
    lens_tint_percentage: 0,
    frame_cost: 0,
    lens_cost: 0,
    treatments_cost: 0,
    labor_cost: 0,
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    discount_percentage: 0,
    total_amount: 0,
    notes: '',
    customer_notes: '',
    expiration_days: 30
  });

  // Available options
  const lensTypes = [
    { value: 'single_vision', label: 'Visión Simple' },
    { value: 'bifocal', label: 'Bifocal' },
    { value: 'trifocal', label: 'Trifocal' },
    { value: 'progressive', label: 'Progresivo' },
    { value: 'reading', label: 'Lectura' },
    { value: 'computer', label: 'Computadora' },
    { value: 'sports', label: 'Deportivo' }
  ];

  const lensMaterials = [
    { value: 'cr39', label: 'CR-39' },
    { value: 'polycarbonate', label: 'Policarbonato' },
    { value: 'high_index_1_67', label: 'Alto Índice 1.67' },
    { value: 'high_index_1_74', label: 'Alto Índice 1.74' },
    { value: 'trivex', label: 'Trivex' },
    { value: 'glass', label: 'Vidrio' }
  ];

  // Fetch quote settings on mount
  useEffect(() => {
    fetchQuoteSettings();
  }, []);

  const fetchQuoteSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await fetch('/api/admin/quote-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch quote settings');
      }
      const data = await response.json();
      setQuoteSettings(data.settings);
      
      // Set default values from settings
      if (data.settings) {
        setFormData(prev => ({
          ...prev,
          labor_cost: data.settings.default_labor_cost || 15000,
          expiration_days: data.settings.default_expiration_days || 30
        }));
      }
    } catch (error) {
      console.error('Error fetching quote settings:', error);
      // Use default values if settings fetch fails
      setQuoteSettings({
        treatment_prices: {
          anti_reflective: 15000,
          blue_light_filter: 20000,
          uv_protection: 10000,
          scratch_resistant: 12000,
          anti_fog: 8000,
          photochromic: 35000,
          polarized: 25000,
          tint: 15000
        },
        lens_type_base_costs: {
          single_vision: 30000,
          bifocal: 45000,
          trifocal: 55000,
          progressive: 60000,
          reading: 25000,
          computer: 35000,
          sports: 40000
        },
        lens_material_multipliers: {
          cr39: 1.0,
          polycarbonate: 1.2,
          high_index_1_67: 1.5,
          high_index_1_74: 2.0,
          trivex: 1.3,
          glass: 0.9
        },
        default_labor_cost: 15000,
        default_tax_percentage: 19.0,
        default_expiration_days: 30
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  // Get available treatments from settings
  const availableTreatments = quoteSettings ? [
    { value: 'anti_reflective', label: 'Anti-reflejante', cost: quoteSettings.treatment_prices?.anti_reflective || 15000 },
    { value: 'blue_light_filter', label: 'Filtro Luz Azul', cost: quoteSettings.treatment_prices?.blue_light_filter || 20000 },
    { value: 'uv_protection', label: 'Protección UV', cost: quoteSettings.treatment_prices?.uv_protection || 10000 },
    { value: 'scratch_resistant', label: 'Anti-rayas', cost: quoteSettings.treatment_prices?.scratch_resistant || 12000 },
    { value: 'anti_fog', label: 'Anti-empañamiento', cost: quoteSettings.treatment_prices?.anti_fog || 8000 },
    { value: 'photochromic', label: 'Fotocromático', cost: quoteSettings.treatment_prices?.photochromic || 35000 },
    { value: 'polarized', label: 'Polarizado', cost: quoteSettings.treatment_prices?.polarized || 25000 },
    { value: 'tint', label: 'Tinte', cost: quoteSettings.treatment_prices?.tint || 15000 }
  ] : [
    { value: 'anti_reflective', label: 'Anti-reflejante', cost: 15000 },
    { value: 'blue_light_filter', label: 'Filtro Luz Azul', cost: 20000 },
    { value: 'uv_protection', label: 'Protección UV', cost: 10000 },
    { value: 'scratch_resistant', label: 'Anti-rayas', cost: 12000 },
    { value: 'anti_fog', label: 'Anti-empañamiento', cost: 8000 },
    { value: 'photochromic', label: 'Fotocromático', cost: 35000 },
    { value: 'polarized', label: 'Polarizado', cost: 25000 },
    { value: 'tint', label: 'Tinte', cost: 15000 }
  ];

  // Load customer if initialCustomerId provided
  useEffect(() => {
    if (initialCustomerId) {
      fetchCustomer(initialCustomerId);
    }
  }, [initialCustomerId]);

  // Load prescriptions when customer is selected
  useEffect(() => {
    if (selectedCustomer?.id) {
      fetchPrescriptions(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  // Load prescription if initialPrescriptionId provided
  useEffect(() => {
    if (initialPrescriptionId && prescriptions.length > 0) {
      const prescription = prescriptions.find(p => p.id === initialPrescriptionId);
      if (prescription) {
        setSelectedPrescription(prescription);
      }
    }
  }, [initialPrescriptionId, prescriptions]);

  const fetchCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data.customer);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  const fetchPrescriptions = async (customerId: string) => {
    try {
      setLoadingPrescriptions(true);
      const response = await fetch(`/api/admin/customers/${customerId}/prescriptions`);
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  // Search customers
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length < 2) {
        setCustomerResults([]);
        return;
      }

      setSearchingCustomers(true);
      try {
        const response = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(customerSearch)}`);
        if (response.ok) {
          const data = await response.json();
          setCustomerResults(data.customers || []);
        }
      } catch (error) {
        console.error('Error searching customers:', error);
      } finally {
        setSearchingCustomers(false);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [customerSearch]);

  // Search frames
  useEffect(() => {
    const searchFrames = async () => {
      if (frameSearch.length < 2) {
        setFrameResults([]);
        return;
      }

      setSearchingFrames(true);
      try {
        const response = await fetch(`/api/admin/products/search?q=${encodeURIComponent(frameSearch)}&type=frame`);
        if (response.ok) {
          const data = await response.json();
          setFrameResults(data.products || []);
        }
      } catch (error) {
        console.error('Error searching frames:', error);
      } finally {
        setSearchingFrames(false);
      }
    };

    const debounce = setTimeout(searchFrames, 300);
    return () => clearTimeout(debounce);
  }, [frameSearch]);

  const calculateTotal = () => {
    const frame = formData.frame_price || 0;
    const lens = formData.lens_cost || 0;
    const treatments = formData.treatments_cost || 0;
    const labor = formData.labor_cost || 0;
    
    const subtotal = frame + lens + treatments + labor;
    const discount = subtotal * (formData.discount_percentage / 100);
    const afterDiscount = subtotal - discount;
    
    // Use tax percentage from settings, default to 19% (IVA Chile)
    const taxPercentage = quoteSettings?.default_tax_percentage || 19.0;
    const tax = afterDiscount * (taxPercentage / 100);
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      discount_amount: discount,
      tax_amount: tax,
      total_amount: afterDiscount + tax
    }));
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.frame_price, formData.lens_cost, formData.treatments_cost, formData.labor_cost, formData.discount_percentage, quoteSettings]);

  const handleTreatmentToggle = (treatment: typeof availableTreatments[0]) => {
    const isSelected = formData.lens_treatments.includes(treatment.value);
    let newTreatments = [...formData.lens_treatments];
    let treatmentsCost = formData.treatments_cost;

    if (isSelected) {
      newTreatments = newTreatments.filter(t => t !== treatment.value);
      treatmentsCost -= treatment.cost;
    } else {
      newTreatments.push(treatment.value);
      treatmentsCost += treatment.cost;
    }

    setFormData(prev => ({
      ...prev,
      lens_treatments: newTreatments,
      treatments_cost: treatmentsCost
    }));
  };

  const handleFrameSelect = (frame: any) => {
    setSelectedFrame(frame);
    setFormData(prev => ({
      ...prev,
      frame_product_id: frame.id,
      frame_name: frame.name,
      frame_brand: frame.frame_brand || '',
      frame_model: frame.frame_model || '',
      frame_color: frame.frame_color || '',
      frame_size: frame.frame_size || '',
      frame_sku: frame.sku || '',
      frame_price: frame.price || 0,
      frame_cost: frame.price || 0
    }));
    setFrameSearch('');
    setFrameResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error('Selecciona un cliente');
      return;
    }

    if (!selectedPrescription) {
      toast.error('Selecciona una receta');
      return;
    }

    if (!formData.lens_type || !formData.lens_material) {
      toast.error('Selecciona tipo y material de lente');
      return;
    }

    setSaving(true);
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + formData.expiration_days);

      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          prescription_id: selectedPrescription.id,
          frame_product_id: selectedFrame?.id,
          frame_name: formData.frame_name,
          frame_brand: formData.frame_brand,
          frame_model: formData.frame_model,
          frame_color: formData.frame_color,
          frame_size: formData.frame_size,
          frame_sku: formData.frame_sku,
          frame_price: formData.frame_price,
          lens_type: formData.lens_type,
          lens_material: formData.lens_material,
          lens_index: formData.lens_index,
          lens_treatments: formData.lens_treatments,
          lens_tint_color: formData.lens_tint_color || null,
          lens_tint_percentage: formData.lens_tint_percentage || null,
          frame_cost: formData.frame_cost,
          lens_cost: formData.lens_cost,
          treatments_cost: formData.treatments_cost,
          labor_cost: formData.labor_cost,
          subtotal: formData.subtotal,
          tax_amount: formData.tax_amount,
          discount_amount: formData.discount_amount,
          discount_percentage: formData.discount_percentage,
          total_amount: formData.total_amount,
          notes: formData.notes,
          customer_notes: formData.customer_notes,
          expiration_date: expirationDate.toISOString().split('T')[0],
          status: 'draft'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear presupuesto');
      }

      toast.success('Presupuesto creado exitosamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast.error(error.message || 'Error al crear presupuesto');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (amount: number) => 
    new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-admin-bg-secondary">
              <div>
                <div className="font-medium">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </div>
                <div className="text-sm text-tierra-media">{selectedCustomer.email}</div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCustomer(null);
                  setSelectedPrescription(null);
                  setPrescriptions([]);
                }}
              >
                Cambiar
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tierra-media" />
              <Input
                placeholder="Buscar cliente por nombre o email..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-10"
              />
              {customerSearch.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchingCustomers ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : customerResults.length > 0 ? (
                    customerResults.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerSearch('');
                          setCustomerResults([]);
                        }}
                      >
                        <div className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-tierra-media">{customer.email}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-tierra-media">
                      No se encontraron clientes
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescription Selection */}
      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Receta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPrescriptions ? (
              <div className="text-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-tierra-media">Este cliente no tiene recetas registradas</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreatePrescription(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nueva Receta
                </Button>
              </div>
            ) : (
              <Select
                value={selectedPrescription?.id || ''}
                onValueChange={(value) => {
                  const prescription = prescriptions.find(p => p.id === value);
                  setSelectedPrescription(prescription);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una receta" />
                </SelectTrigger>
                <SelectContent>
                  {prescriptions.map((prescription) => (
                    <SelectItem key={prescription.id} value={prescription.id}>
                      {prescription.prescription_date} - {prescription.prescription_type || 'Sin tipo'}
                      {prescription.is_current && ' (Actual)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      {/* Frame Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Marco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedFrame ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-admin-bg-secondary">
              <div>
                <div className="font-medium">{selectedFrame.name}</div>
                <div className="text-sm text-tierra-media">
                  {selectedFrame.frame_brand} {selectedFrame.frame_model}
                </div>
                <div className="text-sm font-semibold text-verde-suave">
                  {formatPrice(selectedFrame.price)}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFrame(null);
                  setFormData(prev => ({
                    ...prev,
                    frame_product_id: '',
                    frame_name: '',
                    frame_brand: '',
                    frame_model: '',
                    frame_color: '',
                    frame_size: '',
                    frame_sku: '',
                    frame_price: 0,
                    frame_cost: 0
                  }));
                }}
              >
                Cambiar
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tierra-media" />
              <Input
                placeholder="Buscar marco por nombre, marca o SKU..."
                value={frameSearch}
                onChange={(e) => setFrameSearch(e.target.value)}
                className="pl-10"
              />
              {frameSearch.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchingFrames ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : frameResults.length > 0 ? (
                    frameResults.map((frame) => (
                      <div
                        key={frame.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                        onClick={() => handleFrameSelect(frame)}
                      >
                        <div className="font-medium">{frame.name}</div>
                        <div className="text-sm text-tierra-media">
                          {frame.frame_brand} {frame.frame_model} - Stock: {frame.inventory_quantity}
                        </div>
                        <div className="text-sm font-semibold text-verde-suave">
                          {formatPrice(frame.price)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-tierra-media">
                      No se encontraron marcos
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Manual frame entry */}
          {!selectedFrame && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Nombre del Marco</Label>
                <Input
                  value={formData.frame_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, frame_name: e.target.value }))}
                  placeholder="Ej: Ray-Ban RB2140"
                />
              </div>
              <div>
                <Label>Precio del Marco</Label>
                <Input
                  type="number"
                  value={formData.frame_price || ''}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      frame_price: price,
                      frame_cost: price
                    }));
                  }}
                  placeholder="0"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lens Configuration */}
      {selectedPrescription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Configuración de Lente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Lente *</Label>
                <Select
                  value={formData.lens_type}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, lens_type: value }));
                    // Set default cost based on type from settings
                    const costs = quoteSettings?.lens_type_base_costs || {
                      single_vision: 30000,
                      bifocal: 45000,
                      trifocal: 55000,
                      progressive: 60000,
                      reading: 25000,
                      computer: 35000,
                      sports: 40000
                    };
                    setFormData(prev => ({ 
                      ...prev, 
                      lens_cost: costs[value] || prev.lens_cost 
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {lensTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Material *</Label>
                <Select
                  value={formData.lens_material}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, lens_material: value }));
                    // Adjust cost based on material from settings
                    const materialMultipliers = quoteSettings?.lens_material_multipliers || {
                      cr39: 1.0,
                      polycarbonate: 1.2,
                      high_index_1_67: 1.5,
                      high_index_1_74: 2.0,
                      trivex: 1.3,
                      glass: 0.9
                    };
                    const multiplier = materialMultipliers[value] || 1.0;
                    // Get base cost for current lens type
                    const costs = quoteSettings?.lens_type_base_costs || {
                      single_vision: 30000,
                      bifocal: 45000,
                      trifocal: 55000,
                      progressive: 60000,
                      reading: 25000,
                      computer: 35000,
                      sports: 40000
                    };
                    const baseCost = costs[formData.lens_type] || 30000;
                    setFormData(prev => ({ 
                      ...prev, 
                      lens_cost: baseCost * multiplier 
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona material" />
                  </SelectTrigger>
                  <SelectContent>
                    {lensMaterials.map((material) => (
                      <SelectItem key={material.value} value={material.value}>
                        {material.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Índice de Refracción</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.lens_index || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  lens_index: parseFloat(e.target.value) || null 
                }))}
                placeholder="Ej: 1.67"
              />
            </div>

            {/* Treatments */}
            <div>
              <Label>Tratamientos y Recubrimientos</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableTreatments.map((treatment) => {
                  const isSelected = formData.lens_treatments.includes(treatment.value);
                  return (
                    <div
                      key={treatment.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-verde-suave bg-verde-suave/10' 
                          : 'border-gray-200 hover:border-azul-profundo'
                      }`}
                      onClick={() => handleTreatmentToggle(treatment)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {isSelected && <CheckCircle className="h-4 w-4 text-verde-suave mr-2" />}
                          <span className={isSelected ? 'font-medium' : ''}>{treatment.label}</span>
                        </div>
                        <Badge variant="outline">{formatPrice(treatment.cost)}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tint options */}
            {formData.lens_treatments.includes('tint') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Color del Tinte</Label>
                  <Input
                    value={formData.lens_tint_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, lens_tint_color: e.target.value }))}
                    placeholder="Ej: Gris, Marrón, Verde"
                  />
                </div>
                <div>
                  <Label>Porcentaje de Tinte (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.lens_tint_percentage || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      lens_tint_percentage: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="0-100"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Precios y Costos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Costo de Marco</Label>
              <Input
                type="number"
                value={formData.frame_cost || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  frame_cost: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label>Costo de Lente</Label>
              <Input
                type="number"
                value={formData.lens_cost || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  lens_cost: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label>Costo de Tratamientos</Label>
              <Input
                type="number"
                value={formData.treatments_cost || ''}
                readOnly
                className="bg-gray-100"
              />
            </div>
            <div>
              <Label>Costo de Mano de Obra</Label>
              <Input
                type="number"
                value={formData.labor_cost || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  labor_cost: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Ej: 15000"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span className="font-medium">{formatPrice(formData.subtotal)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Descuento ({formData.discount_percentage}%):</span>
              <span className="font-medium text-red-500">-{formatPrice(formData.discount_amount)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>IVA (19%):</span>
              <span className="font-medium">{formatPrice(formData.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-verde-suave">{formatPrice(formData.total_amount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Descuento (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.discount_percentage || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount_percentage: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label>Validez del Presupuesto (días)</Label>
              <Input
                type="number"
                value={formData.expiration_days}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  expiration_days: parseInt(e.target.value) || 30 
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Notas Internas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas para el equipo..."
              rows={3}
            />
          </div>
          <div>
            <Label>Notas para el Cliente</Label>
            <Textarea
              value={formData.customer_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_notes: e.target.value }))}
              placeholder="Notas visibles para el cliente..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Crear Presupuesto
            </>
          )}
        </Button>
      </div>

      {/* Create Prescription Dialog */}
      {selectedCustomer && (
        <Dialog open={showCreatePrescription} onOpenChange={setShowCreatePrescription}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Receta</DialogTitle>
              <DialogDescription>
                Crea una nueva receta oftalmológica para {selectedCustomer.first_name} {selectedCustomer.last_name}
              </DialogDescription>
            </DialogHeader>
            <CreatePrescriptionForm
              customerId={selectedCustomer.id}
              onSuccess={() => {
                setShowCreatePrescription(false);
                fetchPrescriptions(selectedCustomer.id);
              }}
              onCancel={() => setShowCreatePrescription(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </form>
  );
}

