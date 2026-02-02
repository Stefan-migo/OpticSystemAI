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
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {/* Premium Background Elements for both sides */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-premium-float" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-premium-float"
          style={{ animationDelay: "-4s" }}
        />
      </div>

      {/* Left Side: Branding & Visuals */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 overflow-hidden z-10">
        {/* Background Image with Enhanced Overlays */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
          style={{
            backgroundImage: `url('/luxury_optics_auth_bg_1769965128142.png')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/40 to-transparent" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div className="flex items-center gap-5 group cursor-pointer">
            <div className="h-16 w-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:bg-white group-hover:scale-110">
              <Image
                src="/logo-opttius.png"
                alt="Opttius Logo"
                width={44}
                height={44}
                className="object-contain transition-all duration-500 group-hover:brightness-100 invert group-hover:invert-0"
              />
            </div>
            <span className="text-4xl font-black text-white tracking-tighter uppercase font-heading">
              Opttius
            </span>
          </div>

          <div className="max-w-xl animate-in fade-in slide-in-from-left-10 duration-1000">
            <h2 className="text-6xl font-black text-white leading-[1.1] tracking-tight mb-8">
              Precisión en cada{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">
                detalle
              </span>
              ,<br />
              Visión para tu{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">
                negocio
              </span>
              .
            </h2>
            <div className="h-1.5 w-32 bg-gradient-to-r from-primary to-indigo-500 rounded-full mb-10 shadow-lg shadow-primary/40" />
            <p className="text-2xl text-slate-200/90 font-medium leading-relaxed font-body">
              La plataforma definitiva para la gestión de ópticas modernas.
              Optimiza cada proceso con tecnología de vanguardia y diseño
              premium.
            </p>
          </div>

          <div className="flex items-center gap-8 text-white/40 text-xs font-black uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />{" "}
              Enterprise Edition
            </span>
            <div className="h-1 w-1 rounded-full bg-white/20" />
            <span>v2.5.0</span>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative z-10 overflow-y-auto">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 flex items-center gap-3 lg:hidden">
          <Image
            src="/logo-opttius.png"
            alt="Opttius Logo"
            width={36}
            height={36}
            className="object-contain"
          />
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
            Opttius
          </span>
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="text-center mb-12 lg:text-left space-y-3">
            <Badge
              variant="healty"
              className="bg-primary/10 text-primary border-none text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full inline-block"
            >
              PORTAL DE ACCESO
            </Badge>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Bienvenido
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-loose">
              Ingresa tus credenciales maestras para gestionar tu ecosistema
              óptico.
            </p>
          </div>

          <Card
            variant="glass"
            rounded="lg"
            className="border-white/40 dark:border-slate-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            <CardContent className="p-8 sm:p-12">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-red-500/10 border-red-500/20 rounded-2xl animate-in shake-in duration-500"
                  >
                    <AlertDescription className="text-red-500 font-bold text-xs flex items-center gap-2">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1"
                  >
                    Canal Administrativo (Email)
                  </Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@opttius.com"
                      {...register("email")}
                      className={cn(
                        "h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-14 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold text-slate-700 dark:text-slate-200",
                        errors.email &&
                          "border-red-500 focus-visible:ring-red-500",
                      )}
                      disabled={loading}
                    />
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                  </div>
                  {errors.email && (
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-tight ml-1 flex items-center gap-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <Label
                      htmlFor="password"
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"
                    >
                      Llave Maestra
                    </Label>
                    <Link
                      href="/reset-password"
                      className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
                    >
                      He olvidado mi llave
                    </Link>
                  </div>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("password")}
                      className={cn(
                        "h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-14 pr-14 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold text-slate-700 dark:text-slate-200",
                        errors.password &&
                          "border-red-500 focus-visible:ring-red-500",
                      )}
                      disabled={loading}
                    />
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
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
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-tight ml-1 flex items-center gap-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-16 rounded-2xl shadow-xl shadow-primary/20 font-black uppercase text-xs tracking-[0.2em] group overflow-hidden"
                  disabled={loading}
                  shimmer
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      Acceder al Sistema
                      <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-12 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
                  ¿Aún no eres parte de Opttius?
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-3 h-14 px-8 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-primary/20 transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl"
                >
                  Crear Nueva Identidad
                  <ArrowRight className="h-4 w-4 text-primary" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {["Estado de Red", "Soporte Vital", "Privacidad de Datos"].map(
              (item) => (
                <Link
                  key={item}
                  href="#"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                  {item}
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
