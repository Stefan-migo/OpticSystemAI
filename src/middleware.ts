import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware para redirigir usuarios sin organización a onboarding
 *
 * Rutas excluidas:
 * - /onboarding/* - Rutas de onboarding
 * - /login, /signup - Rutas de autenticación
 * - /api/* - API routes
 * - /_next/* - Next.js internals
 * - /favicon.ico, etc. - Assets estáticos
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Excluir rutas que no necesitan verificación de organización
  const excludedPaths = [
    "/onboarding",
    "/login",
    "/signup",
    "/support", // Portal público de soporte
    "/api",
    "/_next",
    "/favicon.ico",
    "/favicon",
  ];

  // Permitir acceso a la landing page (raíz)
  if (pathname === "/") {
    return NextResponse.next();
  }

  const shouldExclude = excludedPaths.some((path) => pathname.startsWith(path));

  if (shouldExclude) {
    return NextResponse.next();
  }

  // Solo verificar organización en rutas /admin/*
  if (pathname.startsWith("/admin")) {
    console.log("🛡️ Middleware: Checking /admin route:", pathname);
    try {
      // Supabase SSR usa cookies con formato: sb-${projectRef}-auth-token
      // Para localhost, el projectRef es "127"
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
      let projectRef: string;

      if (
        supabaseUrl.includes("localhost") ||
        supabaseUrl.includes("127.0.0.1")
      ) {
        projectRef = "127"; // Simplified format for localhost
      } else {
        // Extract project ref from URL (e.g., https://xyz.supabase.co -> xyz)
        const match = supabaseUrl.match(/https?:\/\/([^.]+)/);
        projectRef = match ? match[1] : "default";
      }

      const authCookieName = `sb-${projectRef}-auth-token`;
      const authCookie = request.cookies.get(authCookieName);

      console.log("🛡️ Middleware: Token check:", {
        cookieName: authCookieName,
        hasAuthCookie: !!authCookie,
        allCookies: request.cookies.getAll().map((c) => c.name),
      });

      if (!authCookie) {
        // No hay cookie de autenticación, redirigir a login
        console.log(
          "🛡️ Middleware: No auth cookie found, redirecting to login",
        );
        if (pathname !== "/login") {
          return NextResponse.redirect(new URL("/login", request.url));
        }
        return NextResponse.next();
      }

      console.log(
        "🛡️ Middleware: Auth cookie found, allowing access to layout",
      );
      // Verificar estado de organización llamando al endpoint check-status
      // Nota: En producción, esto podría optimizarse usando JWT directamente
      // Por ahora, redirigimos y dejamos que el layout haga la verificación
      // para evitar múltiples llamadas API en el middleware
    } catch (error) {
      console.error("🛡️ Middleware error:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
