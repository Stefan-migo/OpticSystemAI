"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Search, Loader2 } from "lucide-react";
import { getBranchHeader } from "@/lib/utils/branch";

interface Product {
  id: string;
  name: string;
  frame_brand?: string;
  frame_model?: string;
  price: number;
  price_includes_tax?: boolean;
  inventory_quantity: number;
  sku?: string;
}

interface FrameSelectorProps {
  selectedFrame: Product | null;
  onSelect: (frame: Product) => void;
  onClear: () => void;
  frameName: string;
  frameSerialNumber: string;
  onFrameNameChange: (name: string) => void;
  onSerialNumberChange: (serial: string) => void;
  currentBranchId: string | null;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);

export default function FrameSelector({
  selectedFrame,
  onSelect,
  onClear,
  frameName,
  frameSerialNumber,
  onFrameNameChange,
  onSerialNumberChange,
  currentBranchId,
}: FrameSelectorProps) {
  const [frameSearch, setFrameSearch] = useState("");
  const [frameResults, setFrameResults] = useState<Product[]>([]);
  const [searchingFrames, setSearchingFrames] = useState(false);

  // Search frames with debounce
  useEffect(() => {
    const searchFrames = async () => {
      if (frameSearch.length < 2) {
        setFrameResults([]);
        return;
      }

      setSearchingFrames(true);
      try {
        const headers: HeadersInit = {
          ...getBranchHeader(currentBranchId),
        };
        const response = await fetch(
          `/api/admin/products/search?q=${encodeURIComponent(frameSearch)}&type=frame`,
          { headers },
        );
        if (response.ok) {
          const data = await response.json();
          setFrameResults(data.products || []);
        }
      } catch (error) {
        console.error("Error searching frames:", error);
      } finally {
        setSearchingFrames(false);
      }
    };

    const debounce = setTimeout(searchFrames, 300);
    return () => clearTimeout(debounce);
  }, [frameSearch, currentBranchId]);

  const handleFrameSelect = (frame: Product) => {
    onSelect(frame);
    setFrameSearch("");
    setFrameResults([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Marco
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedFrame ? (
          <div
            className="flex items-center justify-between p-4 border rounded-lg bg-admin-bg-secondary"
            style={{ backgroundColor: "var(--admin-border-primary)" }}
          >
            <div>
              <div className="font-medium">{selectedFrame.name}</div>
              <div className="text-sm text-tierra-media">
                {selectedFrame.frame_brand} {selectedFrame.frame_model}
              </div>
              <div className="text-sm font-semibold text-verde-suave">
                {formatPrice(selectedFrame.price)}
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              Cambiar
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tierra-media" />
            <Input
              placeholder="Buscar marco por nombre, marca o SKU..."
              value={frameSearch}
              onChange={(e) => setFrameSearch(e.target.value)}
              className="pl-10"
            />
            {frameSearch.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchingFrames ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : frameResults.length > 0 ? (
                  frameResults.map((frame) => (
                    <div
                      key={frame.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                      onClick={() => handleFrameSelect(frame)}
                    >
                      <div className="font-medium">{frame.name}</div>
                      <div className="text-sm text-tierra-media">
                        {frame.frame_brand} {frame.frame_model} - Stock:{" "}
                        {frame.inventory_quantity}
                      </div>
                      <div className="text-sm font-semibold text-verde-suave">
                        {formatPrice(frame.price)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-tierra-media">
                    No se encontraron marcos
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual frame entry */}
        {!selectedFrame && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Nombre del Marco *</Label>
              <Input
                value={frameName}
                onChange={(e) => onFrameNameChange(e.target.value)}
                placeholder="Ej: Ray-Ban RB2140"
                required
              />
            </div>
            <div>
              <Label>Número de Serie</Label>
              <Input
                value={frameSerialNumber}
                onChange={(e) => onSerialNumberChange(e.target.value)}
                placeholder="Número de serie del marco"
              />
            </div>
          </div>
        )}

        {/* Serial number field when frame is selected */}
        {selectedFrame && (
          <div>
            <Label>Número de Serie del Marco</Label>
            <Input
              value={frameSerialNumber}
              onChange={(e) => onSerialNumberChange(e.target.value)}
              placeholder="Número de serie del marco específico"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
