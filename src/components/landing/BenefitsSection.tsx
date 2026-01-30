"use client";

import { Clock, TrendingUp, Heart, Shield } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Ahorro de Tiempo",
    description:
      "Automatiza procesos repetitivos y ahorra hasta 10 horas semanales en tareas administrativas.",
    stat: "10h/semana",
    color: "blue",
  },
  {
    icon: TrendingUp,
    title: "Aumento de Ventas",
    description:
      "Mejora la conversión con presupuestos rápidos y seguimiento automatizado de clientes.",
    stat: "+30%",
    color: "green",
  },
  {
    icon: Heart,
    title: "Mejor Experiencia del Cliente",
    description:
      "Proceso más rápido y profesional que mejora la satisfacción y fidelización de clientes.",
    stat: "+95%",
    color: "pink",
  },
  {
    icon: Shield,
    title: "Reducción de Errores",
    description:
      "Cálculos automáticos y validaciones que eliminan errores en presupuestos y órdenes.",
    stat: "-90%",
    color: "purple",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Resultados que Importan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre cómo Opttius transforma la gestión de tu óptica
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const colorClasses = {
              blue: "bg-blue-100 text-blue-600",
              green: "bg-green-100 text-green-600",
              pink: "bg-pink-100 text-pink-600",
              purple: "bg-purple-100 text-purple-600",
            };
            const colorClass =
              colorClasses[benefit.color as keyof typeof colorClasses] ||
              colorClasses.blue;

            return (
              <div
                key={index}
                className="relative p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="absolute top-4 right-4 text-4xl font-bold text-gray-200">
                  {benefit.stat}
                </div>
                <div
                  className={`inline-flex p-4 ${colorClass.split(" ")[0]} rounded-xl mb-6`}
                >
                  <benefit.icon
                    className={`h-8 w-8 ${colorClass.split(" ")[1]}`}
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
