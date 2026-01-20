"use client";

import { useState, useEffect } from "react";
import { getBranchHeader } from "@/lib/utils/branch";

export interface WorkOrderFormData {
  frame_name: string;
  frame_brand: string;
  frame_model: string;
  frame_color: string;
  frame_size: string;
  frame_sku: string;
  frame_serial_number: string;
  frame_product_id?: string;
  lens_type: string;
  lens_material: string;
  lens_index: number | null;
  lens_treatments: string[];
  lens_tint_color: string;
  lens_tint_percentage: number;
  lab_name: string;
  lab_contact: string;
  lab_order_number: string;
  lab_estimated_delivery_date: string;
  frame_cost: number;
  frame_price_includes_tax: boolean;
  lens_cost: number;
  treatments_cost: number;
  labor_cost: number;
  lab_cost: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  deposit_amount: number;
  balance_amount: number;
  internal_notes: string;
  customer_notes: string;
  status: string;
}

const initialFormData: WorkOrderFormData = {
  frame_name: "",
  frame_brand: "",
  frame_model: "",
  frame_color: "",
  frame_size: "",
  frame_sku: "",
  frame_serial_number: "",
  lens_type: "",
  lens_material: "",
  lens_index: null,
  lens_treatments: [],
  lens_tint_color: "",
  lens_tint_percentage: 0,
  lab_name: "",
  lab_contact: "",
  lab_order_number: "",
  lab_estimated_delivery_date: "",
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
  payment_status: "pending",
  payment_method: "",
  deposit_amount: 0,
  balance_amount: 0,
  internal_notes: "",
  customer_notes: "",
  status: "ordered",
};

export function useWorkOrderForm(
  quoteId?: string,
  initialCustomerId?: string,
  currentBranchId?: string | null,
) {
  const [formData, setFormData] = useState<WorkOrderFormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  // Load quote if quoteId provided
  useEffect(() => {
    if (quoteId) {
      loadQuote(quoteId);
    }
  }, [quoteId]);

  const loadQuote = async (quoteId: string) => {
    try {
      setLoading(true);
      const headers: HeadersInit = {
        ...getBranchHeader(currentBranchId || null),
      };
      const response = await fetch(`/api/admin/quotes/${quoteId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        const quote = data.quote;

        // If quote has frame_product_id, fetch the product to get price_includes_tax
        let framePriceIncludesTax = false;
        if (quote.frame_product_id) {
          try {
            const productHeaders: HeadersInit = {
              ...getBranchHeader(currentBranchId || null),
            };
            const productResponse = await fetch(
              `/api/admin/products/${quote.frame_product_id}`,
              { headers: productHeaders },
            );
            if (productResponse.ok) {
              const productData = await productResponse.json();
              framePriceIncludesTax =
                productData.product?.price_includes_tax || false;
            }
          } catch (error) {
            console.error(
              "Error fetching product for price_includes_tax:",
              error,
            );
          }
        }

        // Set form data from quote
        setFormData((prev) => ({
          ...prev,
          frame_name: quote.frame_name || "",
          frame_brand: quote.frame_brand || "",
          frame_model: quote.frame_model || "",
          frame_color: quote.frame_color || "",
          frame_size: quote.frame_size || "",
          frame_sku: quote.frame_sku || "",
          lens_type: quote.lens_type || "",
          lens_material: quote.lens_material || "",
          lens_index: quote.lens_index,
          lens_treatments: quote.lens_treatments || [],
          lens_tint_color: quote.lens_tint_color || "",
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
          customer_notes: quote.customer_notes || "",
          status: "ordered",
        }));
      }
    } catch (error) {
      console.error("Error loading quote:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof WorkOrderFormData>(
    field: K,
    value: WorkOrderFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateFormData = (data: Partial<WorkOrderFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  return {
    formData,
    updateField,
    updateFormData,
    loadQuote,
    resetForm,
    loading,
  };
}
