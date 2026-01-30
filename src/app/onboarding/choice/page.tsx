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

  // Si no está autenticado, redirigir a login
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido a Opttius
          </h1>
          <p className="text-gray-600 text-lg">Elige cómo quieres empezar</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Choice Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Demo Option */}
          <Card className="border-2 hover:border-blue-500 transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  RECOMENDADO
                </span>
              </div>
              <CardTitle className="text-xl">Explorar con datos demo</CardTitle>
              <CardDescription className="text-base mt-2">
                Accede al sistema con datos pre-cargados para explorar todas las
                funcionalidades antes de configurar tu propia óptica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Dashboard con gráficas y datos realistas</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Clientes, citas y órdenes de ejemplo</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    Puedes activar tu óptica real en cualquier momento
                  </span>
                </li>
              </ul>
              <Button
                onClick={handleDemoChoice}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  <>
                    Explorar con datos demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Real Option */}
          <Card className="border-2 hover:border-indigo-500 transition-all cursor-pointer">
            <CardHeader>
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-2">
                <Building2 className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-xl">
                Configurar mi óptica desde cero
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Crea tu organización y configura tu primera sucursal para
                empezar a trabajar inmediatamente con tus propios datos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Configuración personalizada de tu óptica</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Crea tu primera sucursal durante el onboarding</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Empieza a trabajar con tus propios datos</span>
                </li>
              </ul>
              <Button
                onClick={handleRealChoice}
                disabled={isLoading}
                variant="outline"
                className="w-full border-2 hover:bg-indigo-50"
                size="lg"
              >
                Configurar mi óptica
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ¿Necesitas ayuda?{" "}
            <Link
              href="/support"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contacta soporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
