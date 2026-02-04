# Guía de Configuración: Cloudflare R2 en Opttius

Esta guía explica los pasos necesarios para configurar Cloudflare R2 como el sistema de almacenamiento de imágenes (logos, productos, avatares) de la plataforma.

---

## 1. Alta en Cloudflare y Activación de R2

1. **Crear cuenta**: Si no tienes una, regístrate en [dash.cloudflare.com](https://dash.cloudflare.com/sign-up).
2. **Activar R2**:
   - Ve al menú lateral izquierdo y selecciona **R2**.
   - Si es la primera vez, es posible que debas añadir un método de pago (Cloudflare ofrece un generoso nivel gratuito de 10GB/mes y transferencias gratuitas).
3. **Crear Bucket**:
   - Haz clic en **Create bucket**.
   - Nombre sugerido: `opttius-images` (puedes usar el que prefieras).
   - En **Location**, déjalo en **Automatic**.
   - Haz clic en **Create bucket**.

---

## 2. Configuración de Acceso Público

Para que las imágenes sean visibles mediante una URL pública:

1. Dentro de tu bucket, ve a la pestaña **Settings**.
2. Desplázate hasta la sección **Public Access**.
3. **Opción A (Dominio Personal - Recomendado)**:
   - Haz clic en **Connect Domain**.
   - Escribe un subdominio que tengas en Cloudflare (ej: `cdn.tuoptica.com`).
   - Esto configurará automáticamente los registros DNS y el certificado SSL.
4. **Opción B (R2.dev Subdomain)**:
   - Haz clic en **Allow Access** en la sección "R2.dev subdomain".
   - Esto te proporcionará una URL similar a `https://pub-xxxxxxxxxxxxxx.r2.dev`.
   - **Nota**: Esta URL es útil para desarrollo, pero Cloudflare recomienda usar dominios propios para producción.

---

## 3. Obtención de Credenciales API

1. En la página principal de **R2**, haz clic en el enlace **Manage R2 API Tokens** (a la derecha).
2. Haz clic en **Create API token**.
3. Configuración del Token:
   - **Token name**: `Opttius Upload`.
   - **Permissions**: Selecciona **Object Read & Write**.
   - **Bucket scope**: Selecciona el bucket que creaste (`opttius-images`).
   - **TTL**: Forever (o según tu política de seguridad).
4. Haz clic en **Create API Token**.
5. **IMPORTANTE**: Copia y guarda los siguientes valores en un lugar seguro (no se volverán a mostrar):
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint** (Solo necesitas la parte del ID de cuenta de este URL).

---

## 4. Configuración en la Aplicación

Copia los valores obtenidos a tu archivo `.env.local` (o a las variables de entorno de tu servidor de despliegue):

```env
# ID de cuenta que aparece en el Endpoint (ej: https://<ID>.r2.cloudflarestorage.com)
R2_ACCOUNT_ID=tu_account_id_aqui

# Credenciales del Token API
R2_ACCESS_KEY_ID=tu_access_key_id_aqui
R2_SECRET_ACCESS_KEY=tu_secret_access_key_aqui

# Nombre del bucket que creaste
R2_BUCKET_NAME=opttius-images

# Región (usualmente 'auto')
R2_REGION=auto

# URL pública (La URL de tu dominio conectado o el subdominio r2.dev)
# NO incluyas barra diagonal (/) al final
NEXT_PUBLIC_R2_PUBLIC_URL=https://cdn.tuoptica.com
```

---

## 5. Verificación

Una vez configuradas las variables:

1. Reinicia el servidor de desarrollo (`npm run dev`).
2. Ve a la plataforma y sube un logo o avatar.
3. El sistema detectará automáticamente las variables de R2 y usará Cloudflare en lugar de Supabase Storage.
4. Puedes verificarlo inspeccionando la URL de la imagen subida; debería empezar con tu dominio de Cloudflare.

_Si las variables no están presentes, el sistema seguirá usando Supabase Storage como modo de respaldo automáticamente._
