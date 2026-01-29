"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  User,
  Calendar,
  Clock,
  Loader2,
  Plus,
  Eye,
  Package,
  Truck,
  Wrench,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRUT } from "@/lib/utils/rut";
import { useBranch } from "@/hooks/useBranch";
import { getBranchHeader } from "@/lib/utils/branch";
import { useAuthContext } from "@/contexts/AuthContext";

interface CreateAppointmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
  initialCustomerId?: string;
  lockDateTime?: boolean; // Lock date and time when opened from calendar slot
}

export default function CreateAppointmentForm({
  onSuccess,
  onCancel,
  initialData,
  initialCustomerId,
  lockDateTime = false,
}: CreateAppointmentFormProps) {
  const { user, loading: authLoading } = useAuthContext();
  const { currentBranchId } = useBranch();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(
    initialData?.customer || null,
  );
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Guest customer (non-registered) mode
  // If initialData has a customer, start in registered mode, otherwise allow guest mode
  const [isGuestCustomer, setIsGuestCustomer] = useState(
    !initialData?.customer && !initialCustomerId,
  );
  const [guestCustomerData, setGuestCustomerData] = useState({
    first_name: "",
    last_name: "",
    rut: "",
    email: "",
    phone: "",
  });

  // Schedule settings
  const [scheduleSettings, setScheduleSettings] = useState<any>(null);

  // Available time slots
  const [availableSlots, setAvailableSlots] = useState<
    Array<{ time_slot: string; available: boolean }>
  >([]);

  // Form data
  const [formData, setFormData] = useState({
    appointment_date:
      initialData?.appointment_date ||
      initialData?.date ||
      new Date().toISOString().split("T")[0],
    appointment_time: initialData?.appointment_time || initialData?.time || "",
    duration_minutes:
      initialData?.duration_minutes ||
      scheduleSettings?.default_appointment_duration ||
      30, // Will be updated when scheduleSettings loads
    appointment_type: initialData?.appointment_type || "consultation",
    status: initialData?.status || "scheduled",
    assigned_to: initialData?.assigned_to || null,
    notes: initialData?.notes || "",
    reason: initialData?.reason || "",
    follow_up_required: initialData?.follow_up_required || false,
    follow_up_date: initialData?.follow_up_date || "",
    prescription_id: initialData?.prescription_id || null,
    order_id: initialData?.order_id || null,
  });

  const appointmentTypes = [
    { value: "eye_exam", label: "Examen de la Vista", icon: Eye },
    { value: "consultation", label: "Consulta", icon: User },
    { value: "fitting", label: "Ajuste de Lentes", icon: Package },
    { value: "delivery", label: "Entrega de Lentes", icon: Truck },
    { value: "repair", label: "Reparación", icon: Wrench },
    { value: "follow_up", label: "Seguimiento", icon: RefreshCw },
    { value: "emergency", label: "Emergencia", icon: AlertCircle },
    { value: "other", label: "Otro", icon: CheckCircle },
  ];

  // Load schedule settings
  useEffect(() => {
    if (!authLoading && user) {
      fetchScheduleSettings();
    }
  }, [currentBranchId, authLoading, user]);

  // Load customer if initialCustomerId provided
  useEffect(() => {
    if (initialCustomerId && !selectedCustomer) {
      fetchCustomer(initialCustomerId);
    }
  }, [initialCustomerId]);

  // Load availability when date or duration changes
  useEffect(() => {
    console.log("🔄 Availability useEffect triggered:", {
      hasDate: !!formData.appointment_date,
      date: formData.appointment_date,
      duration: formData.duration_minutes,
      hasSettings: !!scheduleSettings,
    });

    if (formData.appointment_date && scheduleSettings) {
      // Add a small delay to ensure state is ready
      const timer = setTimeout(() => {
        console.log("⏰ Calling fetchAvailability after delay");
        fetchAvailability();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      console.log("⏸️ Skipping fetchAvailability - missing date or settings");
      if (!formData.appointment_date)
        console.log("  - Missing appointment_date");
      if (!scheduleSettings) console.log("  - Missing scheduleSettings");
    }
  }, [formData.appointment_date, formData.duration_minutes, scheduleSettings]);

  // Update form data when initialData changes (for prefilled slots)
  useEffect(() => {
    if (initialData?.date || initialData?.appointment_date) {
      const newDate = initialData.appointment_date || initialData.date;
      const newTime = initialData.appointment_time || initialData.time;

      setFormData((prev) => ({
        ...prev,
        appointment_date: newDate || prev.appointment_date,
        appointment_time: newTime || prev.appointment_time,
      }));

      // Trigger availability fetch if date is set and scheduleSettings is loaded
      if (newDate && scheduleSettings) {
        // Small delay to ensure state is updated
        const timer = setTimeout(() => {
          fetchAvailability();
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [initialData, scheduleSettings]);

  const fetchScheduleSettings = async () => {
    if (!user || authLoading) return;

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...getBranchHeader(currentBranchId),
      };

      const response = await fetch("/api/admin/schedule-settings", { headers });
      if (response.ok) {
        const data = await response.json();
        setScheduleSettings(data.settings);
        // Update default duration from settings if not set from initialData
        if (data.settings && !initialData?.duration_minutes) {
          const defaultDuration =
            data.settings.default_appointment_duration || 30;
          setFormData((prev) => {
            // Always update to use the configured default duration
            // This ensures the form uses the setting from schedule configuration
            return {
              ...prev,
              duration_minutes: defaultDuration,
            };
          });
        }
      }
    } catch (error) {
      console.error("Error fetching schedule settings:", error);
    }
  };

  const fetchCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data.customer);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const fetchAvailability = async () => {
    if (!formData.appointment_date) {
      console.log("No date selected, skipping availability fetch");
      setAvailableSlots([]);
      return;
    }

    if (!scheduleSettings) {
      console.log(
        "Schedule settings not loaded yet, skipping availability fetch",
      );
      return;
    }

    const selectedDate = new Date(formData.appointment_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();

    console.log("🔍 Fetching availability for:", {
      date: formData.appointment_date,
      duration: formData.duration_minutes,
      isToday,
      scheduleSettings: scheduleSettings ? "loaded" : "not loaded",
      minAdvanceHours: scheduleSettings?.min_advance_booking_hours || 0,
    });

    setLoadingAvailability(true);
    try {
      const params = new URLSearchParams({
        date: formData.appointment_date,
        duration: formData.duration_minutes.toString(),
      });

      const headers = {
        "Content-Type": "application/json",
        ...getBranchHeader(currentBranchId),
      };

      const response = await fetch(
        `/api/admin/appointments/availability?${params}`,
        { headers },
      );
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Available slots response:", data);
        console.log("📊 Total slots:", data.slots?.length || 0);
        const availableCount =
          data.slots?.filter((s: any) => s.available === true).length || 0;
        console.log("📊 Available slots:", availableCount);
        console.log("📋 First few slots:", data.slots?.slice(0, 5));

        if (data.slots && data.slots.length > 0) {
          console.log(
            "✅ Setting available slots:",
            data.slots.length,
            "total,",
            availableCount,
            "available",
          );
          setAvailableSlots(data.slots);
        } else {
          console.warn("⚠️ No slots returned from API - empty array");
          setAvailableSlots([]);
        }
      } else {
        const errorData = await response.json();
        console.error("Error fetching availability:", errorData);
        toast.error(errorData.error || "Error al cargar disponibilidad");
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast.error("Error al cargar disponibilidad");
      setAvailableSlots([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Search customers
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length < 1) {
        setCustomerResults([]);
        return;
      }

      setSearchingCustomers(true);
      try {
        const response = await fetch(
          `/api/admin/customers/search?q=${encodeURIComponent(customerSearch)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setCustomerResults(data.customers || []);
        }
      } catch (error) {
        console.error("Error searching customers:", error);
      } finally {
        setSearchingCustomers(false);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [customerSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate customer selection or guest customer data
    if (isGuestCustomer) {
      // Validate guest customer data
      if (
        !guestCustomerData.first_name ||
        !guestCustomerData.first_name.trim()
      ) {
        toast.error("El nombre es obligatorio");
        return;
      }
      if (!guestCustomerData.last_name || !guestCustomerData.last_name.trim()) {
        toast.error("El apellido es obligatorio");
        return;
      }
      if (!guestCustomerData.rut || !guestCustomerData.rut.trim()) {
        toast.error("El RUT es obligatorio");
        return;
      }
    } else {
      // Validate registered customer
      if (!selectedCustomer) {
        toast.error("Selecciona un cliente registrado");
        return;
      }
    }

    if (!formData.appointment_date) {
      toast.error("Selecciona una fecha");
      return;
    }

    if (!formData.appointment_time) {
      toast.error("Selecciona una hora");
      return;
    }

    setSaving(true);
    try {
      const url = initialData?.id
        ? `/api/admin/appointments/${initialData.id}`
        : "/api/admin/appointments";

      const method = initialData?.id ? "PUT" : "POST";

      // Ensure time format is correct (HH:MM:SS)
      let appointmentTime = formData.appointment_time;
      if (appointmentTime && appointmentTime.includes(":")) {
        const parts = appointmentTime.split(":");
        if (parts.length === 2) {
          // If format is HH:MM, add :00 seconds
          appointmentTime = appointmentTime + ":00";
        } else if (parts.length === 3 && parts[2] === "") {
          // If format is HH:MM:, add 00
          appointmentTime = appointmentTime + "00";
        }
      }

      console.log("📤 Submitting appointment:", {
        date: formData.appointment_date,
        time: appointmentTime,
        originalTime: formData.appointment_time,
        duration: formData.duration_minutes,
        customerId: selectedCustomer?.id,
        isGuestCustomer,
        guestCustomerData,
      });

      const requestBody: any = {
        appointment_date: formData.appointment_date,
        appointment_time: appointmentTime,
        duration_minutes: formData.duration_minutes,
        appointment_type: formData.appointment_type,
        status: formData.status,
        assigned_to: formData.assigned_to || null,
        notes: formData.notes || null,
        reason: formData.reason || null,
        follow_up_required: formData.follow_up_required,
        follow_up_date: formData.follow_up_date || null,
        prescription_id: formData.prescription_id || null,
        order_id: formData.order_id || null,
        cancellation_reason: null,
      };

      // If guest customer, send guest data to store in appointment (not create customer)
      if (isGuestCustomer) {
        // Ensure RUT is properly formatted before sending
        const formattedRUT = formatRUT(guestCustomerData.rut.trim());
        requestBody.guest_customer = {
          first_name: guestCustomerData.first_name.trim(),
          last_name: guestCustomerData.last_name.trim(),
          rut: formattedRUT,
          email: guestCustomerData.email.trim() || null,
          phone: guestCustomerData.phone.trim() || null,
        };
      } else {
        requestBody.customer_id = selectedCustomer.id;
      }

      const headers = {
        "Content-Type": "application/json",
        ...getBranchHeader(currentBranchId),
      };

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar cita");
      }

      toast.success(
        initialData?.id
          ? "Cita actualizada exitosamente"
          : "Cita creada exitosamente",
      );
      onSuccess();
    } catch (error: any) {
      console.error("Error saving appointment:", error);
      toast.error(error.message || "Error al guardar cita");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  const isSlotAvailable = (timeSlot: string) => {
    const slot = availableSlots.find((s) => s.time_slot === timeSlot);
    return slot?.available || false;
  };

  const getMinDate = () => {
    if (!scheduleSettings) return new Date().toISOString().split("T")[0];
    const minHours = scheduleSettings.min_advance_booking_hours || 2;
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + minHours);
    return minDate.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    if (!scheduleSettings) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 90);
      return maxDate.toISOString().split("T")[0];
    }
    const maxDays = scheduleSettings.max_advance_booking_days || 90;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + maxDays);
    return maxDate.toISOString().split("T")[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle between registered and guest customer */}
          <div className="flex items-center justify-between">
            <Label>Cliente registrado</Label>
            <Switch
              checked={!isGuestCustomer}
              onCheckedChange={(checked) => {
                setIsGuestCustomer(!checked);
                if (!checked) {
                  // Switching to guest mode - clear selected customer
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                  setCustomerResults([]);
                } else {
                  // Switching to registered mode - clear guest data
                  setGuestCustomerData({
                    first_name: "",
                    last_name: "",
                    rut: "",
                    email: "",
                    phone: "",
                  });
                }
              }}
            />
          </div>

          {isGuestCustomer ? (
            // Guest customer form (non-registered) - Data stored in appointment only
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="text-sm text-blue-800 mb-2">
                <strong>Cliente no registrado:</strong> Ingresa los datos del
                cliente. El cliente será registrado en el sistema cuando asista
                a la cita.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Nombre"
                    value={guestCustomerData.first_name}
                    onChange={(e) =>
                      setGuestCustomerData((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Apellido *</Label>
                  <Input
                    placeholder="Apellido"
                    value={guestCustomerData.last_name}
                    onChange={(e) =>
                      setGuestCustomerData((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label>RUT *</Label>
                <Input
                  placeholder="12.345.678-9 o 123456789"
                  value={guestCustomerData.rut}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Format RUT automatically as user types
                    const formatted = formatRUT(value);
                    setGuestCustomerData((prev) => ({
                      ...prev,
                      rut: formatted,
                    }));
                  }}
                  onBlur={(e) => {
                    // Ensure RUT is properly formatted when field loses focus
                    const formatted = formatRUT(e.target.value);
                    if (formatted !== e.target.value) {
                      setGuestCustomerData((prev) => ({
                        ...prev,
                        rut: formatted,
                      }));
                    }
                  }}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@ejemplo.com (opcional)"
                  value={guestCustomerData.email}
                  onChange={(e) =>
                    setGuestCustomerData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  type="tel"
                  placeholder="+56 9 1234 5678 (opcional)"
                  value={guestCustomerData.phone}
                  onChange={(e) =>
                    setGuestCustomerData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          ) : selectedCustomer ? (
            // Registered customer selected
            <div
              className="flex items-center justify-between p-4 border rounded-lg bg-admin-bg-secondary"
              style={{ backgroundColor: "var(--admin-border-primary)" }}
            >
              <div>
                <div className="font-medium">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </div>
                <div className="text-sm text-tierra-media">
                  {selectedCustomer.email}
                </div>
                {selectedCustomer.phone && (
                  <div className="text-sm text-tierra-media">
                    📞 {selectedCustomer.phone}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCustomer(null);
                  setFormData((prev) => ({ ...prev, prescription_id: null }));
                }}
              >
                Cambiar
              </Button>
            </div>
          ) : (
            // Customer search
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tierra-media" />
              <Input
                placeholder="Buscar cliente por nombre, email, teléfono o RUT (sin puntos ni guion)..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-10"
              />
              {customerSearch.length >= 1 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchingCustomers ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : customerResults.length > 0 ? (
                    customerResults.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerSearch("");
                          setCustomerResults([]);
                        }}
                      >
                        <div className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-tierra-media">
                          {customer.email}
                        </div>
                        <div className="text-xs text-tierra-media flex gap-3 mt-1">
                          {customer.phone && <span>📞 {customer.phone}</span>}
                          {customer.rut && <span>🆔 {customer.rut}</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-tierra-media">
                      No se encontraron clientes
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date and Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Fecha y Hora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={formData.appointment_date}
                onChange={(e) => {
                  if (lockDateTime) return; // Block changes if locked

                  const selectedDate = e.target.value;
                  const today = new Date().toISOString().split("T")[0];

                  // Block past dates
                  if (selectedDate < today) {
                    toast.error("No se pueden agendar citas en fechas pasadas");
                    return;
                  }

                  setFormData((prev) => ({
                    ...prev,
                    appointment_date: selectedDate,
                    appointment_time: "",
                  }));
                  setAvailableSlots([]);
                }}
                min={getMinDate()}
                max={getMaxDate()}
                required
                disabled={lockDateTime}
                className={lockDateTime ? "bg-gray-100 cursor-not-allowed" : ""}
              />
              {lockDateTime && (
                <p className="text-xs text-tierra-media mt-1">
                  Fecha bloqueada (seleccionada desde el calendario)
                </p>
              )}
              {!lockDateTime && (
                <p className="text-xs text-tierra-media mt-1">
                  Selecciona una fecha para ver los horarios disponibles
                </p>
              )}
            </div>
            <div>
              <Label>Duración (minutos) *</Label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    duration_minutes: parseInt(value),
                    appointment_time: "",
                  }));
                  setAvailableSlots([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                  <SelectItem value="90">90 minutos</SelectItem>
                  <SelectItem value="120">120 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Available Time Slots */}
          {formData.appointment_date && (
            <div>
              <Label>Hora Disponible *</Label>
              {loadingAvailability ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-azul-profundo mx-auto mb-2" />
                  <p className="text-sm text-tierra-media">
                    Cargando horarios disponibles...
                  </p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <Clock className="h-8 w-8 text-tierra-media mx-auto mb-2" />
                  <p className="text-sm text-tierra-media font-medium mb-1">
                    No hay horarios disponibles para esta fecha
                  </p>
                  <p className="text-xs text-tierra-media">
                    {scheduleSettings?.min_advance_booking_hours
                      ? `Se requiere reservar con al menos ${scheduleSettings.min_advance_booking_hours} horas de anticipación`
                      : "Verifica la configuración de horarios"}
                  </p>
                </div>
              ) : availableSlots.filter((slot) => slot.available).length ===
                0 ? (
                <div className="text-center py-8 border rounded-lg bg-yellow-50">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800 font-medium mb-1">
                    No hay slots disponibles
                  </p>
                  <p className="text-xs text-yellow-700">
                    {scheduleSettings?.min_advance_booking_hours
                      ? `Se requiere reservar con al menos ${scheduleSettings.min_advance_booking_hours} horas de anticipación. Intenta con una fecha futura.`
                      : "Todos los horarios están ocupados o bloqueados"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 mt-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                  {availableSlots
                    .filter((slot) => {
                      // Ensure slot has valid time_slot
                      if (!slot || !slot.time_slot) return false;

                      // Filter out unavailable slots
                      if (slot.available === false) return false;

                      // Trust the SQL function - it already handles:
                      // - Past slots based on min_advance_booking_hours
                      // - Working hours
                      // - Existing appointments
                      // - Blocked dates
                      // If it returns available=true, the slot is valid for booking
                      return true;
                    })
                    .map((slot) => {
                      const isSelected =
                        formData.appointment_time === slot.time_slot;
                      const isLockedTime = lockDateTime && isSelected;

                      return (
                        <Button
                          key={slot.time_slot}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          onClick={(e) => {
                            if (lockDateTime && !isSelected) {
                              e.preventDefault();
                              e.stopPropagation();
                              return; // Don't allow changing time if locked
                            }
                            e.preventDefault();
                            e.stopPropagation();
                            setFormData((prev) => ({
                              ...prev,
                              appointment_time: slot.time_slot,
                            }));
                          }}
                          disabled={lockDateTime && !isSelected}
                          className={cn(
                            "text-sm",
                            isSelected &&
                              "bg-azul-profundo text-[var(--admin-accent-secondary)] hover:bg-azul-profundo/90",
                            !isSelected && !lockDateTime && "cursor-pointer",
                            lockDateTime &&
                              !isSelected &&
                              "opacity-50 cursor-not-allowed",
                          )}
                          title={
                            lockDateTime && !isSelected ? "Hora bloqueada" : ""
                          }
                        >
                          {formatTime(slot.time_slot)}
                          {isLockedTime && <span className="ml-1">🔒</span>}
                        </Button>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Type */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Cita</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.appointment_type}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, appointment_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {appointmentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Programada</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Motivo de la Cita</Label>
            <Input
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="Motivo de la cita..."
            />
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Requiere Seguimiento</Label>
              <p className="text-sm text-tierra-media">
                Programar una cita de seguimiento
              </p>
            </div>
            <Switch
              checked={formData.follow_up_required}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  follow_up_required: checked,
                }))
              }
            />
          </div>
          {formData.follow_up_required && (
            <div>
              <Label>Fecha de Seguimiento</Label>
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    follow_up_date: e.target.value,
                  }))
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || !formData.appointment_time}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {initialData?.id ? "Actualizar Cita" : "Crear Cita"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
