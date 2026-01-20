"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Plus, Loader2 } from "lucide-react";
import CreatePrescriptionForm from "@/components/admin/CreatePrescriptionForm";

interface Prescription {
  id: string;
  prescription_date: string;
  prescription_type: string | null;
  is_current: boolean;
}

interface PrescriptionSelectorProps {
  customerId: string | null;
  selectedPrescription: Prescription | null;
  onSelect: (prescription: Prescription) => void;
  onPrescriptionsLoaded?: (prescriptions: Prescription[]) => void;
}

export default function PrescriptionSelector({
  customerId,
  selectedPrescription,
  onSelect,
  onPrescriptionsLoaded,
}: PrescriptionSelectorProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [showCreatePrescription, setShowCreatePrescription] = useState(false);

  // Load prescriptions when customer is selected
  useEffect(() => {
    if (customerId) {
      fetchPrescriptions(customerId);
    } else {
      setPrescriptions([]);
    }
  }, [customerId]);

  const fetchPrescriptions = async (customerId: string) => {
    try {
      setLoadingPrescriptions(true);
      const response = await fetch(
        `/api/admin/customers/${customerId}/prescriptions`,
      );
      if (response.ok) {
        const data = await response.json();
        const prescriptionsList = data.prescriptions || [];
        setPrescriptions(prescriptionsList);

        // Auto-select current prescription if available
        const currentPrescription = prescriptionsList.find(
          (p: Prescription) => p.is_current,
        );
        if (currentPrescription) {
          onSelect(currentPrescription);
        } else if (prescriptionsList.length > 0) {
          onSelect(prescriptionsList[0]);
        }

        // Notify parent component
        if (onPrescriptionsLoaded) {
          onPrescriptionsLoaded(prescriptionsList);
        }
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handlePrescriptionCreated = () => {
    setShowCreatePrescription(false);
    if (customerId) {
      fetchPrescriptions(customerId);
    }
  };

  if (!customerId) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Receta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPrescriptions ? (
            <div className="text-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-tierra-media">
                Este cliente no tiene recetas registradas
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreatePrescription(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Nueva Receta
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={selectedPrescription?.id || ""}
                  onValueChange={(value) => {
                    const prescription = prescriptions.find(
                      (p) => p.id === value,
                    );
                    if (prescription) {
                      onSelect(prescription);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una receta" />
                  </SelectTrigger>
                  <SelectContent>
                    {prescriptions.map((prescription) => (
                      <SelectItem key={prescription.id} value={prescription.id}>
                        {prescription.prescription_date} -{" "}
                        {prescription.prescription_type || "Sin tipo"}
                        {prescription.is_current && " (Actual)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreatePrescription(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Prescription Dialog */}
      {customerId && (
        <Dialog
          open={showCreatePrescription}
          onOpenChange={setShowCreatePrescription}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Receta</DialogTitle>
              <DialogDescription>
                Crea una nueva receta oftalmológica para este cliente
              </DialogDescription>
            </DialogHeader>
            <CreatePrescriptionForm
              customerId={customerId}
              onSuccess={handlePrescriptionCreated}
              onCancel={() => setShowCreatePrescription(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
