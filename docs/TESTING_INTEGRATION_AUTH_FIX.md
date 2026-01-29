# Fix: Autenticación en Tests de Integración

## 📋 Contexto

Los tests de integración están creados y la infraestructura multi-tenancy está disponible, pero los tests fallan con errores `401 Unauthorized` debido a un problema de autenticación.

## 🔍 Problema Identificado

### Situación Actual

- ✅ **Migraciones aplicadas:** Las tablas `organizations`, `subscriptions`, `subscription_tiers` existen
- ✅ **Tests creados:** 34 tests de integración (Customers: 12, Products: 14, Orders: 8)
- ✅ **Infraestructura detectada:** Los tests detectan correctamente la infraestructura multi-tenancy
- ❌ **Autenticación falla:** Todos los tests reciben `401 Unauthorized`

### Causa Raíz

El problema es un **mismatch entre cómo los tests autentican y cómo el API route espera autenticación**:

1. **Tests usan:** Tokens Bearer (`Authorization: Bearer <token>`)
2. **API routes esperan:** Cookies de sesión (Next.js `createClient()` lee de `next/headers` cookies)

### Archivos Involucrados

- **Helper de tests:** `src/__tests__/integration/helpers/test-setup.ts`
  - Función `makeAuthenticatedRequest()` - línea ~334
  - Función `createTestUser()` - línea ~120 (genera token)
- **API routes:** `src/app/api/admin/customers/route.ts` (y otros)
  - Usa `createClient()` de `@/utils/supabase/server` - línea ~52
  - `createClient()` lee cookies de `next/headers` - no tokens Bearer

- **Cliente Supabase:** `src/utils/supabase/server.ts`
  - `createClient()` - línea ~5 (usa cookies)
  - `createServiceRoleClient()` - línea ~33 (usa service role key)

## 🎯 Objetivo

Hacer que los tests de integración puedan autenticarse correctamente con las API routes de Next.js.

## 🔧 Soluciones Posibles

### Opción A: Modificar Tests para Usar Cookies (Recomendada)

**Ventajas:**

- No requiere cambios en código de producción
- Simula mejor el comportamiento real del usuario
- Compatible con el flujo actual de Next.js

**Pasos:**

1. **Modificar `makeAuthenticatedRequest()` en `test-setup.ts`:**
   - En lugar de enviar `Authorization: Bearer <token>`
   - Crear y enviar cookies de sesión de Supabase
   - El formato de cookie de Supabase SSR es: `sb-<project-ref>-auth-token`

2. **Formato de cookie esperado:**

   ```typescript
   // Supabase SSR almacena la sesión en una cookie con este formato:
   const cookieName = `sb-${projectRef}-auth-token`;
   const cookieValue = JSON.stringify([
     {
       access_token: token,
       refresh_token: refreshToken,
       expires_at: expiresAt,
       token_type: "bearer",
       user: userData,
     },
   ]);
   ```

3. **Implementación:**
   - Obtener el `projectRef` de la URL de Supabase (local: `127.0.0.1:54321`)
   - Crear la cookie con el formato correcto
   - Enviar la cookie en el header `Cookie` de la petición

### Opción B: Modificar API Routes para Aceptar Tokens Bearer

**Ventajas:**

- Más simple para tests
- Permite autenticación programática

**Desventajas:**

- Requiere cambios en código de producción
- Necesita manejar dos métodos de autenticación

**Pasos:**

1. **Modificar `createClient()` en `src/utils/supabase/server.ts`:**
   - Detectar si hay header `Authorization: Bearer`
   - Si existe, crear cliente con el token directamente
   - Si no, usar cookies (comportamiento actual)

2. **O crear función helper:**
   ```typescript
   export async function createClientFromRequest(request: NextRequest) {
     const authHeader = request.headers.get("authorization");
     if (authHeader?.startsWith("Bearer ")) {
       const token = authHeader.substring(7);
       return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
         global: { headers: { Authorization: `Bearer ${token}` } },
       });
     }
     return createClient(); // Comportamiento actual con cookies
   }
   ```

## 📝 Pasos Detallados para Opción A (Recomendada)

### Paso 1: Entender el Formato de Cookie de Supabase SSR

Supabase SSR almacena la sesión en una cookie con este formato:

