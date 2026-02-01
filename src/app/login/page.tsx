"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Shield,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Por favor ingresa un email válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      const result = await signIn(data.email, data.password);
      if (result.error) {
        setError(result.error.message || "Login failed");
      } else {
        // Check if user is admin and redirect accordingly
        console.log("✅ Login successful, checking admin status...");
        try {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            console.error("❌ Error getting user after login:", userError);
            router.push("/profile");
            return;
          }

          if (user) {
            console.log("👤 User found:", user.email, "ID:", user.id);
            const { data: isAdmin, error: adminError } = await supabase.rpc(
              "is_admin",
              { user_id: user.id },
            );

            if (adminError) {
              console.error("❌ Error checking admin status:", adminError);
              router.push("/profile");
              return;
            }

            console.log("🔐 Admin check result:", isAdmin);

            // Ensure user has admin_users record (needed for onboarding)
            // This creates the record if it doesn't exist
            let adminUser = null;
            try {
              const ensureResponse = await fetch(
                "/api/onboarding/ensure-admin-user",
                {
                  method: "POST",
                },
              );
              if (!ensureResponse.ok) {
                console.warn(
                  "⚠️ Could not ensure admin_user record, but continuing...",
                );
              } else {
                const ensureData = await ensureResponse.json();
                if (ensureData.created) {
                  console.log("✅ Created admin_users record for user");
                }
                // Use the adminUser from the response if available
                if (ensureData.adminUser) {
                  adminUser = ensureData.adminUser;
                }
              }
            } catch (ensureError) {
              console.warn("⚠️ Error ensuring admin_user record:", ensureError);
            }

            // If we don't have adminUser from ensure endpoint, fetch it
            if (!adminUser) {
              const { data: fetchedAdminUser, error: adminUserError } =
                await supabase
                  .from("admin_users")
                  .select("organization_id")
                  .eq("id", user.id)
                  .maybeSingle();

              adminUser = fetchedAdminUser;

              if (adminUserError && adminUserError.code !== "PGRST116") {
                console.warn("⚠️ Error fetching admin_user:", adminUserError);
              }
            }

            // Check if user is root/dev (should go to SaaS Management)
            const isRootUser =
              adminUser?.role === "root" || adminUser?.role === "dev";

            // Check if user needs onboarding (has no organization)
            const hasOrganization = !!adminUser?.organization_id;
            const needsOnboarding = !hasOrganization && !isRootUser; // Root/dev don't need onboarding

            console.log("🔍 Onboarding check:", {
              hasAdminUser: !!adminUser,
              hasOrganization,
              needsOnboarding,
              isRootUser,
              organizationId: adminUser?.organization_id,
            });

            // Priority: onboarding > root/dev (SaaS Management) > admin dashboard > profile
            if (needsOnboarding) {
              console.log(
                "🔄 User needs onboarding, redirecting to /onboarding/choice",
              );
              router.push("/onboarding/choice");
              return;
            } else if (isAdmin || adminUser) {
              if (isRootUser) {
                // Root/dev users go directly to SaaS Management
                console.log(
                  "✅ User is root/dev, redirecting to SaaS Management",
                );
                router.replace("/admin/saas-management/dashboard");
                setTimeout(() => {
                  if (
                    window.location.pathname !==
                    "/admin/saas-management/dashboard"
                  ) {
                    console.log(
                      "⚠️ Router.replace didn't work, trying window.location",
                    );
                    window.location.href = "/admin/saas-management/dashboard";
                  }
                }, 100);
              } else {
                // Regular admin users go to admin dashboard
                console.log("✅ User is admin, redirecting to /admin");
                router.replace("/admin");
                setTimeout(() => {
                  if (window.location.pathname !== "/admin") {
                    console.log(
                      "⚠️ Router.replace didn't work, trying window.location",
                    );
                    window.location.href = "/admin";
                  }
                }, 100);
              }
            } else {
              console.log("ℹ️ User is not admin, redirecting to /profile");
              router.push("/profile");
            }
          } else {
            console.warn("⚠️ No user found after login");
            router.push("/profile");
          }
        } catch (checkError) {
          // If admin check fails, redirect to profile
          console.error("❌ Exception checking admin status:", checkError);
          router.push("/profile");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Left Side: Branding & Visuals (Hidden on small mobile if needed, or first on stack) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 bg-admin-bg-primary overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-110"
          style={{
            backgroundImage: `url('/luxury_optics_auth_bg_1769965128142.png')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-admin-bg-primary/95 via-admin-bg-primary/40 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-white rounded-3xl flex items-center justify-center shadow-premium-lg overflow-hidden p-2">
              <Image
                src="/logo-opttius.png"
                alt="Opttius Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-3xl font-black text-white tracking-tighter uppercase">
              Opttius
            </span>
          </div>

          <div className="max-w-xl">
            <h2 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
              Precision en cada{" "}
              <span className="text-admin-accent-primary">detalle</span>,<br />
              Vision para tu{" "}
              <span className="text-admin-accent-primary">negocio</span>.
            </h2>
            <div className="h-1 w-24 bg-admin-accent-primary rounded-full mb-8" />
            <p className="text-xl text-white/80 font-medium leading-relaxed">
              La plataforma definitiva para la gestión de ópticas modernas.
              Centraliza tus citas, inventario y relaciones con clientes en una
              sola experiencia premium.
            </p>
          </div>

          <div className="flex items-center gap-6 text-white/50 text-sm font-bold uppercase tracking-widest">
            <span>Enterprise Edition</span>
            <div className="h-1 w-1 rounded-full bg-white/30" />
            <span>v2.5.0</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 lg:p-20 bg-slate-50/50 relative overflow-y-auto">
        <div className="absolute top-0 right-0 p-8 flex items-center gap-3 lg:hidden">
          <Image
            src="/logo-opttius.png"
            alt="Opttius Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="text-xl font-black text-admin-text-primary tracking-tighter uppercase">
            Opttius
          </span>
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-10 lg:text-left">
            <h1 className="text-4xl font-black text-admin-text-primary tracking-tight mb-3">
              Bienvenido de Nuevo
            </h1>
            <p className="text-admin-text-tertiary font-bold uppercase text-[10px] tracking-widest">
              Ingresa tus credenciales para acceder a la Agenda Maestra
            </p>
          </div>

          <Card className="border-none bg-white shadow-premium-lg rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 sm:p-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-admin-error/5 border-admin-error/20 rounded-2xl"
                  >
                    <AlertDescription className="text-admin-error font-bold text-xs">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest ml-1"
                  >
                    Correo Electrónico
                  </Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@opttius.com"
                      {...register("email")}
                      className={cn(
                        "h-14 rounded-2xl border-admin-border-primary/50 bg-slate-50/50 pl-12 focus:bg-white transition-all font-bold",
                        errors.email
                          ? "border-admin-error focus-visible:ring-admin-error"
                          : "focus-visible:ring-admin-accent-primary",
                      )}
                      disabled={loading}
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-text-tertiary transition-colors group-focus-within:text-admin-accent-primary" />
                  </div>
                  {errors.email && (
                    <p className="text-[10px] text-admin-error font-black uppercase tracking-tight ml-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label
                      htmlFor="password"
                      className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest ml-1"
                    >
                      Contraseña
                    </Label>
                    <Link
                      href="/reset-password"
                      className="text-[10px] font-bold text-admin-accent-primary hover:text-admin-accent-primary/80 uppercase tracking-widest"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("password")}
                      className={cn(
                        "h-14 rounded-2xl border-admin-border-primary/50 bg-slate-50/50 pl-12 pr-12 focus:bg-white transition-all font-bold",
                        errors.password
                          ? "border-admin-error focus-visible:ring-admin-error"
                          : "focus-visible:ring-admin-accent-primary",
                      )}
                      disabled={loading}
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-text-tertiary transition-colors group-focus-within:text-admin-accent-primary" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-xl hover:bg-transparent text-admin-text-tertiary"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-[10px] text-admin-error font-black uppercase tracking-tight ml-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-admin-accent-primary hover:bg-admin-accent-primary/90 text-white rounded-2xl shadow-premium-md font-black uppercase text-[11px] tracking-widest transition-all active:scale-[0.98] group"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      Acceder al Panel
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-10 text-center">
                <p className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest mb-4">
                  ¿No tienes acceso todavía?
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-admin-border-primary/40 text-[10px] font-black text-admin-text-primary uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Crear una nueva cuenta
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[9px] font-bold text-admin-text-tertiary uppercase tracking-widest opacity-60">
            <Link
              href="#"
              className="hover:text-admin-accent-primary transition-colors"
            >
              Estado del Servicio
            </Link>
            <Link
              href="#"
              className="hover:text-admin-accent-primary transition-colors"
            >
              Privacidad
            </Link>
            <Link
              href="#"
              className="hover:text-admin-accent-primary transition-colors"
            >
              Soporte Técnico
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
