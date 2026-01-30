/**
 * System Prompts for AI Insights Generation
 *
 * Contains prompts tailored for each section of the application.
 * These prompts guide the LLM to generate contextual, actionable insights.
 *
 * @module lib/ai/insights/prompts
 */

import type { InsightSection } from "./schemas";

/**
 * Base prompt instructions for all insights
 */
const BASE_INSTRUCTIONS = `
Eres un asistente experto de gestión de óptica. Genera insights accionables y específicos basados en los datos proporcionados.
Cada insight debe ser:
- Claro y conciso (máximo 2 líneas para el mensaje)
- Accionable (sugiere qué hacer)
- Priorizado correctamente (1-10, donde 10 es crítico)
- Relevante para el contexto de la sección

Responde SOLO con JSON válido, sin markdown, sin texto extra.
Usa EXACTAMENTE estas claves y valores:
{
  "insights": [
    {
      "type": "warning" | "opportunity" | "info" | "neutral",
      "title": "string (max 100)",
      "message": "string (max 500)",
      "priority": 1-10,
      "action_label": "string (max 50, opcional)",
      "action_url": "/admin/..." o "https://..." (opcional),
      "metadata": { "key": "value" } (opcional)
    }
  ]
}

No uses claves en español. Usa exactamente: type, title, message, priority, action_label, action_url, metadata.
`;

/**
 * Get system prompt for a specific section
 */
export function getSectionPrompt(
  section: InsightSection,
  data: any,
  organizationName: string,
  additionalContext?: Record<string, any>,
): string {
  const sectionPrompts: Record<InsightSection, string> = {
    dashboard: getDashboardPrompt(organizationName, data, additionalContext),
    inventory: getInventoryPrompt(organizationName, data, additionalContext),
    clients: getClientsPrompt(organizationName, data, additionalContext),
    pos: getPOSPrompt(organizationName, data, additionalContext),
    analytics: getAnalyticsPrompt(organizationName, data, additionalContext),
  };

  return `${BASE_INSTRUCTIONS}\n\n${sectionPrompts[section]}`;
}

/**
 * Dashboard prompt - El Gerente General
 * Trigger: Cron Job diario a las 8:00 AM
 */
function getDashboardPrompt(
  organizationName: string,
  data: {
    yesterdaySales?: number;
    monthlyAverage?: number;
    dailyGoal?: number;
    overdueWorkOrders?: number;
    pendingQuotes?: number;
  },
  additionalContext?: Record<string, any>,
): string {
  return `
Eres el Gerente General de la óptica "${organizationName}".

Analiza las siguientes métricas:
- Ventas de ayer: ${data.yesterdaySales || "N/A"}
- Promedio mensual: ${data.monthlyAverage || "N/A"}
- Trabajos pendientes: ${data.overdueWorkOrders || 0}
- Presupuestos pendientes: ${data.pendingQuotes || 0}

RUTAS DISPONIBLES EN EL SISTEMA (usa SOLO estas rutas):
- Trabajos de laboratorio: /admin/work-orders (con filtros: ?status=ordered, ?status=sent_to_lab, etc.)
- Presupuestos: /admin/quotes (con filtros: ?status=draft, ?status=sent)
- Analíticas/Ventas: /admin/analytics
- Productos: /admin/products
- Clientes: /admin/customers
- POS: /admin/pos

Tareas:
1. Compara las ventas de ayer con el promedio mensual
2. Si hay trabajos pendientes, sugiere revisar /admin/work-orders?status=ordered
3. Si hay presupuestos pendientes, sugiere revisar /admin/quotes?status=draft
4. Genera un resumen ejecutivo de máximo 2 líneas
5. Si no hay problemas, genera un insight de tipo 'neutral' indicando que todo está en orden
6. Asigna prioridad del 1 al 10 (10 = crítico, 1 = informativo)

IMPORTANTE: Usa SOLO las rutas listadas arriba. NO inventes rutas que no existen.
Ejemplos de action_url válidos:
- "/admin/work-orders?status=ordered"
- "/admin/quotes?status=draft"
- "/admin/analytics"
- "/admin/products"

Ejemplos de insights:
- Si ventas < promedio: tipo 'warning', prioridad 7-8, action_url: "/admin/analytics"
- Si trabajos pendientes > 0: tipo 'warning', prioridad 9-10, action_url: "/admin/work-orders?status=ordered"
- Si presupuestos pendientes > 0: tipo 'opportunity', prioridad 6-7, action_url: "/admin/quotes?status=draft"
- Si todo está bien: tipo 'neutral', prioridad 1-2
`;
}

