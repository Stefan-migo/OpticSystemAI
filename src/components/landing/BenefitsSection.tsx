"use client";

import { Clock, TrendingUp, Heart, Shield, Sparkles } from "lucide-react";
import businessConfig from "@/config/business";

const benefits = [
  {
    icon: Clock,
    title: "Ahorro de Tiempo",
    description:
      "Automatiza procesos repetitivos y recupera hasta 10 horas semanales de gestión administrativa.",
    stat: "10h/sem",
  },
  {
    icon: TrendingUp,
    title: "Crecimiento Orgánico",
    description:
      "Incrementa la tasa de cierre de presupuestos con seguimiento inteligente y proactivo.",
    stat: "+35%",
  },
  {
    icon: Heart,
    title: "Fidelización de Pacientes",
    description:
      "Ofrece una experiencia profesional y rápida que genera lealtad a largo plazo con tu marca.",
    stat: "+98%",
  },
  {
    icon: Shield,
    title: "Precisión de Datos",
    description:
      "Minimiza errores humanos y garantiza que cada orden de laboratorio sea perfecta.",
    stat: "-95%",
  },
];

export function BenefitsSection() {
  return (
    <section
      className="py-32 bg-white relative overflow-hidden"
      id="beneficios"
    >
      {/* Decorative blurry background highlights */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50/50 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span>Impacto en tu Negocio</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-malisha text-gray-900 mb-6 leading-tight">
            Resultados que{" "}
            <span className="text-primary italic">Transforman</span>
          </h2>
          <p className="text-lg text-gray-500 font-body">
            Descubre por qué {businessConfig.name} es la elección predilecta de
            las ópticas modernas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            return (
              <div
                key={index}
                className="group relative p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-premium hover:shadow-premium-lg transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                {/* Background Stat Number */}
                <div className="absolute -top-4 -right-2 text-7xl font-malisha text-gray-50/50 transition-colors group-hover:text-primary/5 select-none pointer-events-none">
                  {benefit.stat}
                </div>

                <div className="relative z-10">
                  <div className="inline-flex p-5 bg-gray-50 rounded-[1.5rem] mb-8 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-sm">
                    <benefit.icon className="h-8 w-8" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight group-hover:text-primary transition-colors">
                    {benefit.title}
                  </h3>

                  <p className="text-gray-500 leading-relaxed font-body text-sm">
                    {benefit.description}
                  </p>
                </div>

                {/* Bottom decorative line */}
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-50 transition-colors group-hover:bg-primary/20"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
