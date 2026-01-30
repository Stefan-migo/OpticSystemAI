"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ArrowRight } from "lucide-react";

export function DemoModeBanner() {
  const router = useRouter();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkDemoMode = async () => {
      try {
        const response = await fetch("/api/admin/check-status");
        const data = await response.json();

        if (data.organization?.isDemoMode) {
          setIsDemoMode(true);
          // Verificar si el banner fue descartado previamente
          const dismissed = localStorage.getItem("demo-banner-dismissed");
          if (dismissed) {
            setIsDismissed(true);
          }
        }
      } catch (err) {
        console.error("Error checking demo mode:", err);
      }
    };

    checkDemoMode();
  }, []);

  const handleActivate = () => {
    router.push("/onboarding/create");
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("demo-banner-dismissed", "true");
  };

  if (!isDemoMode || isDismissed) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 mb-4 relative">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Sparkles className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <AlertDescription className="text-amber-900 font-medium mb-2">
            Estás en modo demo
          </AlertDescription>
          <p className="text-sm text-amber-800 mb-3">
            Estás explorando el sistema con datos de ejemplo. ¿Listo para
            empezar con tus propios datos?
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleActivate}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Activar mi Óptica
              <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            >
              Más tarde
            </Button>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-amber-600 hover:text-amber-900 hover:bg-amber-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
