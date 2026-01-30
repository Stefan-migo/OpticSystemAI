"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Gateway = "flow" | "mercadopago" | "paypal";

export function CheckoutForm() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CLP");
  const [orderId, setOrderId] = useState("");
  const [gateway, setGateway] = useState<Gateway>("flow");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        setError(data.error ?? "Error al crear el intento de pago.");
        return;
      }
      // Flow y otras pasarelas redirigen a approvalUrl
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
        return;
      }
      // Fallback: si no hay approvalUrl pero hay clientSecret (para otras pasarelas futuras)
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
          Crea un intento de pago y completa con Flow (Chile).
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateIntent} className="space-y-4">
          <div>
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? "Creando intento…"
              : gateway === "flow"
                ? "Continuar con Flow"
                : `Continuar con ${gateway === "mercadopago" ? "Mercado Pago" : "PayPal"}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
