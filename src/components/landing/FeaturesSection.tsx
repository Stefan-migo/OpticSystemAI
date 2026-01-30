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
    title: "Gestión de Clientes IA",
    description:
      "Sistema inteligente de gestión de clientes con historial completo, recetas y seguimiento automatizado.",
    color: "blue",
  },
  {
    icon: ShoppingCart,
    title: "POS Integrado",
    description:
      "Punto de venta completo con múltiples métodos de pago, gestión de inventario y facturación automática.",
    color: "indigo",
  },
  {
    icon: Building2,
    title: "Multi-Sucursal",
    description:
      "Gestiona múltiples sucursales desde un solo panel con sincronización en tiempo real y control centralizado.",
    color: "cyan",
  },
  {
    icon: MessageSquare,
    title: "Chatbot IA",
    description:
      "Asistente inteligente que responde consultas, gestiona citas y automatiza tareas administrativas.",
    color: "teal",
  },
  {
    icon: BarChart3,
    title: "Analíticas Avanzadas",
    description:
      "Dashboard con métricas clave, reportes personalizados y insights para tomar decisiones informadas.",
    color: "blue",
  },
  {
    icon: Calendar,
    title: "Sistema de Citas",
    description:
      "Calendario inteligente con disponibilidad automática, recordatorios y gestión de horarios.",
    color: "indigo",
  },
  {
    icon: FileText,
    title: "Presupuestos y Órdenes",
    description:
      "Creación automática de presupuestos, conversión a órdenes y seguimiento completo del ciclo de vida.",
    color: "cyan",
  },
  {
    icon: Package,
    title: "Gestión de Inventario",
    description:
      "Control de stock en tiempo real, alertas de inventario bajo y gestión de productos ópticos.",
    color: "teal",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Características Principales</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Herramientas poderosas diseñadas específicamente para ópticas y
            laboratorios
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const colorClasses = {
              blue: "bg-blue-100 text-blue-600",
              indigo: "bg-indigo-100 text-indigo-600",
              cyan: "bg-cyan-100 text-cyan-600",
              teal: "bg-teal-100 text-teal-600",
            };
            const colorClass =
              colorClasses[feature.color as keyof typeof colorClasses] ||
              colorClasses.blue;

            return (
              <div
                key={index}
                className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div
                  className={`inline-flex p-3 ${colorClass.split(" ")[0]} rounded-lg mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon
                    className={`h-6 w-6 ${colorClass.split(" ")[1]}`}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