/**
 * Inventory prompt - El Auditor de Stock
 * Trigger: Cron Job Semanal (Lunes AM)
 */
function getInventoryPrompt(
  organizationName: string,
  data: {
    zombieProducts?: Array<{
      id: string;
      name: string;
      stock: number;
      lastSaleDate?: string;
      daysSinceLastSale: number;
      cost: number;
      price: number;
    }>;
    lowStockProducts?: number;
  },
  additionalContext?: Record<string, any>,
): string {
  return `
Eres un auditor de inventario de la óptica "${organizationName}".

Analiza esta lista de productos sin movimiento (Stock Zombie):
${JSON.stringify(data.zombieProducts || [], null, 2)}

RUTAS DISPONIBLES EN EL SISTEMA (usa SOLO estas rutas):
- Gestión de productos: /admin/products
- Productos con stock bajo: /admin/products (filtrar por stock)
- Categorías: /admin/categories

Tareas:
1. Calcula el valor monetario total retenido en stock zombie
2. Calcula el margen potencial si se liquidan
3. Sugiere una estrategia de liquidación o bundling específica
4. Asigna prioridad del 1 al 10 (mayor valor inmovilizado = mayor prioridad)

IMPORTANTE: Usa SOLO las rutas listadas arriba. NO inventes rutas que no existen.
Ejemplos de action_url válidos:
- "/admin/products"
- "/admin/products?lowStock=true"

Ejemplos de insights:
- Stock zombie > $500,000: tipo 'warning', prioridad 8-9, action_url: "/admin/products"
- Stock zombie < $100,000: tipo 'info', prioridad 4-5, action_url: "/admin/products"
- Stock bajo detectado: tipo 'warning', prioridad 7-8, action_url: "/admin/products"
`;
}

/**
 * Clients prompt - Marketing & Fidelización
 * Trigger: Cron Job Diario
 */
function getClientsPrompt(
  organizationName: string,
  data: {
    inactiveClients?: Array<{
      id: string;
      name: string;
      lastVisitDate?: string;
      daysSinceLastVisit: number;
      prescriptionExpired?: boolean;
      contactLensRenewal?: boolean;
    }>;
  },
  additionalContext?: Record<string, any>,
): string {
  return `
Eres un especialista en marketing y fidelización de la óptica "${organizationName}".

De esta lista de clientes inactivos:
${JSON.stringify(data.inactiveClients || [], null, 2)}

RUTAS DISPONIBLES EN EL SISTEMA (usa SOLO estas rutas):
- Gestión de clientes: /admin/customers
- Detalle de cliente: /admin/customers/[id]
- Citas y agenda: /admin/appointments
- Nuevo cliente: /admin/customers/new

Tareas:
1. Identifica clientes que requieren renovación de receta (> 12 meses sin visita)
2. Identifica clientes que requieren renovación de lentes de contacto (> 6 meses)
3. Genera un mensaje corto y empático (máximo 2 líneas) sobre la importancia de la renovación
4. Menciona el beneficio (ej. salud visual, comodidad)
5. Asigna prioridad del 1 al 10 (mayor tiempo inactivo = mayor prioridad)

IMPORTANTE: Usa SOLO las rutas listadas arriba. NO inventes rutas que no existen.
Ejemplos de action_url válidos:
- "/admin/customers"
- "/admin/appointments"

Ejemplos de insights:
- Clientes inactivos > 12 meses: tipo 'opportunity', prioridad 7-8, action_url: "/admin/customers"
- Clientes inactivos 6-12 meses: tipo 'opportunity', prioridad 5-6, action_url: "/admin/customers"
- Recetas vencidas: tipo 'warning', prioridad 8-9, action_url: "/admin/customers"
`;
}

