"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { InsightCard } from "./InsightCard";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  InsightSection,
  DatabaseInsight,
} from "@/lib/ai/insights/schemas";

interface SmartContextWidgetProps {
  section: InsightSection;
}

export function SmartContextWidget({ section }: SmartContextWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch insights for the section
  const {
    data: insights = [],
    isLoading,
    error,
  } = useQuery<DatabaseInsight[]>({
    queryKey: ["ai-insights", section],
    queryFn: async () => {
      const res = await fetch(`/api/ai/insights?section=${section}`);
      if (!res.ok) {
        if (res.status === 404) {
          return [];
        }
        throw new Error("Failed to fetch insights");
      }
      const data = await res.json();
      return data.insights || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Dismiss insight mutation
  const dismissInsight = useMutation({
    mutationFn: async (insightId: string) => {
      const res = await fetch(`/api/ai/insights/${insightId}/dismiss`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to dismiss insight");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-insights", section] });
    },
  });

  // Feedback mutation
  const sendFeedback = useMutation({
    mutationFn: async ({
      insightId,
      score,
    }: {
      insightId: string;
      score: number;
    }) => {
      const res = await fetch(`/api/ai/insights/${insightId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      if (!res.ok) throw new Error("Failed to send feedback");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-insights", section] });
    },
  });

  // Regenerate insights mutation
  const regenerateInsights = async () => {
    setIsRegenerating(true);
    try {
      // Paso 1: Obtener datos reales
      const prepareResponse = await fetch(
        `/api/ai/insights/prepare-data?section=${section}`,
      );
      if (!prepareResponse.ok) {
        throw new Error("Error obteniendo datos del sistema");
      }
      const prepareData = await prepareResponse.json();

      // Paso 2: Generar insights
      const generateResponse = await fetch("/api/ai/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          data: prepareData.data[section] || prepareData.data,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse
          .json()
          .catch(() => ({ error: generateResponse.statusText }));
        throw new Error(errorData.error || "Error generando insights");
      }

      const result = await generateResponse.json();

      toast.success(
        `✅ ${result.count} insight${result.count !== 1 ? "s" : ""} generado${result.count !== 1 ? "s" : ""}`,
        {
          description: "Los insights se actualizarán automáticamente",
        },
      );

      // Invalidar cache para refrescar
      queryClient.invalidateQueries({ queryKey: ["ai-insights", section] });
    } catch (error: any) {
      toast.error("Error generando insights", {
        description: error.message || "Intenta nuevamente",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Sort insights by priority (highest first)
  const sortedInsights = [...insights].sort((a, b) => b.priority - a.priority);

  // Don't show anything if there's an error
  if (error) {
    return null;
  }

  // Button with badge showing insight count
  const hasInsights = insights && insights.length > 0;
  const badgeCount = insights.length;

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "shadow-xl bg-white/80 backdrop-blur-md hover:bg-white border-2 transition-all hover:scale-105 active:scale-95",
              hasInsights
                ? "border-blue-300 hover:border-blue-400"
                : "border-gray-200 hover:border-gray-300",
              isLoading && "opacity-50 cursor-not-allowed",
            )}
            disabled={isLoading}
          >
            <Sparkles
              className={cn(
                "w-4 h-4 mr-2",
                hasInsights ? "text-blue-600" : "text-gray-500",
                isLoading && "animate-pulse",
              )}
            />
            <span className="text-xs font-bold text-gray-700">
              {isLoading
                ? "Cargando..."
                : hasInsights
                  ? `Insights (${badgeCount})`
                  : "Insights"}
            </span>
            {hasInsights && (
              <span className="ml-2 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black">
                {badgeCount}
              </span>
            )}
            {isOpen ? (
              <ChevronUp className="w-4 h-4 ml-2 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-96 max-w-[calc(100vw-2rem)] p-0 shadow-2xl border-blue-100 rounded-2xl overflow-hidden"
          align="start"
          side="top"
          sideOffset={10}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">
                Insights Inteligentes
              </span>
              {hasInsights && (
                <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                  {badgeCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  regenerateInsights();
                }}
                disabled={isRegenerating}
                title="Regenerar insights"
              >
                <RefreshCw
                  className={cn(
                    "w-3.5 h-3.5 text-gray-600",
                    isRegenerating && "animate-spin",
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
              >
                <X className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-6 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-600">
                  Cargando insights...
                </span>
              </div>
            ) : !hasInsights ? (
              <div className="p-6 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600 text-center">
                  No hay insights disponibles aún
                </p>
                <Button
                  onClick={regenerateInsights}
                  disabled={isRegenerating}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-2" />
                      Generar Insights
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                {sortedInsights.map((insight, index) => (
                  <div
                    key={insight.id}
                    className={cn(
                      "p-3 border-b border-gray-100 last:border-b-0",
                      index === 0 && "bg-blue-50/50",
                    )}
                  >
                    <InsightCard
                      insight={insight}
                      onDismiss={() => dismissInsight.mutate(insight.id)}
                      onFeedback={(score) =>
                        sendFeedback.mutate({ insightId: insight.id, score })
                      }
                      compact={true}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
