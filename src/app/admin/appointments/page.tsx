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
  CalendarDays,
  Filter,
  ArrowRight,
  Activity,
  FileText,
  Building2,
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
    if (isGlobalView && isSuperAdmin && branches.length > 0) {
      if (!selectedBranchForView) {
        setSelectedBranchForView(branches[0]?.id || null);
      }
    } else if (!isGlobalView && selectedBranchForView) {
      setSelectedBranchForView(null);
    }
  }, [isGlobalView, isSuperAdmin, branches.length, selectedBranchForView]);

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
    switch (status) {
      case "scheduled":
        return (
          <Badge
            variant="outline"
            className="bg-admin-bg-tertiary/50 text-admin-info border-admin-info/30 font-bold text-[10px] uppercase tracking-wider"
          >
            <Clock className="h-3 w-3 mr-1" />
            Programada
          </Badge>
        );
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="bg-admin-bg-tertiary/50 text-admin-success border-admin-success/30 font-bold text-[10px] uppercase tracking-wider"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmada
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-admin-bg-tertiary/50 text-admin-accent-secondary border-admin-accent-secondary/30 font-bold text-[10px] uppercase tracking-wider"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completada
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-admin-error/10 text-admin-error border-admin-error/30 font-bold text-[10px] uppercase tracking-wider"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      case "no_show":
        return (
          <Badge
            variant="outline"
            className="bg-admin-bg-tertiary/50 text-admin-text-tertiary border-admin-border-secondary font-bold text-[10px] uppercase tracking-wider"
          >
            <XCircle className="h-3 w-3 mr-1" />
            No asistó
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {status}
          </Badge>
        );
    }
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-admin-text-primary font-malisha">
            Agenda Maestra
          </h1>
          <p className="text-sm font-medium text-admin-text-tertiary uppercase tracking-widest">
            Gestión de Consultas y Procedimientos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/appointments/settings">
            <Button
              variant="secondary"
              className="h-11 px-5 bg-admin-bg-tertiary hover:bg-admin-border-primary text-admin-text-primary font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </Button>
          </Link>
          <Button
            onClick={() => {
              setSelectedAppointment(null);
              setPrefilledAppointmentData(null);
              setShowCreateAppointment(true);
            }}
            className="h-11 px-6 bg-admin-accent-primary hover:bg-admin-accent-secondary text-white font-bold rounded-xl transition-all shadow-lg shadow-admin-accent-primary/10 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Cita</span>
          </Button>
        </div>
      </div>

      {/* View Controls */}
      <Card className="border-none bg-admin-bg-secondary shadow-soft overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-admin-bg-tertiary/50 p-1 rounded-xl border border-admin-border-primary/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate("prev")}
                  className="h-9 w-9 p-0 hover:bg-white hover:text-admin-accent-primary rounded-lg transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="px-4 h-9 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-admin-accent-primary rounded-lg transition-all"
                >
                  Hoy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateDate("next")}
                  className="h-9 w-9 p-0 hover:bg-white hover:text-admin-accent-primary rounded-lg transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-admin-accent-primary/5 rounded-xl border border-admin-accent-primary/10">
                <CalendarDays className="h-5 w-5 text-admin-accent-primary" />
                <span className="text-lg font-bold text-admin-text-primary">
                  {view === "week"
                    ? `Semana del ${currentDate.toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`
                    : currentDate.toLocaleDateString("es-CL", {
                        month: "long",
                        year: "numeric",
                      })}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Branch selector for global view */}
              {isGlobalView && isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedBranchForView || ""}
                    onValueChange={(value) => setSelectedBranchForView(value)}
                  >
                    <SelectTrigger className="w-[180px] h-10 bg-admin-bg-tertiary/30 border-admin-border-primary/50 font-bold text-xs rounded-xl focus:ring-admin-accent-primary/20">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-admin-text-tertiary" />
                        <SelectValue placeholder="Sucursal" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-admin-border-primary shadow-premium-lg">
                      {branches.map((branch) => (
                        <SelectItem
                          key={branch.id}
                          value={branch.id}
                          className="font-medium"
                        >
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="h-10 w-px bg-admin-border-primary/30 hidden md:block" />

              <Select
                value={view}
                onValueChange={(value: "week" | "month") => setView(value)}
              >
                <SelectTrigger className="w-[110px] h-10 bg-admin-bg-tertiary/30 border-admin-border-primary/50 font-bold text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-admin-border-primary shadow-premium-lg">
                  <SelectItem value="week" className="font-medium">
                    Semana
                  </SelectItem>
                  <SelectItem value="month" className="font-medium">
                    Mes
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-10 bg-admin-bg-tertiary/30 border-admin-border-primary/50 font-bold text-xs rounded-xl">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-admin-text-tertiary" />
                    <SelectValue placeholder="Filtrar Estado" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-admin-border-primary shadow-premium-lg">
                  <SelectItem value="all" className="font-medium">
                    Todos los Estados
                  </SelectItem>
                  <SelectItem
                    value="scheduled"
                    className="font-medium text-admin-info"
                  >
                    Programadas
                  </SelectItem>
                  <SelectItem
                    value="confirmed"
                    className="font-medium text-admin-success"
                  >
                    Confirmadas
                  </SelectItem>
                  <SelectItem
                    value="completed"
                    className="font-medium text-admin-accent-secondary"
                  >
                    Completadas
                  </SelectItem>
                  <SelectItem
                    value="cancelled"
                    className="font-medium text-admin-error"
                  >
                    Canceladas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Agenda Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar Mini-Dashboard */}
        <div className="space-y-6 xl:col-span-1">
          <Card className="border-none bg-admin-bg-secondary shadow-soft overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-admin-text-primary uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-admin-accent-primary" />
                Resumen de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-admin-info/5 p-3 rounded-xl border border-admin-info/10">
                  <p className="text-[9px] font-bold text-admin-info uppercase">
                    Total Citas
                  </p>
                  <p className="text-xl font-black text-admin-info">
                    {appointments.length}
                  </p>
                </div>
                <div className="bg-admin-success/5 p-3 rounded-xl border border-admin-success/10">
                  <p className="text-[9px] font-bold text-admin-success uppercase">
                    Confirmadas
                  </p>
                  <p className="text-xl font-black text-admin-success">
                    {
                      appointments.filter((a) => a.status === "confirmed")
                        .length
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest px-1">
                  Próximos Bloques
                </p>
                <div className="space-y-2">
                  {appointments
                    .filter(
                      (a) =>
                        new Date(a.appointment_date).toDateString() ===
                        new Date().toDateString(),
                    )
                    .sort((a, b) =>
                      a.appointment_time.localeCompare(b.appointment_time),
                    )
                    .slice(0, 3)
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-admin-bg-tertiary/20 border border-admin-border-primary/30 hover:bg-white transition-all cursor-pointer"
                        onClick={() => handleAppointmentClick(apt)}
                      >
                        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm text-admin-accent-primary">
                          {apt.appointment_time.substring(0, 5)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-admin-text-primary truncate">
                            {apt.customer
                              ? `${apt.customer.first_name} ${apt.customer.last_name}`
                              : `${apt.guest_first_name} ${apt.guest_last_name}`}
                          </p>
                          <p className="text-[9px] text-admin-text-tertiary truncate uppercase">
                            {getAppointmentTypeLabel(apt.appointment_type)}
                          </p>
                        </div>
                      </div>
                    ))}
                  {appointments.filter(
                    (a) =>
                      new Date(a.appointment_date).toDateString() ===
                      new Date().toDateString(),
                  ).length === 0 && (
                    <p className="text-[10px] text-admin-text-tertiary italic p-4 text-center">
                      No hay citas para hoy
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-admin-bg-secondary shadow-soft overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-admin-text-primary uppercase tracking-widest flex items-center gap-2">
                <Settings className="h-4 w-4 text-admin-info" />
                Herramientas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-xs font-bold text-admin-text-secondary hover:text-admin-accent-primary hover:bg-admin-accent-primary/5 rounded-lg h-9"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Sincronizar Datos
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-xs font-bold text-admin-text-secondary hover:text-admin-accent-primary hover:bg-admin-accent-primary/5 rounded-lg h-9"
              >
                <FileText className="h-3.5 w-3.5 mr-2" />
                Reporte Semanal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View - Main Area */}
        <Card
          className="xl:col-span-3 border-none bg-admin-bg-secondary shadow-soft overflow-hidden min-h-[600px]"
          data-tour="appointments-calendar"
        >
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <div className="relative h-12 w-12">
                  <RefreshCw className="h-12 w-12 animate-spin text-admin-accent-primary opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-admin-accent-primary animate-pulse" />
                  </div>
                </div>
                <p className="text-xs font-bold text-admin-text-tertiary uppercase tracking-widest">
                  Sincronizando Agenda...
                </p>
              </div>
            ) : (
              <div className="p-1">
                <AppointmentCalendar
                  view={view}
                  currentDate={currentDate}
                  appointments={appointments}
                  onAppointmentClick={handleAppointmentClick}
                  onDateChange={setCurrentDate}
                  onSlotClick={handleSlotClick}
                  scheduleSettings={scheduleSettings}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Appointment Dialog */}
      <Dialog
        open={showCreateAppointment}
        onOpenChange={setShowCreateAppointment}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-none bg-admin-bg-secondary shadow-premium-xl rounded-2xl p-0">
          <div className="p-8">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-admin-accent-primary/10 rounded-xl flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-admin-accent-primary" />
                </div>
                <DialogTitle className="text-2xl font-bold text-admin-text-primary tracking-tight">
                  {selectedAppointment ? "Editar Cita" : "Nueva Reserva"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm font-medium text-admin-text-tertiary uppercase tracking-widest pl-13">
                {selectedAppointment
                  ? "Modifique los parámetros de la sesión seleccionada"
                  : "Ingrese los detalles para agendar una nueva consulta"}
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
                setPrefilledAppointmentData(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      {selectedAppointment && !showCreateAppointment && (
        <Dialog
          open={!!selectedAppointment}
          onOpenChange={() => setSelectedAppointment(null)}
        >
          <DialogContent className="max-w-lg border-none bg-admin-bg-secondary shadow-premium-xl rounded-2xl p-0 overflow-hidden">
            <div className="bg-admin-accent-primary/5 p-8 border-b border-admin-border-primary/30">
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-admin-accent-primary/10 rounded-xl flex items-center justify-center">
                      <User className="h-5 w-5 text-admin-accent-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-admin-text-primary">
                      Detalles de la Cita
                    </DialogTitle>
                  </div>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                <DialogDescription className="text-xs font-bold text-admin-text-tertiary uppercase tracking-widest pl-13">
                  ID: {selectedAppointment.id.substring(0, 8)} • Registro de
                  Agenda
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-8">
              {/* Customer Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-4 bg-admin-accent-primary rounded-full" />
                  <p className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest">
                    Información del Cliente
                  </p>
                </div>

                <div className="pl-6 space-y-3">
                  {selectedAppointment.customer ? (
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-admin-text-primary">
                        {selectedAppointment.customer.first_name}{" "}
                        {selectedAppointment.customer.last_name}
                      </p>
                      <div className="flex flex-col gap-1">
                        {selectedAppointment.customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-admin-text-secondary">
                            <span className="opacity-50">📞</span>{" "}
                            {selectedAppointment.customer.phone}
                          </div>
                        )}
                        {selectedAppointment.customer.email && (
                          <div className="flex items-center gap-2 text-sm text-admin-text-secondary">
                            <span className="opacity-50">✉️</span>{" "}
                            {selectedAppointment.customer.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-admin-text-primary">
                        {selectedAppointment.guest_first_name}{" "}
                        {selectedAppointment.guest_last_name}
                      </p>
                      <div className="flex flex-col gap-1">
                        {selectedAppointment.guest_rut && (
                          <div className="flex items-center gap-2 text-sm text-admin-text-secondary italic">
                            <span className="opacity-50">🆔</span> RUT:{" "}
                            {selectedAppointment.guest_rut}
                          </div>
                        )}
                        {selectedAppointment.guest_phone && (
                          <div className="flex items-center gap-2 text-sm text-admin-text-secondary">
                            <span className="opacity-50">📞</span>{" "}
                            {selectedAppointment.guest_phone}
                          </div>
                        )}
                        <p className="text-[10px] font-bold text-admin-error mt-2 uppercase tracking-tight bg-admin-error/5 px-2 py-1 rounded inline-block">
                          Cliente no registrado en base de datos
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Details Grid */}
              <div className="grid grid-cols-2 gap-6 bg-admin-bg-tertiary/30 p-5 rounded-2xl border border-admin-border-primary/30">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-wider">
                    Fecha y Hora
                  </p>
                  <p className="text-sm font-bold text-admin-text-primary flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-admin-accent-primary" />
                    {new Date(
                      selectedAppointment.appointment_date,
                    ).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    • {selectedAppointment.appointment_time}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-wider">
                    Servicio / Tipo
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-admin-text-primary">
                    {(() => {
                      const Icon = getAppointmentTypeIcon(
                        selectedAppointment.appointment_type,
                      );
                      return <Icon className="h-3.5 w-3.5 text-admin-info" />;
                    })()}
                    <span>
                      {getAppointmentTypeLabel(
                        selectedAppointment.appointment_type,
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-wider">
                    Duración
                  </p>
                  <p className="text-sm font-bold text-admin-text-primary flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-admin-text-tertiary" />
                    {selectedAppointment.duration_minutes} min
                  </p>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-4 bg-admin-info rounded-full" />
                  <p className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-widest">
                    Gestión de Estado
                  </p>
                </div>
                <div className="flex items-center gap-3 pl-6">
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
                          setSelectedAppointment({
                            ...selectedAppointment,
                            status: newStatus,
                          });
                          fetchAppointments();
                          toast.success("Estado actualizado");
                        }
                      } catch (error) {
                        toast.error("Error al actualizar");
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1 h-11 rounded-xl border-admin-border-primary/50 font-bold text-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-admin-border-primary">
                      <SelectItem value="scheduled" className="text-admin-info">
                        Programada
                      </SelectItem>
                      <SelectItem
                        value="confirmed"
                        className="text-admin-success"
                      >
                        Confirmada
                      </SelectItem>
                      <SelectItem
                        value="completed"
                        className="text-admin-accent-secondary"
                      >
                        Completada
                      </SelectItem>
                      <SelectItem
                        value="cancelled"
                        className="text-admin-error"
                      >
                        Cancelada
                      </SelectItem>
                      <SelectItem
                        value="no_show"
                        className="text-admin-text-tertiary"
                      >
                        No se presentó
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm("¿Eliminar cita permanentemente?")) return;
                      try {
                        const response = await fetch(
                          `/api/admin/appointments/${selectedAppointment.id}`,
                          { method: "DELETE" },
                        );
                        if (response.ok) {
                          toast.success("Cita eliminada");
                          setSelectedAppointment(null);
                          fetchAppointments();
                        }
                      } catch (error) {
                        toast.error("Error al eliminar");
                      }
                    }}
                    className="h-11 w-11 rounded-xl text-admin-error hover:bg-admin-error hover:text-white transition-all border border-admin-error/20"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Notes & Reason */}
              {(selectedAppointment.reason || selectedAppointment.notes) && (
                <div className="bg-admin-bg-tertiary/10 p-5 rounded-2xl space-y-4">
                  {selectedAppointment.reason && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-wider text-admin-info">
                        Motivo
                      </p>
                      <p className="text-sm font-medium text-admin-text-primary leading-relaxed">
                        {selectedAppointment.reason}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-admin-text-tertiary uppercase tracking-wider text-admin-accent-primary">
                        Observaciones
                      </p>
                      <p className="text-sm font-medium text-admin-text-primary leading-relaxed italic">
                        {selectedAppointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-admin-border-primary/30">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateAppointment(true)}
                  className="flex-1 h-12 rounded-xl border-admin-border-primary hover:bg-admin-bg-tertiary font-bold transition-all text-sm uppercase tracking-wide"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Editar Datos
                </Button>
                {selectedAppointment.customer?.id && (
                  <Link
                    href={`/admin/customers/${selectedAppointment.customer.id}`}
                    className="flex-1"
                  >
                    <Button className="w-full h-12 rounded-xl bg-admin-accent-primary hover:bg-admin-accent-secondary font-bold transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2">
                      Ficha Cliente
                      <ArrowRight className="h-4 w-4" />
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
