"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ArrowLeft,
  Edit,
  FileText,
  User,
  Eye,
  Package,
  Calculator,
  Calendar,
  DollarSign,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Printer,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Quote {
  id: string;
  quote_number: string;
  quote_date: string;
  expiration_date?: string;
  customer: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  prescription?: any;
  frame_product?: any;
  frame_name?: string;
  frame_brand?: string;
  frame_model?: string;
  frame_color?: string;
  frame_size?: string;
  frame_sku?: string;
  frame_price: number;
  lens_type?: string;
  lens_material?: string;
  lens_index?: number;
  lens_treatments?: string[];
  lens_tint_color?: string;
  lens_tint_percentage?: number;
  frame_cost: number;
  lens_cost: number;
  treatments_cost: number;
  labor_cost: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  discount_percentage: number;
  total_amount: number;
  currency: string;
  status: string;
  notes?: string;
  customer_notes?: string;
  terms_and_conditions?: string;
  created_at: string;
  converted_to_work_order_id?: string;
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (quoteId) {
      fetchQuote();
    }
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/quotes/${quoteId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }

      const data = await response.json();
      setQuote(data.quote);
    } catch (error) {
      console.error('Error fetching quote:', error);
      toast.error('Error al cargar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToWorkOrder = async () => {
    if (!quote) return;

    if (!confirm('¿Convertir este presupuesto en un trabajo? Esta acción no se puede deshacer.')) {
      return;
    }

    setConverting(true);
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/convert`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al convertir presupuesto');
      }

      const data = await response.json();
      toast.success('Presupuesto convertido a trabajo exitosamente');
      router.push(`/admin/work-orders/${data.workOrder.id}`);
    } catch (error: any) {
      console.error('Error converting quote:', error);
      toast.error(error.message || 'Error al convertir presupuesto');
    } finally {
      setConverting(false);
    }
  };

  const handlePrint = () => {
    if (!quote) return;

    // Create printable HTML content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor, permite ventanas emergentes para imprimir');
      return;
    }

    const customerName = quote.customer?.first_name && quote.customer?.last_name
      ? `${quote.customer.first_name} ${quote.customer.last_name}`
      : 'Sin nombre';

    const treatmentsList = quote.lens_treatments && quote.lens_treatments.length > 0
      ? quote.lens_treatments.map(t => `<li>${t}</li>`).join('')
      : '<li>Ninguno</li>';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Presupuesto ${quote.quote_number}</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
            }
            .header {
              border-bottom: 3px solid #8B5A3C;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #8B5A3C;
              font-size: 24px;
            }
            .quote-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section h2 {
              color: #8B5A3C;
              border-bottom: 2px solid #D4A574;
              padding-bottom: 5px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .pricing-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .pricing-table td {
              padding: 10px;
              border-bottom: 1px solid #eee;
            }
            .pricing-table .total-row {
              font-weight: bold;
              font-size: 18px;
              border-top: 2px solid #8B5A3C;
              color: #8B5A3C;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              font-size: 12px;
              color: #666;
            }
            ul {
              margin: 10px 0;
              padding-left: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PRESUPUESTO ${quote.quote_number}</h1>
            <p>Fecha: ${new Date(quote.quote_date).toLocaleDateString('es-CL')}</p>
            ${quote.expiration_date ? `<p>Válido hasta: ${new Date(quote.expiration_date).toLocaleDateString('es-CL')}</p>` : ''}
          </div>

          <div class="quote-info">
            <div>
              <h3>Cliente</h3>
              <p><strong>${customerName}</strong></p>
              ${quote.customer?.email ? `<p>Email: ${quote.customer.email}</p>` : ''}
              ${quote.customer?.phone ? `<p>Teléfono: ${quote.customer.phone}</p>` : ''}
            </div>
            <div>
              <h3>Estado</h3>
              <p><strong>${quote.status.toUpperCase()}</strong></p>
            </div>
          </div>

          <div class="section">
            <h2>Marco</h2>
            <div class="info-row">
              <span>Nombre:</span>
              <span>${quote.frame_name || '-'}</span>
            </div>
            ${quote.frame_brand ? `<div class="info-row"><span>Marca:</span><span>${quote.frame_brand}</span></div>` : ''}
            ${quote.frame_model ? `<div class="info-row"><span>Modelo:</span><span>${quote.frame_model}</span></div>` : ''}
            ${quote.frame_color ? `<div class="info-row"><span>Color:</span><span>${quote.frame_color}</span></div>` : ''}
            <div class="info-row">
              <span>Precio:</span>
              <span><strong>${formatPrice(quote.frame_price)}</strong></span>
            </div>
          </div>

          <div class="section">
            <h2>Lente</h2>
            ${quote.lens_type ? `<div class="info-row"><span>Tipo:</span><span>${quote.lens_type}</span></div>` : ''}
            ${quote.lens_material ? `<div class="info-row"><span>Material:</span><span>${quote.lens_material}</span></div>` : ''}
            ${quote.lens_index ? `<div class="info-row"><span>Índice:</span><span>${quote.lens_index}</span></div>` : ''}
            <div class="info-row">
              <span>Tratamientos:</span>
              <span>
                <ul>${treatmentsList}</ul>
              </span>
            </div>
          </div>

          <div class="section">
            <h2>Desglose de Precios</h2>
            <table class="pricing-table">
              <tr>
                <td>Costo de Marco:</td>
                <td style="text-align: right;">${formatPrice(quote.frame_cost)}</td>
              </tr>
              <tr>
                <td>Costo de Lente:</td>
                <td style="text-align: right;">${formatPrice(quote.lens_cost)}</td>
              </tr>
              <tr>
                <td>Costo de Tratamientos:</td>
                <td style="text-align: right;">${formatPrice(quote.treatments_cost)}</td>
              </tr>
              <tr>
                <td>Costo de Mano de Obra:</td>
                <td style="text-align: right;">${formatPrice(quote.labor_cost)}</td>
              </tr>
              <tr>
                <td><strong>Subtotal:</strong></td>
                <td style="text-align: right;"><strong>${formatPrice(quote.subtotal)}</strong></td>
              </tr>
              ${quote.discount_amount > 0 ? `
              <tr>
                <td>Descuento (${quote.discount_percentage}%):</td>
                <td style="text-align: right; color: red;">-${formatPrice(quote.discount_amount)}</td>
              </tr>
              ` : ''}
              <tr>
                <td>IVA (19%):</td>
                <td style="text-align: right;">${formatPrice(quote.tax_amount)}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL:</td>
                <td style="text-align: right;">${formatPrice(quote.total_amount)}</td>
              </tr>
            </table>
          </div>

          ${quote.customer_notes ? `
          <div class="section">
            <h2>Notas para el Cliente</h2>
            <p>${quote.customer_notes.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}

          ${quote.terms_and_conditions ? `
          <div class="section">
            <h2>Términos y Condiciones</h2>
            <p>${quote.terms_and_conditions.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>Este presupuesto es válido hasta ${quote.expiration_date ? new Date(quote.expiration_date).toLocaleDateString('es-CL') : 'fecha no especificada'}</p>
            <p>Para más información, contacte con nosotros.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }, 250);
  };

  const handleSendQuote = async () => {
    if (!quote) return;

    const emailToSend = quote.customer?.email || sendEmail;
    
    if (!emailToSend || !emailToSend.includes('@')) {
      toast.error('Por favor, ingresa un email válido');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar presupuesto');
      }

      toast.success(`Presupuesto enviado exitosamente a ${emailToSend}`);
      setShowSendDialog(false);
      setSendEmail('');
      
      // Refresh quote to update status
      fetchQuote();
    } catch (error: any) {
      console.error('Error sending quote:', error);
      toast.error(error.message || 'Error al enviar presupuesto');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    // Set initial email if customer has one
    if (quote?.customer?.email && !sendEmail) {
      setSendEmail(quote.customer.email);
    }
  }, [quote]);

  const formatPrice = (amount: number) => 
    new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { variant: 'outline', label: 'Borrador', icon: FileText },
      sent: { variant: 'secondary', label: 'Enviado', icon: Send },
      accepted: { variant: 'default', label: 'Aceptado', icon: CheckCircle },
      rejected: { variant: 'destructive', label: 'Rechazado', icon: XCircle },
      expired: { variant: 'outline', label: 'Expirado', icon: Clock },
      converted_to_work: { variant: 'default', label: 'Convertido', icon: RefreshCw }
    };

    const statusConfig = config[status] || { variant: 'outline', label: status, icon: FileText };
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Cargando...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Presupuesto no encontrado</h1>
          </div>
        </div>
      </div>
    );
  }

  const customerName = quote.customer?.first_name && quote.customer?.last_name
    ? `${quote.customer.first_name} ${quote.customer.last_name}`
    : 'Sin nombre';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">{quote.quote_number}</h1>
            <p className="text-tierra-media">Presupuesto para {customerName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(quote.status)}
          {!quote.converted_to_work_order_id && (
            <Button onClick={handleConvertToWorkOrder} disabled={converting}>
              {converting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Convertir a Trabajo
                </>
              )}
            </Button>
          )}
          {quote.converted_to_work_order_id && (
            <Link href={`/admin/work-orders/${quote.converted_to_work_order_id}`}>
              <Button variant="outline">
                Ver Trabajo
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={() => setShowSendDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            Enviar Presupuesto
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Send Quote Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Presupuesto por Email</DialogTitle>
            <DialogDescription>
              {quote?.customer?.email 
                ? `El presupuesto será enviado al email del cliente: ${quote.customer.email}`
                : 'Ingresa el email al cual enviar el presupuesto'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {quote?.customer?.email ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-sm font-medium text-blue-900">Email del Cliente</Label>
                <p className="text-sm text-blue-700 mt-1">{quote.customer.email}</p>
                <p className="text-xs text-blue-600 mt-2">
                  El presupuesto se enviará a este email. Si deseas enviarlo a otro email, puedes cambiarlo abajo.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  El cliente no tiene un email asignado. Por favor, ingresa el email de destino.
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="email">Email de Destino</Label>
              <Input
                id="email"
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendQuote} disabled={sending || !sendEmail}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="pricing">Precios</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-tierra-media">Nombre</p>
                  <p className="font-medium">{customerName}</p>
                </div>
                {quote.customer?.email && (
                  <div>
                    <p className="text-sm text-tierra-media">Email</p>
                    <p className="font-medium">{quote.customer.email}</p>
                  </div>
                )}
                {quote.customer?.phone && (
                  <div>
                    <p className="text-sm text-tierra-media">Teléfono</p>
                    <p className="font-medium">{quote.customer.phone}</p>
                  </div>
                )}
                <Link href={`/admin/customers/${quote.customer?.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Ver Cliente
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Prescription Info */}
            {quote.prescription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Receta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-tierra-media">Fecha</p>
                    <p className="font-medium">
                      {new Date(quote.prescription.prescription_date).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  {quote.prescription.prescription_type && (
                    <div>
                      <p className="text-sm text-tierra-media">Tipo</p>
                      <p className="font-medium">{quote.prescription.prescription_type}</p>
                    </div>
                  )}
                  {quote.prescription.issued_by && (
                    <div>
                      <p className="text-sm text-tierra-media">Emitida por</p>
                      <p className="font-medium">{quote.prescription.issued_by}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-tierra-media">Fecha</p>
                  <p className="font-medium">
                    {new Date(quote.quote_date).toLocaleDateString('es-CL')}
                  </p>
                </div>
                {quote.expiration_date && (
                  <div>
                    <p className="text-sm text-tierra-media">Válido hasta</p>
                    <p className="font-medium">
                      {new Date(quote.expiration_date).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-tierra-media">Total</p>
                  <p className="text-2xl font-bold text-verde-suave">
                    {formatPrice(quote.total_amount)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Frame and Lens Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Marco
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-tierra-media">Nombre</p>
                  <p className="font-medium">{quote.frame_name || '-'}</p>
                </div>
                {quote.frame_brand && (
                  <div>
                    <p className="text-sm text-tierra-media">Marca</p>
                    <p className="font-medium">{quote.frame_brand}</p>
                  </div>
                )}
                {quote.frame_model && (
                  <div>
                    <p className="text-sm text-tierra-media">Modelo</p>
                    <p className="font-medium">{quote.frame_model}</p>
                  </div>
                )}
                {quote.frame_color && (
                  <div>
                    <p className="text-sm text-tierra-media">Color</p>
                    <p className="font-medium">{quote.frame_color}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-tierra-media">Precio</p>
                  <p className="font-semibold text-verde-suave">
                    {formatPrice(quote.frame_price)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Lente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quote.lens_type && (
                  <div>
                    <p className="text-sm text-tierra-media">Tipo</p>
                    <p className="font-medium">{quote.lens_type}</p>
                  </div>
                )}
                {quote.lens_material && (
                  <div>
                    <p className="text-sm text-tierra-media">Material</p>
                    <p className="font-medium">{quote.lens_material}</p>
                  </div>
                )}
                {quote.lens_index && (
                  <div>
                    <p className="text-sm text-tierra-media">Índice</p>
                    <p className="font-medium">{quote.lens_index}</p>
                  </div>
                )}
                {quote.lens_treatments && quote.lens_treatments.length > 0 && (
                  <div>
                    <p className="text-sm text-tierra-media">Tratamientos</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {quote.lens_treatments.map((treatment, idx) => (
                        <Badge key={idx} variant="outline">{treatment}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Detallada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.frame_sku && (
                <div>
                  <p className="text-sm text-tierra-media">SKU del Marco</p>
                  <p className="font-medium">{quote.frame_sku}</p>
                </div>
              )}
              {quote.lens_tint_color && (
                <div>
                  <p className="text-sm text-tierra-media">Color del Tinte</p>
                  <p className="font-medium">{quote.lens_tint_color}</p>
                </div>
              )}
              {quote.lens_tint_percentage && (
                <div>
                  <p className="text-sm text-tierra-media">Porcentaje de Tinte</p>
                  <p className="font-medium">{quote.lens_tint_percentage}%</p>
                </div>
              )}
              {quote.notes && (
                <div>
                  <p className="text-sm text-tierra-media">Notas Internas</p>
                  <p className="font-medium whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}
              {quote.customer_notes && (
                <div>
                  <p className="text-sm text-tierra-media">Notas para el Cliente</p>
                  <p className="font-medium whitespace-pre-wrap">{quote.customer_notes}</p>
                </div>
              )}
              {quote.terms_and_conditions && (
                <div>
                  <p className="text-sm text-tierra-media">Términos y Condiciones</p>
                  <p className="font-medium whitespace-pre-wrap">{quote.terms_and_conditions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Desglose de Precios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-tierra-media">Costo de Marco:</span>
                  <span className="font-medium">{formatPrice(quote.frame_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tierra-media">Costo de Lente:</span>
                  <span className="font-medium">{formatPrice(quote.lens_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tierra-media">Costo de Tratamientos:</span>
                  <span className="font-medium">{formatPrice(quote.treatments_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tierra-media">Costo de Mano de Obra:</span>
                  <span className="font-medium">{formatPrice(quote.labor_cost)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-medium">{formatPrice(quote.subtotal)}</span>
                </div>
                {quote.discount_amount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Descuento ({quote.discount_percentage}%):</span>
                    <span className="font-medium">-{formatPrice(quote.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-tierra-media">IVA (19%):</span>
                  <span className="font-medium">{formatPrice(quote.tax_amount)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-verde-suave">{formatPrice(quote.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

