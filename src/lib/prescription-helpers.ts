/**
 * Helper functions for prescription types translation
 */

const PRESCRIPTION_TYPE_LABELS: Record<string, string> = {
  single_vision: "Visión Simple",
  bifocal: "Bifocal",
  trifocal: "Trifocal",
  progressive: "Progresivo",
  reading: "Lectura",
  computer: "Computadora",
  sports: "Deportivo",
};

/**
 * Translate prescription type from English to Spanish
 * @param prescriptionType - The prescription type value (e.g., "single_vision")
 * @returns The translated label or the original value if not found
 */
export function translatePrescriptionType(
  prescriptionType: string | null | undefined,
): string {
  if (!prescriptionType) {
    return "Sin tipo";
  }
  return PRESCRIPTION_TYPE_LABELS[prescriptionType] || prescriptionType;
}

/**
 * Get all prescription types with their labels
 */
export function getPrescriptionTypes() {
  return Object.entries(PRESCRIPTION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
}
