"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MercadoPagoButton } from "./MercadoPagoButton";
import { cn } from "@/lib/utils";

type Gateway = "flow" | "mercadopago" | "paypal";

interface Tier {
  name: string;
  price_monthly: number;
}

const tierLabels: Record<string, string> = {
  basic: "Básico",
  pro: "Pro",
  premium: "Premium",
};

export function CheckoutForm() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CLP");
  const [orderId, setOrderId] = useState("");
  const [gateway, setGateway] = useState<Gateway>("mercadopago");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/checkout/tiers", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.tiers?.length) setTiers(data.tiers);
      })
      .catch(() => {});
  }, []);

  const handleSelectTier = (tier: Tier) => {
    setSelectedTier(tier.name);
    setAmount(String(Number(tier.price_monthly)));
  };

  const handleCreateIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPreferenceId(null);
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: amountNum,
          currency,
          gateway,
          order_id: orderId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message != null
              ? String(data.error.message)
              : "Error al crear el intento de pago.";
        setError(errMsg);
        return;
      }
      if (gateway === "mercadopago" && data.preferenceId) {
        setPreferenceId(data.preferenceId);
        return;
      }
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
        return;
      }
      if (data.clientSecret) {
        setError(
          "Esta pasarela requiere un componente de pago embebido (aún no implementado).",
        );
        return;
      }
      setError("No se recibió URL de aprobación del servidor.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Checkout de pago</CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecciona un plan y completa el pago de forma segura.
        </p>
      </CardHeader>
      <CardContent>
        {!preferenceId ? (
          <form onSubmit={handleCreateIntent} className="space-y-4">
            {tiers.length > 0 && (
              <div>
                <Label>Plan / Tier</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  {tiers.map((tier) => (
                    <Button
                      key={tier.name}
                      type="button"
                      variant={
                        selectedTier === tier.name ? "default" : "outline"
                      }
                      className={cn(
                        "h-auto py-3 flex flex-col items-center",
                        selectedTier === tier.name &&
                          "ring-2 ring-primary ring-offset-2",
                      )}
                      onClick={() => handleSelectTier(tier)}
                    >
                      <span className="font-medium">
                        {tierLabels[tier.name] ?? tier.name}
                      </span>
                      <span className="text-sm opacity-90">
                        ${Number(tier.price_monthly).toLocaleString()}/mes
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="1000"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setSelectedTier(null);
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="CLP"
              />
            </div>
            <div>
              <Label htmlFor="order_id">ID de orden (opcional)</Label>
              <Input
                id="order_id"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="UUID de la orden"
              />
            </div>
            <div>
              <Label>Pasarela</Label>
              <div className="flex gap-2 mt-1">
                {(["flow", "mercadopago", "paypal"] as const).map((g) => (
                  <Button
                    key={g}
                    type="button"
                    variant={gateway === g ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGateway(g)}
                  >
                    {g === "flow"
                      ? "Flow"
                      : g === "mercadopago"
                        ? "Mercado Pago"
                        : "PayPal"}
                  </Button>
                ))}
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? "Creando intento…"
                : gateway === "mercadopago"
                  ? "Continuar con Mercado Pago"
                  : `Continuar con ${gateway === "flow" ? "Flow" : "PayPal"}`}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Completa el pago con Mercado Pago haciendo clic en el botón a
                continuación.
              </AlertDescription>
            </Alert>
            <MercadoPagoButton
              preferenceId={preferenceId}
              onError={(err) => {
                setError(err.message);
                setPreferenceId(null);
              }}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setPreferenceId(null);
                setError(null);
              }}
            >
              Cancelar y volver
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