```typescript
// Nombre de la cookie
const cookieName = `sb-${projectRef}-auth-token`;

// Valor de la cookie (array JSON stringificado)
const cookieValue = JSON.stringify([
  {
    access_token: string,
    refresh_token: string,
    expires_at: number, // Unix timestamp
    token_type: "bearer",
    user: {
      id: string,
      email: string,
      // ... otros campos del usuario
    },
  },
]);
```

### Paso 2: Obtener Información de Sesión

En `createTestUser()` ya se obtiene el token:

- `sessionData?.session?.access_token` - línea ~169
- Necesitamos también: `refresh_token`, `expires_at`, `user`

### Paso 3: Modificar `makeAuthenticatedRequest()`

```typescript
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {},
  authToken?: string,
  sessionData?: any, // Agregar parámetro para datos completos de sesión
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (authToken && sessionData) {
    // Extraer projectRef de la URL de Supabase
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
    const projectRef =
      supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1")
        ? "127-0-0-1-54321" // Formato sanitizado para cookie name
        : extractProjectRef(supabaseUrl);

    const cookieName = `sb-${projectRef}-auth-token`;

    // Crear cookie con formato de Supabase SSR
    const cookieValue = JSON.stringify([
      {
        access_token: authToken,
        refresh_token: sessionData.session?.refresh_token || "",
        expires_at:
          sessionData.session?.expires_at ||
          Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: sessionData.user || {},
      },
    ]);

    headers.set("Cookie", `${cookieName}=${encodeURIComponent(cookieValue)}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Importante para incluir cookies
  });
}
```

### Paso 4: Actualizar Llamadas a `makeAuthenticatedRequest()`

En los tests, pasar también `sessionData`:

```typescript
// En createTestUser(), retornar también sessionData
return {
  id: authUser.user.id,
  email,
  organization_id: organizationId,
  authToken: sessionData?.session?.access_token,
  sessionData: sessionData, // Agregar esto
};

// En los tests, usar:
const response = await makeAuthenticatedRequest(
  url,
  options,
  userA.authToken,
  userA.sessionData, // Pasar también sessionData
);
```

## 🧪 Verificación

Después de implementar la solución:

1. **Ejecutar tests:**

   ```bash
   npm run test:run -- src/__tests__/integration/api/customers.test.ts
   ```

2. **Verificar que:**
   - ✅ Tests pasan (no más 401)
   - ✅ Autenticación funciona correctamente
   - ✅ Multi-tenancy se valida (usuarios solo ven datos de su organización)

3. **Tests esperados:**
   - Customers API: 12 tests
   - Products API: 14 tests
   - Orders API: 8 tests
   - **Total: 34 tests de integración**

## 📚 Referencias Técnicas

### Supabase SSR Cookie Format

- Documentación: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- El formato exacto puede variar, verificar en `node_modules/@supabase/ssr/dist/` si es necesario

### Next.js Cookies

- `next/headers` cookies API: https://nextjs.org/docs/app/api-reference/functions/cookies
- En tests, necesitamos simular esto con headers HTTP

### Archivos Clave

- `src/__tests__/integration/helpers/test-setup.ts` - Helper de tests
- `src/utils/supabase/server.ts` - Cliente Supabase del servidor
- `src/app/api/admin/customers/route.ts` - Ejemplo de API route

## ⚠️ Notas Importantes

1. **Servidor Next.js debe estar corriendo:**
   - Los tests hacen peticiones HTTP reales a `http://localhost:3000`
   - Asegurarse de que `npm run dev` esté ejecutándose

2. **Base de datos local:**
   - Supabase debe estar corriendo localmente
   - Migraciones deben estar aplicadas
   - Verificar con: `npx supabase status`

3. **Variables de entorno:**
   - `NEXT_PUBLIC_SUPABASE_URL` debe apuntar a local: `http://127.0.0.1:54321`
   - `SUPABASE_SERVICE_ROLE_KEY` para operaciones admin en tests

## ✅ Criterios de Éxito

- [ ] Todos los tests de integración pasan (34 tests)
- [ ] No hay errores 401 Unauthorized
- [ ] Multi-tenancy se valida correctamente (aislamiento de datos)
- [ ] Tests son determinísticos y reproducibles

---

**Última Actualización:** 2026-01-27  
**Estado:** ✅ COMPLETADO  
**Resultado:** Solución híbrida implementada - 12/12 tests de Customers API pasando  
**Solución Final:** Opción B (modificar API routes para aceptar Bearer tokens como fallback)  
**Fecha de Completación:** 2026-01-27
