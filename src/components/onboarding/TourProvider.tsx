"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTour } from "@/hooks/useTour";
import { useRoot } from "@/hooks/useRoot";
import { TourOverlay } from "./TourOverlay";
import { TourCard } from "./TourCard";
import { TourProgress } from "./TourProgress";
import { TOUR_STEPS, TOUR_CONFIG } from "@/lib/onboarding/tour-config";

interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const {
    progress,
    isLoading,
    currentStep,
    totalSteps,
    isActive,
    isNotStarted,
    startTour,
    completeStep,
    completeTour,
    skipTour,
    isStarting,
  } = useTour();

  const { isRoot } = useRoot();

  const pathname = usePathname();
  const router = useRouter();
  const [elementBounds, setElementBounds] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [forceDisabled, setForceDisabled] = useState(false);
  const [hasCompletedInvalidStep, setHasCompletedInvalidStep] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Deshabilitar tour para usuarios root/dev
  useEffect(() => {
    if (isRoot) {
      setForceDisabled(true);
    }
  }, [isRoot]);

  // Auto-iniciar tour en primera visita - esperar a que la página esté completamente cargada
  useEffect(() => {
    // No iniciar tour si es usuario root/dev
    if (isRoot || forceDisabled) {
      return;
    }

    if (
      !isLoading &&
      isNotStarted &&
      TOUR_CONFIG.autoStart &&
      !isStarting &&
      mounted &&
      !forceDisabled
    ) {
      // Esperar a que el DOM esté completamente cargado
      const timer = setTimeout(() => {
        // Verificar que estamos en una página admin antes de iniciar
        if (pathname.startsWith("/admin")) {
          startTour();
        }
      }, 1500); // Aumentado a 1.5 segundos para asegurar que la página está completamente cargada
      return () => clearTimeout(timer);
    }
  }, [
    isLoading,
    isNotStarted,
    startTour,
    isStarting,
    mounted,
    pathname,
    forceDisabled,
    isRoot,
  ]);

  // Navegar a la página correcta si el paso requiere una página específica
  useEffect(() => {
    if (!isActive || !mounted || isNavigating) return;

    const currentStepData = TOUR_STEPS[currentStep];
    if (!currentStepData) return;

    // Mapear secciones a rutas
    const sectionToRoute: Record<string, string> = {
      dashboard: "/admin",
      customers: "/admin/customers",
      products: "/admin/products",
      quotes: "/admin/quotes",
      "work-orders": "/admin/work-orders",
      appointments: "/admin/appointments",
      pos: "/admin/pos",
      analytics: "/admin/analytics",
      system: "/admin/system",
    };

    const requiredRoute = sectionToRoute[currentStepData.section];
    if (requiredRoute && pathname !== requiredRoute) {
      // Usar router.push en lugar de window.location.href para evitar recargas completas
      setIsNavigating(true);
      router.push(requiredRoute);
      // Resetear el flag después de un breve delay
      setTimeout(() => setIsNavigating(false), 100);
      return;
    }
  }, [currentStep, isActive, pathname, mounted, router, isNavigating]);

  // Función para buscar el elemento con múltiples intentos - optimizada
  const findElement = useCallback(
    (
      selector: string,
      maxAttempts = 8,
      delay = 200,
    ): Promise<DOMRect | null> => {
      return new Promise((resolve) => {
        let attempts = 0;
        let warned = false; // Solo loguear una vez

        const tryFind = () => {
          attempts++;
          const element = document.querySelector(selector);

          if (element) {
            const rect = element.getBoundingClientRect();
            // Verificar que el elemento sea visible
            if (rect.width > 0 && rect.height > 0) {
              resolve(rect);
              return;
            }
          }

          if (attempts < maxAttempts) {
            setTimeout(tryFind, delay);
          } else {
            // No loguear - el tour funcionará sin el elemento (mostrando la tarjeta centrada)
            resolve(null);
          }
        };

        tryFind();
      });
    },
    [],
  );

  // Actualizar bounds del elemento cuando cambia el paso o la ruta
  useEffect(() => {
    if (!isActive || !mounted || isNavigating) {
      setElementBounds(null);
      return;
    }

    const currentStepData = TOUR_STEPS[currentStep];
    if (!currentStepData) {
      setElementBounds(null);
      return;
    }

    // Buscar el elemento con múltiples intentos para manejar carga lenta
    const findElementAsync = async () => {
      // Esperar a que la página se renderice después de navegación
      await new Promise((resolve) => setTimeout(resolve, 300));

      const bounds = await findElement(currentStepData.selector, 8, 200);
      setElementBounds(bounds);
    };

    findElementAsync();
  }, [currentStep, isActive, pathname, mounted, isNavigating, findElement]);

  // Si no hay datos del paso, completar el tour automáticamente en un efecto
  // DEBE estar antes de cualquier return condicional
  const currentStepData = TOUR_STEPS[currentStep];
  useEffect(() => {
    if (isActive && !currentStepData && !hasCompletedInvalidStep) {
      setHasCompletedInvalidStep(true);
      completeTour();
    }
  }, [isActive, currentStepData, completeTour, hasCompletedInvalidStep]);

  // Handlers - deben estar antes de cualquier return para cumplir con las reglas de hooks
  const handleSkip = useCallback(() => {
    // Deshabilitar inmediatamente el tour localmente
    setForceDisabled(true);
    // Llamar a skipTour para actualizar el servidor
    skipTour();
  }, [skipTour]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      completeStep(currentStep);
    } else {
      completeTour();
    }
  }, [currentStep, totalSteps, completeStep, completeTour]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      // Para ir hacia atrás, necesitamos actualizar el progreso manualmente
      // Por ahora, solo permitimos avanzar
      // TODO: Implementar navegación hacia atrás si es necesario
    }
  }, [currentStep]);

  // Si el tour no está activo, fue forzado a deshabilitarse, o es usuario root/dev, solo renderizar children
  if (!isActive || !mounted || forceDisabled || isRoot) {
    return <>{children}</>;
  }

  if (!currentStepData) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {TOUR_CONFIG.showProgress && (
        <TourProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          onSkip={handleSkip}
        />
      )}
      {/* Mostrar overlay y tarjeta incluso si no se encuentra el elemento */}
      <TourOverlay selector={currentStepData.selector} isActive={isActive}>
        <TourCard
          step={currentStepData}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          onComplete={completeTour}
          position={currentStepData.position}
          elementBounds={elementBounds}
        />
      </TourOverlay>
    </>
  );
}
