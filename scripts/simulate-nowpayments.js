const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * Script para simular un Webhook (IPN) exitoso de NOWPayments
 * Calcula la firma HMAC-SHA512 necesaria para pasar la seguridad.
 */

// 1. Cargar variables de entorno manualmente
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach(line => {
    const [key, value] = line.split("=");
    if (key && value) env[key.trim()] = value.trim();
});

const IPN_SECRET = env.NOWPAYMENTS_IPN_SECRET;
const BASE_URL = env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

if (!IPN_SECRET) {
    console.error("❌ Error: No se encontró NOWPAYMENTS_IPN_SECRET en .env.local");
    process.exit(1);
}

// 2. Configurar el ID del pago (desde argumento o por defecto)
const paymentId = process.argv[2] || "4931022775"; // Usando el de tu imagen

// 3. Crear el payload idéntico al de NOWPayments
const payload = {
    payment_id: parseInt(paymentId),
    invoice_id: parseInt(paymentId),
    payment_status: "finished",
    pay_address: "vaya_direccion_cripto_test_sandbox",
    price_amount: 0.21,
    price_currency: "usd",
    pay_amount: 0.00021,
    pay_currency: "btc",
    order_id: `ORG-076becfe-9425-47ee-adfd-0dc0e7103d68-1770138339912`, // Reemplaza si tienes otro
    actually_paid: 0.21,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

const body = JSON.stringify(payload);

// 4. Calcular la firma HMAC-SHA512
const signature = crypto
    .createHmac("sha512", IPN_SECRET)
    .update(body)
    .digest("hex");

console.log(`🚀 Simulando pago para ID: ${paymentId}`);
console.log(`📡 Enviando a: ${BASE_URL}/api/webhooks/nowpayments`);
console.log(`🔐 Firma generada: ${signature.substring(0, 10)}...`);

// 5. Enviar el POST
async function sendWebhook() {
    try {
        const response = await fetch(`${BASE_URL}/api/webhooks/nowpayments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-nowpayments-sig": signature
            },
            body: body
        });

        const result = await response.json();

        if (response.ok) {
            console.log("✅ ÉXITO: El servidor procesó el webhook correctamente.");
            console.log("📝 Respuesta:", result);
        } else {
            console.log("❌ ERROR:", response.status, result);
        }
    } catch (error) {
        console.error("💥 Error de conexión:", error.message);
    }
}

sendWebhook();
