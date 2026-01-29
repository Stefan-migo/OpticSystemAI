/**
 * Billing Factory
 *
 * Factory Pattern para crear el adaptador de facturación correcto
 * según la configuración del sistema.
 */

import { BillingAdapter } from "./adapters/BillingAdapter";
import { InternalBilling } from "./adapters/InternalBilling";
// import { SIIBilling } from './adapters/SIIBilling'; // Futuro: Fase 2

export interface BillingConfig {
  useFiscalBilling: boolean;
  siiCredentials?: {
    apiKey: string;
    apiUrl: string;
    // ... otros credenciales SII
  };
}

export class BillingFactory {
  /**
   * Crea el adaptador de facturación según la configuración
   */
  static createAdapter(config: BillingConfig): BillingAdapter {
    if (config.useFiscalBilling && config.siiCredentials) {
      // TODO: Implementar SIIBilling en Fase 2 (Futuro)
      // return new SIIBilling(config.siiCredentials);
      throw new Error(
        "Facturación fiscal (SII) no implementada aún. Use facturación interna.",
      );
    }

    // Por defecto, usar facturación interna (Shadow Billing)
    return new InternalBilling();
  }

  /**
   * Obtiene la configuración de facturación desde la base de datos
   * Por ahora siempre retorna facturación interna
   */
  static async getBillingConfig(branchId: string): Promise<BillingConfig> {
    // TODO: Leer configuración desde organization_settings o branch_settings
    // Por ahora, siempre usar facturación interna
    return {
      useFiscalBilling: false,
    };
  }
}
