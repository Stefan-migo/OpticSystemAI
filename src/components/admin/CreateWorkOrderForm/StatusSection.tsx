"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusSectionProps {
  status: string;
  onStatusChange: (status: string) => void;
}

export default function StatusSection({
  status,
  onStatusChange,
}: StatusSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado Inicial</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quote">Presupuesto</SelectItem>
            <SelectItem value="ordered">Ordenado</SelectItem>
            <SelectItem value="sent_to_lab">Enviado al Lab</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
