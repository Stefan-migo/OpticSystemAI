"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthContext } from "@/contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AvatarUpload from "@/components/ui/AvatarUpload";
import {
  User,
  MapPin,
  Edit3,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Award,
  Loader2,
  Sparkles,
  Settings,
  CreditCard,
  XCircle,
} from "lucide-react";
import { SubscriptionManagementSection } from "@/components/admin/SubscriptionManagementSection";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

// Form schemas
const personalInfoSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bio: z
    .string()
    .max(500, "La biografía no puede exceder 500 caracteres")
    .optional(),
});

const addressSchema = z
  .object({
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default("Chile"),
  })
  .refine((data) => data.country !== undefined && data.country !== "", {
    message: "El país es requerido",
    path: ["country"],
  });

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z
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
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
type AddressForm = z.infer<typeof addressSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    profile,
    loading: authLoading,
    updateProfile,
    refetchProfile,
  } = useAuthContext();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview",
  );
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    timezone: profile?.timezone || "America/Santiago",
  });

  // Form hooks
  const personalForm = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      phone: profile?.phone || "",
      dateOfBirth: profile?.date_of_birth || "",
      bio: profile?.bio || "",
    },
  });

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressLine1: profile?.address_line_1 || "",
      addressLine2: profile?.address_line_2 || "",
      city: profile?.city || "",
      state: profile?.state || "",
      postalCode: profile?.postal_code || "",
      country: profile?.country || "Chile",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  // Update form defaults when profile changes
  useEffect(() => {
    if (profile) {
      personalForm.reset({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        phone: profile.phone || "",
        dateOfBirth: profile.date_of_birth || "",
        bio: profile.bio || "",
      });
      addressForm.reset({
        addressLine1: profile.address_line_1 || "",
        addressLine2: profile.address_line_2 || "",
        city: profile.city || "",
        state: profile.state || "",
        postalCode: profile.postal_code || "",
        country: profile.country || "Chile",
      });
      setPreferences({
        timezone: profile.timezone || "America/Santiago",
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (avatarUrl: string) => {
    try {
      await updateProfile({ avatar_url: avatarUrl });
      toast.success("Foto de perfil actualizada exitosamente");
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Error al actualizar la foto de perfil");
      throw error;
    }
  };

  const handlePersonalInfoSubmit = async (data: PersonalInfoForm) => {
    try {
      setIsLoading(true);
      await updateProfile({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null,
        date_of_birth: data.dateOfBirth || null,
        bio: data.bio || null,
      });
      setIsEditingPersonal(false);
      toast.success("Información personal actualizada exitosamente");
    } catch (error) {
      console.error("Error updating personal info:", error);
      toast.error("Error al actualizar la información personal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSubmit = async (data: AddressForm) => {
    try {
      setIsLoading(true);
      await updateProfile({
        address_line_1: data.addressLine1 || null,
        address_line_2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        postal_code: data.postalCode || null,
        country: data.country || null,
      });
      setIsEditingAddress(false);
      toast.success("Dirección actualizada exitosamente");
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Error al actualizar la dirección");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordForm) => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      passwordForm.reset();
      setIsChangingPassword(false);
      toast.success("Contraseña cambiada exitosamente");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Error al cambiar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setIsLoading(true);
      await updateProfile({
        timezone: preferences.timezone,
      });
      toast.success("Preferencias actualizadas exitosamente");
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Error al actualizar las preferencias");
    } finally {
      setIsLoading(false);
    }
  };

  const memberSince = profile?.created_at
    ? formatDate(profile.created_at, {
        format: "long",
        locale: "es-CL",
        includeYear: false,
      })
    : "Recientemente";

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] animate-premium-float" />
        <div
          className="absolute middle-[-10%] right-[-5%] w-[25%] h-[25%] bg-indigo-500/5 rounded-full blur-[100px] animate-premium-float"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Page Header */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
            Mi Perfil Administrativo
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium font-body">
            Gestiona tu información personal, preferencias y seguridad de
            acceso.
          </p>
        </div>

        {/* Profile Hero Card */}
        <Card
          variant="glass"
          rounded="lg"
          className="mb-10 overflow-hidden border-white/40 dark:border-slate-800/50 shadow-2xl animate-in zoom-in-95 duration-500"
        >
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500 scale-75" />
                <div className="relative z-10 p-1 bg-white dark:bg-slate-800 rounded-full shadow-xl">
                  <AvatarUpload
                    currentAvatarUrl={profile?.avatar_url || undefined}
                    onUploadSuccess={handleAvatarUpload}
                    isEditing={true}
                    size="lg"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {profile?.first_name && profile?.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : user.email?.split("@")[0]}
                    </h2>
                    <Badge
                      variant="healty"
                      className="w-fit mx-auto md:mx-0 bg-green-500/10 text-green-600 border-none px-3 py-1 font-bold text-[10px]"
                    >
                      ADMINISTRADOR
                    </Badge>
                  </div>
                  <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                    {user.email}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {profile?.is_member && (
                    <Badge className="gap-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-1.5 rounded-full transition-all">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-bold tracking-wide text-[10px] uppercase">
                        MIEMBRO GOLD
                      </span>
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="gap-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-4 py-1.5 rounded-full transition-all"
                  >
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase">
                      Desde {memberSince}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <TabsList className="p-1.5 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl grid w-full grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { id: "overview", label: "Resumen", icon: User },
              { id: "personal", label: "Personal", icon: Edit3 },
              { id: "address", label: "Dirección", icon: MapPin },
              { id: "subscription", label: "Suscripción", icon: CreditCard },
              { id: "settings", label: "Ajustes", icon: Settings },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-xl py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all duration-300"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                <span className="font-bold tracking-tight">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent
            value="overview"
            className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500"
          >
            <div className="grid gap-8 md:grid-cols-2">
              <Card variant="interactive" className="group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/10 transition-colors">
                      <User className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-primary" />
                    </div>
                    Información Base
                  </CardTitle>
                </CardHeader>
                <CardContent spacing="relaxed" className="p-6 pt-0">
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Nombre Completo
                      </Label>
                      <p className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-200">
                        {profile?.first_name && profile?.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : "Pendiente de completar"}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Canal de Acceso
                      </Label>
                      <p className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-200">
                        {user.email}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Teléfono
                        </Label>
                        <p className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-200">
                          {profile?.phone || "Sin registro"}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Cumpleaños
                        </Label>
                        <p className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-200">
                          {profile?.date_of_birth
                            ? formatDate(profile.date_of_birth)
                            : "Sin registro"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-6 border-slate-200 dark:border-slate-800 rounded-2xl font-bold h-12"
                    onClick={() => {
                      setActiveTab("personal");
                      setIsEditingPersonal(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Actualizar Información
                  </Button>
                </CardContent>
              </Card>

              <Card variant="interactive" className="group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-800 dark:text-white group-hover:text-amber-500 transition-colors">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-amber-500/10 transition-colors">
                      <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-amber-500" />
                    </div>
                    Ubicación Principal
                  </CardTitle>
                </CardHeader>
                <CardContent spacing="relaxed" className="p-6 pt-0">
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 min-h-[84px]">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Dirección Lineal
                      </Label>
                      <div className="mt-1">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {profile?.address_line_1 || "Pendiente de completar"}
                        </p>
                        {profile?.address_line_2 && (
                          <p className="text-sm font-medium text-slate-500">
                            {profile.address_line_2}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Ciudad
                        </Label>
                        <p className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-200">
                          {profile?.city || "—"}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          País
                        </Label>
                        <p className="text-sm font-bold mt-1 text-slate-700 dark:text-slate-200">
                          {profile?.country || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-6 border-slate-200 dark:border-slate-800 rounded-2xl font-bold h-12"
                    onClick={() => {
                      setActiveTab("address");
                      setIsEditingAddress(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Gestionar Dirección
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Personal Information Tab Content */}
          <TabsContent
            value="personal"
            className="animate-in fade-in slide-in-from-top-2 duration-500"
          >
            <Card variant="elevated" className="border-0 shadow-2xl">
              <CardHeader
                padding="lg"
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <CardTitle size="lg" theme="modern">
                    Datos Personales
                  </CardTitle>
                  {!isEditingPersonal && (
                    <Button
                      onClick={() => setIsEditingPersonal(true)}
                      variant="outline"
                      className="border-2 font-bold px-6"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar Información
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent padding="lg">
                <form
                  onSubmit={personalForm.handleSubmit(handlePersonalInfoSubmit)}
                  className="space-y-8"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-bold text-slate-700 dark:text-slate-300"
                      >
                        Nombre <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        {...personalForm.register("firstName")}
                        disabled={!isEditingPersonal || isLoading}
                        className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                      />
                      {personalForm.formState.errors.firstName && (
                        <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />{" "}
                          {personalForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="lastName"
                        className="text-sm font-bold text-slate-700 dark:text-slate-300"
                      >
                        Apellido <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        {...personalForm.register("lastName")}
                        disabled={!isEditingPersonal || isLoading}
                        className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                      />
                      {personalForm.formState.errors.lastName && (
                        <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />{" "}
                          {personalForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label
                        htmlFor="phone"
                        className="text-sm font-bold text-slate-700 dark:text-slate-300"
                      >
                        Teléfono
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...personalForm.register("phone")}
                        disabled={!isEditingPersonal || isLoading}
                        className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label
                        htmlFor="dateOfBirth"
                        className="text-sm font-bold text-slate-700 dark:text-slate-300"
                      >
                        Fecha de Nacimiento
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...personalForm.register("dateOfBirth")}
                        disabled={!isEditingPersonal || isLoading}
                        className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="bio"
                      className="text-sm font-bold text-slate-700 dark:text-slate-300"
                    >
                      Biografía
                    </Label>
                    <Textarea
                      id="bio"
                      {...personalForm.register("bio")}
                      disabled={!isEditingPersonal || isLoading}
                      rows={5}
                      placeholder="Cuéntanos un poco sobre ti, tu rol en la óptica, etc."
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10 rounded-2xl p-4"
                    />
                    {personalForm.formState.errors.bio && (
                      <p className="text-xs font-medium text-red-500">
                        {personalForm.formState.errors.bio.message}
                      </p>
                    )}
                  </div>

                  {isEditingPersonal && (
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 h-12 shadow-xl shadow-primary/20"
                        shimmer
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-5 w-5 mr-2" />
                        )}
                        Guardar Cambios
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12 border-2"
                        onClick={() => {
                          setIsEditingPersonal(false);
                          personalForm.reset();
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address Tab Content */}
          <TabsContent
            value="address"
            className="animate-in fade-in slide-in-from-top-2 duration-500"
          >
            <Card variant="elevated" className="border-0 shadow-2xl">
              <CardHeader
                padding="lg"
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <CardTitle size="lg" theme="modern">
                    Dirección de Envío / Oficina
                  </CardTitle>
                  {!isEditingAddress && (
                    <Button
                      onClick={() => setIsEditingAddress(true)}
                      variant="outline"
                      className="border-2 font-bold px-6"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar Dirección
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent padding="lg">
                <form
                  onSubmit={addressForm.handleSubmit(handleAddressSubmit)}
                  className="space-y-8"
                >
                  <div className="grid gap-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label
                          htmlFor="addressLine1"
                          className="text-sm font-bold text-slate-700 dark:text-slate-300"
                        >
                          Dirección Línea 1
                        </Label>
                        <Input
                          id="addressLine1"
                          {...addressForm.register("addressLine1")}
                          disabled={!isEditingAddress || isLoading}
                          className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="addressLine2"
                          className="text-sm font-bold text-slate-700 dark:text-slate-300"
                        >
                          Dirección Línea 2
                        </Label>
                        <Input
                          id="addressLine2"
                          {...addressForm.register("addressLine2")}
                          disabled={!isEditingAddress || isLoading}
                          className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label
                          htmlFor="city"
                          className="text-sm font-bold text-slate-700 dark:text-slate-300"
                        >
                          Ciudad
                        </Label>
                        <Input
                          id="city"
                          {...addressForm.register("city")}
                          disabled={!isEditingAddress || isLoading}
                          className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="state"
                          className="text-sm font-bold text-slate-700 dark:text-slate-300"
                        >
                          Región / Provincia
                        </Label>
                        <Input
                          id="state"
                          {...addressForm.register("state")}
                          disabled={!isEditingAddress || isLoading}
                          className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label
                          htmlFor="postalCode"
                          className="text-sm font-bold text-slate-700 dark:text-slate-300"
                        >
                          Código Postal
                        </Label>
                        <Input
                          id="postalCode"
                          {...addressForm.register("postalCode")}
                          disabled={!isEditingAddress || isLoading}
                          className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="country"
                          className="text-sm font-bold text-slate-700 dark:text-slate-300"
                        >
                          País
                        </Label>
                        <Input
                          id="country"
                          {...addressForm.register("country")}
                          disabled={!isEditingAddress || isLoading}
                          className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                    </div>
                  </div>

                  {isEditingAddress && (
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 h-12 shadow-xl shadow-primary/20"
                        shimmer
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-5 w-5 mr-2" />
                        )}
                        Guardar Dirección
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12 border-2"
                        onClick={() => {
                          setIsEditingAddress(false);
                          addressForm.reset();
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab Content */}
          <TabsContent
            value="subscription"
            className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500"
          >
            <SubscriptionManagementSection />
          </TabsContent>

          {/* Settings Tab Content */}
          <TabsContent
            value="settings"
            className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500"
          >
            {/* Password Change Card */}
            <Card
              variant="elevated"
              className="border-0 shadow-2xl overflow-hidden"
            >
              <CardHeader
                padding="lg"
                className="bg-slate-50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800"
              >
                <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  Seguridad de la Cuenta
                </CardTitle>
                <CardDescription>
                  Administra tu contraseña y métodos de acceso.
                </CardDescription>
              </CardHeader>
              <CardContent padding="lg">
                {!isChangingPassword ? (
                  <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        Contraseña
                      </h4>
                      <p className="text-sm text-slate-500 tracking-widest mt-1">
                        ••••••••••••••••
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsChangingPassword(true)}
                      className="border-2 font-bold"
                    >
                      Cambiar Contraseña
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                    className="space-y-6 max-w-xl"
                  >
                    <div className="space-y-3">
                      <Label
                        htmlFor="currentPassword"
                        className="text-sm font-bold"
                      >
                        Contraseña Actual
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          {...passwordForm.register("currentPassword")}
                          disabled={isLoading}
                          className="h-12 pr-12 rounded-2xl border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-slate-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label
                          htmlFor="newPassword"
                          className="text-sm font-bold"
                        >
                          Nueva Contraseña
                        </Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            {...passwordForm.register("newPassword")}
                            disabled={isLoading}
                            className="h-12 pr-12 rounded-2xl border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-xs font-medium text-red-500">
                            {passwordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-sm font-bold"
                        >
                          Confirmar Nueva
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            {...passwordForm.register("confirmPassword")}
                            disabled={isLoading}
                            className="h-12 pr-12 rounded-2xl border-slate-200 dark:border-slate-800 transition-all focus:ring-4 focus:ring-primary/10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 h-12 shadow-xl shadow-primary/20"
                        shimmer
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Save className="h-5 w-5 mr-2" />
                        )}
                        Actualizar Ahora
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12 border-2"
                        onClick={() => {
                          setIsChangingPassword(false);
                          passwordForm.reset();
                        }}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Preferences Card */}
            <Card
              variant="elevated"
              className="border-0 shadow-2xl overflow-hidden"
            >
              <CardHeader
                padding="lg"
                className="bg-slate-50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800"
              >
                <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Bell className="h-5 w-5 text-amber-500" />
                  </div>
                  Personalización
                </CardTitle>
                <CardDescription>
                  Ajusta el sistema a tus necesidades regionales.
                </CardDescription>
              </CardHeader>
              <CardContent padding="lg" spacing="relaxed">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-3">
                    <Label htmlFor="timezone" className="text-sm font-bold">
                      Zona Horaria Regional
                    </Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) =>
                        setPreferences((prev) => ({ ...prev, timezone: value }))
                      }
                    >
                      <SelectTrigger
                        id="timezone"
                        className="h-12 rounded-2xl border-slate-200 dark:border-slate-800"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl border-slate-200 dark:border-slate-800">
                        <SelectItem value="America/Santiago">
                          Santiago, Chile (GMT-3)
                        </SelectItem>
                        <SelectItem value="America/Argentina/Buenos_Aires">
                          Buenos Aires, Argentina (GMT-3)
                        </SelectItem>
                        <SelectItem value="America/Lima">
                          Lima, Perú (GMT-5)
                        </SelectItem>
                        <SelectItem value="America/Bogota">
                          Bogotá, Colombia (GMT-5)
                        </SelectItem>
                        <SelectItem value="America/Mexico_City">
                          CDMX, México (GMT-6)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handlePreferencesUpdate}
                    className="w-full h-12 shadow-xl shadow-amber-500/20"
                    shimmer
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5 mr-2" />
                    )}
                    Guardar Preferencias
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando perfil...</p>
          </div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
