"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  CreditCard,
  Banknote,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useBranch } from "@/hooks/useBranch";
import { getBranchHeader } from "@/lib/utils/branch";
import { BranchSelector } from "@/components/admin/BranchSelector";
import Link from "next/link";

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
  status: "draft" | "confirmed" | "reviewed";
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

interface DailySummary {
  date: string;
  branch_id: string | null;
  opening_cash_amount: number;
  total_sales: number;
  total_transactions: number;
  cash_sales: number;
  debit_card_sales: number;
  credit_card_sales: number;
  installments_sales: number;
  other_payment_sales: number;
  expected_cash: number;
  total_subtotal: number;
  total_tax: number;
  total_discounts: number;
}

export default function CashRegisterPage() {
  const {
    currentBranchId,
    isSuperAdmin,
    branches,
    isLoading: branchLoading,
  } = useBranch();
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Close dialog form state
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [actualCash, setActualCash] = useState<number>(0);
  const [cardMachineDebit, setCardMachineDebit] = useState<number>(0);
  const [cardMachineCredit, setCardMachineCredit] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [discrepancies, setDiscrepancies] = useState("");

  const isGlobalView = !currentBranchId && isSuperAdmin;

  useEffect(() => {
    fetchClosures();
  }, [currentBranchId, isGlobalView]);

  useEffect(() => {
    if (showCloseDialog) {
      fetchDailySummary();
    }
  }, [showCloseDialog, currentBranchId]);

  const fetchClosures = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {
        ...getBranchHeader(currentBranchId),
      };

      const response = await fetch("/api/admin/cash-register/closures", {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setClosures(data.closures || []);
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al cargar cierres de caja");
      }
    } catch (error: any) {
      console.error("Error fetching closures:", error);
      toast.error("Error al cargar cierres de caja");
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async () => {
    setLoadingSummary(true);
    try {
      const headers: HeadersInit = {
        ...getBranchHeader(currentBranchId),
      };

      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/admin/cash-register/close?date=${today}`,
        { headers },
      );
      if (response.ok) {
        const data = await response.json();
        setDailySummary(data.summary);
        setOpeningCash(data.summary.opening_cash_amount || 0);
        setActualCash(data.summary.expected_cash || 0);
        setCardMachineDebit(data.summary.debit_card_sales || 0);
        setCardMachineCredit(data.summary.credit_card_sales || 0);
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al cargar resumen del día");
      }
    } catch (error: any) {
      console.error("Error fetching daily summary:", error);
      toast.error("Error al cargar resumen del día");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCloseCashRegister = async () => {
    if (!dailySummary) {
      toast.error("No hay datos del día para cerrar");
      return;
    }

    setClosing(true);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...getBranchHeader(currentBranchId),
      };

      const today = new Date().toISOString().split("T")[0];
      const response = await fetch("/api/admin/cash-register/close", {
        method: "POST",
        headers,
        body: JSON.stringify({
          closure_date: `${today}T00:00:00`,
          opening_cash_amount: openingCash,
          actual_cash: actualCash,
          card_machine_debit_total: cardMachineDebit,
          card_machine_credit_total: cardMachineCredit,
          notes: notes || null,
          discrepancies: discrepancies || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cerrar la caja");
      }

      const result = await response.json();
      toast.success("Caja cerrada exitosamente");
      setShowCloseDialog(false);
      fetchClosures();

      // Reset form
      setOpeningCash(0);
      setActualCash(0);
      setCardMachineDebit(0);
      setCardMachineCredit(0);
      setNotes("");
      setDiscrepancies("");
    } catch (error: any) {
      console.error("Error closing cash register:", error);
      toast.error(error.message || "Error al cerrar la caja");
    } finally {
      setClosing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { variant: "outline", label: "Borrador", icon: FileText },
      confirmed: { variant: "default", label: "Confirmado", icon: CheckCircle },
      reviewed: { variant: "secondary", label: "Revisado", icon: Eye },
    };

    const statusConfig = config[status] || {
      variant: "outline",
      label: status,
      icon: FileText,
    };
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const cashDifference = dailySummary
    ? (actualCash || 0) - (dailySummary.expected_cash || 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/pos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al POS
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-azul-profundo">Caja</h1>
            <p className="text-tierra-media">
              {isGlobalView
                ? "Gestión de caja - Todas las sucursales"
                : "Gestión de caja diaria"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && <BranchSelector />}
          <Button
            onClick={() => setShowCloseDialog(true)}
            disabled={!currentBranchId && !isSuperAdmin}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Cerrar Caja
          </Button>
        </div>
      </div>

      {/* Daily Summary Card (if branch selected) */}
      {currentBranchId && dailySummary && (
        <Card className="bg-admin-bg-tertiary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Resumen del Día - {new Date().toLocaleDateString("es-CL")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-tierra-media">Total Ventas</p>
                <p className="text-2xl font-bold text-azul-profundo">
                  {formatCurrency(dailySummary.total_sales)}
                </p>
              </div>
              <div>
                <p className="text-sm text-tierra-media">Transacciones</p>
                <p className="text-2xl font-bold text-azul-profundo">
                  {dailySummary.total_transactions}
                </p>
              </div>
              <div>
                <p className="text-sm text-tierra-media">Efectivo Esperado</p>
                <p className="text-2xl font-bold text-verde-suave">
                  {formatCurrency(dailySummary.expected_cash)}
                </p>
              </div>
              <div>
                <p className="text-sm text-tierra-media">Ventas en Efectivo</p>
                <p className="text-2xl font-bold text-azul-profundo">
                  {formatCurrency(dailySummary.cash_sales)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Closures Table */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <CardHeader>
          <CardTitle>Cierres de Caja</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-azul-profundo mx-auto mb-4" />
              <p className="text-tierra-media">Cargando cierres...</p>
            </div>
          ) : closures.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-tierra-media mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-azul-profundo mb-2">
                No hay cierres de caja
              </h3>
              <p className="text-tierra-media">
                {currentBranchId
                  ? "Aún no se ha cerrado la caja para esta sucursal"
                  : "Seleccione una sucursal para ver sus cierres de caja"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {isSuperAdmin && <TableHead>Sucursal</TableHead>}
                  <TableHead>Fecha</TableHead>
                  <TableHead>Ventas Totales</TableHead>
                  <TableHead>Transacciones</TableHead>
                  <TableHead>Efectivo</TableHead>
                  <TableHead>Tarjeta Débito</TableHead>
                  <TableHead>Tarjeta Crédito</TableHead>
                  <TableHead>Diferencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cerrado por</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closures.map((closure) => (
                  <TableRow key={closure.id}>
                    {isSuperAdmin && (
                      <TableCell>{closure.branch?.name || "N/A"}</TableCell>
                    )}
                    <TableCell>
                      {new Date(closure.closure_date).toLocaleDateString(
                        "es-CL",
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(closure.total_sales)}
                    </TableCell>
                    <TableCell>{closure.total_transactions}</TableCell>
                    <TableCell>{formatCurrency(closure.cash_sales)}</TableCell>
                    <TableCell>
                      {formatCurrency(closure.debit_card_sales)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(closure.credit_card_sales)}
                    </TableCell>
                    <TableCell>
                      {closure.cash_difference !== 0 ? (
                        <div className="flex items-center gap-1">
                          {closure.cash_difference > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={
                              closure.cash_difference > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {formatCurrency(Math.abs(closure.cash_difference))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-tierra-media">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(closure.status)}</TableCell>
                    <TableCell>
                      {closure.closed_by_user
                        ? `${closure.closed_by_user.first_name} ${closure.closed_by_user.last_name}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/cash-register/${closure.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Close Cash Register Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cerrar Caja</DialogTitle>
            <DialogDescription>
              Complete los datos para cerrar la caja del día
            </DialogDescription>
          </DialogHeader>

          {loadingSummary ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-azul-profundo mx-auto mb-4" />
              <p className="text-tierra-media">Cargando resumen del día...</p>
            </div>
          ) : dailySummary ? (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen del Día</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-tierra-media">Total Ventas</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(dailySummary.total_sales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-tierra-media">Transacciones</p>
                    <p className="text-xl font-bold">
                      {dailySummary.total_transactions}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-tierra-media">
                      Ventas en Efectivo
                    </p>
                    <p className="text-xl font-bold">
                      {formatCurrency(dailySummary.cash_sales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-tierra-media">Tarjeta Débito</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(dailySummary.debit_card_sales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-tierra-media">Tarjeta Crédito</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(dailySummary.credit_card_sales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-tierra-media">
                      Efectivo Esperado
                    </p>
                    <p className="text-xl font-bold text-verde-suave">
                      {formatCurrency(dailySummary.expected_cash)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Reconciliation */}
              <div className="space-y-4">
                <div>
                  <Label>Monto Inicial de Caja</Label>
                  <Input
                    type="number"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Efectivo Físico Contado</Label>
                  <Input
                    type="number"
                    value={actualCash}
                    onChange={(e) => setActualCash(Number(e.target.value))}
                    placeholder="0"
                  />
                  {cashDifference !== 0 && (
                    <p
                      className={`text-sm mt-1 ${cashDifference > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {cashDifference > 0 ? "+" : ""}
                      {formatCurrency(cashDifference)}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Total Máquina Débito</Label>
                  <Input
                    type="number"
                    value={cardMachineDebit}
                    onChange={(e) =>
                      setCardMachineDebit(Number(e.target.value))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Total Máquina Crédito</Label>
                  <Input
                    type="number"
                    value={cardMachineCredit}
                    onChange={(e) =>
                      setCardMachineCredit(Number(e.target.value))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Notas</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales..."
                  />
                </div>
                <div>
                  <Label>Discrepancias</Label>
                  <Input
                    value={discrepancies}
                    onChange={(e) => setDiscrepancies(e.target.value)}
                    placeholder="Describa cualquier discrepancia encontrada..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-tierra-media mx-auto mb-4" />
              <p className="text-tierra-media">
                No hay datos disponibles para cerrar la caja
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCloseCashRegister}
              disabled={closing || !dailySummary}
            >
              {closing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Cerrando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Cerrar Caja
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
