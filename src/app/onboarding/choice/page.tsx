"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  Building2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function OnboardingChoicePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null);

  // Redirigir a login si no hay usuario (en efecto, no durante render)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Verificar si el usuario ya tiene organización
  useEffect(() => {
    const checkOrganization = async () => {
      if (!user || authLoading) return;

      try {
        const response = await fetch("/api/admin/check-status");
        const data = await response.json();

        if (data.organization?.hasOrganization) {
          // Ya tiene organización, redirigir al admin
          router.push("/admin");
          return;
        }

        setHasOrganization(false);
      } catch (err) {
        console.error("Error checking organization status:", err);
        setHasOrganization(false);
      }
    };

    checkOrganization();
  }, [user, authLoading, router]);

  const handleDemoChoice = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/assign-demo", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al asignar organización demo");
      }

      // Redirigir al admin con organización demo
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Error al asignar organización demo");
      setIsLoading(false);
    }
  };

  const handleRealChoice = () => {
    router.push("/onboarding/create");
  };

  // Mostrar loading mientras se verifica autenticación
  if (authLoading || hasOrganization === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Verificando estado...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar nada mientras el useEffect redirige
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--admin-bg-primary)] relative overflow-hidden px-4 py-12">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-premium-float" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] animate-premium-float"
          style={{ animationDelay: "-2s" }}
        />
        <div
          className="absolute top-1/4 right-[15%] w-64 h-64 bg-blue-400/5 rounded-full blur-[80px] animate-premium-float"
          style={{ animationDelay: "-4s" }}
        />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--admin-bg-primary)] rounded-[2rem] shadow-2xl mb-6 relative group">
            <div className="absolute inset-0 bg-[var(--admin-bg-primary)] rounded-[2rem] scale-90 group-hover:scale-110 transition-transform duration-500" />
            <Building2 className="h-10 w-10 text-primary relative z-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Bienvenido a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
              Opttius
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mx-auto">
            Estamos listos para transformar tu óptica. Elige cómo te gustaría
            comenzar tu experiencia.
          </p>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="mb-8 animate-in zoom-in-95 duration-300"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Choice Cards */}
        <div className="grid md:grid-cols-2 gap-8 h-full">
          {/* Demo Option */}
          <Card
            variant="interactive"
            shimmer
            className="flex flex-col h-full group"
          >
            <CardHeader padding="lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <Badge className="bg-primary/10 text-primary border-none px-3 py-1 font-bold text-[10px] tracking-wider uppercase">
                  RECOMENDADO
                </Badge>
              </div>
              <CardTitle
                size="lg"
                theme="sophisticated"
                className="text-2xl group-hover:text-primary transition-colors"
              >
                Explorar con datos demo
              </CardTitle>
              <CardDescription
                size="lg"
                className="mt-4 leading-relaxed text-accent-foreground"
              >
                Accede al sistema con una óptica pre-configurada. Ideal para
                conocer todas las herramientas en segundos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1" padding="lg" spacing="relaxed">
              <div className="space-y-4 mb-8">
                {[
                  "Dashboard con analíticas realistas",
                  "Catálogo de productos e inventario",
                  "Flujo completo de ventas y agenda",
                  "Sin compromiso, activa tu óptica real luego",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 bg-green-500/10 rounded-full p-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleDemoChoice}
                disabled={isLoading}
                size="lg"
                className="w-full shadow-xl shadow-primary/20"
                shimmer
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Asignando entorno...
                  </>
                ) : (
                  <>
                    Comenzar con Demo
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Real Option */}
          <Card
            variant="interactive"
            shimmer
            className="flex flex-col h-full group"
          >
            <CardHeader padding="lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <Badge className="bg-primary/10 text-primary border-none px-3 py-1 font-bold text-[10px] tracking-wider uppercase">
                  PERSONALIZADO
                </Badge>
              </div>
              <CardTitle
                size="lg"
                theme="sophisticated"
                className="text-2xl group-hover:text-primary transition-colors"
              >
                Configurar mi óptica
              </CardTitle>
              <CardDescription
                size="lg"
                className="mt-4 leading-relaxed text-accent-foreground"
              >
                Empieza hoy mismo con tu propia información. Configura tu marca,
                sucursales y equipo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1" padding="lg" spacing="relaxed">
              <div className="space-y-4 mb-8">
                {[
                  "Identificador único para tu óptica",
                  "Configuración de tu primera sucursal",
                  "Personalización de marca y preferencias",
                  "Listo para vender desde el primer día",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 bg-green-500/10 rounded-full p-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleRealChoice}
                disabled={isLoading}
                size="lg"
                className="w-full shadow-xl shadow-primary/20"
                shimmer
              >
                Configurar Organización
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center animate-in fade-in duration-1000 delay-500">
          <p className="text-sm text-slate-500 dark:text-slate-500 flex items-center justify-center gap-2">
            ¿Tienes dudas sobre los planes?{" "}
            <Link
              href="/support"
              className="text-primary hover:text-primary/80 font-bold hover:underline transition-all"
            >
              Contacta con nosotros
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
