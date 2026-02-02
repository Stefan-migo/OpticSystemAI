/**
 * Inicia ngrok para exponer localhost:3000 (webhooks Mercado Pago, etc.).
 * Lee NGROK_AUTHTOKEN desde .env.local.
 * En Windows, ngrok instalado vía npm a veces no toma la variable de entorno;
 * por eso también se escribe un archivo de config temporal que ngrok sí lee.
 *
 * Uso: npm run tunnel
 * Requiere: ngrok instalado globalmente (npm install -g ngrok)
 * En .env.local: NGROK_AUTHTOKEN=tu_token_de_ngrok
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

let token = (process.env.NGROK_AUTHTOKEN || "").trim();
if (!token) {
  console.warn(
    "NGROK_AUTHTOKEN no está en .env.local. Añade: NGROK_AUTHTOKEN=tu_token"
  );
  process.exit(1);
}

const configPath = path.resolve(process.cwd(), ".ngrok-tunnel.yml");
try {
  fs.writeFileSync(configPath, `authtoken: ${token}\n`, "utf8");
} catch (err) {
  console.warn("No se pudo escribir .ngrok-tunnel.yml:", err.message);
}

const env = { ...process.env, NGROK_AUTHTOKEN: token };
if (fs.existsSync(configPath)) {
  env.NGROK_CONFIG = configPath;
  console.log("Usando authtoken desde .env.local (config temporal)");
} else {
  console.log("Usando NGROK_AUTHTOKEN desde .env.local");
}

// El PATH puede tener ngrok v2 (npm) que no acepta --config. Usamos solo env:
// NGROK_CONFIG y NGROK_AUTHTOKEN. Comando sin --config para que funcione con v2 y v3.
const cmd = "ngrok http 3000";

console.log("Iniciando túnel a http://localhost:3000 (asegúrate de tener 'npm run dev' en otro terminal)\n");

const child = spawn(cmd, [], {
  stdio: "inherit",
  env,
  shell: true,
  windowsHide: true,
});

child.on("error", (err) => {
  console.error("Error al ejecutar ngrok:", err.message);
  console.error("Asegúrate de tener ngrok instalado: npm install -g ngrok");
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
