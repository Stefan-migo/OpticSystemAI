"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Eye,
  Package,
  Wrench,
  Truck,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useBranch } from "@/hooks/useBranch";

// Lazy load large components to reduce initial bundle size
const AppointmentCalendar = dynamic(
  () => import("@/components/admin/AppointmentCalendar"),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-azul-profundo mx-auto"></div>
          <p className="text-tierra-media">Cargando calendario...</p>
        </div>
      </div>
    ),
    ssr: false,
  },
);

const CreateAppointmentForm = dynamic(
  () => import("@/components/admin/CreateAppointmentForm"),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-azul-profundo mx-auto"></div>
          <p className="text-tierra-media">Cargando formulario...</p>
        </div>
      </div>
    ),
    ssr: false,
  },
);
import { Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/contexts/AuthContext";
import { getBranchHeader } from "@/lib/utils/branch";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: string;
  status: string;
  customer?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  } | null;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_rut?: string;
  guest_email?: string;
  guest_phone?: string;
  assigned_staff?: {
    id: string;
    first_name?: string;
    last_name?: string;
  };
  notes?: string;
  reason?: string;
}

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAppointment, setShowCreateAppointment] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [prefilledAppointmentData, setPrefilledAppointmentData] = useState<{
    date?: string;
    time?: string;
    lockDateTime?: boolean;
  } | null>(null);
  const [scheduleSettings, setScheduleSettings] = useState<any>(null);

  const {
    currentBranch,
    branches,
    isGlobalView,
    isSuperAdmin,
    setCurrentBranch,
    currentBranchId,
  } = useBranch();
  const [selectedBranchForView, setSelectedBranchForView] = useState<
    string | null
  >(null);

  // Determine which branch to use for filtering
  const branchIdForFilter =
    isGlobalView && selectedBranchForView
      ? selectedBranchForView
      : currentBranch?.id || null;

  // Initialize selectedBranchForView when in global view
  useEffect(() => {
    if (
      isGlobalView &&
      isSuperAdmin &&
      branches.length > 0 &&
      !selectedBranchForView
    ) {
      // Default to first branch when entering global view
      setSelectedBranchForView(branches[0]?.id || null);
    } else if (!isGlobalView && selectedBranchForView) {
      // Clear selection when not in global view
      setSelectedBranchForView(null);
    }
  }, [isGlobalView, isSuperAdmin, branches.length]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAppointments();
      fetchScheduleSettings();
    }
  }, [currentDate, statusFilter, branchIdForFilter, authLoading, user]);

  const fetchAppointments = async () => {
    if (!user || authLoading) return;

    try {
      setLoading(true);
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - (view === "week" ? 7 : 30));
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + (view === "week" ? 7 : 30));

      const params = new URLSearchParams({
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(branchIdForFilter && { branch_id: branchIdForFilter }),
      });

      const headers: HeadersInit = {
        ...getBranchHeader(branchIdForFilter || currentBranchId),
      };

      const response = await fetch(`/api/admin/appointments?${params}`, {
        headers,
      });
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Error al cargar citas");
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleSettings = async () => {
    if (!user || authLoading) return;

    try {
      const headers: HeadersInit = {
        ...getBranchHeader(branchIdForFilter || currentBranchId),
      };

      const response = await fetch("/api/admin/schedule-settings", { headers });
      if (!response.ok) {
        throw new Error("Failed to fetch schedule settings");
      }
      const data = await response.json();
      setScheduleSettings(data.settings || null);
    } catch (error) {
      console.error("Error fetching schedule settings:", error);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getAppointmentTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      eye_exam: Eye,
      consultation: User,
      fitting: Package,
      delivery: Truck,
      repair: Wrench,
      follow_up: RefreshCw,
      emergency: AlertCircle,
      other: Calendar,
    };
    return icons[type] || Calendar;
  };

  const getAppointmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      eye_exam: "Examen de la Vista",
      consultation: "Consulta",
      fitting: "Ajuste",
      delivery: "Entrega",
      repair: "Reparación",
      follow_up: "Seguimiento",
      emergency: "Emergencia",
      other: "Otro",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      scheduled: { variant: "outline", label: "Programada", icon: Clock },
      confirmed: { variant: "default", label: "Confirmada", icon: CheckCircle },
      completed: {
        variant: "secondary",
        label: "Completada",
        icon: CheckCircle,
      },
      cancelled: { variant: "destructive", label: "Cancelada", icon: XCircle },
      no_show: {
        variant: "destructive",
        label: "No se presentó",
        icon: XCircle,
      },
    };

    const statusConfig = config[status] || {
      variant: "outline",
      label: status,
      icon: Clock,
    };
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const handleAppointmentCreated = () => {
    setShowCreateAppointment(false);
    setSelectedAppointment(null);
    setPrefilledAppointmentData(null); // Clear prefilled data after successful creation
    fetchAppointments();
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPrefilledAppointmentData(null); // Clear prefilled data when viewing existing appointment
    setShowCreateAppointment(false); // Close create form if open
  };

  const handleSlotClick = (date: Date, time: string) => {
    // Open create appointment form with pre-filled date and time
    setSelectedAppointment(null);
    // Format time correctly (HH:MM)
    const timeFormatted = time.length >= 5 ? time.substring(0, 5) : time;
    setPrefilledAppointmentData({
      date: date.toISOString().split("T")[0],
      time: timeFormatted,
      lockDateTime: true, // Lock date and time when opened from slot
    });
    setShowCreateAppointment(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-azul-profundo">
            Agenda y Citas
          </h1>
          <p className="text-tierra-media">
            Gestiona las citas y agenda de la óptica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/appointments/settings">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          </Link>
          <Button
            onClick={() => {
              setSelectedAppointment(null);
              setPrefilledAppointmentData(null); // Ensure no prefilled data when creating new appointment
              setShowCreateAppointment(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* View Controls */}
      <Card className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-lg font-semibold">
                {view === "week"
                  ? `Semana del ${currentDate.toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`
                  : currentDate.toLocaleDateString("es-CL", {
                      month: "long",
                      year: "numeric",
                    })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Branch selector for global view */}
              {isGlobalView && isSuperAdmin && (
                <Select
                  value={selectedBranchForView || ""}
                  onValueChange={(value) => setSelectedBranchForView(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select
                value={view}
                onValueChange={(value: "week" | "month") => setView(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="scheduled">Programadas</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card
        className="bg-admin-bg-tertiary shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        data-tour="appointments-calendar"
      >
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-azul-profundo mx-auto mb-4" />
              <p className="text-tierra-media">Cargando agenda...</p>
            </div>
          ) : (
            <AppointmentCalendar
              view={view}
              currentDate={currentDate}
              appointments={appointments}
              onAppointmentClick={handleAppointmentClick}
              onDateChange={setCurrentDate}
              onSlotClick={handleSlotClick}
              scheduleSettings={scheduleSettings}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Appointment Dialog */}
      <Dialog
        open={showCreateAppointment}
        onOpenChange={setShowCreateAppointment}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment ? "Editar Cita" : "Nueva Cita"}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment
                ? "Modifica los detalles de la cita"
                : "Crea una nueva cita en la agenda"}
            </DialogDescription>
          </DialogHeader>
          <CreateAppointmentForm
            initialData={
              selectedAppointment || prefilledAppointmentData || undefined
            }
            initialCustomerId={undefined}
            lockDateTime={prefilledAppointmentData?.lockDateTime || false}
            onSuccess={handleAppointmentCreated}
            onCancel={() => {
              setShowCreateAppointment(false);
              setSelectedAppointment(null);
              setPrefilledAppointmentData(null); // Clear prefilled data when closing
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      {selectedAppointment && !showCreateAppointment && (
        <Dialog
          open={!!selectedAppointment}
          onOpenChange={() => setSelectedAppointment(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cita Detalle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-tierra-media">Cliente</p>
                {selectedAppointment.customer ? (
                  // Registered customer
                  <>
                    <p className="font-medium">
                      {selectedAppointment.customer.first_name}{" "}
                      {selectedAppointment.customer.last_name}
                    </p>
                    {selectedAppointment.customer.phone && (
                      <p className="text-sm text-tierra-media">
                        📞 {selectedAppointment.customer.phone}
                      </p>
                    )}
                    {selectedAppointment.customer.email && (
                      <p className="text-sm text-tierra-media">
                        ✉️ {selectedAppointment.customer.email}
                      </p>
                    )}
                  </>
                ) : (
                  // Guest (non-registered) customer
                  <>
                    <p className="font-medium">
                      {selectedAppointment.guest_first_name}{" "}
                      {selectedAppointment.guest_last_name}
                    </p>
                    {selectedAppointment.guest_rut && (
                      <p className="text-sm text-tierra-media">
                        🆔 RUT: {selectedAppointment.guest_rut}
                      </p>
                    )}
                    {selectedAppointment.guest_phone && (
                      <p className="text-sm text-tierra-media">
                        📞 {selectedAppointment.guest_phone}
                      </p>
                    )}
                    {selectedAppointment.guest_email && (
                      <p className="text-sm text-tierra-media">
                        ✉️ {selectedAppointment.guest_email}
                      </p>
                    )}
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Cliente no registrado - Se registrará cuando asista a
                      la cita
                    </p>
                  </>
                )}
              </div>
              <div>
                <p className="text-sm text-tierra-media">Fecha y Hora</p>
                <p className="font-medium">
                  {new Date(
                    selectedAppointment.appointment_date,
                  ).toLocaleDateString("es-CL")}{" "}
                  a las {selectedAppointment.appointment_time}
                </p>
              </div>
              <div>
                <p className="text-sm text-tierra-media">Duración</p>
                <p className="font-medium">
                  {selectedAppointment.duration_minutes} minutos
                </p>
              </div>
              <div>
                <p className="text-sm text-tierra-media">Tipo</p>
                <div className="flex items-center gap-2 mt-1">
                  {(() => {
                    const Icon = getAppointmentTypeIcon(
                      selectedAppointment.appointment_type,
                    );
                    return <Icon className="h-4 w-4" />;
                  })()}
                  <span className="font-medium">
                    {getAppointmentTypeLabel(
                      selectedAppointment.appointment_type,
                    )}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-tierra-media mb-2">Estado Actual</p>
                <div className="mb-3">
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                <Label className="text-sm text-tierra-media mb-2 block">
                  Cambiar Estado
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedAppointment.status}
                    onValueChange={async (newStatus) => {
                      try {
                        const response = await fetch(
                          `/api/admin/appointments/${selectedAppointment.id}`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: newStatus }),
                          },
                        );

                        if (response.ok) {
                          const data = await response.json();
                          setSelectedAppointment({
                            ...selectedAppointment,
                            status: newStatus,
                          });
                          fetchAppointments();
                          toast.success("Estado actualizado exitosamente");
                        } else {
                          const errorData = await response.json();
                          throw new Error(
                            errorData.error || "Error al actualizar estado",
                          );
                        }
                      } catch (error: any) {
                        console.error("Error updating status:", error);
                        toast.error(
                          error.message || "Error al actualizar estado",
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Programada</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="no_show">No se presentó</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (
                        !confirm(
                          "¿Estás seguro de que deseas eliminar esta cita?",
                        )
                      ) {
                        return;
                      }

                      try {
                        const response = await fetch(
                          `/api/admin/appointments/${selectedAppointment.id}`,
                          {
                            method: "DELETE",
                          },
                        );

                        if (response.ok) {
                          toast.success("Cita eliminada exitosamente");
                          setSelectedAppointment(null);
                          fetchAppointments();
                        } else {
                          const errorData = await response.json();
                          throw new Error(
                            errorData.error || "Error al eliminar cita",
                          );
                        }
                      } catch (error: any) {
                        console.error("Error deleting appointment:", error);
                        toast.error(error.message || "Error al eliminar cita");
                      }
                    }}
                    className="flex-shrink-0"
                    title="Eliminar cita"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-tierra-media">Motivo de Consulta</p>
                <p className="font-medium">
                  {selectedAppointment.reason || "No especificado"}
                </p>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm text-tierra-media">Notas</p>
                  <p className="font-medium">{selectedAppointment.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateAppointment(true);
                  }}
                  className="flex-1"
                >
                  Editar
                </Button>
                {selectedAppointment.customer?.id && (
                  <Link
                    href={`/admin/customers/${selectedAppointment.customer.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      Ver Cliente
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
