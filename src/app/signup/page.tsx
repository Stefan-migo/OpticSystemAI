"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              ¡Cuenta Creada!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Tu cuenta ha sido creada exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {requiresEmailConfirmation ? (
              <>
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-800">
                    <strong>¡Cuenta creada exitosamente!</strong>
                    <br />
                    <br />
                    Por favor, revisa tu correo electrónico y haz clic en el
                    enlace de confirmación para activar tu cuenta.
                    <br />
                    <br />
                    Una vez que confirmes tu email, podrás iniciar sesión y
                    configurar tu óptica.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Ir a Iniciar Sesión
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-center text-gray-500 mt-4">
                  Después de confirmar tu email, podrás iniciar sesión y
                  configurar tu óptica
                </p>
              </>
            ) : (
              <>
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">
                    <strong>¡Cuenta creada exitosamente!</strong>
                    <br />
                    <br />
                    Serás redirigido al onboarding en breve...
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => router.push("/onboarding/choice")}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Continuar al Onboarding
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crear Cuenta
          </h1>
          <p className="text-gray-600">Únete para comenzar</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Comienza Ahora
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Completa tu información para crear una cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Nombre
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Juan"
                    {...register("firstName")}
                    className={`h-11 ${errors.firstName ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
                    disabled={loading}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    {...register("lastName")}
                    className={`h-11 ${errors.lastName ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
                    disabled={loading}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register("email")}
                    className={`h-11 pl-10 ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
                    disabled={loading}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Teléfono (Opcional)
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    {...register("phone")}
                    className={`h-11 pl-10 ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
                    disabled={loading}
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    {...register("password")}
                    className={`h-11 pl-10 pr-10 ${errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirma tu contraseña"
                    {...register("confirmPassword")}
                    className={`h-11 pl-10 pr-10 ${errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    Crear Cuenta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in instead
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          Al crear una cuenta, aceptas nuestros términos de servicio
        </p>
      </div>
    </div>
  );
}
