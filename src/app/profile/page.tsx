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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
} from "lucide-react";
import { toast } from "sonner";

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
      })
    : "Recientemente";

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal, preferencias y configuración de
            cuenta
          </p>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar Section */}
              <div className="flex-shrink-0">
                <AvatarUpload
                  currentAvatarUrl={profile?.avatar_url || undefined}
                  onUploadSuccess={handleAvatarUpload}
                  isEditing={true}
                  size="lg"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-semibold mb-1">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : user.email}
                </h2>
                <p className="text-muted-foreground mb-4">{user.email}</p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  {profile?.is_member && (
                    <Badge className="gap-1 bg-primary">
                      <Sparkles className="h-3 w-3" />
                      Miembro
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <Award className="h-3 w-3" />
                    Miembro desde {memberSince}
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
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="address">Dirección</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-muted-foreground">Nombre</Label>
                    <p className="font-medium">
                      {profile?.first_name && profile?.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : "No establecido"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Correo Electrónico
                    </Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium">
                      {profile?.phone || "No establecido"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Fecha de Nacimiento
                    </Label>
                    <p className="font-medium">
                      {profile?.date_of_birth
                        ? formatDate(profile.date_of_birth)
                        : "No establecido"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => {
                      setActiveTab("personal");
                      setIsEditingPersonal(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar Información Personal
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Dirección
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-muted-foreground">Dirección</Label>
                    <p className="font-medium">
                      {profile?.address_line_1 || "No establecido"}
                    </p>
                    {profile?.address_line_2 && (
                      <p className="font-medium">{profile.address_line_2}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Ciudad</Label>
                    <p className="font-medium">
                      {profile?.city || "No establecido"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">País</Label>
                    <p className="font-medium">
                      {profile?.country || "No establecido"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => {
                      setActiveTab("address");
                      setIsEditingAddress(true);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar Dirección
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                      Actualiza tus datos personales y biografía
                    </CardDescription>
                  </div>
                  {!isEditingPersonal && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingPersonal(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={personalForm.handleSubmit(handlePersonalInfoSubmit)}
                  className="space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        Nombre <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        {...personalForm.register("firstName")}
                        disabled={!isEditingPersonal || isLoading}
                      />
                      {personalForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive">
                          {personalForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Apellido <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        {...personalForm.register("lastName")}
                        disabled={!isEditingPersonal || isLoading}
                      />
                      {personalForm.formState.errors.lastName && (
                        <p className="text-sm text-destructive">
                          {personalForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...personalForm.register("phone")}
                      disabled={!isEditingPersonal || isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...personalForm.register("dateOfBirth")}
                      disabled={!isEditingPersonal || isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografía</Label>
                    <Textarea
                      id="bio"
                      {...personalForm.register("bio")}
                      disabled={!isEditingPersonal || isLoading}
                      rows={4}
                      placeholder="Cuéntanos sobre ti..."
                    />
                    {personalForm.formState.errors.bio && (
                      <p className="text-sm text-destructive">
                        {personalForm.formState.errors.bio.message}
                      </p>
                    )}
                  </div>

                  {isEditingPersonal && (
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Guardar Cambios
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditingPersonal(false);
                          personalForm.reset();
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address Tab */}
          <TabsContent value="address">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dirección de Envío</CardTitle>
                    <CardDescription>
                      Actualiza tu información de dirección
                    </CardDescription>
                  </div>
                  {!isEditingAddress && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingAddress(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={addressForm.handleSubmit(handleAddressSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Dirección Línea 1</Label>
                    <Input
                      id="addressLine1"
                      {...addressForm.register("addressLine1")}
                      disabled={!isEditingAddress || isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">Dirección Línea 2</Label>
                    <Input
                      id="addressLine2"
                      {...addressForm.register("addressLine2")}
                      disabled={!isEditingAddress || isLoading}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        {...addressForm.register("city")}
                        disabled={!isEditingAddress || isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Región/Provincia</Label>
                      <Input
                        id="state"
                        {...addressForm.register("state")}
                        disabled={!isEditingAddress || isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Código Postal</Label>
                      <Input
                        id="postalCode"
                        {...addressForm.register("postalCode")}
                        disabled={!isEditingAddress || isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        {...addressForm.register("country")}
                        disabled={!isEditingAddress || isLoading}
                      />
                    </div>
                  </div>

                  {isEditingAddress && (
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Guardar Cambios
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditingAddress(false);
                          addressForm.reset();
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription>
                  Actualiza tu contraseña para mantener tu cuenta segura
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isChangingPassword ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    Cambiar Contraseña
                  </Button>
                ) : (
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña Actual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          {...passwordForm.register("currentPassword")}
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          {...passwordForm.register("newPassword")}
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-destructive">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirmar Nueva Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          {...passwordForm.register("confirmPassword")}
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                          {
                            passwordForm.formState.errors.confirmPassword
                              .message
                          }
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Actualizar Contraseña
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          passwordForm.reset();
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferencias
                </CardTitle>
                <CardDescription>
                  Gestiona las preferencias de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                        Ciudad de México, México (GMT-6)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handlePreferencesUpdate} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Preferencias
                </Button>
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
