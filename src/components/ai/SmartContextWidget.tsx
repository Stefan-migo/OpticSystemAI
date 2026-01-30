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
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
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

  // Loading state - compact
  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="text-xs text-gray-600">Cargando insights...</span>
        </div>
      </div>
    );
  }

  // Error state - silently fail, don't show error UI
  if (error) {
    return null;
  }

  // Show generate button if no insights
  if (!insights || insights.length === 0) {
    return (
      <div className="fixed top-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">No hay insights aún</span>
            </div>
            <Button
              onClick={regenerateInsights}
              disabled={isRegenerating}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Generar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Sort insights by priority (highest first)
  const sortedInsights = [...insights].sort((a, b) => b.priority - a.priority);
  const topInsight = sortedInsights[0];
  const remainingInsights = sortedInsights.slice(1);

  // If minimized, show only a small badge
  if (isMinimized && topInsight) {
    return (
      <div className="fixed top-4 right-4 z-40">
        <Button
          onClick={() => setIsMinimized(false)}
          variant="outline"
          size="sm"
          className="shadow-lg bg-white hover:bg-gray-50 border-2 border-blue-200"
        >
          <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
          <span className="text-xs font-medium text-gray-700">
            {insights.length} insight{insights.length !== 1 ? "s" : ""}
          </span>
        </Button>
      </div>
    );
  }

  // Render floating widget with insights
  return (
    <div className="fixed top-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">
              Insights Inteligentes
            </span>
            {insights.length > 0 && (
              <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                {insights.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={regenerateInsights}
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
            {isExpanded && remainingInsights.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsMinimized(true)}
            >
              <X className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[600px] overflow-y-auto">
          {topInsight && (
            <div className="p-3 border-b border-gray-100 last:border-b-0">
              <InsightCard
                insight={topInsight}
                onDismiss={() => dismissInsight.mutate(topInsight.id)}
                onFeedback={(score) =>
                  sendFeedback.mutate({ insightId: topInsight.id, score })
                }
                compact={true}
              />
            </div>
          )}

          {/* Remaining insights (collapsible) */}
          {isExpanded &&
            remainingInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-3 border-b border-gray-100 last:border-b-0"
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
        </div>

        {/* Footer hint */}
        {remainingInsights.length > 0 && !isExpanded && (
          <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-600 h-6"
              onClick={() => setIsExpanded(true)}
            >
              Ver {remainingInsights.length} más
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
