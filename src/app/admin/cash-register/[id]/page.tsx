'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  DollarSign,
  CreditCard,
  Banknote,
  Calendar,
  CheckCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  User,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { getBranchHeader } from '@/lib/utils/branch';
import Link from 'next/link';

interface CashClosure {
  id: string;
  branch_id: string;
  closure_date: string;
  closed_by: string;
  opening_cash_amount: number;
  total_sales: number;
  total_transactions: number;
  cash_sales: number;
  debit_card_sales: number;
  credit_card_sales: number;
  installments_sales: number;
  other_payment_sales: number;
  expected_cash: number;
  actual_cash: number | null;
  cash_difference: number;
  card_machine_debit_total: number;
  card_machine_credit_total: number;
  card_machine_difference: number;
  total_subtotal: number;
  total_tax: number;
  total_discounts: number;
  closing_cash_amount: number | null;
  notes: string | null;
  discrepancies: string | null;
  status: 'draft' | 'confirmed' | 'reviewed';
  opened_at: string;
  closed_at: string;
  confirmed_at: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  closed_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method_type: string;
  created_at: string;
  order_items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export default function CashClosureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const closureId = params.id as string;
  
  const [closure, setClosure] = useState<CashClosure | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClosure();
  }, [closureId]);

  const fetchClosure = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/cash-register/closures/${closureId}`);
      if (response.ok) {
        const data = await response.json();
        setClosure(data.closure);
        setOrders(data.orders || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al cargar el cierre de caja');
        router.push('/admin/cash-register');
      }
    } catch (error: any) {
      console.error('Error fetching closure:', error);
      toast.error('Error al cargar el cierre de caja');
      router.push('/admin/cash-register');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'outline', label: 'Borrador' },
      confirmed: { variant: 'default', label: 'Confirmado' },
      reviewed: { variant: 'secondary', label: 'Revisado' }
    };

    const statusConfig = config[status] || { variant: 'outline', label: status };
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      debit_card: 'Tarjeta Débito',
      credit_card: 'Tarjeta Crédito',
      installments: 'Cuotas',
      transfer: 'Transferencia',
      check: 'Cheque',
      other: 'Otro'
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-azul-profundo mx-auto mb-4" />
          <p className="text-tierra-media">Cargando cierre de caja...</p>
        </div>
      </div>
    );
  }

  if (!closure) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/cash-register">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Cierre de Caja</h1>
            <p className="text-tierra-media">
              {formatDate(closure.closure_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(closure.status)}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-admin-bg-tertiary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-tierra-media flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-azul-profundo">
              {formatCurrency(closure.total_sales)}
            </p>
            <p className="text-sm text-tierra-media mt-1">
              {closure.total_transactions} transacciones
            </p>
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-tierra-media flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Efectivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-verde-suave">
              {formatCurrency(closure.cash_sales)}
            </p>
            {closure.actual_cash !== null && (
              <p className="text-sm text-tierra-media mt-1">
                Físico: {formatCurrency(closure.actual_cash)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-admin-bg-tertiary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-tierra-media flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Tarjetas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-azul-profundo">
              {formatCurrency(closure.debit_card_sales + closure.credit_card_sales)}
            </p>
            <p className="text-sm text-tierra-media mt-1">
              Débito: {formatCurrency(closure.debit_card_sales)} | 
              Crédito: {formatCurrency(closure.credit_card_sales)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash Reconciliation */}
        <Card className="bg-admin-bg-tertiary">
          <CardHeader>
            <CardTitle>Reconciliación de Efectivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-tierra-media">Monto Inicial:</span>
              <span className="font-semibold">{formatCurrency(closure.opening_cash_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tierra-media">Ventas en Efectivo:</span>
              <span className="font-semibold">{formatCurrency(closure.cash_sales)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-tierra-media font-semibold">Efectivo Esperado:</span>
              <span className="font-bold text-verde-suave">{formatCurrency(closure.expected_cash)}</span>
            </div>
            {closure.actual_cash !== null && (
              <>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-tierra-media">Efectivo Físico:</span>
                  <span className="font-semibold">{formatCurrency(closure.actual_cash)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-tierra-media font-semibold">Diferencia:</span>
                  <span className={`font-bold flex items-center gap-1 ${
                    closure.cash_difference > 0 ? 'text-green-600' : 
                    closure.cash_difference < 0 ? 'text-red-600' : 
                    'text-tierra-media'
                  }`}>
                    {closure.cash_difference !== 0 && (
                      closure.cash_difference > 0 ? 
                        <TrendingUp className="h-4 w-4" /> : 
                        <TrendingDown className="h-4 w-4" />
                    )}
                    {formatCurrency(Math.abs(closure.cash_difference))}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card Machine Reconciliation */}
        <Card className="bg-admin-bg-tertiary">
          <CardHeader>
            <CardTitle>Reconciliación de Tarjetas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-tierra-media">Ventas Débito:</span>
              <span className="font-semibold">{formatCurrency(closure.debit_card_sales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tierra-media">Máquina Débito:</span>
              <span className="font-semibold">{formatCurrency(closure.card_machine_debit_total)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-tierra-media">Ventas Crédito:</span>
              <span className="font-semibold">{formatCurrency(closure.credit_card_sales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tierra-media">Máquina Crédito:</span>
              <span className="font-semibold">{formatCurrency(closure.card_machine_credit_total)}</span>
            </div>
            {closure.card_machine_difference !== 0 && (
              <div className="flex justify-between border-t pt-2">
                <span className="text-tierra-media font-semibold">Diferencia:</span>
                <span className={`font-bold flex items-center gap-1 ${
                  closure.card_machine_difference > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {closure.card_machine_difference > 0 ? 
                    <TrendingUp className="h-4 w-4" /> : 
                    <TrendingDown className="h-4 w-4" />
                  }
                  {formatCurrency(Math.abs(closure.card_machine_difference))}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <Card className="bg-admin-bg-tertiary">
        <CardHeader>
          <CardTitle>Desglose por Método de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-tierra-media">Efectivo</p>
              <p className="text-xl font-bold">{formatCurrency(closure.cash_sales)}</p>
            </div>
            <div>
              <p className="text-sm text-tierra-media">Tarjeta Débito</p>
              <p className="text-xl font-bold">{formatCurrency(closure.debit_card_sales)}</p>
            </div>
            <div>
              <p className="text-sm text-tierra-media">Tarjeta Crédito</p>
              <p className="text-xl font-bold">{formatCurrency(closure.credit_card_sales)}</p>
            </div>
            <div>
              <p className="text-sm text-tierra-media">Cuotas</p>
              <p className="text-xl font-bold">{formatCurrency(closure.installments_sales)}</p>
            </div>
            {closure.other_payment_sales > 0 && (
              <div>
                <p className="text-sm text-tierra-media">Otros</p>
                <p className="text-xl font-bold">{formatCurrency(closure.other_payment_sales)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="bg-admin-bg-tertiary">
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-tierra-media">Subtotal:</span>
            <span className="font-semibold">{formatCurrency(closure.total_subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tierra-media">IVA:</span>
            <span className="font-semibold">{formatCurrency(closure.total_tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tierra-media">Descuentos:</span>
            <span className="font-semibold">{formatCurrency(closure.total_discounts)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-tierra-media font-semibold">Total:</span>
            <span className="font-bold text-2xl text-azul-profundo">
              {formatCurrency(closure.total_sales)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-admin-bg-tertiary">
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {closure.branch && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-tierra-media" />
              <span className="text-tierra-media">Sucursal:</span>
              <span className="font-semibold">{closure.branch.name} ({closure.branch.code})</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-tierra-media" />
            <span className="text-tierra-media">Cerrado por:</span>
            <span className="font-semibold">
              {closure.closed_by_user 
                ? `${closure.closed_by_user.first_name} ${closure.closed_by_user.last_name}`
                : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-tierra-media" />
            <span className="text-tierra-media">Abierto:</span>
            <span className="font-semibold">{formatDate(closure.opened_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-tierra-media" />
            <span className="text-tierra-media">Cerrado:</span>
            <span className="font-semibold">{formatDate(closure.closed_at)}</span>
          </div>
          {closure.confirmed_at && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-tierra-media" />
              <span className="text-tierra-media">Confirmado:</span>
              <span className="font-semibold">{formatDate(closure.confirmed_at)}</span>
            </div>
          )}
          {closure.notes && (
            <div className="mt-4">
              <p className="text-sm text-tierra-media mb-1">Notas:</p>
              <p className="text-sm">{closure.notes}</p>
            </div>
          )}
          {closure.discrepancies && (
            <div className="mt-4">
              <p className="text-sm text-tierra-media mb-1">Discrepancias:</p>
              <p className="text-sm text-red-600">{closure.discrepancies}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders List */}
      {orders.length > 0 && (
        <Card className="bg-admin-bg-tertiary">
          <CardHeader>
            <CardTitle>Órdenes del Día ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="text-sm text-tierra-media">
                      {getPaymentMethodLabel(order.payment_method_type)} • {formatDate(order.created_at)}
                    </p>
                  </div>
                  <p className="font-bold">{formatCurrency(order.total_amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
