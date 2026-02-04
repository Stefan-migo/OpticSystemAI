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
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Shield,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

const signupSchema = z
  .object({
    firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
    email: z.string().email("Por favor ingresa un email válido"),
    phone: z.string().optional().or(z.literal("")),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .regex(
        /[A-Z]/,
        "La contraseña debe contener al menos una letra mayúscula",
      )
      .regex(
        /[a-z]/,
        "La contraseña debe contener al menos una letra minúscula",
      )
      .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signUp, loading } = useAuthContext();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] =
    useState(false);

  const getThemeLogo = () => {
    switch (theme) {
      case "dark":
        return "/logo-opttius-dark.png";
      case "blue":
        return "/logo-opttius-blue.png";
      case "green":
        return "/logo-opttius-green.png";
      case "red":
        return "/logo-opttius-red.png";
      default:
        return "/logo-opttius.png";
    }
  };

  const getThemeTextLogo = () => {
    switch (theme) {
      case "dark":
        return "/logo-text-dark.svg";
      case "blue":
        return "/logo-text-blue.svg";
      case "green":
        return "/logo-text-green.svg";
      case "red":
        return "/logo-text-red.svg";
      default:
        return "/logo-text-default.svg";
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      setError(null);

      console.log("🚀 Starting signup process for:", data.email);

      const result = await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });

      if (result.error) {
        console.error("❌ Signup error:", result.error);
        setError(result.error.message || "Signup failed");
        return;
      }

      console.log("📝 Signup result:", {
        hasUser: !!result.data?.user,
        userId: result.data?.user?.id,
        email: result.data?.user?.email,
        emailConfirmedAt: result.data?.user?.email_confirmed_at,
        createdAt: result.data?.user?.created_at,
        lastSignInAt: result.data?.user?.last_sign_in_at,
      });

      // Check if this is a NEW user or an EXISTING user
      // If created_at and last_sign_in_at are very close, it's likely a new user
      // If last_sign_in_at exists and is different from created_at, it's an existing user
      const user = result.data?.user;
      const isNewUser =
        user &&
        (!user.last_sign_in_at ||
          (user.created_at &&
            user.last_sign_in_at &&
            new Date(user.last_sign_in_at).getTime() -
              new Date(user.created_at).getTime() <
              5000)); // Less than 5 seconds difference

      console.log("🔍 User analysis:", {
        isNewUser,
        createdAt: user?.created_at,
        lastSignInAt: user?.last_sign_in_at,
        timeDifference:
          user?.created_at && user?.last_sign_in_at
            ? new Date(user.last_sign_in_at).getTime() -
              new Date(user.created_at).getTime()
            : null,
      });

      // Check if email confirmation is required
      // For NEW users with enable_confirmations=true, email should NOT be confirmed
      // However, Supabase local may auto-confirm emails in development
      // So we need to check if this is truly a new user AND if email is confirmed
      const emailNeedsConfirmation = user && !user.email_confirmed_at;

      // IMPORTANT: Supabase local may auto-confirm emails in development
      // So we ALWAYS require confirmation flow for NEW users, regardless of what Supabase returns
      // This ensures consistent behavior and proper user flow
      const shouldRequireConfirmationFlow = isNewUser;

      console.log("🔍 Email confirmation check:", {
        emailNeedsConfirmation,
        isNewUser,
        shouldRequireConfirmationFlow,
        emailConfirmedAt: user?.email_confirmed_at,
        userCreatedAt: user?.created_at,
        userLastSignInAt: user?.last_sign_in_at,
      });

      // Store the state - ALWAYS require confirmation flow for new users
      // This ensures users see the confirmation message even if Supabase auto-confirmed
      setRequiresEmailConfirmation(shouldRequireConfirmationFlow);
      setIsSuccess(true);

      // ALWAYS require confirmation flow for new users
      // Even if Supabase auto-confirmed, we want users to see the message
      if (shouldRequireConfirmationFlow) {
        // User needs to confirm email - don't redirect, show message
        console.log("📧 Email confirmation flow required for new user.");
        console.log("📧 User email_confirmed_at:", user?.email_confirmed_at);
        console.log(
          "📧 Note: Supabase may have auto-confirmed, but we're enforcing the flow",
        );

        // Don't redirect - user must confirm email first
        // Sign out the user to prevent automatic redirects
        try {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          await supabase.auth.signOut();
          console.log("🔒 Signed out user to prevent automatic redirects");
        } catch (signOutError) {
          console.warn("⚠️ Could not sign out user:", signOutError);
        }
        return;
      }

      // Email already confirmed
      // Check if this is an existing user trying to sign up again
      if (!isNewUser && user?.email_confirmed_at) {
        console.warn(
          "⚠️ User already exists and is confirmed. This email is already registered.",
        );
        setError(
          "Este email ya está registrado. Por favor, inicia sesión en lugar de crear una nueva cuenta.",
        );
        setIsSuccess(false);
        // Sign out the user
        try {
          const { createClient } = await import("@/utils/supabase/client");
          const supabase = createClient();
          await supabase.auth.signOut();
          console.log("🔒 Signed out existing user");
        } catch (signOutError) {
          console.warn("⚠️ Could not sign out user:", signOutError);
        }
        return;
      }

      // Email already confirmed - this should only happen for truly new users
      // in development mode or if email was auto-confirmed
      if (isNewUser && user?.email_confirmed_at) {
        console.log(
          "✅ New user email already confirmed (development mode or auto-confirmed)",
        );
      }

      console.log("✅ Email already confirmed, redirecting to onboarding");
      console.log("✅ User email_confirmed_at:", user?.email_confirmed_at);
      // Only redirect if email is confirmed
      setTimeout(() => {
        router.push("/onboarding/choice");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
      console.error("Signup error:", err);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
        {/* Left Side: Branding & Visuals */}
        <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 bg-admin-bg-primary overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-110"
            style={{
              backgroundImage: `url('/luxury_optics_auth_bg_1769965128142.png')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-admin-bg-primary/95 via-admin-bg-primary/40 to-transparent" />

          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center shadow-premium-lg overflow-hidden p-2">
                <Image
                  src={getThemeLogo()}
                  alt="Opttius Logo"
                  width={40}
                  height={40}
                  className="object-contain transition-all duration-500 brightness-100"
                />
              </div>
              <Image
                src={getThemeTextLogo()}
                alt="Opttius"
                width={140}
                height={40}
                className="object-contain brightness-0 invert"
              />
            </div>

            <div className="max-w-xl">
              <h2 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
                Tu visión,{" "}
                <span className="text-admin-accent-primary">nuestra</span>,
                <br />
                tecnología.
              </h2>
              <div className="h-1 w-24 bg-admin-accent-primary rounded-full mb-8" />
              <p className="text-xl text-[var(--background)] font-medium leading-relaxed bg-[rgba(240,253,244,0.1)] rounded-[10px]">
                Únete a la red de ópticas que están transformando la salud
                visual con gestión inteligente y experiencia de usuario
                superior.
              </p>
            </div>

            <div className="flex items-center gap-6 text-white/50 text-sm font-bold uppercase tracking-widest">
              <span>Enterprise Edition</span>
              <div className="h-1 w-1 rounded-full bg-white/30" />
              <span>v2.5.0</span>
            </div>
          </div>
        </div>

        {/* Right Side: Success Message */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 lg:p-20 bg-[var(--admin-bg-primary)] relative overflow-y-auto">
          <div className="absolute top-0 right-0 p-8 flex items-center gap-3 lg:hidden">
            <Image
              src={getThemeLogo()}
              alt="Opttius Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <Image
              src={getThemeTextLogo()}
              alt="Opttius"
              width={80}
              height={25}
              className="object-contain"
            />
          </div>
          <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
            <Card className="border-none bg-[var(--admin-bg-tertiary)] shadow-premium-lg rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-admin-success/10 rounded-3xl mb-8">
                  <CheckCircle2 className="h-10 w-10 text-admin-success" />
                </div>

                <h3 className="text-3xl font-black text-admin-text-primary tracking-tight mb-3">
                  ¡Cuenta Creada!
                </h3>
                <p className="text-admin-text-tertiary font-bold uppercase text-[10px] tracking-widest mb-8">
                  Tu acceso ha sido procesado exitosamente
                </p>

                {requiresEmailConfirmation ? (
                  <div className="space-y-8">
                    <div className="p-6 bg-admin-info/5 border border-[var(--accent-foreground)] rounded-2xl text-left">
                      <p className="text-xs font-bold text-admin-text-secondary leading-relaxed">
                        Por favor, revisa tu correo electrónico y haz clic en el
                        enlace de confirmación para activar tu cuenta.
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push("/login")}
                      className="w-full h-14 border border-[var(--admin-border-secondary)] bg-admin-accent-primary hover:bg-admin-accent-primary/90 text-white rounded-2xl shadow-premium-md font-black uppercase text-[11px] tracking-widest transition-all"
                    >
                      Ir a Iniciar Sesión
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="p-6 bg-admin-success/5 border border-admin-success/20 rounded-2xl text-left">
                      <p className="text-xs font-bold text-admin-text-secondary leading-relaxed">
                        Redirigiendo al configurador de tu óptica...
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push("/onboarding/choice")}
                      className="w-full h-14 bg-admin-accent-primary hover:bg-admin-accent-primary/90 text-white rounded-2xl shadow-premium-md font-black uppercase text-[11px] tracking-widest transition-all"
                    >
                      Continuar al Onboarding
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[120px] animate-premium-float" />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-500/10 rounded-full blur-[120px] animate-premium-float"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      {/* Left Side: Branding & Value Props (Visible only on LG up) */}
      <div className="relative hidden lg:flex lg:w-5/12 xl:w-1/2 overflow-hidden z-10">
        {/* Deep Dark Gradient Background */}
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-primary/20" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          {/* Logo Section */}
          <div className="flex items-center gap-5 group cursor-pointer w-fit">
            <div className="h-16 w-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:bg-white group-hover:scale-110">
              <Image
                src={getThemeLogo()}
                alt="Opttius Logo"
                width={42}
                height={42}
                className="object-contain transition-all duration-500 group-hover:brightness-100"
              />
            </div>
            <Image
              src={getThemeTextLogo()}
              alt="Opttius"
              width={160}
              height={50}
              className="object-contain brightness-0 invert"
            />
          </div>

          {/* Main Content */}
          <div className="space-y-12 animate-in fade-in slide-in-from-left-10 duration-1000">
            <div className="space-y-6">
              <Badge
                variant="healty"
                className="bg-primary/20 text-primary border-none text-[10px] font-black tracking-[0.2em] px-5 py-2 rounded-full"
              >
                REGISTRO DE SOCIOS
              </Badge>
              <h2 className="text-7xl font-black text-white leading-[1] tracking-tighter">
                Diseña el <br />
                <span className="text-primary">futuro</span> de tu <br />
                óptica.
              </h2>
              <p className="text-2xl text-slate-300 font-medium leading-relaxed max-w-lg font-body">
                Únete a la red de ópticas inteligentes más avanzada.
                Automatización total, diseño exquisito y crecimiento
                exponencial.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                {
                  icon: Shield,
                  text: "Infraestructura de Alta Seguridad",
                  color: "text-blue-400",
                },
                {
                  icon: Sparkles,
                  text: "Inteligencia Artificial Predictiva",
                  color: "text-amber-400",
                },
                {
                  icon: CheckCircle2,
                  text: "Soporte Premium 24/7",
                  color: "text-emerald-400",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-white/10 transition-colors">
                    <item.icon className={cn("h-6 w-6", item.color)} />
                  </div>
                  <span className="text-lg text-slate-200 font-bold tracking-tight">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black text-primary border border-primary/30 px-4 py-1.5 rounded-full uppercase tracking-widest bg-primary/5">
              Lanzamiento Exclusivo 2026
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 xl:p-24 relative z-10 overflow-y-auto bg-[var(--admin-bg-primary)]">
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 flex items-center gap-3 lg:hidden">
          <Image src={getThemeLogo()} alt="Logo" width={32} height={32} />
          <Image
            src={getThemeTextLogo()}
            alt="Opttius"
            width={100}
            height={30}
            className="object-contain"
          />
        </div>

        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="text-center lg:text-left mb-12 space-y-4">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Comienza tu <br className="sm:hidden" /> Gran Obra.
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] leading-relaxed">
              Estás a un paso de revolucionar la gestión de tu negocio óptico
              con tecnología de élite.
            </p>
          </div>

          <Card
            variant="glass"
            rounded="lg"
            className="border-white/40 dark:border-slate-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)]"
          >
            <CardContent className="p-8 sm:p-12">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-red-500/10 border-red-500/20 rounded-2xl animate-in shake-in duration-500"
                  >
                    <AlertDescription className="text-red-500 font-bold text-xs">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Nombre
                    </Label>
                    <div className="relative group">
                      <Input
                        placeholder="Juan"
                        {...register("firstName")}
                        className={cn(
                          "h-14 rounded-2xl border-[var(--admin-border-secondary)] bg-[var(--admin-bg-primary)] pl-12 focus:bg-[var(--admin-bg-primary)] transition-all font-bold",
                          errors.firstName &&
                            "border-red-500 focus-visible:ring-red-500",
                        )}
                        disabled={loading}
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    {errors.firstName && (
                      <p className="text-[10px] text-red-500 font-black uppercase tracking-tight ml-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Apellido
                    </Label>
                    <div className="relative group">
                      <Input
                        placeholder="Pérez"
                        {...register("lastName")}
                        className={cn(
                          "h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-12 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold",
                          errors.lastName &&
                            "border-red-500 focus-visible:ring-red-500",
                        )}
                        disabled={loading}
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Email Corporativo
                    </Label>
                    <div className="relative group">
                      <Input
                        type="email"
                        placeholder="socio@opttius.com"
                        {...register("email")}
                        className={cn(
                          "h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-12 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold",
                          errors.email &&
                            "border-red-500 focus-visible:ring-red-500",
                        )}
                        disabled={loading}
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Teléfono Móvil
                    </Label>
                    <div className="relative group">
                      <Input
                        type="tel"
                        placeholder="+56 9"
                        {...register("phone")}
                        className="h-14 rounded-2xl border-[var(--admin-border-secondary)] bg-[var(--admin-bg-primary)] pl-12 focus:bg-[var(--admin-bg-primary)] transition-all font-bold"
                        disabled={loading}
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Llave de Seguridad
                    </Label>
                    <div className="relative group">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("password")}
                        className={cn(
                          "h-14 rounded-2xl border-[var(--admin-border-secondary)] bg-[var(--admin-bg-primary)] pl-12 pr-12 focus:bg-[var(--admin-bg-primary)] transition-all font-bold",
                          errors.password &&
                            "border-red-500 focus-visible:ring-red-500",
                        )}
                        disabled={loading}
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent text-slate-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Repetir Llave
                    </Label>
                    <div className="relative group">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("confirmPassword")}
                        className={cn(
                          "h-14 rounded-2xl border-[var(--admin-border-secondary)] bg-[var(--admin-bg-primary)] pl-12 pr-12 focus:bg-[var(--admin-bg-primary)] transition-all font-bold",
                          errors.confirmPassword &&
                            "border-red-500 focus-visible:ring-red-500",
                        )}
                        disabled={loading}
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent text-slate-400"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-16 rounded-2xl shadow-2xl shadow-primary/30 font-black uppercase text-xs tracking-[0.3em] group transition-all"
                    disabled={loading}
                    shimmer
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Finalizando Configuración...
                      </>
                    ) : (
                      <>
                        Iniciar mi Evolución
                        <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-3" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-12 text-center pt-8 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  ¿Ya tienes una identidad registrada?
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-black text-primary uppercase tracking-[0.2em] hover:brightness-110 transition-all group"
                >
                  Acceder al Panel Maestro
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-12 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80 leading-relaxed max-w-lg mx-auto">
            Al registrarte en Opttius, aceptas nuestros{" "}
            <Link href="#" className="text-slate-900 dark:text-white underline">
              Términos de Élite
            </Link>{" "}
            y la{" "}
            <Link href="#" className="text-slate-900 dark:text-white underline">
              Política de Soberanía de Datos
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
