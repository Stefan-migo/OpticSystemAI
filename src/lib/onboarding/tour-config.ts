/**
 * Tour Configuration
 *
 * This file contains the configuration for the onboarding tour,
 * including all steps, their descriptions, and selectors.
 */

export interface TourStep {
  id: string;
  section: string; // 'dashboard', 'customers', 'products', etc.
  title: string;
  description: string;
  keyActions: string[]; // Lista de acciones clave
  selector: string; // Selector CSS del elemento a destacar
  position?: "top" | "bottom" | "left" | "right" | "center";
  actionUrl?: string; // URL para acción rápida
  actionLabel?: string; // Texto del botón de acción
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard-overview",
    section: "dashboard",
    title: "Dashboard - Visión General",
    description:
      "Aquí encontrarás todas las métricas clave de tu óptica: ventas, trabajos pendientes, presupuestos y citas del día.",
    keyActions: [
      "Ver métricas en tiempo real",
      "Acceder rápidamente a POS, citas y trabajos",
      "Revisar alertas de stock bajo",
    ],
    selector: '[data-tour="dashboard-header"]',
    position: "bottom",
  },
  {
    id: "customers-list",
    section: "customers",
    title: "Gestión de Clientes",
    description:
      "Administra tu base de datos de clientes. Busca por RUT, nombre o email. Crea nuevos clientes y gestiona sus recetas médicas.",
    keyActions: [
      "Buscar clientes por RUT (con o sin formato)",
      "Crear nuevo cliente",
      "Ver historial completo (citas, presupuestos, trabajos)",
    ],
    selector: '[data-tour="customers-search"]',
    position: "bottom",
    actionUrl: "/admin/customers/new",
    actionLabel: "Crear Cliente",
  },
  {
    id: "products-catalog",
    section: "products",
    title: "Catálogo de Productos",
    description:
      "Gestiona tu inventario de productos ópticos: marcos, lentes, accesorios. Controla stock, precios y categorías.",
    keyActions: [
      "Agregar nuevos productos",
      "Filtrar por categoría o tipo",
      "Ver alertas de stock bajo",
      "Importar productos en masa",
    ],
    selector: '[data-tour="products-header"]',
    position: "bottom",
    actionUrl: "/admin/products/add",
    actionLabel: "Agregar Producto",
  },
  {
    id: "quotes-create",
    section: "quotes",
    title: "Presupuestos",
    description:
      "Crea presupuestos detallados para tus clientes. Incluye marcos, lentes, tratamientos y mano de obra. Envía por email y convierte a trabajos.",
    keyActions: [
      "Crear nuevo presupuesto",
      "Enviar presupuesto por email",
      "Convertir presupuesto aceptado a trabajo",
      "Gestionar expiración automática",
    ],
    selector: '[data-tour="quotes-header"]',
    position: "bottom",
    actionUrl: "/admin/quotes",
    actionLabel: "Crear Presupuesto",
  },
  {
    id: "work-orders-tracking",
    section: "work-orders",
    title: "Trabajos de Laboratorio",
    description:
      "Sigue el progreso de los trabajos de laboratorio. Cambia estados, asigna personal y visualiza el timeline de cada trabajo.",
    keyActions: [
      "Crear nuevo trabajo desde presupuesto",
      "Cambiar estado del trabajo",
      "Ver timeline visual del progreso",
      "Asignar trabajos a personal",
    ],
    selector: '[data-tour="work-orders-header"]',
    position: "bottom",
  },
  {
    id: "appointments-calendar",
    section: "appointments",
    title: "Citas y Agenda",
    description:
      "Gestiona tu calendario de citas. Crea nuevas citas, visualiza disponibilidad y gestiona estados. Soporta clientes no registrados.",
    keyActions: [
      "Ver calendario semanal/mensual",
      "Crear nueva cita",
      "Verificar disponibilidad",
      "Gestionar estados de citas",
    ],
    selector: '[data-tour="appointments-calendar"]',
    position: "top",
  },
  {
    id: "pos-sales",
    section: "pos",
    title: "Punto de Venta",
    description:
      "Sistema de ventas rápido e integrado. Busca clientes, carga presupuestos, selecciona productos y procesa pagos con múltiples métodos.",
    keyActions: [
      "Buscar cliente por RUT o nombre",
      "Cargar presupuesto al carrito",
      "Seleccionar productos y calcular totales",
      "Procesar venta con múltiples métodos de pago",
    ],
    selector: '[data-tour="pos-header"]',
    position: "bottom",
    actionUrl: "/admin/pos",
    actionLabel: "Abrir POS",
  },
  {
    id: "analytics-reports",
    section: "analytics",
    title: "Analíticas y Reportes",
    description:
      "Visualiza el rendimiento de tu negocio con gráficos y reportes detallados. Analiza ventas, tendencias y productos más vendidos.",
    keyActions: [
      "Ver gráficos de ventas",
      "Filtrar reportes por período",
      "Analizar productos más vendidos",
      "Exportar datos",
    ],
    selector: '[data-tour="analytics-header"]',
    position: "bottom",
  },
  {
    id: "system-config",
    section: "system",
    title: "Configuración del Sistema",
    description:
      "Configura tu óptica: datos de la empresa, emails, notificaciones, horarios y más. Personaliza el sistema según tus necesidades.",
    keyActions: [
      "Configurar datos de la óptica",
      "Ajustar notificaciones",
      "Configurar plantillas de email",
      "Revisar salud del sistema",
    ],
    selector: '[data-tour="system-header"]',
    position: "bottom",
  },
];

export const TOUR_CONFIG = {
  /** Desactivar todo el tour (auto-inicio, overlay, botón flotante). Poner en true cuando esté listo. */
  enabled: false,
  autoStart: true, // Iniciar automáticamente en primera visita
  showProgress: true, // Mostrar barra de progreso
  allowSkip: true, // Permitir saltar el tour
  allowRestart: true, // Permitir reiniciar el tour
  highlightDelay: 100, // Delay antes de destacar elemento (ms) - reducido para mejor rendimiento
  animationDuration: 200, // Duración de animaciones (ms) - reducido para mejor rendimiento
  useMockupPages: true, // Usar páginas mockup para mejor performance
  mockupBasePath: "/admin/tour", // Ruta base para páginas mockup
};

/**
 * Get tour steps filtered by user role
 * Currently returns all steps, but can be extended for role-based filtering
 */
export function getTourStepsForUser(userRole?: string): TourStep[] {
  const baseSteps = TOUR_STEPS;

  // Future: Add role-based filtering
  // if (userRole === 'super_admin') {
  //   return [
  //     ...baseSteps,
  //     {
  //       id: 'branches-management',
  //       section: 'branches',
  //       title: 'Gestión de Sucursales',
  //       // ...
  //     },
  //   ];
  // }

  return baseSteps;
}
