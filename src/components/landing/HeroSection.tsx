"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import businessConfig from "@/config/business";

export function HeroSection() {
  const router = useRouter();

  const handleDemoClick = () => {
    router.push("/onboarding/choice");
  };

  const handleSignUpClick = () => {
    router.push("/signup");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-20">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[30%] h-[50%] bg-blue-100 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-widest animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span>Inteligencia Artificial para tu Óptica</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-8xl font-malisha text-gray-900 leading-[1.1] tracking-tight">
              Lleva tu Óptica al{" "}
              <span className="text-primary italic">Siguiente Nivel</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl font-body leading-relaxed">
              La plataforma todo-en-uno diseñada para transformar la gestión de
              tu óptica y laboratorio. Vende más, gestiona mejor y sorprende a
              tus clientes.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
              <Button
                onClick={handleSignUpClick}
                size="lg"
                className="rounded-full h-16 px-10 text-lg shadow-premium hover:shadow-premium-lg transition-all font-bold"
              >
                Empezar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={handleDemoClick}
                size="lg"
                variant="outline"
                className="rounded-full h-16 px-10 text-lg border-gray-200 hover:border-primary hover:text-primary transition-all font-bold"
              >
                Ver Demo en Vivo
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-8 justify-center lg:justify-start text-sm text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <span>Sin tarjeta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <span>Setup instantáneo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Element */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-2xl transition-all duration-500 group-hover:bg-primary/20"></div>
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 aspect-square lg:aspect-auto lg:h-[600px]">
              <Image
                src="/hero-image.png" // We will need to place the generated image here
                alt="Opttius Management"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

              {/* Floating Cards */}
              <div className="absolute bottom-10 left-10 right-10 flex gap-4 animate-float">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex-1 border border-white/20">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                    Ventas Hoy
                  </p>
                  <p className="text-2xl font-malisha text-gray-900">
                    $2,450.00
                  </p>
                  <p className="text-[10px] text-green-500 font-bold mt-1">
                    +12% vs ayer
                  </p>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex-1 border border-white/20">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                    Trabajos Pendientes
                  </p>
                  <p className="text-2xl font-malisha text-gray-900">14</p>
                  <p className="text-[10px] text-primary font-bold mt-1">
                    4 próximos a vencer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
