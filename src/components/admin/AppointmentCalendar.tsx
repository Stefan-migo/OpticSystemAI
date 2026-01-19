'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock,
  User,
  Eye,
  Package,
  Truck,
  Wrench,
  AlertCircle,
  RefreshCw,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  } | null;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_rut?: string;
  guest_email?: string;
  guest_phone?: string;
  notes?: string;
}

interface ScheduleSettings {
  slot_duration_minutes: number;
  working_hours: {
    [key: string]: {
      enabled: boolean;
      start_time: string;
      end_time: string;
      lunch_start?: string | null;
      lunch_end?: string | null;
    };
  };
}

interface AppointmentCalendarProps {
  view: 'week' | 'month';
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onDateChange: (date: Date) => void;
  onSlotClick?: (date: Date, time: string) => void;
  scheduleSettings?: ScheduleSettings | null;
}

export default function AppointmentCalendar({
  view,
  currentDate,
  appointments,
  onAppointmentClick,
  onDateChange,
  onSlotClick,
  scheduleSettings
}: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate time slots based on schedule settings
  // If no settings, fallback to default (8:00 to 20:00)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    
    if (!scheduleSettings?.working_hours) {
      // Fallback: default slots from 8:00 to 20:00
      for (let hour = 8; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(time);
        }
      }
      return slots;
    }

    // Get slot duration from settings (default 15 minutes)
    const slotDuration = scheduleSettings.slot_duration_minutes || 15;
    
    // Find the earliest start time and latest end time across all enabled days
    let earliestStart = 24; // hours
    let latestEnd = 0; // hours
    
    Object.values(scheduleSettings.working_hours).forEach(dayConfig => {
      if (dayConfig.enabled) {
        const startHour = parseInt(dayConfig.start_time.split(':')[0]);
        const endHour = parseInt(dayConfig.end_time.split(':')[0]);
        const endMinute = parseInt(dayConfig.end_time.split(':')[1]);
        const endTimeDecimal = endHour + (endMinute / 60);
        
        if (startHour < earliestStart) {
          earliestStart = startHour;
        }
        if (endTimeDecimal > latestEnd) {
          latestEnd = endTimeDecimal;
        }
      }
    });

    // Generate slots from earliest start to latest end
    let currentHour = Math.floor(earliestStart);
    let currentMinute = Math.round((earliestStart - currentHour) * 60);
    const endHour = Math.floor(latestEnd);
    const endMinute = Math.round((latestEnd - endHour) * 60);
    
    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(time);
      
      currentMinute += slotDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    return slots;
  }, [scheduleSettings]);

  // Check if a time slot is available for a specific date based on schedule settings
  const isSlotAvailableForDate = (date: Date, timeSlot: string): boolean => {
    if (!scheduleSettings?.working_hours) {
      return true; // If no settings, assume all slots are available
    }

    // Get day name in lowercase (monday, tuesday, etc.)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = date.getDay();
    const dayName = dayNames[dayIndex];
    const dayConfig = scheduleSettings.working_hours[dayName];

    if (!dayConfig || !dayConfig.enabled) {
      return false; // Day is disabled
    }

    // Parse time slot (format: HH:MM)
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const slotTimeDecimal = slotHour + (slotMinute / 60);

    // Parse working hours
    const [startHour, startMinute] = dayConfig.start_time.split(':').map(Number);
    const startTimeDecimal = startHour + (startMinute / 60);
    
    const [endHour, endMinute] = dayConfig.end_time.split(':').map(Number);
    const endTimeDecimal = endHour + (endMinute / 60);

    // Check if slot is within working hours
    if (slotTimeDecimal < startTimeDecimal || slotTimeDecimal >= endTimeDecimal) {
      return false;
    }

    // Check if slot is during lunch break
    if (dayConfig.lunch_start && dayConfig.lunch_end) {
      const [lunchStartHour, lunchStartMinute] = dayConfig.lunch_start.split(':').map(Number);
      const lunchStartDecimal = lunchStartHour + (lunchStartMinute / 60);
      
      const [lunchEndHour, lunchEndMinute] = dayConfig.lunch_end.split(':').map(Number);
      const lunchEndDecimal = lunchEndHour + (lunchEndMinute / 60);

      if (slotTimeDecimal >= lunchStartDecimal && slotTimeDecimal < lunchEndDecimal) {
        return false;
      }
    }

    return true;
  };

  // Get week days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    startOfWeek.setDate(diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentDate]);

  // Get month days
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1)); // Start from Monday
    
    const days: Date[] = [];
    const current = new Date(startDate);
    while (current <= lastDay || days.length < 35) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (days.length >= 42) break; // 6 weeks max
    }
    return days;
  }, [currentDate]);

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const getAppointmentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      eye_exam: 'bg-blue-100 border-blue-300 text-blue-800',
      consultation: 'bg-green-100 border-green-300 text-green-800',
      fitting: 'bg-purple-100 border-purple-300 text-purple-800',
      delivery: 'bg-orange-100 border-orange-300 text-orange-800',
      repair: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      follow_up: 'bg-indigo-100 border-indigo-300 text-indigo-800',
      emergency: 'bg-red-100 border-red-300 text-red-800',
      other: 'bg-gray-100 border-gray-300 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  const getAppointmentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 border-blue-300 text-blue-800',
      confirmed: 'bg-green-100 border-green-300 text-green-800',
      completed: 'bg-orange-100 border-orange-300 text-orange-800',
      cancelled: 'bg-red-100 border-red-300 text-red-800',
      no_show: 'bg-gray-100 border-gray-300 text-gray-800'
    };
    return colors[status] || colors.scheduled;
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
      other: CalendarIcon
    };
    return icons[type] || CalendarIcon;
  };

  const getAppointmentsForTimeSlot = (date: Date, timeSlot: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      if (apt.appointment_date !== dateStr) return false;
      const aptTime = apt.appointment_time.substring(0, 5); // HH:MM
      const slotTime = timeSlot;
      // Check if appointment starts at or overlaps with this slot
      return aptTime <= slotTime && 
             (parseInt(aptTime.split(':')[0]) * 60 + parseInt(aptTime.split(':')[1]) + apt.duration_minutes) >
             (parseInt(slotTime.split(':')[0]) * 60 + parseInt(slotTime.split(':')[1]));
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date, time?: string) => {
    const now = new Date();
    if (time) {
      // Parse time slot (format: HH:MM:SS or HH:MM)
      const timeOnly = time.substring(0, 5); // Get HH:MM
      const [hours, minutes] = timeOnly.split(':').map(Number);
      const dateTime = new Date(date);
      dateTime.setHours(hours, minutes, 0, 0);
      return dateTime < now;
    }
    // For dates without time, check if it's before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  if (view === 'week') {
    return (
      <div className="space-y-4">
        {/* Week Header */}
        <div className="grid grid-cols-8 gap-2">
          <div className="font-semibold text-sm text-tierra-media">Hora</div>
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={cn(
                "text-center font-semibold p-2 rounded",
                isToday(day) && "bg-azul-profundo text-white"
              )}
            >
              <div className="text-xs" style={isToday(day) ? { color: 'var(--admin-warning)' } : undefined}>{day.toLocaleDateString('es-CL', { weekday: 'short' })}</div>
              <div className="text-lg" style={isToday(day) ? { color: 'var(--admin-warning)' } : undefined}>{day.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {timeSlots.map((timeSlot) => (
            <div key={timeSlot} className="grid grid-cols-8 gap-2">
              <div className="text-xs text-tierra-media py-2 text-right pr-2">
                {timeSlot}
              </div>
              {weekDays.map((day, dayIdx) => {
                const slotAppointments = getAppointmentsForTimeSlot(day, timeSlot);
                const isSlotPast = isPast(day, timeSlot);
                const hasAppointments = slotAppointments.length > 0;
                const isSlotAvailable = isSlotAvailableForDate(day, timeSlot);
                const isPastDate = day < new Date() && !isToday(day);
                const isPastTime = isSlotPast;
                const isClickable = !hasAppointments && !isPastDate && !isPastTime && isSlotAvailable;
                
                return (
                  <div
                    key={dayIdx}
                    onClick={(e) => {
                      // Only trigger slot click if clicking on empty space (not on an appointment)
                      // Block past dates, times, and unavailable slots
                      if (isClickable && onSlotClick) {
                        e.stopPropagation();
                        onSlotClick(day, timeSlot);
                      }
                    }}
                    className={cn(
                      "min-h-[60px] border border-gray-200 rounded p-1 relative",
                      (!isSlotAvailable || isPastDate || isPastTime) && "bg-gray-50 opacity-50 cursor-not-allowed",
                      isToday(day) && !isSlotPast && isSlotAvailable && "bg-blue-50",
                      isClickable && onSlotClick && "cursor-pointer hover:bg-blue-100 transition-colors"
                    )}
                  >
                    {hasAppointments ? (
                      slotAppointments.map((apt) => {
                        const Icon = getAppointmentTypeIcon(apt.appointment_type);
                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick(apt);
                            }}
                            className={cn(
                              "text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 transition-opacity border",
                              getAppointmentStatusColor(apt.status)
                            )}
                            style={{
                              height: `${Math.max(apt.duration_minutes / 15 * 60, 40)}px`
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              <span className="font-medium truncate">
                                {apt.customer 
                                  ? `${apt.customer.first_name || ''} ${apt.customer.last_name || ''}`.trim()
                                  : `${apt.guest_first_name || ''} ${apt.guest_last_name || ''}`.trim()}
                              </span>
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {apt.appointment_type}
                            </div>
                            <div className="text-xs font-semibold mt-0.5">
                              {apt.status === 'scheduled' ? 'Programado' :
                               apt.status === 'confirmed' ? 'Confirmado' :
                               apt.status === 'completed' ? 'Completado' :
                               apt.status === 'cancelled' ? 'Cancelado' :
                               apt.status === 'no_show' ? 'No asistió' : apt.status}
                            </div>
                          </div>
                        );
                      })
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Month view
  return (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="grid grid-cols-7 gap-2">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <div key={day} className="text-center font-semibold text-sm text-tierra-media p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Month Days */}
      <div className="grid grid-cols-7 gap-2">
        {monthDays.map((day, idx) => {
          const dayAppointments = getAppointmentsForDate(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isDayToday = isToday(day);
          const isDayPast = isPast(day);

          return (
            <Card
              key={idx}
              className={cn(
                "min-h-[120px] cursor-pointer hover:shadow-md transition-shadow",
                !isCurrentMonth && "opacity-40",
                isDayPast && "bg-gray-50",
                isDayToday && "border-2 border-azul-profundo"
              )}
              onClick={() => {
                setSelectedDate(day);
                onDateChange(day);
                if (view === 'month') {
                  // Switch to week view when clicking a day
                  // This would need to be handled by parent component
                }
              }}
            >
              <CardContent className="p-2">
                <div className={cn(
                  "text-sm font-semibold mb-2",
                  isDayToday && "text-azul-profundo"
                )}>
                  {day.getDate()}
                </div>
                {dayAppointments.length > 0 && (
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => {
                      const Icon = getAppointmentTypeIcon(apt.appointment_type);
                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(apt);
                          }}
                          className={cn(
                            "text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity border",
                            getAppointmentStatusColor(apt.status) // Use status color instead of type color
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <Icon className="h-2 w-2" />
                            <span className="truncate font-medium">
                              {apt.appointment_time.substring(0, 5)} - {apt.customer?.first_name} {apt.customer?.last_name}
                            </span>
                          </div>
                          <div className="text-xs opacity-75 truncate">
                            {apt.appointment_type}
                          </div>
                          <div className="text-xs font-semibold mt-0.5">
                            {apt.status === 'scheduled' ? 'Programado' :
                             apt.status === 'confirmed' ? 'Confirmado' :
                             apt.status === 'completed' ? 'Completado' :
                             apt.status === 'cancelled' ? 'Cancelado' :
                             apt.status === 'no_show' ? 'No asistió' : apt.status}
                          </div>
                        </div>
                      );
                    })}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-tierra-media text-center">
                        +{dayAppointments.length - 3} más
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

