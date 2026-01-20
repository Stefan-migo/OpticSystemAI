"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory } from "lucide-react";

interface LabInfoSectionProps {
  labName: string;
  labContact: string;
  labOrderNumber: string;
  labEstimatedDeliveryDate: string;
  onLabNameChange: (name: string) => void;
  onLabContactChange: (contact: string) => void;
  onLabOrderNumberChange: (number: string) => void;
  onLabDeliveryDateChange: (date: string) => void;
}

function LabInfoSectionComponent({
  labName,
  labContact,
  labOrderNumber,
  labEstimatedDeliveryDate,
  onLabNameChange,
  onLabContactChange,
  onLabOrderNumberChange,
  onLabDeliveryDateChange,
}: LabInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Factory className="h-5 w-5 mr-2" />
          Información del Laboratorio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nombre del Laboratorio</Label>
            <Input
              value={labName}
              onChange={(e) => onLabNameChange(e.target.value)}
              placeholder="Ej: Laboratorio Óptico Central"
            />
          </div>
          <div>
            <Label>Contacto del Laboratorio</Label>
            <Input
              value={labContact}
              onChange={(e) => onLabContactChange(e.target.value)}
              placeholder="Teléfono o email"
            />
          </div>
          <div>
            <Label>Número de Orden del Lab</Label>
            <Input
              value={labOrderNumber}
              onChange={(e) => onLabOrderNumberChange(e.target.value)}
              placeholder="Número asignado por el laboratorio"
            />
          </div>
          <div>
            <Label>Fecha Estimada de Entrega</Label>
            <Input
              type="date"
              value={labEstimatedDeliveryDate}
              onChange={(e) => onLabDeliveryDateChange(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize LabInfoSection to prevent unnecessary re-renders
export default memo(LabInfoSectionComponent);
