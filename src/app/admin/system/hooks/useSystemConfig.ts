"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface SystemConfig {
  id: string;
  config_key: string;
  config_value: any;
  description?: string;
  category: string;
  is_public: boolean;
  is_sensitive: boolean;
  value_type: string;
  updated_at: string;
}

const fetchConfigs = async (): Promise<SystemConfig[]> => {
  const response = await fetch("/api/admin/system/config");
  if (!response.ok) {
    throw new Error("Failed to fetch system config");
  }
  const data = await response.json();
  return data.configs || [];
};

export function useSystemConfig() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["systemConfig"],
    queryFn: fetchConfigs,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      configKey,
      newValue,
    }: {
      configKey: string;
      newValue: any;
    }) => {
      const response = await fetch("/api/admin/system/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updates: [{ config_key: configKey, config_value: newValue }],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update config");
      }

      const data = await response.json();
      const result = data.results[0];

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemConfig"] });
      toast.success("Configuración actualizada exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar configuración");
    },
  });

  return {
    configs: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateConfig: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
