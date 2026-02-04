# Plan de implementación: Cloudflare R2 (almacenamiento de imágenes)

Este documento describe el plan detallado para integrar **Cloudflare R2** como almacenamiento de imágenes en Opttius (logos de ópticas, imágenes de productos, avatares), incluyendo alta en la plataforma, suite de pruebas y tareas paso a paso para una implementación limpia.

---

## 1. Resumen y objetivos

### 1.1 Por qué R2

- **Egress gratis**: Sin coste por descarga; ideal para muchas ópticas consumiendo imágenes.
- **10 GB gratis**: Permite pruebas y bajo volumen sin coste.
- **S3 compatible**: Uso del SDK estándar de AWS S3 sin cambios de protocolo.
- **Rendimiento**: Mejor latencia que S3 en muchos benchmarks; red global Cloudflare.

### 1.2 Alcance

- **Incluido**: Upload de imágenes (logos de organización, productos, avatares) vía API; URLs públicas guardadas en Supabase (Postgres).
- **No incluido**: Migración masiva desde Supabase Storage existente (fase opcional posterior).

### 1.3 Criterios de éxito

- Upload funcional desde Sistema > Configuración (logo óptica) y desde productos/avatares.
- Tests automatizados que cubran upload, URL pública y validaciones.
- Fallback o configuración para seguir usando Supabase Storage si R2 no está configurado.

---

## 2. Setup en la plataforma R2 (alta y configuración)

### 2.1 Cuenta Cloudflare

| Paso  | Acción                | Detalle                                                            |
| ----- | --------------------- | ------------------------------------------------------------------ |
| 2.1.1 | Crear cuenta          | [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) |
| 2.1.2 | Verificar email       | Obligatorio para activar R2                                        |
| 2.1.3 | Añadir método de pago | Requerido para R2 (no se cobra hasta superar free tier)            |

### 2.2 Activar R2 y crear bucket

| Paso  | Acción                | Detalle                                                                                           |
| ----- | --------------------- | ------------------------------------------------------------------------------------------------- |
| 2.2.1 | Ir a R2               | Dashboard > **R2 Object Storage** (menú lateral)                                                  |
| 2.2.2 | Crear bucket          | **Create bucket**; nombre sugerido: `opttius-images` (o `opttius-{env}` por entorno)              |
| 2.2.3 | Región                | Dejar **Automatic** (Cloudflare elige la óptima)                                                  |
| 2.2.4 | Configuración pública | **Allow public access** si las imágenes serán públicas por URL (recomendado para logos/productos) |
| 2.2.5 | Guardar               | Anotar **Bucket name** (ej. `opttius-images`)                                                     |

### 2.3 API Tokens (acceso programático)

| Paso  | Acción                             | Detalle                                                                                              |
| ----- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 2.3.1 | Ir a **R2 > Manage R2 API Tokens** | O: Overview del bucket > **Manage API Tokens**                                                       |
| 2.3.2 | Create API token                   | Nombre: `opttius-upload` (o por entorno)                                                             |
| 2.3.3 | Permisos                           | **Object Read & Write** para el bucket creado                                                        |
| 2.3.4 | TTL                                | **Forever** (o 1 año y rotación programada)                                                          |
| 2.3.5 | Crear y copiar                     | Se muestran **Access Key ID** y **Secret Access Key** una sola vez; guardarlos en gestor de secretos |

### 2.4 Account ID y endpoint

