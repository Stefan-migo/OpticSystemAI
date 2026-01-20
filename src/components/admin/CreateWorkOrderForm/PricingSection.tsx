"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface PricingSectionProps {
  frameCost: number;
  lensCost: number;
  treatmentsCost: number;
  laborCost: number;
  labCost: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  depositAmount: number;
  balanceAmount: number;
  onFrameCostChange: (cost: number) => void;
  onLensCostChange: (cost: number) => void;
  onLaborCostChange: (cost: number) => void;
  onLabCostChange: (cost: number) => void;
  onDiscountChange: (amount: number) => void;
  onPaymentStatusChange: (status: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onDepositChange: (amount: number) => void;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);

function PricingSectionComponent({
  frameCost,
  lensCost,
  treatmentsCost,
  laborCost,
  labCost,
  discountAmount,
  subtotal,
  taxAmount,
  totalAmount,
  paymentStatus,
  paymentMethod,
  depositAmount,
  balanceAmount,
  onFrameCostChange,
  onLensCostChange,
  onLaborCostChange,
  onLabCostChange,
  onDiscountChange,
  onPaymentStatusChange,
  onPaymentMethodChange,
  onDepositChange,
}: PricingSectionProps) {
  return (
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
              value={frameCost || ""}
              onChange={(e) =>
                onFrameCostChange(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <Label>Costo de Lente</Label>
            <Input
              type="number"
              value={lensCost || ""}
              onChange={(e) =>
                onLensCostChange(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <Label>Costo de Tratamientos</Label>
            <Input
              type="number"
              value={treatmentsCost || ""}
              readOnly
              className="bg-gray-100"
            />
          </div>
          <div>
            <Label>Costo de Mano de Obra</Label>
            <Input
              type="number"
              value={laborCost || ""}
              onChange={(e) =>
                onLaborCostChange(parseFloat(e.target.value) || 0)
              }
              placeholder="Ej: 15000"
            />
          </div>
          <div>
            <Label>Costo del Laboratorio</Label>
            <Input
              type="number"
              value={labCost || ""}
              onChange={(e) => onLabCostChange(parseFloat(e.target.value) || 0)}
              placeholder="Costo pagado al lab"
            />
          </div>
          <div>
            <Label>Descuento</Label>
            <Input
              type="number"
              value={discountAmount || ""}
              onChange={(e) =>
                onDiscountChange(parseFloat(e.target.value) || 0)
              }
              placeholder="Monto de descuento"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Descuento:</span>
            <span className="font-medium text-red-500">
              -{formatPrice(discountAmount)}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span>IVA (19%):</span>
            <span className="font-medium">{formatPrice(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span className="text-verde-suave">{formatPrice(totalAmount)}</span>
          </div>
        </div>

        {/* Payment Information */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <Label>Estado de Pago</Label>
            <Select value={paymentStatus} onValueChange={onPaymentStatusChange}>
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
              value={paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              placeholder="Efectivo, transferencia, etc."
            />
          </div>
          <div>
            <Label>Seña/Depósito</Label>
            <Input
              type="number"
              value={depositAmount || ""}
              onChange={(e) => {
                const deposit = parseFloat(e.target.value) || 0;
                onDepositChange(deposit);
              }}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Saldo Pendiente</Label>
            <Input
              type="number"
              value={balanceAmount || ""}
              readOnly
              className="bg-gray-100 font-semibold"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize PricingSection to prevent unnecessary re-renders
export default memo(PricingSectionComponent);
