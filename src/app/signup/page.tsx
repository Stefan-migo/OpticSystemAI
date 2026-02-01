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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] =
    useState(false);

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
                Tu visión,{" "}
                <span className="text-admin-accent-primary">nuestra</span>,
                <br />
                tecnología.
              </h2>
              <div className="h-1 w-24 bg-admin-accent-primary rounded-full mb-8" />
              <p className="text-xl text-white/80 font-medium leading-relaxed">
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
          <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
            <Card className="border-none bg-white shadow-premium-lg rounded-[2.5rem] overflow-hidden">
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
                    <div className="p-6 bg-admin-info/5 border border-admin-info/20 rounded-2xl text-left">
                      <p className="text-xs font-bold text-admin-text-secondary leading-relaxed">
                        Por favor, revisa tu correo electrónico y haz clic en el
                        enlace de confirmación para activar tu cuenta.
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push("/login")}
                      className="w-full h-14 bg-admin-accent-primary hover:bg-admin-accent-primary/90 text-white rounded-2xl shadow-premium-md font-black uppercase text-[11px] tracking-widest transition-all"
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
              Escala tu óptica al{" "}
              <span className="text-admin-accent-primary">siguiente</span>
              <br />
              nivel hoy.
            </h2>
            <div className="h-1 w-24 bg-admin-accent-primary rounded-full mb-8" />
            <p className="text-xl text-white/80 font-medium leading-relaxed">
              Únete a cientos de profesionales que ya confían en Opttius para
              gestionar sus sucursales, inventarios y ventas con una plataforma
              diseñada para el éxito.
            </p>
          </div>

          <div className="flex items-center gap-6 text-white/50 text-sm font-bold uppercase tracking-widest">
            <span>Enterprise Edition</span>
            <div className="h-1 w-1 rounded-full bg-white/30" />
            <span>v2.5.0</span>
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
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

        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-8 lg:text-left">
            <h1 className="text-4xl font-black text-admin-text-primary tracking-tight mb-2">
              Crea tu Cuenta
            </h1>
            <p className="text-admin-text-tertiary font-bold uppercase text-[10px] tracking-widest">
              Estás a pocos pasos de optimizar tu visión de negocio
            </p>
          </div>

          <Card className="border-none bg-white shadow-premium-lg rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 sm:p-12">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest ml-1"
                    >
                      Nombre
                    </Label>
                    <div className="relative group">
                      <Input
                        id="firstName"
                        placeholder="Juan"
                        {...register("firstName")}
                        className={cn(
                          "h-14 rounded-2xl border-admin-border-primary/50 bg-slate-50/50 pl-12 focus:bg-white transition-all font-bold",
                          errors.firstName ? "border-admin-error" : "",
                        )}
                        disabled={loading}
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-text-tertiary group-focus-within:text-admin-accent-primary transition-colors" />
                    </div>
                    {errors.firstName && (
                      <p className="text-[9px] text-admin-error font-black uppercase tracking-tight ml-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest ml-1"
                    >
                      Apellido
                    </Label>
                    <div className="relative group">
                      <Input
                        id="lastName"
                        placeholder="Pérez"
                        {...register("lastName")}
                        className={cn(
                          "h-14 rounded-2xl border-admin-border-primary/50 bg-slate-50/50 pl-12 focus:bg-white transition-all font-bold",
                          errors.lastName ? "border-admin-error" : "",
                        )}
                        disabled={loading}
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-text-tertiary group-focus-within:text-admin-accent-primary transition-colors" />
                    </div>
                    {errors.lastName && (
                      <p className="text-[9px] text-admin-error font-black uppercase tracking-tight ml-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest ml-1"
                    >
                      Correo Corporativo
                    </Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan@optica.com"
                        {...register("email")}
                        className={cn(
                          "h-14 rounded-2xl border-admin-border-primary/50 bg-slate-50/50 pl-12 focus:bg-white transition-all font-bold",
                          errors.email ? "border-admin-error" : "",
                        )}
                        disabled={loading}
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-text-tertiary group-focus-within:text-admin-accent-primary transition-colors" />
                    </div>
                    {errors.email && (
                      <p className="text-[9px] text-admin-error font-black uppercase tracking-tight ml-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest ml-1"
                    >
                      Teléfono (Opcional)
                    </Label>
                    <div className="relative group">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+56 9 1234 5678"
                        {...register("phone")}
                        className="h-14 rounded-2xl border-admin-border-primary/50 bg-slate-50/50 pl-12 focus:bg-white transition-all font-bold"
                        disabled={loading}
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-text-tertiary group-focus-within:text-admin-accent-primary transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest ml-1"
                    >
                      Contraseña Maestra
                    </Label>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mín. 6 carcateres"
                        {...register("password")}
                        className={cn(
                          "h-14 rounded-2xl border-admin-border-primary/50 bg-slate-50/50 pl-12 pr-12 focus:bg-white transition-all font-bold",
                          errors.password ? "border-admin-error" : "",
                        )}
                        disabled={loading}
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-text-tertiary group-focus-within:text-admin-accent-primary transition-colors" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-transparent text-admin-text-tertiary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-[9px] text-admin-error font-black uppercase tracking-tight ml-1 leading-tight">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest ml-1"
                    >
                      Confirmar Contraseña
                    </Label>
                    <div className="relative group">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repite tu contraseña"
                        {...register("confirmPassword")}
                        className={cn(
                          "h-14 rounded-2xl border-admin-border-primary/50 bg-slate-50/50 pl-12 pr-12 focus:bg-white transition-all font-bold",
                          errors.confirmPassword ? "border-admin-error" : "",
                        )}
                        disabled={loading}
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-text-tertiary group-focus-within:text-admin-accent-primary transition-colors" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-transparent text-admin-text-tertiary"
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
                    {errors.confirmPassword && (
                      <p className="text-[9px] text-admin-error font-black uppercase tracking-tight ml-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-14 bg-admin-accent-primary hover:bg-admin-accent-primary/90 text-white rounded-2xl shadow-premium-md font-black uppercase text-[11px] tracking-widest transition-all active:scale-[0.98] group"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creando Infraestructura...
                      </>
                    ) : (
                      <>
                        Comenzar Ahora
                        <Sparkles className="ml-2 h-5 w-5 transition-transform group-hover:scale-110" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-8 text-center pt-6 border-t border-admin-border-primary/10">
                <p className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest mb-4">
                  ¿Ya tienes una cuenta registrada?
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-[10px] font-black text-admin-accent-primary uppercase tracking-widest hover:underline"
                >
                  Inicia sesión aquí
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-[9px] font-bold text-admin-text-tertiary uppercase tracking-widest opacity-60">
            Al registrarte, confirmas que has leído y aceptado nuestros{" "}
            <Link href="#" className="underline">
              Términos de Servicio
            </Link>{" "}
            y{" "}
            <Link href="#" className="underline">
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
