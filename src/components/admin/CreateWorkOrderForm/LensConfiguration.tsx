"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle } from "lucide-react";

interface Treatment {
  value: string;
  label: string;
  cost: number;
}

interface LensConfigurationProps {
  lensType: string;
  lensMaterial: string;
  lensIndex: number | null;
  lensTreatments: string[];
  lensTintColor: string;
  lensTintPercentage: number;
  onLensTypeChange: (type: string) => void;
  onLensMaterialChange: (material: string) => void;
  onLensIndexChange: (index: number | null) => void;
  onTreatmentsChange: (treatments: string[], cost: number) => void;
  onTintColorChange: (color: string) => void;
  onTintPercentageChange: (percentage: number) => void;
}

const lensTypes = [
  { value: "single_vision", label: "Visión Simple" },
  { value: "bifocal", label: "Bifocal" },
  { value: "trifocal", label: "Trifocal" },
  { value: "progressive", label: "Progresivo" },
  { value: "reading", label: "Lectura" },
  { value: "computer", label: "Computadora" },
  { value: "sports", label: "Deportivo" },
];

const lensMaterials = [
  { value: "cr39", label: "CR-39" },
  { value: "polycarbonate", label: "Policarbonato" },
  { value: "high_index_1_67", label: "Alto Índice 1.67" },
  { value: "high_index_1_74", label: "Alto Índice 1.74" },
  { value: "trivex", label: "Trivex" },
  { value: "glass", label: "Vidrio" },
];

const availableTreatments: Treatment[] = [
  { value: "anti_reflective", label: "Anti-reflejante", cost: 15000 },
  { value: "blue_light_filter", label: "Filtro Luz Azul", cost: 20000 },
  { value: "uv_protection", label: "Protección UV", cost: 10000 },
  { value: "scratch_resistant", label: "Anti-rayas", cost: 12000 },
  { value: "anti_fog", label: "Anti-empañamiento", cost: 8000 },
  { value: "photochromic", label: "Fotocromático", cost: 35000 },
  { value: "polarized", label: "Polarizado", cost: 25000 },
  { value: "tint", label: "Tinte", cost: 15000 },
];

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);

export default function LensConfiguration({
  lensType,
  lensMaterial,
  lensIndex,
  lensTreatments,
  lensTintColor,
  lensTintPercentage,
  onLensTypeChange,
  onLensMaterialChange,
  onLensIndexChange,
  onTreatmentsChange,
  onTintColorChange,
  onTintPercentageChange,
}: LensConfigurationProps) {
  const handleLensTypeChange = (value: string) => {
    onLensTypeChange(value);
    // Calculate base cost based on lens type
    const costs: Record<string, number> = {
      single_vision: 30000,
      bifocal: 45000,
      trifocal: 55000,
      progressive: 80000,
      reading: 25000,
      computer: 35000,
      sports: 40000,
    };
    // Note: The actual cost calculation with material multiplier should be handled by parent
    // This just triggers the change
  };

  const handleLensMaterialChange = (value: string) => {
    onLensMaterialChange(value);
    // Note: Material multiplier calculation should be handled by parent
  };

  const handleTreatmentToggle = (treatment: Treatment) => {
    const isSelected = lensTreatments.includes(treatment.value);
    let newTreatments = [...lensTreatments];
    let treatmentsCost = 0;

    if (isSelected) {
      newTreatments = newTreatments.filter((t) => t !== treatment.value);
    } else {
      newTreatments.push(treatment.value);
    }

    // Calculate total treatments cost
    newTreatments.forEach((treatmentValue) => {
      const treatment = availableTreatments.find(
        (t) => t.value === treatmentValue,
      );
      if (treatment) {
        treatmentsCost += treatment.cost;
      }
    });

    onTreatmentsChange(newTreatments, treatmentsCost);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Configuración de Lente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo de Lente *</Label>
            <Select value={lensType} onValueChange={handleLensTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                {lensTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Material *</Label>
            <Select
              value={lensMaterial}
              onValueChange={handleLensMaterialChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona material" />
              </SelectTrigger>
              <SelectContent>
                {lensMaterials.map((material) => (
                  <SelectItem key={material.value} value={material.value}>
                    {material.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Índice de Refracción</Label>
          <Input
            type="number"
            step="0.01"
            value={lensIndex || ""}
            onChange={(e) =>
              onLensIndexChange(parseFloat(e.target.value) || null)
            }
            placeholder="Ej: 1.67"
          />
        </div>

        {/* Treatments */}
        <div>
          <Label>Tratamientos y Recubrimientos</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {availableTreatments.map((treatment) => {
              const isSelected = lensTreatments.includes(treatment.value);
              return (
                <div
                  key={treatment.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "border-verde-suave bg-verde-suave/10"
                      : "border-gray-200 hover:border-azul-profundo"
                  }`}
                  onClick={() => handleTreatmentToggle(treatment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-verde-suave mr-2" />
                      )}
                      <span className={isSelected ? "font-medium" : ""}>
                        {treatment.label}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {formatPrice(treatment.cost)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tint configuration (only if tint treatment is selected) */}
        {lensTreatments.includes("tint") && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Color del Tinte</Label>
              <Input
                value={lensTintColor}
                onChange={(e) => onTintColorChange(e.target.value)}
                placeholder="Ej: Gris, Marrón, Verde"
              />
            </div>
            <div>
              <Label>Porcentaje de Tinte (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={lensTintPercentage || ""}
                onChange={(e) =>
                  onTintPercentageChange(parseInt(e.target.value) || 0)
                }
                placeholder="0-100"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
