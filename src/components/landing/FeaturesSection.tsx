"use client";

import {
  Users,
  ShoppingCart,
  Building2,
  MessageSquare,
  BarChart3,
  Calendar,
  FileText,
  Package,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Gestión de Pacientes IA",
    description:
      "Historiales inteligentes con análisis predictivo de graduación y recetas digitales completas.",
  },
  {
    icon: ShoppingCart,
    title: "POS de Nueva Generación",
    description:
      "Venta rápida e intuitiva con integración de inventario y facturación en un clic.",
  },
  {
    icon: Building2,
    title: "Control Multi-Sucursal",
    description:
      "Gestiona tu imperio óptico desde un solo lugar con sincronización en la nube 24/7.",
  },
  {
    icon: MessageSquare,
    title: "Asistente AI 24/7",
    description:
      "Atención al cliente automatizada que agenda citas y responde dudas sobre productos.",
  },
  {
    icon: BarChart3,
    title: "Inteligencia de Negocio",
    description:
      "Reportes ejecutivos automáticos que te dicen exactamente dónde estás ganando dinero.",
  },
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description:
      "Optimiza el tiempo de tus optometristas con recordatorios vía WhatsApp automáticos.",
  },
  {
    icon: FileText,
    title: "Laboratorio Conectado",
    description:
      "Seguimiento en tiempo real de órdenes de laboratorio desde el taller hasta las manos del cliente.",
  },
  {
    icon: Package,
    title: "Inventario Infinito",
    description:
      "Control de stock con IA que te avisa cuándo reponer basándose en tus tendencias de venta.",
  },
];

export function FeaturesSection() {
  return (
    <section
      className="py-32 bg-[var(--admin-bg-primary)]"
      id="caracteristicas"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[var(--admin-bg-primary)]">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Capacidades Premium</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-malisha text-gray-900 mb-6">
            Todo lo que necesitas,{" "}
            <span className="text-primary italic">Elevado al Máximo</span>
          </h2>
          <p className="text-lg text-gray-500 font-body">
            Herramientas diseñadas con precisión suiza para el mercado óptico de
            vanguardia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-[var(--admin-bg-tertiary)] rounded-[2rem] border border-gray-100 hover:border-primary/20 hover:shadow-premium-lg transition-all duration-500 hover:-translate-y-2"
            >
              <div className="inline-flex p-4 bg-[var(--admin-bg-tertiary)] rounded-2xl mb-6 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed font-body">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
