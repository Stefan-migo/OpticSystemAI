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
  Factory,
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
import { useBranch } from '@/hooks/useBranch';
import { getBranchHeader } from '@/lib/utils/branch';
import { calculatePriceWithTax } from '@/lib/utils/tax';
import { getTaxPercentage, getQuoteTaxInclusionSettings } from '@/lib/utils/tax-config';

interface CreateWorkOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  quoteId?: string;
  initialCustomerId?: string;
  initialPrescriptionId?: string;
}

export default function CreateWorkOrderForm({ 
  onSuccess, 
  onCancel,
  quoteId,
  initialCustomerId,
  initialPrescriptionId
}: CreateWorkOrderFormProps) {
  const { currentBranchId } = useBranch();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
    frame_serial_number: '',
    lens_type: '',
    lens_material: '',
    lens_index: null as number | null,
    lens_treatments: [] as string[],
    lens_tint_color: '',
    lens_tint_percentage: 0,
    lab_name: '',
    lab_contact: '',
    lab_order_number: '',
    lab_estimated_delivery_date: '',
    frame_cost: 0,
    frame_price_includes_tax: false,
    lens_cost: 0,
    treatments_cost: 0,
    labor_cost: 0,
    lab_cost: 0,
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    payment_status: 'pending',
    payment_method: '',
    deposit_amount: 0,
    internal_notes: '',
    customer_notes: '',
    status: 'ordered'
  });

  // Available options (same as quote form)
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

  const availableTreatments = [
    { value: 'anti_reflective', label: 'Anti-reflejante', cost: 15000 },
    { value: 'blue_light_filter', label: 'Filtro Luz Azul', cost: 20000 },
    { value: 'uv_protection', label: 'Protección UV', cost: 10000 },
    { value: 'scratch_resistant', label: 'Anti-rayas', cost: 12000 },
    { value: 'anti_fog', label: 'Anti-empañamiento', cost: 8000 },
    { value: 'photochromic', label: 'Fotocromático', cost: 35000 },
    { value: 'polarized', label: 'Polarizado', cost: 25000 },
    { value: 'tint', label: 'Tinte', cost: 15000 }
  ];

  // Load quote if quoteId provided
  useEffect(() => {
    if (quoteId) {
      loadQuote(quoteId);
    }
  }, [quoteId]);

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

  const loadQuote = async (quoteId: string) => {
    try {
      setLoading(true);
      const headers: HeadersInit = {
        ...getBranchHeader(currentBranchId)
      };
      const response = await fetch(`/api/admin/quotes/${quoteId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        const quote = data.quote;
        
        // Load customer
        if (quote.customer_id) {
          await fetchCustomer(quote.customer_id);
        }
        
        // If quote has frame_product_id, fetch the product to get price_includes_tax
        let framePriceIncludesTax = false;
        if (quote.frame_product_id) {
          try {
            const productHeaders: HeadersInit = {
              ...getBranchHeader(currentBranchId)
            };
            const productResponse = await fetch(`/api/admin/products/${quote.frame_product_id}`, { headers: productHeaders });
            if (productResponse.ok) {
              const productData = await productResponse.json();
              framePriceIncludesTax = productData.product?.price_includes_tax || false;
            }
          } catch (error) {
            console.error('Error fetching product for price_includes_tax:', error);
          }
        }
        
        // Set form data from quote
        setFormData(prev => ({
          ...prev,
          frame_name: quote.frame_name || '',
          frame_brand: quote.frame_brand || '',
          frame_model: quote.frame_model || '',
          frame_color: quote.frame_color || '',
          frame_size: quote.frame_size || '',
          frame_sku: quote.frame_sku || '',
          lens_type: quote.lens_type || '',
          lens_material: quote.lens_material || '',
          lens_index: quote.lens_index,
          lens_treatments: quote.lens_treatments || [],
          lens_tint_color: quote.lens_tint_color || '',
          lens_tint_percentage: quote.lens_tint_percentage || 0,
          frame_cost: quote.frame_cost || 0,
          frame_price_includes_tax: framePriceIncludesTax,
          lens_cost: quote.lens_cost || 0,
          treatments_cost: quote.treatments_cost || 0,
          labor_cost: quote.labor_cost || 0,
          subtotal: quote.subtotal || 0,
          tax_amount: quote.tax_amount || 0,
          discount_amount: quote.discount_amount || 0,
          total_amount: quote.total_amount || 0,
          customer_notes: quote.customer_notes || '',
          status: 'ordered'
        }));
      }
    } catch (error) {
      console.error('Error loading quote:', error);
      toast.error('Error al cargar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

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
        
        // Auto-select current prescription if available
        const currentPrescription = data.prescriptions?.find((p: any) => p.is_current);
        if (currentPrescription) {
          setSelectedPrescription(currentPrescription);
        } else if (data.prescriptions?.length > 0) {
          setSelectedPrescription(data.prescriptions[0]);
        }
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
        const headers: HeadersInit = {
          ...getBranchHeader(currentBranchId)
        };
        const response = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(customerSearch)}`, { headers });
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
  }, [customerSearch, currentBranchId]);

  // Search frames
  useEffect(() => {
    const searchFrames = async () => {
      if (frameSearch.length < 2) {
        setFrameResults([]);
        return;
      }

      setSearchingFrames(true);
      try {
        const headers: HeadersInit = {
          ...getBranchHeader(currentBranchId)
        };
        const response = await fetch(`/api/admin/products/search?q=${encodeURIComponent(frameSearch)}&type=frame`, { headers });
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
  }, [frameSearch, currentBranchId]);

  const [taxPercentage, setTaxPercentage] = useState<number>(19.0);
  const [quoteSettings, setQuoteSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  
  // Fetch tax percentage and quote settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const tax = await getTaxPercentage();
        setTaxPercentage(tax);
        
        // Fetch quote settings for tax inclusion settings
        const headers: HeadersInit = {
          ...getBranchHeader(currentBranchId)
        };
        const response = await fetch('/api/admin/quote-settings', { headers });
        if (response.ok) {
          const data = await response.json();
          setQuoteSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [currentBranchId]);
  
  const calculateTotal = () => {
    // Use tax percentage from settings or system config, default to 19% (IVA Chile)
    const effectiveTaxRate = quoteSettings?.default_tax_percentage || taxPercentage;
    
    // Get tax inclusion settings from quote settings (default to true - IVA incluido)
    const lensIncludesTax = quoteSettings?.lens_cost_includes_tax ?? true;
    const treatmentsIncludeTax = quoteSettings?.treatments_cost_includes_tax ?? true;
    const laborIncludesTax = quoteSettings?.labor_cost_includes_tax ?? true;
    // Lab cost typically doesn't include tax (it's an external service)
    const labIncludesTax = false;
    
    // Calculate frame price with tax consideration
    const framePriceBreakdown = calculatePriceWithTax(
      formData.frame_cost || 0,
      formData.frame_price_includes_tax || false,
      effectiveTaxRate
    );
    
    // Calculate lens, treatments, labor, and lab with tax consideration
    const lensBreakdown = calculatePriceWithTax(
      formData.lens_cost || 0,
      lensIncludesTax,
      effectiveTaxRate
    );
    
    const treatmentsBreakdown = calculatePriceWithTax(
      formData.treatments_cost || 0,
      treatmentsIncludeTax,
      effectiveTaxRate
    );
    
    const laborBreakdown = calculatePriceWithTax(
      formData.labor_cost || 0,
      laborIncludesTax,
      effectiveTaxRate
    );
    
    const labBreakdown = calculatePriceWithTax(
      formData.lab_cost || 0,
      labIncludesTax,
      effectiveTaxRate
    );
    
    // Calculate subtotal (sum of all subtotals without tax)
    const subtotal = framePriceBreakdown.subtotal + 
                     lensBreakdown.subtotal + 
                     treatmentsBreakdown.subtotal + 
                     laborBreakdown.subtotal + 
                     labBreakdown.subtotal;
    
    // Calculate total tax (sum of all taxes)
    const totalTax = framePriceBreakdown.tax + 
                     lensBreakdown.tax + 
                     treatmentsBreakdown.tax + 
                     laborBreakdown.tax + 
                     labBreakdown.tax;
    
    // Total with tax (before discount)
    const totalWithTax = subtotal + totalTax;
    
    // Apply discount to total with tax
    const discount = formData.discount_amount || 0;
    const afterDiscount = Math.max(0, totalWithTax - discount);
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: totalTax,
      total_amount: afterDiscount,
      balance_amount: afterDiscount - prev.deposit_amount
    }));
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.frame_cost, formData.frame_price_includes_tax, formData.lens_cost, formData.treatments_cost, formData.labor_cost, formData.lab_cost, formData.discount_amount, formData.deposit_amount, taxPercentage, quoteSettings]);

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
      frame_cost: frame.price || 0,
      frame_price_includes_tax: frame.price_includes_tax || false
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

    if (!formData.frame_name) {
      toast.error('Ingresa el nombre del marco');
      return;
    }

    setSaving(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...getBranchHeader(currentBranchId)
      };
      const response = await fetch('/api/admin/work-orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          prescription_id: selectedPrescription.id,
          quote_id: quoteId || null,
          frame_product_id: selectedFrame?.id,
          frame_name: formData.frame_name,
          frame_brand: formData.frame_brand,
          frame_model: formData.frame_model,
          frame_color: formData.frame_color,
          frame_size: formData.frame_size,
          frame_sku: formData.frame_sku,
          frame_serial_number: formData.frame_serial_number,
          lens_type: formData.lens_type,
          lens_material: formData.lens_material,
          lens_index: formData.lens_index,
          lens_treatments: formData.lens_treatments,
          lens_tint_color: formData.lens_tint_color || null,
          lens_tint_percentage: formData.lens_tint_percentage || null,
          lab_name: formData.lab_name,
          lab_contact: formData.lab_contact,
          lab_order_number: formData.lab_order_number,
          lab_estimated_delivery_date: formData.lab_estimated_delivery_date || null,
          frame_cost: formData.frame_cost,
          lens_cost: formData.lens_cost,
          treatments_cost: formData.treatments_cost,
          labor_cost: formData.labor_cost,
          lab_cost: formData.lab_cost,
          subtotal: formData.subtotal,
          tax_amount: formData.tax_amount,
          discount_amount: formData.discount_amount,
          total_amount: formData.total_amount,
          payment_status: formData.payment_status,
          payment_method: formData.payment_method,
          deposit_amount: formData.deposit_amount,
          balance_amount: formData.total_amount - formData.deposit_amount,
          internal_notes: formData.internal_notes,
          customer_notes: formData.customer_notes,
          status: formData.status
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear trabajo');
      }

      toast.success('Trabajo creado exitosamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating work order:', error);
      toast.error(error.message || 'Error al crear trabajo');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-azul-profundo" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection - Same as quote form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedCustomer ? (
            <div 
              className="flex items-center justify-between p-4 border rounded-lg bg-admin-bg-secondary"
              style={{ backgroundColor: 'var(--admin-border-primary)' }}
            >
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

      {/* Prescription Selection - Same as quote form */}
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
              <div className="flex gap-2">
                <Select
                  value={selectedPrescription?.id || ''}
                  onValueChange={(value) => {
                    const prescription = prescriptions.find(p => p.id === value);
                    setSelectedPrescription(prescription);
                  }}
                  className="flex-1"
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreatePrescription(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Frame Selection - Same as quote form but with serial number */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Marco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedFrame ? (
            <div 
              className="flex items-center justify-between p-4 border rounded-lg bg-admin-bg-secondary"
              style={{ backgroundColor: 'var(--admin-border-primary)' }}
            >
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
                <Label>Nombre del Marco *</Label>
                <Input
                  value={formData.frame_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, frame_name: e.target.value }))}
                  placeholder="Ej: Ray-Ban RB2140"
                  required
                />
              </div>
              <div>
                <Label>Número de Serie</Label>
                <Input
                  value={formData.frame_serial_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, frame_serial_number: e.target.value }))}
                  placeholder="Número de serie del marco"
                />
              </div>
            </div>
          )}

          {selectedFrame && (
            <div>
              <Label>Número de Serie del Marco</Label>
              <Input
                value={formData.frame_serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, frame_serial_number: e.target.value }))}
                placeholder="Número de serie del marco específico"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lens Configuration - Same as quote form */}
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
                    const costs: Record<string, number> = {
                      single_vision: 30000,
                      bifocal: 45000,
                      trifocal: 55000,
                      progressive: 80000,
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
                    const materialMultipliers: Record<string, number> = {
                      cr39: 1.0,
                      polycarbonate: 1.2,
                      high_index_1_67: 1.5,
                      high_index_1_74: 2.0,
                      trivex: 1.3,
                      glass: 0.9
                    };
                    const multiplier = materialMultipliers[value] || 1.0;
                    setFormData(prev => ({ 
                      ...prev, 
                      lens_cost: prev.lens_cost * multiplier 
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

            {/* Treatments - Same as quote form */}
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

      {/* Lab Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Factory className="h-5 w-5 mr-2" />
            Información del Laboratorio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre del Laboratorio</Label>
              <Input
                value={formData.lab_name}
                onChange={(e) => setFormData(prev => ({ ...prev, lab_name: e.target.value }))}
                placeholder="Ej: Laboratorio Óptico Central"
              />
            </div>
            <div>
              <Label>Contacto del Laboratorio</Label>
              <Input
                value={formData.lab_contact}
                onChange={(e) => setFormData(prev => ({ ...prev, lab_contact: e.target.value }))}
                placeholder="Teléfono o email"
              />
            </div>
            <div>
              <Label>Número de Orden del Lab</Label>
              <Input
                value={formData.lab_order_number}
                onChange={(e) => setFormData(prev => ({ ...prev, lab_order_number: e.target.value }))}
                placeholder="Número asignado por el laboratorio"
              />
            </div>
            <div>
              <Label>Fecha Estimada de Entrega</Label>
              <Input
                type="date"
                value={formData.lab_estimated_delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, lab_estimated_delivery_date: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing - Same as quote form but with lab cost */}
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
            <div>
              <Label>Costo del Laboratorio</Label>
              <Input
                type="number"
                value={formData.lab_cost || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  lab_cost: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Costo pagado al lab"
              />
            </div>
            <div>
              <Label>Descuento</Label>
              <Input
                type="number"
                value={formData.discount_amount || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount_amount: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Monto de descuento"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span className="font-medium">{formatPrice(formData.subtotal)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Descuento:</span>
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

          {/* Payment Information */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <Label>Estado de Pago</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Método de Pago</Label>
              <Input
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                placeholder="Efectivo, transferencia, etc."
              />
            </div>
            <div>
              <Label>Seña/Depósito</Label>
              <Input
                type="number"
                value={formData.deposit_amount || ''}
                onChange={(e) => {
                  const deposit = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({ 
                    ...prev, 
                    deposit_amount: deposit,
                    balance_amount: prev.total_amount - deposit
                  }));
                }}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Saldo Pendiente</Label>
              <Input
                type="number"
                value={formData.total_amount - formData.deposit_amount || ''}
                readOnly
                className="bg-gray-100 font-semibold"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Inicial</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quote">Presupuesto</SelectItem>
              <SelectItem value="ordered">Ordenado</SelectItem>
              <SelectItem value="sent_to_lab">Enviado al Lab</SelectItem>
            </SelectContent>
          </Select>
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
              value={formData.internal_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
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
              Crear Trabajo
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

