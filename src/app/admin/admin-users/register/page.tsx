"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useBranch } from "@/hooks/useBranch";

interface Branch {
  id: string;
  name: string;
  code: string;
}

export default function RegisterUserPage() {
  const router = useRouter();
  const { isSuperAdmin } = useBranch();
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "admin",
    branch_id: "",
  });

  // Cargar sucursales disponibles
  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const response = await fetch("/api/admin/branches");
        if (response.ok) {
          const data = await response.json();
          setBranches(data.branches || []);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.email || !formData.password) {
      setError("Email y contraseña son requeridos");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    // Validar que si el rol requiere sucursal, se haya seleccionado una
    if (
      (formData.role === "admin" || formData.role === "employee") &&
      !formData.branch_id &&
      branches.length > 0
    ) {
      setError("Debes seleccionar una sucursal para este rol");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/admin-users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          branch_id: formData.branch_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar usuario");
      }

      toast.success("Usuario registrado exitosamente");
      router.push("/admin/admin-users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Determinar roles permitidos según el usuario actual
  const getAllowedRoles = () => {
    // En una implementación completa, verificar el rol del usuario actual
    // Por ahora, asumimos que admin puede crear admin y employee
    // Super admin puede crear admin, employee, super_admin
    // Root/dev puede crear cualquier rol (se valida en el backend)
    if (isSuperAdmin) {
      return [
        { value: "admin", label: "Administrador" },
        { value: "employee", label: "Empleado/Vendedor" },
        { value: "super_admin", label: "Super Administrador" },
      ];
    }
    return [
      { value: "admin", label: "Administrador" },
      { value: "employee", label: "Empleado/Vendedor" },
    ];
  };

  const requiresBranch =
    formData.role === "admin" || formData.role === "employee";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/admin-users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-azul-profundo">
            Registrar Nuevo Usuario
          </h1>
          <p className="text-tierra-media">
            El usuario será registrado con tu organización actual
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>
            Completa los datos para registrar un nuevo usuario en tu
            organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  setFormData({ ...formData, role: value, branch_id: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {getAllowedRoles().map((roleOption) => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-tierra-media mt-1">
                {formData.role === "employee"
                  ? "Acceso operativo sin permisos de administración"
                  : formData.role === "admin"
                    ? "Acceso completo a una sucursal"
                    : formData.role === "super_admin"
                      ? "Acceso completo a todas las sucursales de la organización"
                      : ""}
              </p>
            </div>

            {requiresBranch && (
              <div>
                <Label htmlFor="branch_id">
                  Sucursal {branches.length > 0 ? "*" : ""}
                </Label>
                {loadingBranches ? (
                  <div className="flex items-center gap-2 p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-tierra-media">
                      Cargando sucursales...
                    </span>
                  </div>
                ) : branches.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No hay sucursales disponibles. El usuario puede ser
                      asignado a una sucursal después de la creación.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select
                    value={formData.branch_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, branch_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} ({branch.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                minLength={8}
              />
              <p className="text-sm text-tierra-media mt-1">
                Mínimo 8 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                minLength={8}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Registrar Usuario
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
