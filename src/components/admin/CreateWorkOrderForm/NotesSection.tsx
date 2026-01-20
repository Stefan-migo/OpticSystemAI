"use client";

import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NotesSectionProps {
  internalNotes: string;
  customerNotes: string;
  onInternalNotesChange: (notes: string) => void;
  onCustomerNotesChange: (notes: string) => void;
}

function NotesSectionComponent({
  internalNotes,
  customerNotes,
  onInternalNotesChange,
  onCustomerNotesChange,
}: NotesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Notas Internas</Label>
          <Textarea
            value={internalNotes}
            onChange={(e) => onInternalNotesChange(e.target.value)}
            placeholder="Notas para el equipo..."
            rows={3}
          />
        </div>
        <div>
          <Label>Notas para el Cliente</Label>
          <Textarea
            value={customerNotes}
            onChange={(e) => onCustomerNotesChange(e.target.value)}
            placeholder="Notas visibles para el cliente..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize NotesSection to prevent unnecessary re-renders
export default memo(NotesSectionComponent);
