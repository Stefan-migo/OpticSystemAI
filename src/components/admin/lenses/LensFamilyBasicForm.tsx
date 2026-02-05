"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface LensFamilyFormData {
  name: string;
  brand: string;
  lens_type: string;
  lens_material: string;
  description: string;
  is_active: boolean;
}

interface LensFamilyBasicFormProps {
  data: LensFamilyFormData;
  onChange: (data: LensFamilyFormData) => void;
  errors?: Record<string, string>;
}

export const LENS_TYPES = [
  { value: "single_vision", label: "Monofocal" },
  { value: "bifocal", label: "Bifocal" },
  { value: "trifocal", label: "Trifocal" },
  { value: "progressive", label: "Progresivo" },
  { value: "reading", label: "Lectura" },
  { value: "computer", label: "Computadora" },
  { value: "sports", label: "Deportivo" },
];

export const LENS_MATERIALS = [
  { value: "cr39", label: "CR-39" },
  { value: "polycarbonate", label: "Policarbonato" },
  { value: "high_index_1_67", label: "Alto Índice 1.67" },
  { value: "high_index_1_74", label: "Alto Índice 1.74" },
  { value: "trivex", label: "Trivex" },
  { value: "glass", label: "Vidrio" },
];

export function LensFamilyBasicForm({
  data,
  onChange,
  errors = {},
}: LensFamilyBasicFormProps) {
  const handleChange = (field: keyof LensFamilyFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la Familia *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Ej: Varilux Comfort"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Input
            id="brand"
            value={data.brand}
            onChange={(e) => handleChange("brand", e.target.value)}
            placeholder="Ej: Essilor"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lens_type">Tipo de Lente *</Label>
          <Select
            value={data.lens_type}
            onValueChange={(value) => handleChange("lens_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {LENS_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lens_material">Material *</Label>
          <Select
            value={data.lens_material}
            onValueChange={(value) => handleChange("lens_material", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar material" />
            </SelectTrigger>
            <SelectContent>
              {LENS_MATERIALS.map((material) => (
                <SelectItem key={material.value} value={material.value}>
                  {material.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Descripción detallada de la familia de lentes..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active_family"
          checked={data.is_active}
          onChange={(e) => handleChange("is_active", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="is_active_family" className="cursor-pointer">
          Familia Activa
        </Label>
      </div>
    </div>
  );
}
