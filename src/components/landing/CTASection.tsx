"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  const router = useRouter();

  const handleDemoClick = () => {
    router.push("/onboarding/choice");
  };

  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          <span>Prueba Gratuita - Sin Compromiso</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          ¿Listo para transformar tu óptica?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Únete a cientos de ópticas que ya están optimizando sus operaciones
          con Opttius. Regístrate gratis y prueba el sistema durante 14 días,
          sin tarjeta de crédito.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push("/signup")}
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            Registrarse Gratis Ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            onClick={handleDemoClick}
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg backdrop-blur-sm"
          >
            Explorar con Datos Demo
          </Button>
        </div>
        <p className="mt-6 text-sm text-blue-100">
          ✓ Sin tarjeta de crédito • ✓ Configuración en 5 minutos • ✓ Soporte
          24/7
        </p>
      </div>
    </section>
  );
}