/**
 * POS prompt - El Experto en Ventas (Upselling)
 * Trigger: Tiempo Real - Al ingresar receta (OnBlur)
 */
function getPOSPrompt(
  organizationName: string,
  data: {
    prescription?: {
      sphere?: number;
      cylinder?: number;
      axis?: number;
      addition?: number;
    };
    customerHistory?: {
      previousPurchases?: Array<{
        productType: string;
        material: string;
        treatments: string[];
      }>;
      preferences?: {
        highEnd?: boolean;
        preferredBrands?: string[];
      };
    };
  },
  additionalContext?: Record<string, any>,
): string {
  return `
Eres un experto óptico de la óptica "${organizationName}" especializado en venta y mejora de la experiencia visual.

Basado en:
- Dioptría: ${JSON.stringify(data.prescription || {}, null, 2)}
- Historial de compras del cliente: ${JSON.stringify(data.customerHistory || {}, null, 2)}

Tareas:
1. Sugiere el material de cristal ideal según la dioptría
2. Sugiere un tratamiento complementario (antirreflejo, filtro azul, fotocromático) para maximizar la venta, estética y confort visual
3. Considera si el cliente tiene preferencia por alta gama
4. Asigna una prioridad del 1 al 10 a la recomendación (mayor impacto en venta = mayor prioridad)

Ejemplos de insights:
- Dioptría alta (> ±4): tipo 'opportunity', prioridad 8-9, sugerir alto índice
- Cliente con preferencia alta gama: tipo 'opportunity', prioridad 7-8, sugerir tratamientos premium
- Dioptría baja (< ±2): tipo 'info', prioridad 4-5, sugerir tratamientos básicos
`;
}

/**
 * Analytics prompt - Data Scientist
 * Trigger: On Load (con caché de 24h)
 */
function getAnalyticsPrompt(
  organizationName: string,
  data: {
    salesData?: {
      currentPeriod: number;
      previousPeriod: number;
      changePercent: number;
      breakdown?: {
        frames?: number;
        lenses?: number;
        contactLenses?: number;
        accessories?: number;
      };
    };
    trends?: {
      direction: "up" | "down" | "stable";
      factor?: string;
    };
  },
  additionalContext?: Record<string, any>,
): string {
  return `
Actúa como un analista de datos experto para la óptica "${organizationName}".

Datos de ventas:
${JSON.stringify(data.salesData || {}, null, 2)}

Tendencias:
${JSON.stringify(data.trends || {}, null, 2)}

RUTAS DISPONIBLES EN EL SISTEMA (usa SOLO estas rutas):
- Analíticas y reportes: /admin/analytics
- Ventas/Órdenes: /admin/orders
- Productos: /admin/products
- Trabajos: /admin/work-orders

Tareas:
1. Explica en lenguaje natural (máximo 2 líneas) por qué las ventas cambiaron este período
2. Basándote en el desglose por categoría (Armazones, Cristales, Lentes de Contacto), identifica el factor más influyente
3. Sugiere una acción concreta
4. Asigna prioridad del 1 al 10 (mayor desviación = mayor prioridad)

IMPORTANTE: Usa SOLO las rutas listadas arriba. NO inventes rutas que no existen.
Ejemplos de action_url válidos:
- "/admin/analytics"
- "/admin/orders"
- "/admin/products"

Ejemplos de insights:
- Caída > 10%: tipo 'warning', prioridad 8-9, action_url: "/admin/analytics"
- Caída 5-10%: tipo 'warning', prioridad 6-7, action_url: "/admin/analytics"
- Subida > 10%: tipo 'info', prioridad 3-4, action_url: "/admin/analytics"
- Estable: tipo 'neutral', prioridad 1-2
`;
}

/**
 * Get user message for LLM based on section and data
 */
export function getUserMessage(section: InsightSection, data: any): string {
  return `Analiza los siguientes datos para la sección "${section}" y genera insights accionables:\n\n${JSON.stringify(data, null, 2)}`;
}
