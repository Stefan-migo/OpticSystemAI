"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useBranch } from "@/hooks/useBranch";
import { getBranchHeader } from "@/lib/utils/branch";
import CustomerSelector from "./CustomerSelector";
import PrescriptionSelector from "./PrescriptionSelector";
import FrameSelector from "./FrameSelector";
import LensConfiguration from "./LensConfiguration";
import LabInfoSection from "./LabInfoSection";
import PricingSection from "./PricingSection";
import StatusSection from "./StatusSection";
import NotesSection from "./NotesSection";
import {
  useWorkOrderForm,
  type WorkOrderFormData,
} from "./hooks/useWorkOrderForm";
import { useWorkOrderCalculations } from "./hooks/useWorkOrderCalculations";
import { useWorkOrderValidation } from "./hooks/useWorkOrderValidation";

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
  initialPrescriptionId,
}: CreateWorkOrderFormProps) {
  const { currentBranchId } = useBranch();
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [selectedFrame, setSelectedFrame] = useState<any>(null);

  // Use custom hooks
  const {
    formData,
    updateField,
    updateFormData,
    loading: loadingForm,
  } = useWorkOrderForm(quoteId, initialCustomerId, currentBranchId);

  const {
    subtotal,
    taxAmount,
    totalAmount,
    balanceAmount,
    taxPercentage,
    quoteSettings,
  } = useWorkOrderCalculations({
    formData,
    updateFormData,
    currentBranchId,
  });

  const { validate } = useWorkOrderValidation(
    formData,
    selectedCustomer,
    selectedPrescription,
  );

  // Load customer if initialCustomerId provided
  useEffect(() => {
    if (initialCustomerId) {
      fetchCustomer(initialCustomerId);
    }
  }, [initialCustomerId]);

  const fetchCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data.customer);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setSelectedPrescription(null);
  };

  const handleCustomerClear = () => {
    setSelectedCustomer(null);
    setSelectedPrescription(null);
  };

  const handleFrameSelect = (frame: any) => {
    setSelectedFrame(frame);
    updateFormData({
      frame_product_id: frame.id,
      frame_name: frame.name,
      frame_brand: frame.frame_brand || "",
      frame_model: frame.frame_model || "",
      frame_color: frame.frame_color || "",
      frame_size: frame.frame_size || "",
      frame_sku: frame.sku || "",
      frame_cost: frame.price || 0,
      frame_price_includes_tax: frame.price_includes_tax || false,
    });
  };

  const handleFrameClear = () => {
    setSelectedFrame(null);
    updateFormData({
      frame_product_id: undefined,
      frame_name: "",
      frame_brand: "",
      frame_model: "",
      frame_color: "",
      frame_size: "",
      frame_sku: "",
      frame_cost: 0,
    });
  };

  const handleLensTypeChange = (type: string) => {
    updateField("lens_type", type);
    const costs: Record<string, number> = {
      single_vision: 30000,
      bifocal: 45000,
      trifocal: 55000,
      progressive: 80000,
      reading: 25000,
      computer: 35000,
      sports: 40000,
    };
    const baseCost = costs[type] || formData.lens_cost;
    updateField("lens_cost", baseCost);
  };

  const handleLensMaterialChange = (material: string) => {
    updateField("lens_material", material);
    const materialMultipliers: Record<string, number> = {
      cr39: 1.0,
      polycarbonate: 1.2,
      high_index_1_67: 1.5,
      high_index_1_74: 2.0,
      trivex: 1.3,
      glass: 0.9,
    };
    const multiplier = materialMultipliers[material] || 1.0;
    updateField("lens_cost", formData.lens_cost * multiplier);
  };

  const handleTreatmentsChange = (treatments: string[], cost: number) => {
    updateFormData({
      lens_treatments: treatments,
      treatments_cost: cost,
    });
  };

  const handleDepositChange = (amount: number) => {
    updateFormData({
      deposit_amount: amount,
      balance_amount: totalAmount - amount,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setSaving(true);
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...getBranchHeader(currentBranchId),
      };
      const response = await fetch("/api/admin/work-orders", {
        method: "POST",
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
          lab_estimated_delivery_date:
            formData.lab_estimated_delivery_date || null,
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
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear trabajo");
      }

      toast.success("Trabajo creado exitosamente");
      onSuccess();
    } catch (error: any) {
      console.error("Error creating work order:", error);
      toast.error(error.message || "Error al crear trabajo");
    } finally {
      setSaving(false);
    }
  };

  if (loadingForm) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-azul-profundo" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CustomerSelector
        selectedCustomer={selectedCustomer}
        onSelect={handleCustomerSelect}
        onClear={handleCustomerClear}
        currentBranchId={currentBranchId}
      />

      <PrescriptionSelector
        customerId={selectedCustomer?.id || null}
        selectedPrescription={selectedPrescription}
        onSelect={setSelectedPrescription}
      />

      <FrameSelector
        selectedFrame={selectedFrame}
        onSelect={handleFrameSelect}
        onClear={handleFrameClear}
        frameName={formData.frame_name}
        frameSerialNumber={formData.frame_serial_number}
        onFrameNameChange={(name) => updateField("frame_name", name)}
        onSerialNumberChange={(serial) =>
          updateField("frame_serial_number", serial)
        }
        currentBranchId={currentBranchId}
      />

      {selectedPrescription && (
        <LensConfiguration
          lensType={formData.lens_type}
          lensMaterial={formData.lens_material}
          lensIndex={formData.lens_index}
          lensTreatments={formData.lens_treatments}
          lensTintColor={formData.lens_tint_color}
          lensTintPercentage={formData.lens_tint_percentage}
          onLensTypeChange={handleLensTypeChange}
          onLensMaterialChange={handleLensMaterialChange}
          onLensIndexChange={(index) => updateField("lens_index", index)}
          onTreatmentsChange={handleTreatmentsChange}
          onTintColorChange={(color) => updateField("lens_tint_color", color)}
          onTintPercentageChange={(percentage) =>
            updateField("lens_tint_percentage", percentage)
          }
        />
      )}

      <LabInfoSection
        labName={formData.lab_name}
        labContact={formData.lab_contact}
        labOrderNumber={formData.lab_order_number}
        labEstimatedDeliveryDate={formData.lab_estimated_delivery_date}
        onLabNameChange={(name) => updateField("lab_name", name)}
        onLabContactChange={(contact) => updateField("lab_contact", contact)}
        onLabOrderNumberChange={(number) =>
          updateField("lab_order_number", number)
        }
        onLabDeliveryDateChange={(date) =>
          updateField("lab_estimated_delivery_date", date)
        }
      />

      <PricingSection
        frameCost={formData.frame_cost}
        lensCost={formData.lens_cost}
        treatmentsCost={formData.treatments_cost}
        laborCost={formData.labor_cost}
        labCost={formData.lab_cost}
        discountAmount={formData.discount_amount}
        subtotal={subtotal}
        taxAmount={taxAmount}
        totalAmount={totalAmount}
        paymentStatus={formData.payment_status}
        paymentMethod={formData.payment_method}
        depositAmount={formData.deposit_amount}
        balanceAmount={balanceAmount}
        onFrameCostChange={(cost) => updateField("frame_cost", cost)}
        onLensCostChange={(cost) => updateField("lens_cost", cost)}
        onLaborCostChange={(cost) => updateField("labor_cost", cost)}
        onLabCostChange={(cost) => updateField("lab_cost", cost)}
        onDiscountChange={(amount) => updateField("discount_amount", amount)}
        onPaymentStatusChange={(status) =>
          updateField("payment_status", status)
        }
        onPaymentMethodChange={(method) =>
          updateField("payment_method", method)
        }
        onDepositChange={handleDepositChange}
      />

      <StatusSection
        status={formData.status}
        onStatusChange={(status) => updateField("status", status)}
      />

      <NotesSection
        internalNotes={formData.internal_notes}
        customerNotes={formData.customer_notes}
        onInternalNotesChange={(notes) => updateField("internal_notes", notes)}
        onCustomerNotesChange={(notes) => updateField("customer_notes", notes)}
      />

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
    </form>
  );
}
