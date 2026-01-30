"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Eye } from "lucide-react";

export function HeroSection() {
  const router = useRouter();

  const handleDemoClick = () => {
    router.push("/onboarding/choice");
  };

  const handleSignUpClick = () => {
    router.push("/signup");
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>La Gestión Inteligente para el Futuro de tu Óptica</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Optimiza tu Óptica con{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Inteligencia Artificial
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl">
              Sistema completo de gestión diseñado específicamente para ópticas
              y laboratorios. Automatiza procesos, aumenta ventas y mejora la
              experiencia del cliente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                onClick={handleSignUpClick}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Registrarse Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={handleDemoClick}
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
              >
                Probar con Datos Demo
              </Button>
            </div>

            <div className="flex items-center gap-8 justify-center lg:justify-start text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Configuración en minutos</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Element */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main illustration placeholder - Eye with digital elements */}
              <div className="relative w-full h-[500px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-3xl blur-3xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-blue-100">
                  <div className="space-y-6">
                    {/* Eye icon with digital aura */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                        <Eye className="h-32 w-32 text-blue-600 relative z-10" />
                      </div>
                    </div>

                    {/* Dashboard preview elements */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <div className="h-2 bg-blue-200 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-blue-300 rounded w-1/2"></div>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                        <div className="h-2 bg-indigo-200 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-indigo-300 rounded w-1/2"></div>
                      </div>
                      <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100">
                        <div className="h-2 bg-cyan-200 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-cyan-300 rounded w-1/2"></div>
                      </div>
                    </div>

                    {/* Stats preview */}
                    <div className="flex justify-around pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          +30%
                        </div>
                        <div className="text-xs text-gray-600">Ventas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          -50%
                        </div>
                        <div className="text-xs text-gray-600">Tiempo</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-600">
                          +95%
                        </div>
                        <div className="text-xs text-gray-600">
                          Satisfacción
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}
