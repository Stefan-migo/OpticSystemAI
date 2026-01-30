"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { generateSlug } from "@/lib/utils/slug-generator";
import { useSlugValidation } from "@/hooks/useSlugValidation";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "@/lib/api/validation/organization-schemas";
import Link from "next/link";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      subscription_tier: "basic",
      branchName: "Casa Matriz",
    },
  });

  const organizationName = watch("name");
  const slug = watch("slug");

  // Validación en vivo del slug
  const slugValidation = useSlugValidation(slug || "");

  // Auto-generar slug desde el nombre
  useEffect(() => {
    if (organizationName && !slug) {
      const autoSlug = generateSlug(organizationName);
      setValue("slug", autoSlug);
    }
  }, [organizationName, slug, setValue]);

  // Verificar si el usuario ya tiene organización
  useEffect(() => {
    const checkOrganization = async () => {
      if (!user || authLoading) return;

      try {
        const response = await fetch("/api/admin/check-status");
        const data = await response.json();

        if (
          data.organization?.hasOrganization &&
          !data.organization?.isDemoMode
        ) {
          // Ya tiene organización real, redirigir al admin
          router.push("/admin");
          return;
        }

        setHasOrganization(data.organization?.hasOrganization || false);
      } catch (err) {
        console.error("Error checking organization status:", err);
        setHasOrganization(false);
      }
    };

    checkOrganization();
  }, [user, authLoading, router]);

  const onSubmit = async (data: CreateOrganizationInput) => {
    // Validar que el slug esté disponible antes de enviar
    if (slugValidation.isAvailable === false) {
      setError("El identificador no está disponible. Por favor, elige otro.");
      return;
    }

    if (slugValidation.isValidating) {
      setError("Espera a que termine la validación del identificador.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint = hasOrganization
        ? "/api/onboarding/activate-real-org"
        : "/api/admin/organizations";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Mostrar detalles del error si están disponibles
        const errorMessage = result.details
          ? `${result.error}: ${result.details}`
          : result.error || "Error al crear la organización";

        console.error("❌ Error creating organization:", {
          status: response.status,
          error: result.error,
          details: result.details,
          code: result.code,
          hint: result.hint,
          fullResponse: result,
        });

        throw new Error(errorMessage);
      }

      // Redirigir a página de completado
      router.push("/onboarding/complete");
    } catch (err: any) {
      setError(err.message || "Error al crear la organización");
      setIsSubmitting(false);
    }
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

  const isSlugValid = slugValidation.isAvailable === true;
  const isSlugInvalid = slugValidation.isAvailable === false;
  const showSlugValidation = slug && slug.length >= 2;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {hasOrganization ? "Activar tu Óptica" : "Crea tu Óptica"}
          </h1>
          <p className="text-gray-600">
            {hasOrganization
              ? "Completa la información para activar tu organización real"
              : "Configura los datos básicos de tu organización"}
          </p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Información de la Óptica</CardTitle>
            <CardDescription>
              Estos datos se usarán para identificar tu organización en el
              sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Nombre de la organización */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre de la óptica <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Ej. Óptica Centro"
                  className={errors.name ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Identificador (slug) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="optica-centro"
                    className={
                      errors.slug || isSlugInvalid
                        ? "border-red-500 pr-10"
                        : isSlugValid
                          ? "border-green-500 pr-10"
                          : ""
                    }
                    disabled={isSubmitting}
                  />
                  {showSlugValidation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {slugValidation.isValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : isSlugValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : isSlugInvalid ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                {errors.slug && (
                  <p className="text-sm text-red-600">{errors.slug.message}</p>
                )}
                {slugValidation.error && (
                  <p className="text-sm text-red-600">{slugValidation.error}</p>
                )}
                {isSlugValid && (
                  <p className="text-sm text-green-600">
                    ✓ Identificador disponible
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Se usará en URLs. Debe ser único. Solo letras minúsculas,
                  números y guiones.
                </p>
              </div>

              {/* Nombre de primera sucursal */}
              <div className="space-y-2">
                <Label htmlFor="branchName">
                  Nombre de primera sucursal (opcional)
                </Label>
                <Input
                  id="branchName"
                  {...register("branchName")}
                  placeholder="Casa Matriz"
                  disabled={isSubmitting}
                />
                {errors.branchName && (
                  <p className="text-sm text-red-600">
                    {errors.branchName.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Si no especificas un nombre, se creará una sucursal llamada
                  "Casa Matriz"
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    slugValidation.isValidating ||
                    slugValidation.isAvailable === false
                  }
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {hasOrganization ? "Activando..." : "Creando..."}
                    </>
                  ) : (
                    <>
                      {hasOrganization ? "Activar Óptica" : "Crear y continuar"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿Prefieres explorar primero?{" "}
            <Link
              href="/onboarding/choice"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Volver a las opciones
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
