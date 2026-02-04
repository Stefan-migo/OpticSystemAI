"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import businessConfig from "@/config/business";

export function CTASection() {
  const router = useRouter();

  const handleDemoClick = () => {
    router.push("/onboarding/choice");
  };

  return (
    <section className="py-32 relative overflow-hidden bg-[var(--admin-bg-primary)]">
      {/* High-impact background */}
      <div className="absolute inset-0 bg-gray-900 -z-20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-blue-900/20 -z-10"></div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-10 border border-white/10">
          <Sparkles className="h-4 w-4" />
          <span>Comienza tu Nueva Era</span>
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-7xl font-malisha text-[var(--admin-accent-primary)] mb-8 leading-tight">
          Eleva tu Óptica al <br />
          <span className="text-primary italic">Estándar de Excelencia</span>
        </h2>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-body leading-relaxed">
          Únete a la nueva generación de ópticas que ya están dominando el
          mercado con {businessConfig.name}. Tecnología suiza de gestión a tu
          alcance.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button
            onClick={() => router.push("/signup")}
            size="lg"
            className="h-16 px-12 rounded-2xl bg-primary text-white hover:bg-primary/90 text-lg font-bold shadow-2xl transition-all hover:scale-[1.05]"
          >
            Empezar Gratis Ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            onClick={handleDemoClick}
            size="lg"
            variant="outline"
            className="h-16 px-12 rounded-2xl border-[var(--admin-accent-secondary)] text-[var(--accent-foreground)] bg-[var(--admin-bg-tertiary)] hover:bg-white/5 text-lg font-bold backdrop-blur-sm transition-all"
          >
            Ver Demo Interactiva
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">
          <span className="flex items-center gap-2">
            <div className="h-1 w-1 bg-primary rounded-full"></div>
            Sin Tarjeta
          </span>
          <span className="flex items-center gap-2">
            <div className="h-1 w-1 bg-primary rounded-full"></div>
            Setup en 5m
          </span>
          <span className="flex items-center gap-2">
            <div className="h-1 w-1 bg-primary rounded-full"></div>
            Soporte Global
          </span>
        </div>
      </div>
    </section>
  );
}
