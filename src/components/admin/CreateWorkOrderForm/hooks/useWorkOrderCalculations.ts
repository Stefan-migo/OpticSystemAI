"use client";

import { useEffect, useState } from "react";
import { calculatePriceWithTax } from "@/lib/utils/tax";
import {
  getTaxPercentage,
  getQuoteTaxInclusionSettings,
} from "@/lib/utils/tax-config";
import { getBranchHeader } from "@/lib/utils/branch";
import type { WorkOrderFormData } from "./useWorkOrderForm";

interface UseWorkOrderCalculationsProps {
  formData: WorkOrderFormData;
  updateFormData: (data: Partial<WorkOrderFormData>) => void;
  currentBranchId: string | null;
}

export function useWorkOrderCalculations({
  formData,
  updateFormData,
  currentBranchId,
}: UseWorkOrderCalculationsProps) {
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
          ...getBranchHeader(currentBranchId),
        };
        const response = await fetch("/api/admin/quote-settings", { headers });
        if (response.ok) {
          const data = await response.json();
          setQuoteSettings(data.settings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [currentBranchId]);

  const calculateTotals = () => {
    // Use tax percentage from settings or system config, default to 19% (IVA Chile)
    const effectiveTaxRate =
      quoteSettings?.default_tax_percentage || taxPercentage;

    // Get tax inclusion settings from quote settings (default to true - IVA incluido)
    const lensIncludesTax = quoteSettings?.lens_cost_includes_tax ?? true;
    const treatmentsIncludeTax =
      quoteSettings?.treatments_cost_includes_tax ?? true;
    const laborIncludesTax = quoteSettings?.labor_cost_includes_tax ?? true;
    // Lab cost typically doesn't include tax (it's an external service)
    const labIncludesTax = false;

    // Calculate frame price with tax consideration
    const framePriceBreakdown = calculatePriceWithTax(
      formData.frame_cost || 0,
      formData.frame_price_includes_tax || false,
      effectiveTaxRate,
    );

    // Calculate lens, treatments, labor, and lab with tax consideration
    const lensBreakdown = calculatePriceWithTax(
      formData.lens_cost || 0,
      lensIncludesTax,
      effectiveTaxRate,
    );

    const treatmentsBreakdown = calculatePriceWithTax(
      formData.treatments_cost || 0,
      treatmentsIncludeTax,
      effectiveTaxRate,
    );

    const laborBreakdown = calculatePriceWithTax(
      formData.labor_cost || 0,
      laborIncludesTax,
      effectiveTaxRate,
    );

    const labBreakdown = calculatePriceWithTax(
      formData.lab_cost || 0,
      labIncludesTax,
      effectiveTaxRate,
    );

    // Calculate subtotal (sum of all subtotals without tax)
    const subtotal =
      framePriceBreakdown.subtotal +
      lensBreakdown.subtotal +
      treatmentsBreakdown.subtotal +
      laborBreakdown.subtotal +
      labBreakdown.subtotal;

    // Calculate total tax (sum of all taxes)
    const totalTax =
      framePriceBreakdown.tax +
      lensBreakdown.tax +
      treatmentsBreakdown.tax +
      laborBreakdown.tax +
      labBreakdown.tax;

    // Total with tax (before discount)
    const totalWithTax = subtotal + totalTax;

    // Apply discount to total with tax
    const discount = formData.discount_amount || 0;
    const afterDiscount = Math.max(0, totalWithTax - discount);

    updateFormData({
      subtotal,
      tax_amount: totalTax,
      total_amount: afterDiscount,
      balance_amount: afterDiscount - formData.deposit_amount,
    });
  };

  // Recalculate when relevant fields change
  useEffect(() => {
    calculateTotals();
  }, [
    formData.frame_cost,
    formData.frame_price_includes_tax,
    formData.lens_cost,
    formData.treatments_cost,
    formData.labor_cost,
    formData.lab_cost,
    formData.discount_amount,
    formData.deposit_amount,
    taxPercentage,
    quoteSettings,
  ]);

  return {
    subtotal: formData.subtotal,
    taxAmount: formData.tax_amount,
    totalAmount: formData.total_amount,
    balanceAmount: formData.balance_amount,
    calculateTotals,
    taxPercentage,
    quoteSettings,
    loadingSettings,
  };
}
