"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2 } from "lucide-react";

type TierName = "basic" | "pro" | "premium";

interface TierFromApi {
  name: TierName;
  price_monthly: number;
  max_branches?: number | null;
  max_users?: number | null;
  max_customers?: number | null;
  max_products?: number | null;
}

const DEFAULT_PRICES: Record<TierName, number> = {
  basic: 49,
  pro: 99,
  premium: 299,
};

const PLANS_CONFIG: Record<
  TierName,
  {
    displayName: string;
    description: string;
    features: string[];
    popular: boolean;
  }
> = {
  basic: {
    displayName: "Standard",
    description: "Para ópticas que inician su transformación digital.",
    features: [
      "1 sucursal",
      "Hasta 2 usuarios",
      "Hasta 500 pacientes",
      "Inventario básico",
      "POS integrado",
      "Presupuestos & Órdenes",
      "Soporte vía tickets",
    ],
    popular: false,
  },
  pro: {
    displayName: "Professional",
    description: "La potencia de la IA para ópticas en expansión.",
    features: [
      "3 sucursales",
      "Hasta 10 usuarios",
      "Hasta 5,000 pacientes",
      "Inventario avanzado",
      "Asistente IA 24/7",
      "Reportes ejecutivos",
      "Soporte prioritario",
    ],
    popular: true,
  },
  premium: {
    displayName: "Enterprise",
    description: "Control total para grandes cadenas y laboratorios.",
    features: [
      "Sucursales ilimitadas",
      "Usuarios ilimitados",
      "Pacientes ilimitados",
      "API de integración",
      "Multibodega avanzada",
      "Personalización de marca",
      "Account Manager dedicado",
    ],
    popular: false,
  },
};

const TIER_ORDER: TierName[] = ["basic", "pro", "premium"];

export function PricingSection() {
  const router = useRouter();
  const [tiers, setTiers] = useState<Array<{ name: TierName; price: number }>>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/landing/tiers")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.tiers?.length) return;
        const ordered = TIER_ORDER.map((name) => {
          const row = data.tiers.find((t: TierFromApi) => t.name === name);
          const price =
            row != null && typeof row.price_monthly === "number"
              ? Number(row.price_monthly)
              : DEFAULT_PRICES[name];
          return { name, price };
        });
        setTiers(ordered);
      })
      .catch(() => {
        if (!cancelled) {
          setTiers(
            TIER_ORDER.map((name) => ({ name, price: DEFAULT_PRICES[name] })),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGetStarted = () => {
    router.push("/signup");
  };

  const plans = tiers.length
    ? tiers.map((t) => ({
        ...PLANS_CONFIG[t.name],
        price: `$${Math.round(t.price).toLocaleString()}`,
        period: "mes",
      }))
    : TIER_ORDER.map((name) => ({
        ...PLANS_CONFIG[name],
        price: `$${DEFAULT_PRICES[name].toLocaleString()}`,
        period: "mes",
      }));

  return (
    <section id="precios" className="py-32 bg-[var(--admin-bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Inversión en Crecimiento</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-malisha text-gray-900 mb-6">
            Planes Diseñados para{" "}
            <span className="text-primary italic">Escalar</span>
          </h2>
          <p className="text-lg text-gray-500 font-body">
            Elige el nivel de potencia que tu óptica necesita. Sin contratos
            ocultos.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, index) => (
              <div
                key={plan.displayName}
                className={`relative flex flex-col p-10 rounded-[3rem] transition-all duration-500 ${
                  plan.popular
                    ? "bg-[var(--admin-border-primary)] border border-[var(--admin-text-primary)] shadow-premium-lg scale-105 z-10"
                    : "bg-[var(--admin-bg-secondary)] border border-[var(--admin-info)] shadow-premium hover:shadow-premium-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                      Más Solicitado
                    </span>
                  </div>
                )}

                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                    {plan.displayName}
                  </h3>
                  <p className="text-gray-500 text-sm font-body leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-malisha text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-400 font-medium">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <div className="flex-1 mb-10">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">
                    ¿Qué incluye?
                  </p>
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </div>
                        <span className="text-gray-600 text-sm font-body leading-tight">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={handleGetStarted}
                  className={`w-full h-14 rounded-2xl font-bold transition-all duration-300 ${
                    plan.popular
                      ? "bg-primary text-white shadow-premium hover:shadow-premium-lg hover:scale-[1.02]"
                      : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                  }`}
                  variant={plan.popular ? "default" : "ghost"}
                >
                  Comenzar ahora
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-20 text-center max-w-2xl mx-auto">
          <p className="text-gray-500 text-sm font-body leading-relaxed mb-8">
            Todos los planes incluyen una prueba gratuita de 14 días con acceso
            total. No se requiere tarjeta de crédito para comenzar.
          </p>
          <div className="h-px w-20 bg-gray-200 mx-auto"></div>
        </div>
      </div>
    </section>
  );
}
