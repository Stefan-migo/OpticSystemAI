# Túnel local para webhooks (Mercado Pago / Flow)

Para probar webhooks en local, Mercado Pago (y otras pasarelas) necesitan una URL pública. Esta guía usa **ngrok** con un script ya configurado en el proyecto.

---

## 0. Tener ngrok instalado (oficial, no npm) y authtoken

1. **Usar ngrok oficial (v3), no el de npm.**  
   Si instalaste antes con `npm install -g ngrok`, desinstálalo para evitar conflictos:

   ```bash
   npm uninstall -g ngrok
   ```

   Luego instala el oficial: [ngrok.com/download](https://ngrok.com/download) o `winget install ngrok.ngrok`.  
   Así `ngrok version` y `npm run tunnel` usarán el mismo binario (v3).

2. **Configurar authtoken** (una vez con el ngrok oficial):

   ```bash
   ngrok config add-authtoken TU_TOKEN_REAL
   ```

   El token real lo obtienes en [dashboard.ngrok.com → Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) (no uses la palabra "NGROK_AUTHTOKEN", sino el valor largo).

3. **Opcional:** En `.env.local` añade `NGROK_AUTHTOKEN=tu_token` para que el script del túnel también lo use si hace falta.

---

## 2. Arrancar la app

En un terminal:

```bash
npm run dev
```

Deja la app corriendo en `http://localhost:3000`.

---

## 3. Arrancar el túnel ngrok

En **otro** terminal:

```bash
npm run tunnel
```

Verás algo como:

```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

Copia la URL **HTTPS** (ej. `https://abc123.ngrok-free.app`). En plan gratuito la URL cambia cada vez que reinicias ngrok.

---

## 4. Configurar Mercado Pago

1. Entra al [panel de Mercado Pago](https://www.mercadopago.com/developers/panel/app) → tu app → **Webhooks** → **Configurar notificaciones**.
2. **URL de notificación:**  
   `https://TU-URL-NGROK/api/webhooks/mercadopago`  
   (ej. `https://abc123.ngrok-free.app/api/webhooks/mercadopago`)
3. Evento: **Pagos**.
4. Guarda y copia la **clave secreta** → en `.env.local`:
   ```bash
   MERCADOPAGO_WEBHOOK_SECRET=la_clave_que_te_dio_el_panel
   ```

---

## 5. (Opcional) URL base para back_urls

Para que al terminar el pago Mercado Pago redirija a tu entorno local vía ngrok, en `.env.local` puedes poner:

```bash
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok-free.app
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

Sustituye `abc123.ngrok-free.app` por la URL que te muestra ngrok. Si no lo cambias, las `back_urls` seguirán apuntando a `http://localhost:3000` y la redirección post-pago puede no funcionar bien fuera de tu máquina.

---

## Resumen

| Paso | Comando / Acción                                                        |
| ---- | ----------------------------------------------------------------------- |
| 1    | `npm install`                                                           |
| 2    | `npm run dev` (terminal 1)                                              |
| 3    | `npm run tunnel` (terminal 2) → copiar URL HTTPS                        |
| 4    | Panel MP: Webhook URL = `https://TU-URL-NGROK/api/webhooks/mercadopago` |
| 5    | Opcional: `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_APP_URL` = URL ngrok    |

Si reinicias ngrok, la URL cambia: actualiza la URL del webhook en el panel de Mercado Pago y, si las usas, las variables de URL base en `.env.local`.
