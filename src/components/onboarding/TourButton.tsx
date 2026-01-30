"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "@/hooks/useTour";

export function TourButton() {
  const { restartTour, isCompleted, isNotStarted, isLoading } = useTour();

  if (isLoading) return null;

  return (
    <Button
      onClick={() => restartTour()}
      className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
      title={
        isCompleted || isNotStarted
          ? "Iniciar tour guiado"
          : "Ver tour nuevamente"
      }
      size="icon"
    >
      <HelpCircle className="h-6 w-6" />
    </Button>
  );
}
