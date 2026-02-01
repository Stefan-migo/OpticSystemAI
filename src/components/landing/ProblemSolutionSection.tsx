"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import businessConfig from "@/config/business";

export function ProblemSolutionSection() {
  const problems = [
    {
      icon: XCircle,
      title: "Gestión Manual Desorganizada",
      description:
        "Seguimiento de clientes, citas y recetas en múltiples sistemas o papel que generan caos.",
    },
    {
      icon: XCircle,
      title: "Pérdida de Tiempo Admin",
      description:
        "Horas perdidas en procesos manuales que consumen la energía de tu equipo.",
    },
    {
      icon: XCircle,
      title: "Errores en Recetas y Órdenes",
      description:
        "Cálculos manuales propensos a errores que resultan en devoluciones y pérdida de dinero.",
    },
    {
      icon: XCircle,
      title: "Falta de Visibilidad Real",
      description:
        "Sin datos claros sobre ventas e inventario, diriges tu negocio a ciegas.",
    },
  ];

  const solutions = [
    {
      icon: CheckCircle2,
      title: "Centro de Operaciones Inteligente",
      description:
        "Una única plataforma para controlar pacientes, ventas y laboratorio con precisión total.",
    },
    {
      icon: CheckCircle2,
      title: "Automatización con IA Avanzada",
      description:
        "Nuestra IA gestiona lo complejo mientras tú te enfocas en el crecimiento de tu óptica.",
    },
    {
      icon: CheckCircle2,
      title: "Precisión Absoluta en Cálculos",
      description:
        "Elimina el error humano. Presupuestos y órdenes perfectas desde el primer intento.",
    },
    {
      icon: CheckCircle2,
      title: "Analíticas de Alto Nivel",
      description:
        "Toma decisiones basadas en datos reales. Imagina tener el control total de tus KPI.",
    },
  ];

  return (
    <section className="py-32 bg-gray-50/50" id="beneficios">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em] mb-4">
            Evolución Digital
          </h2>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-malisha text-gray-900 mb-6 leading-tight">
            De Problemas a una{" "}
            <span className="text-primary italic">Gestión Impecable</span>
          </h3>
          <p className="text-lg text-gray-500 font-body">
            Entendemos los desafíos del mercado óptico actual. Por eso hemos
            creado la solución definitiva.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-20 items-stretch">
          {/* Problems Column */}
          <div className="relative">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-malisha text-gray-900">
                Los Desafíos Tradicionales
              </h3>
            </div>

            <div className="space-y-4">
              {problems.map((problem, index) => (
                <div
                  key={index}
                  className="group p-8 bg-white border border-gray-100 rounded-[2rem] transition-all duration-300 hover:border-red-100 hover:bg-red-50/10"
                >
                  <div className="flex items-start gap-5">
                    <div className="mt-1 h-6 w-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-red-400 group-hover:bg-red-50 transition-colors">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-900 transition-colors">
                        {problem.title}
                      </h4>
                      <p className="text-gray-500 leading-relaxed text-sm">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions Column */}
          <div className="relative">
            <div className="absolute -inset-6 bg-primary/5 rounded-[3rem] blur-3xl -z-10"></div>

            <div className="flex items-center gap-4 mb-10">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-malisha text-gray-900">
                La Solución {businessConfig.name}
              </h3>
            </div>

            <div className="space-y-4">
              {solutions.map((solution, index) => (
                <div
                  key={index}
                  className="group p-8 bg-white border border-transparent rounded-[2rem] shadow-premium hover:shadow-premium-lg transition-all duration-500 hover:scale-[1.02] border-primary/5"
                >
                  <div className="flex items-start gap-5">
                    <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        {solution.title}
                      </h4>
                      <p className="text-gray-500 leading-relaxed text-sm">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