| Paso  | Acción      | Detalle                                                                                                                                 |
| ----- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 2.4.1 | Account ID  | En Dashboard, columna derecha **Account ID** (ej. `a1b2c3d4e5f6...`)                                                                    |
| 2.4.2 | Endpoint S3 | Para R2: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (documentación: [R2 S3 API](https://developers.cloudflare.com/r2/api/s3/api/)) |

### 2.5 CORS (para uploads desde el navegador, opcional)

Si en el futuro se hace upload directo desde el cliente al bucket:

- En el bucket: **Settings > CORS policy**.
- Añadir origen permitido: `https://tudominio.com` y `http://localhost:3000` en desarrollo.

Para una implementación limpia inicial se recomienda **solo upload desde el servidor** (Next.js API route), por lo que CORS en R2 puede dejarse para una fase posterior.

---

## 3. Variables de entorno

Añadir a `.env.local` y a los entornos de staging/producción (sin commitear valores reales).

```env
# ===== CLOUDFLARE R2 (Object Storage - imágenes) =====
# Si no se configuran, el upload puede fallback a Supabase Storage
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=opttius-images
# Región vacía para R2 (Cloudflare la gestiona)
R2_REGION=auto
# URL pública del bucket (tras configurar dominio público o R2 dev subdomain)
# Ejemplo dev: https://pub-xxx.r2.dev (desde R2 > bucket > Settings > Public access)
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

Actualizar `env.example` con las mismas claves y valores de ejemplo/placeholder, y documentar en este plan que `NEXT_PUBLIC_R2_PUBLIC_URL` puede ser la URL del “R2.dev subdomain” del bucket o un dominio custom.

---

## 4. Arquitectura técnica

### 4.1 Flujo de upload

1. Cliente (ej. `ImageUpload`, `SystemConfig`) envía `FormData` (file + `folder`) a **`POST /api/upload`**.
2. API verifica autenticación y (si aplica) que el usuario sea admin o pertenezca a la organización.
3. API valida tipo (imagen) y tamaño (ej. máx. 5 MB).
4. Si `R2_*` está configurado: upload a R2 vía SDK S3-compatible; se obtiene la URL pública (o se construye con `NEXT_PUBLIC_R2_PUBLIC_URL` + key).
5. Si R2 no está configurado: fallback a Supabase Storage (comportamiento actual deseado).
6. Respuesta: `{ url: string }` para guardar en Postgres (ej. `organizations.logo_url`, `products.featured_image`).

### 4.2 Estructura de “carpetas” en el bucket (prefijos)

- `organizations/{organization_id}/logo.{ext}` — logos de óptica.
- `organizations/{organization_id}/...` — más assets por organización si se amplía.
- `products/{organization_id}/{product_id}/{filename}.{ext}` — imágenes de productos.
- `avatars/{user_id}/{filename}.{ext}` — avatares.

Así se facilita limpieza por organización y políticas de vida útil si más adelante se configuran.

### 4.3 Dependencia

- Paquete: `@aws-sdk/client-s3` (R2 es compatible con la API S3; no hace falta `@aws-sdk/lib-storage` salvo que se quiera multipart explícito).
- Configuración del cliente S3 con `endpoint` apuntando a `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` y región (ej. `auto` o `wnam` según docs de Cloudflare).

### 4.4 URL pública del objeto en R2

- R2 no devuelve una URL pública por defecto; hay que construirla.
- **Opción A – R2.dev subdomain**: En el bucket, Settings > Public access > "Allow Access" > R2.dev subdomain. Se obtiene una URL base (ej. `https://pub-xxxx.r2.dev`). URL final = `NEXT_PUBLIC_R2_PUBLIC_URL + '/' + key` (ej. `https://pub-xxxx.r2.dev/organizations/org-uuid/logo.png`).
- **Opción B – Custom domain**: Configurar un dominio (ej. `cdn.tudominio.com`) en R2 para el bucket; usar esa base en `NEXT_PUBLIC_R2_PUBLIC_URL` y construir igual: base + '/' + key.
- En el API route, tras el `PutObject`, devolver `url: NEXT_PUBLIC_R2_PUBLIC_URL + '/' + key` (sin trailing slash en la base).

---

## 5. Tareas paso a paso (implementación limpia)

### Fase 1: Preparación del proyecto

- [ ] **T1.1** Crear documento de plan (este archivo) y ubicarlo en `docs/CLOUDFLARE_R2_IMPLEMENTATION_PLAN.md`.
- [ ] **T1.2** Añadir variables R2 a `env.example` con placeholders y comentarios.
- [ ] **T1.3** Instalar dependencia: `@aws-sdk/client-s3` (y opcionalmente `@aws-sdk/s3-request-presigner` si más adelante se usan URLs firmadas).
- [ ] **T1.4** Crear módulo de configuración/cliente R2 (ej. `src/lib/r2/client.ts`) que lea `R2_*` y exporte un cliente S3 configurado para R2, o `null` si no hay configuración (para fallback).

### Fase 2: API de upload

- [ ] **T2.1** Implementar o extender `POST /api/upload` (ej. `src/app/api/upload/route.ts`):
  - Leer `file` y `folder` del `FormData`.
  - Verificar autenticación (y rol admin/organización según contexto).
  - Validar tipo MIME (solo imágenes) y tamaño (ej. ≤ 5 MB).
- [ ] **T2.2** Si existen vars R2: generar `key` según la estructura de carpetas (organizations/products/avatars); subir con `PutObject`; construir URL pública (R2 dev subdomain o custom) y devolver `{ url }`.
- [ ] **T2.3** Si no existen vars R2: usar Supabase Storage (lógica actual o a implementar) y devolver `{ url }`.
- [ ] **T2.4** Respuestas de error: 400 (validación), 401 (no autenticado), 403 (sin permiso), 413 (archivo demasiado grande), 500 (error de R2/Supabase); mensajes claros y sin exponer detalles internos.

### Fase 3: Integración en la UI

- [ ] **T3.1** Asegurar que el componente de logo en **Sistema > Configuración > General** (ej. `SystemConfig`) use el mismo flujo de upload (llamada a `POST /api/upload` con `folder` adecuado, p. ej. `organizations` o `logos`) y guarde la URL en `organizations.logo_url`.
- [ ] **T3.2** Revisar `ImageUpload` y `AvatarUpload`: que llamen a `POST /api/upload` con `folder` (products / avatars) y que muestren la URL devuelta; sin cambios de contrato si ya usan `/api/upload`.
- [ ] **T3.3** (Opcional) Añadir en la UI un indicador de “almacenamiento” (R2 vs Supabase) solo en desarrollo o para admins, para verificar que el fallback funciona.

### Fase 4: URL pública del bucket R2

- [ ] **T4.1** En Cloudflare R2, en el bucket: **Settings > Public access**. Habilitar “R2.dev subdomain” y anotar la URL (ej. `https://pub-xxxx.r2.dev`).
- [ ] **T4.2** Poner esa URL en `NEXT_PUBLIC_R2_PUBLIC_URL` (o construir la URL pública como `NEXT_PUBLIC_R2_PUBLIC_URL + '/' + key`). Si se usa dominio custom, configurar el custom domain en R2 y usar esa base en `NEXT_PUBLIC_R2_PUBLIC_URL`.
- [ ] **T4.3** Documentar en este plan que las URLs finales serán `NEXT_PUBLIC_R2_PUBLIC_URL + '/' + key` (o la variante que se implemente).

### Fase 5: Seguridad y buenas prácticas

- [ ] **T5.1** No exponer `R2_SECRET_ACCESS_KEY` ni `R2_ACCESS_KEY_ID` al cliente; usar solo en API routes o server-side.
- [ ] **T5.2** Limitar tamaño máximo en API (ej. 5 MB) y tipos MIME (image/jpeg, image/png, image/webp, image/gif).
- [ ] **T5.3** Nombres de objeto: usar UUID o “organization_id + timestamp + random” para evitar colisiones y enumeración predecible.
- [ ] **T5.4** (Opcional) Rate limiting en `POST /api/upload` para evitar abuso (p. ej. por IP o por usuario).

### Fase 6: Documentación y despliegue

- [ ] **T6.1** Actualizar README o `docs/SETUP_GUIDE.md` con la sección “Almacenamiento de imágenes (R2)”: enlace a este plan, variables necesarias y pasos mínimos de configuración.
- [ ] **T6.2** En CI/CD (si aplica): no inyectar secretos R2 en builds de preview; solo en entornos de staging/producción. Comprobar que sin R2 el fallback a Supabase no rompe el build.
- [ ] **T6.3** Deploy en staging: configurar las variables R2, subir un logo y una imagen de producto y comprobar que las URLs se ven correctamente.

---

## 6. Test suite

### 6.1 Tests unitarios (API upload)

- [ ] **UT1** Sin auth: `POST /api/upload` sin cookie/token → 401.
- [ ] **UT2** Sin `file` en body: 400 y mensaje claro.
- [ ] **UT3** Archivo no imagen (ej. `.txt`): 400.
- [ ] **UT4** Archivo > 5 MB: 413.
- [ ] **UT5** Con auth y archivo imagen válido: 200 y cuerpo con `url` string (mockeando el cliente S3 o usando bucket de prueba si se dispone).

### 6.2 Tests de integración (opcional pero recomendado)

- [ ] **IT1** Con R2 configurado (env de test): upload real a un bucket de prueba; comprobar que la URL devuelta existe (HEAD o GET) y que el contenido es la imagen.
- [ ] **IT2** Sin R2 configurado: comprobar que la ruta sigue respondiendo (fallback a Supabase o 503/503 con mensaje controlado, según diseño).

### 6.3 Tests E2E (si hay suite E2E)

- [ ] **E2E1** Login como admin → Sistema > Configuración > General → subir logo → guardar → recargar y comprobar que el logo se muestra en el header.
- [ ] **E2E2** Crear/editar producto con imagen; comprobar que la imagen se muestra en listado/detalle.

### 6.4 Herramientas sugeridas

- Unit/API: **Vitest** + `next/test-utils` o peticiones `fetch` al handler de la route.
- Integración: mismo stack; variables de entorno de test con bucket R2 dedicado o Supabase Storage.
- E2E: Playwright o Cypress, según el proyecto.

---

## 7. Criterios de aceptación y checklist final

- [ ] Alta en Cloudflare y bucket R2 creado; API token con permisos mínimos.
- [ ] Variables R2 en `env.example` y documentadas; configuración en staging/producción sin secretos en repo.
- [ ] `POST /api/upload` implementado con R2 + fallback a Supabase; validaciones y códigos HTTP correctos.
- [ ] Logo de óptica y al menos un flujo de imagen de producto (o avatar) funcionando contra R2.
- [ ] Suite de tests (unitarios como mínimo) pasando; opcional: 1 integración y 1 E2E.
- [ ] Documentación actualizada (este plan + README o SETUP_GUIDE) y revisión de seguridad (sin secretos en cliente, límites de tamaño y tipo).

---

## 8. Referencias

- [Cloudflare R2 – S3 API](https://developers.cloudflare.com/r2/api/s3/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [AWS SDK for JavaScript v3 – S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) (para `src/app/api/upload/route.ts`)

---

## 9. Resumen de tareas (checklist rápido)

| ID        | Fase        | Tarea                                         | Estado |
| --------- | ----------- | --------------------------------------------- | ------ |
| T1.1      | Preparación | Documento de plan en `docs/`                  | [x]    |
| T1.2      | Preparación | Variables R2 en `env.example`                 | [x]    |
| T1.3      | Preparación | Instalar `@aws-sdk/client-s3`                 | [x]    |
| T1.4      | Preparación | Módulo cliente R2 (`src/lib/r2/client.ts`)    | [x]    |
| T2.1      | API         | `POST /api/upload`: auth + validación         | [x]    |
| T2.2      | API         | Upload a R2 y construcción de URL pública     | [x]    |
| T2.3      | API         | Fallback a Supabase si R2 no configurado      | [x]    |
| T2.4      | API         | Códigos de error 400/401/403/413/500          | [x]    |
| T3.1      | UI          | Logo óptica usa `/api/upload` + guarda URL    | [x]    |
| T3.2      | UI          | ImageUpload / AvatarUpload usan `/api/upload` | [x]    |
| T4.1      | R2          | Habilitar R2.dev subdomain (o custom domain)  | ☐      |
| T4.2      | R2          | Configurar `NEXT_PUBLIC_R2_PUBLIC_URL`        | ☐      |
| T5.1      | Seguridad   | Secretos solo server-side                     | [x]    |
| T5.2      | Seguridad   | Límite tamaño y MIME                          | [x]    |
| T5.3      | Seguridad   | Nombres de objeto no predecibles              | [x]    |
| T6.1      | Docs        | Actualizar README o SETUP_GUIDE               | [x]    |
| T6.2      | CI/CD       | Sin secretos R2 en preview; fallback ok       | ☐      |
| T6.3      | Deploy      | Prueba en staging (logo + producto)           | ☐      |
| UT1–UT5   | Tests       | Tests unitarios API upload                    | [x]    |
| IT1–IT2   | Tests       | Tests integración (opcional)                  | ☐      |
| E2E1–E2E2 | Tests       | Tests E2E (opcional)                          | ☐      |

---

_Documento: Plan de implementación Cloudflare R2 – Opttius. Última actualización: febrero 2026._
