"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export function ProblemSolutionSection() {
  const problems = [
    {
      icon: XCircle,
      title: "Gestión Manual Desorganizada",
      description:
        "Seguimiento de clientes, citas y recetas en múltiples sistemas o papel",
    },
    {
      icon: XCircle,
      title: "Pérdida de Tiempo en Tareas Repetitivas",
      description:
        "Horas perdidas en procesos administrativos que podrían automatizarse",
    },
    {
      icon: XCircle,
      title: "Errores en Presupuestos y Órdenes",
      description:
        "Cálculos manuales propensos a errores que afectan la rentabilidad",
    },
    {
      icon: XCircle,
      title: "Falta de Visibilidad del Negocio",
      description: "Sin datos claros sobre ventas, inventario y rendimiento",
    },
  ];

  const solutions = [
    {
      icon: CheckCircle2,
      title: "Sistema Centralizado Inteligente",
      description:
        "Todo en un solo lugar: clientes, citas, presupuestos, órdenes y más",
      color: "blue",
    },
    {
      icon: CheckCircle2,
      title: "Automatización con IA",
      description:
        "Chatbot inteligente que gestiona consultas y tareas automáticamente",
      color: "indigo",
    },
    {
      icon: CheckCircle2,
      title: "Cálculos Precisos y Automáticos",
      description:
        "Presupuestos y órdenes con cálculos automáticos sin errores",
      color: "cyan",
    },
    {
      icon: CheckCircle2,
      title: "Analíticas en Tiempo Real",
      description:
        "Dashboard con métricas clave para tomar decisiones informadas",
      color: "teal",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            De Problemas a Soluciones
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Entendemos los desafíos que enfrentas y tenemos las herramientas
            para resolverlos
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Problems Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h3 className="text-2xl font-bold text-gray-900">Los Desafíos</h3>
            </div>
            {problems.map((problem, index) => (
              <div
                key={index}
                className="p-6 bg-red-50 border border-red-100 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <problem.icon className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {problem.title}
                    </h4>
                    <p className="text-gray-600">{problem.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Solutions Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <h3 className="text-2xl font-bold text-gray-900">
                La Solución Opttius
              </h3>
            </div>
            {solutions.map((solution, index) => {
              const colorClasses = {
                blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-600",
                indigo:
                  "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600",
                cyan: "from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-600",
                teal: "from-teal-50 to-teal-100 border-teal-200 text-teal-600",
              };
              const colorClass =
                colorClasses[solution.color as keyof typeof colorClasses] ||
                colorClasses.blue;

              return (
                <div
                  key={index}
                  className={`p-6 bg-gradient-to-br ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]} border ${colorClass.split(" ")[2]} rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-1`}
                >
                  <div className="flex items-start gap-4">
                    <solution.icon
                      className={`h-6 w-6 ${colorClass.split(" ")[3]} mt-1 flex-shrink-0`}
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {solution.title}
                      </h4>
                      <p className="text-gray-600">{solution.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
