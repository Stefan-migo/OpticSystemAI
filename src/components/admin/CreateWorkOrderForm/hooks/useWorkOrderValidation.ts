"use client";

import type { WorkOrderFormData } from "./useWorkOrderForm";

interface ValidationErrors {
  customer?: string;
  prescription?: string;
  lensType?: string;
  lensMaterial?: string;
  frameName?: string;
  [key: string]: string | undefined;
}

export function useWorkOrderValidation(
  formData: WorkOrderFormData,
  selectedCustomer: any,
  selectedPrescription: any,
) {
  const validate = (): boolean => {
    const errors: ValidationErrors = {};

    if (!selectedCustomer) {
      errors.customer = "Selecciona un cliente";
    }

    if (!selectedPrescription) {
      errors.prescription = "Selecciona una receta";
    }

    if (!formData.lens_type || !formData.lens_material) {
      if (!formData.lens_type) {
        errors.lensType = "Selecciona tipo de lente";
      }
      if (!formData.lens_material) {
        errors.lensMaterial = "Selecciona material de lente";
      }
    }

    if (!formData.frame_name) {
      errors.frameName = "Ingresa el nombre del marco";
    }

    return Object.keys(errors).length === 0;
  };

  const validateField = (field: string): boolean => {
    switch (field) {
      case "customer":
        return !!selectedCustomer;
      case "prescription":
        return !!selectedPrescription;
      case "lensType":
        return !!formData.lens_type;
      case "lensMaterial":
        return !!formData.lens_material;
      case "frameName":
        return !!formData.frame_name;
      default:
        return true;
    }
  };

  const getErrors = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!selectedCustomer) {
      errors.customer = "Selecciona un cliente";
    }

    if (!selectedPrescription) {
      errors.prescription = "Selecciona una receta";
    }

    if (!formData.lens_type) {
      errors.lensType = "Selecciona tipo de lente";
    }

    if (!formData.lens_material) {
      errors.lensMaterial = "Selecciona material de lente";
    }

    if (!formData.frame_name) {
      errors.frameName = "Ingresa el nombre del marco";
    }

    return errors;
  };

  return {
    validate,
    validateField,
    getErrors,
    isValid: validate(),
  };
}
