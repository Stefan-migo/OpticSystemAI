"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "$49",
    period: "mes",
    description: "Perfecto para ópticas pequeñas",
    features: [
      "1 sucursal",
      "Hasta 2 usuarios",
      "Hasta 500 clientes",
      "Hasta 100 productos",
      "POS integrado",
      "Sistema de citas",
      "Presupuestos y órdenes",
      "Soporte por email",
    ],
    popular: false,
    color: "blue",
  },
  {
    name: "Pro",
    price: "$99",
    period: "mes",
    description: "Ideal para ópticas en crecimiento",
    features: [
      "3 sucursales",
      "Hasta 5 usuarios",
      "Hasta 2,000 clientes",
      "Hasta 500 productos",
      "Todo lo de Basic",
      "Chatbot IA",
      "Analíticas avanzadas",
      "Soporte prioritario",
    ],
    popular: true,
    color: "indigo",
  },
  {
    name: "Premium",
    price: "$299",
    period: "mes",
    description: "Para grandes operaciones",
    features: [
      "Sucursales ilimitadas",
      "Hasta 50 usuarios",
      "Clientes ilimitados",
      "Productos ilimitados",
      "Todo lo de Pro",
      "API personalizada",
      "Branding personalizado",
      "Soporte 24/7 dedicado",
    ],
    popular: false,
    color: "cyan",
  },
];

export function PricingSection() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/onboarding/choice");
  };

  return (
    <section id="precios" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Planes que se Adaptan a Ti
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Elige el plan perfecto para tu óptica. Todos incluyen prueba
            gratuita de 14 días.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl border-2 ${
                plan.popular
                  ? "border-indigo-500 shadow-2xl scale-105 bg-gradient-to-br from-indigo-50 to-white"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => {
                  const colorClasses = {
                    blue: "bg-blue-100 text-blue-600",
                    indigo: "bg-indigo-100 text-indigo-600",
                    cyan: "bg-cyan-100 text-cyan-600",
                  };
                  const colorClass =
                    colorClasses[plan.color as keyof typeof colorClasses] ||
                    colorClasses.blue;

                  return (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div
                        className={`p-1 ${colorClass.split(" ")[0]} rounded-full mt-0.5 flex-shrink-0`}
                      >
                        <Check
                          className={`h-4 w-4 ${colorClass.split(" ")[1]}`}
                        />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  );
                })}
              </ul>

              <Button
                onClick={handleGetStarted}
                className={`w-full ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                    : "bg-gray-900 hover:bg-gray-800 text-white"
                }`}
                size="lg"
              >
                Comenzar Prueba Gratuita
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Todos los planes incluyen prueba gratuita de 14 días
          </p>
          <Button
            onClick={() => router.push("/signup")}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            Comenzar Ahora - Es Gratis
          </Button>
        </div>
      </div>
    </section>
  );
}
