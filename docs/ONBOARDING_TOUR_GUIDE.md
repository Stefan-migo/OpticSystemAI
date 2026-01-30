# 🎯 Guía de Implementación: Tour de Primera Visita (Onboarding Tour)

**Fecha Creación:** 2026-01-29  
**Estado:** 📋 Documentación Completa - Listo para Implementación  
**Objetivo:** Crear un sistema de guía interactiva para usuarios nuevos que explique las funcionalidades principales del sistema Opttius

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Análisis del Flujo del Sistema](#análisis-del-flujo-del-sistema)
3. [Diseño del Tour](#diseño-del-tour)
4. [Arquitectura Técnica](#arquitectura-técnica)
5. [Implementación Paso a Paso](#implementación-paso-a-paso)
6. [Configuración y Personalización](#configuración-y-personalización)
7. [Acceso y Re-visitación](#acceso-y-re-visitación)

---

## 🎯 Visión General

### Objetivo

Implementar un sistema de tour guiado interactivo que ayude a los usuarios nuevos a entender y utilizar las funcionalidades principales de Opttius. El tour debe ser:

- **No intrusivo:** El usuario puede saltarlo o pausarlo en cualquier momento
- **Contextual:** Se muestra en el momento adecuado (primera visita)
- **Re-visitable:** El usuario puede acceder al tour nuevamente cuando lo necesite
- **Progresivo:** Guía paso a paso por las secciones más importantes
- **Adaptativo:** Se adapta según el tipo de usuario (admin, super admin)

### Beneficios

- Reduce la curva de aprendizaje
- Mejora la adopción de funcionalidades
- Reduce consultas de soporte
- Mejora la experiencia del usuario
- Aumenta la productividad desde el inicio

---

## 🔍 Análisis del Flujo del Sistema

### Secciones Principales del Sistema Opttius

Basado en el análisis del código y la estructura del sistema, estas son las secciones que deben ser explicadas en el tour:

#### 1. **Dashboard** (`/admin`)

- **Propósito:** Vista general con KPIs y métricas clave
- **Elementos Clave:**
  - Tarjetas de métricas (ventas, trabajos, presupuestos, citas)
  - Gráficos de ingresos y tendencias
  - Resumen de actividades recientes
  - Accesos rápidos a módulos principales
- **Acciones Importantes:** Ver métricas, acceder rápidamente a POS, citas, trabajos

#### 2. **Punto de Venta (POS)** (`/admin/pos`)

- **Propósito:** Sistema de ventas rápido e integrado
- **Elementos Clave:**
  - Búsqueda de clientes (RUT, nombre, email)
  - Carga de presupuestos al carrito
  - Selección de productos (marcos, lentes, tratamientos)
  - Cálculo automático de precios e IVA
  - Múltiples métodos de pago
- **Acciones Importantes:** Procesar venta, buscar cliente, cargar presupuesto

#### 3. **Clientes** (`/admin/customers`)

- **Propósito:** Gestión completa de clientes y datos médicos
- **Elementos Clave:**
  - Lista de clientes con búsqueda inteligente
  - Crear nuevo cliente
  - Ver perfil completo (recetas, historial)
  - Gestión de recetas oftalmológicas
- **Acciones Importantes:** Crear cliente, buscar por RUT, ver historial

#### 4. **Productos** (`/admin/products`)

- **Propósito:** Catálogo e inventario de productos ópticos
- **Elementos Clave:**
  - Lista/grid de productos
  - Filtros por categoría, tipo, stock
  - Agregar nuevo producto
  - Gestión de inventario (stock, precios)
- **Acciones Importantes:** Agregar producto, filtrar, ver stock bajo

#### 5. **Presupuestos** (`/admin/quotes`)

- **Propósito:** Crear y gestionar presupuestos para clientes
- **Elementos Clave:**
  - Lista de presupuestos (estados: borrador, enviado, aceptado)
  - Crear nuevo presupuesto
  - Enviar por email
  - Convertir a trabajo de laboratorio
- **Acciones Importantes:** Crear presupuesto, enviar, convertir a trabajo

#### 6. **Trabajos de Laboratorio** (`/admin/work-orders`)

- **Propósito:** Seguimiento de trabajos de laboratorio
- **Elementos Clave:**
  - Lista de trabajos con estados
  - Timeline visual del progreso
  - Cambiar estado del trabajo
  - Asignar a personal
- **Acciones Importantes:** Crear trabajo, cambiar estado, ver timeline

#### 7. **Citas y Agenda** (`/admin/appointments`)

- **Propósito:** Gestión de citas y calendario
- **Elementos Clave:**
  - Calendario semanal/mensual
  - Crear nueva cita
  - Ver disponibilidad
  - Gestionar estados de citas
- **Acciones Importantes:** Crear cita, ver calendario, gestionar disponibilidad

#### 8. **Analíticas** (`/admin/analytics`)

- **Propósito:** Reportes y estadísticas del negocio
- **Elementos Clave:**
  - Gráficos de ventas
  - Reportes por período
  - Análisis de productos más vendidos
  - Tendencias de ingresos
- **Acciones Importantes:** Ver reportes, filtrar por período, exportar datos

#### 9. **Sistema** (`/admin/system`)

- **Propósito:** Configuración general del sistema
- **Elementos Clave:**
  - Configuración de la óptica
  - Configuración de emails
  - Notificaciones
  - Salud del sistema
- **Acciones Importantes:** Configurar sistema, ajustar notificaciones

### Flujo Recomendado del Tour

El tour debe seguir un orden lógico que refleje el flujo de trabajo típico de una óptica:

```
1. Dashboard (Visión General)
   ↓
2. Clientes (Base de datos de clientes)
   ↓
3. Productos (Catálogo e inventario)
   ↓
4. Presupuestos (Crear cotizaciones)
   ↓
5. Trabajos (Seguimiento de laboratorio)
   ↓
6. Citas (Agenda y calendario)
   ↓
7. Punto de Venta (Ventas rápidas)
   ↓
8. Analíticas (Reportes y estadísticas)
   ↓
9. Sistema (Configuración)
```

**Nota:** El tour puede ser personalizado según el tipo de usuario. Por ejemplo, un super admin podría ver también la sección de Sucursales.

---

## 🎨 Diseño del Tour

### Componentes Visuales

#### 1. **Overlay con Spotlight**

- Fondo oscuro semitransparente (backdrop)
- Área destacada (spotlight) alrededor del elemento explicado
- Flecha apuntando al elemento
- Tarjeta flotante con información

#### 2. **Tarjeta de Información**

- Título de la sección
- Descripción breve (2-3 líneas)
- Lista de acciones clave (bullets)
- Botones: "Anterior", "Siguiente", "Saltar Tour", "Finalizar"

#### 3. **Indicador de Progreso**

- Barra de progreso superior
- Contador "Paso X de Y"
- Puntos de navegación (dots) para saltar a pasos específicos

#### 4. **Botón de Ayuda Flotante**

- Botón fijo en la esquina inferior derecha
- Icono de "?" o "Guía"
- Acceso rápido para reiniciar el tour

### Estados del Tour

1. **No iniciado:** Usuario nunca ha visto el tour
2. **En progreso:** Tour iniciado pero no completado
3. **Completado:** Tour completado exitosamente
4. **Deshabilitado:** Usuario ha deshabilitado el tour

### Persistencia

- Guardar estado del tour en la base de datos (`user_tour_progress`)
- Permitir reanudar desde donde se quedó
- Opción de reiniciar desde el principio

---

## 🏗️ Arquitectura Técnica

### Base de Datos

#### Nueva Tabla: `user_tour_progress`

```sql
CREATE TABLE public.user_tour_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Estado del tour
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'disabled')),

  -- Progreso actual
  current_step INTEGER DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}',

  -- Metadatos
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Configuración
  skip_on_next_login BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, organization_id)
);

-- Índices
CREATE INDEX idx_user_tour_progress_user ON public.user_tour_progress(user_id);
CREATE INDEX idx_user_tour_progress_org ON public.user_tour_progress(organization_id);

-- RLS Policies
ALTER TABLE public.user_tour_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tour progress"
ON public.user_tour_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tour progress"
ON public.user_tour_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tour progress"
ON public.user_tour_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Estructura de Archivos

```
src/
├── components/
│   └── onboarding/
│       ├── TourProvider.tsx          # Context provider del tour
│       ├── TourOverlay.tsx           # Overlay con spotlight
│       ├── TourCard.tsx              # Tarjeta de información
│       ├── TourProgress.tsx          # Barra de progreso
│       ├── TourButton.tsx            # Botón flotante de ayuda
│       └── useTour.ts                # Hook personalizado
├── hooks/
│   └── useTour.ts                    # Hook principal del tour
├── lib/
│   └── onboarding/
│       ├── tour-config.ts            # Configuración de pasos del tour
│       ├── tour-selectors.ts         # Selectores CSS para elementos
│       └── tour-api.ts               # API calls para guardar progreso
└── app/
    └── api/
        └── onboarding/
            └── tour/
                ├── route.ts         # GET/POST progreso del tour
                └── [step]/
                    └── route.ts     # Marcar paso como completado
```

### Configuración del Tour

#### `tour-config.ts`

```typescript
export interface TourStep {
  id: string;
  section: string; // 'dashboard', 'customers', 'products', etc.
  title: string;
  description: string;
  keyActions: string[]; // Lista de acciones clave
  selector: string; // Selector CSS del elemento a destacar
  position?: "top" | "bottom" | "left" | "right" | "center";
  actionUrl?: string; // URL para acción rápida
  actionLabel?: string; // Texto del botón de acción
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard-overview",
    section: "dashboard",
    title: "Dashboard - Visión General",
    description:
      "Aquí encontrarás todas las métricas clave de tu óptica: ventas, trabajos pendientes, presupuestos y citas del día.",
    keyActions: [
      "Ver métricas en tiempo real",
      "Acceder rápidamente a POS, citas y trabajos",
      "Revisar alertas de stock bajo",
    ],
    selector: '[data-tour="dashboard-header"]',
    position: "bottom",
  },
  {
    id: "customers-list",
    section: "customers",
    title: "Gestión de Clientes",
    description:
      "Administra tu base de datos de clientes. Busca por RUT, nombre o email. Crea nuevos clientes y gestiona sus recetas médicas.",
    keyActions: [
      "Buscar clientes por RUT (con o sin formato)",
      "Crear nuevo cliente",
      "Ver historial completo (citas, presupuestos, trabajos)",
    ],
    selector: '[data-tour="customers-search"]',
    position: "bottom",
    actionUrl: "/admin/customers/new",
    actionLabel: "Crear Cliente",
  },
  {
    id: "products-catalog",
    section: "products",
    title: "Catálogo de Productos",
    description:
      "Gestiona tu inventario de productos ópticos: marcos, lentes, accesorios. Controla stock, precios y categorías.",
    keyActions: [
      "Agregar nuevos productos",
      "Filtrar por categoría o tipo",
      "Ver alertas de stock bajo",
      "Importar productos en masa",
    ],
    selector: '[data-tour="products-header"]',
    position: "bottom",
    actionUrl: "/admin/products/add",
    actionLabel: "Agregar Producto",
  },
  {
    id: "quotes-create",
    section: "quotes",
    title: "Presupuestos",
    description:
      "Crea presupuestos detallados para tus clientes. Incluye marcos, lentes, tratamientos y mano de obra. Envía por email y convierte a trabajos.",
    keyActions: [
      "Crear nuevo presupuesto",
      "Enviar presupuesto por email",
      "Convertir presupuesto aceptado a trabajo",
      "Gestionar expiración automática",
    ],
    selector: '[data-tour="quotes-header"]',
    position: "bottom",
    actionUrl: "/admin/quotes",
    actionLabel: "Crear Presupuesto",
  },
  {
    id: "work-orders-tracking",
    section: "work-orders",
    title: "Trabajos de Laboratorio",
    description:
      "Sigue el progreso de los trabajos de laboratorio. Cambia estados, asigna personal y visualiza el timeline de cada trabajo.",
    keyActions: [
      "Crear nuevo trabajo desde presupuesto",
      "Cambiar estado del trabajo",
      "Ver timeline visual del progreso",
      "Asignar trabajos a personal",
    ],
    selector: '[data-tour="work-orders-header"]',
    position: "bottom",
  },
  {
    id: "appointments-calendar",
    section: "appointments",
    title: "Citas y Agenda",
    description:
      "Gestiona tu calendario de citas. Crea nuevas citas, visualiza disponibilidad y gestiona estados. Soporta clientes no registrados.",
    keyActions: [
      "Ver calendario semanal/mensual",
      "Crear nueva cita",
      "Verificar disponibilidad",
      "Gestionar estados de citas",
    ],
    selector: '[data-tour="appointments-calendar"]',
    position: "top",
  },
  {
    id: "pos-sales",
    section: "pos",
    title: "Punto de Venta",
    description:
      "Sistema de ventas rápido e integrado. Busca clientes, carga presupuestos, selecciona productos y procesa pagos con múltiples métodos.",
    keyActions: [
      "Buscar cliente por RUT o nombre",
      "Cargar presupuesto al carrito",
      "Seleccionar productos y calcular totales",
      "Procesar venta con múltiples métodos de pago",
    ],
    selector: '[data-tour="pos-header"]',
    position: "bottom",
    actionUrl: "/admin/pos",
    actionLabel: "Abrir POS",
  },
  {
    id: "analytics-reports",
    section: "analytics",
    title: "Analíticas y Reportes",
    description:
      "Visualiza el rendimiento de tu negocio con gráficos y reportes detallados. Analiza ventas, tendencias y productos más vendidos.",
    keyActions: [
      "Ver gráficos de ventas",
      "Filtrar reportes por período",
      "Analizar productos más vendidos",
      "Exportar datos",
    ],
    selector: '[data-tour="analytics-header"]',
    position: "bottom",
  },
  {
    id: "system-config",
    section: "system",
    title: "Configuración del Sistema",
    description:
      "Configura tu óptica: datos de la empresa, emails, notificaciones, horarios y más. Personaliza el sistema según tus necesidades.",
    keyActions: [
      "Configurar datos de la óptica",
      "Ajustar notificaciones",
      "Configurar plantillas de email",
      "Revisar salud del sistema",
    ],
    selector: '[data-tour="system-header"]',
    position: "bottom",
  },
];

export const TOUR_CONFIG = {
  autoStart: true, // Iniciar automáticamente en primera visita
  showProgress: true, // Mostrar barra de progreso
  allowSkip: true, // Permitir saltar el tour
  allowRestart: true, // Permitir reiniciar el tour
  highlightDelay: 300, // Delay antes de destacar elemento (ms)
  animationDuration: 300, // Duración de animaciones (ms)
};
```

---

## 🚀 Implementación Paso a Paso

### Paso 1: Crear Migración de Base de Datos

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_user_tour_progress.sql`

```sql
-- Crear tabla user_tour_progress
CREATE TABLE IF NOT EXISTS public.user_tour_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'disabled')),
  current_step INTEGER DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}',

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

  skip_on_next_login BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, organization_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_user ON public.user_tour_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_org ON public.user_tour_progress(organization_id);

-- RLS
ALTER TABLE public.user_tour_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tour progress"
ON public.user_tour_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tour progress"
ON public.user_tour_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tour progress"
ON public.user_tour_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_tour_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_tour_progress_updated_at
BEFORE UPDATE ON public.user_tour_progress
FOR EACH ROW
EXECUTE FUNCTION update_user_tour_progress_updated_at();
```

### Paso 2: Crear Configuración del Tour

**Archivo:** `src/lib/onboarding/tour-config.ts`

(Código completo en sección anterior)

### Paso 3: Crear Hook Personalizado

**Archivo:** `src/hooks/useTour.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TOUR_STEPS, TOUR_CONFIG } from "@/lib/onboarding/tour-config";

interface TourProgress {
  status: "not_started" | "in_progress" | "completed" | "disabled";
  current_step: number;
  completed_steps: number[];
  skip_on_next_login: boolean;
}

export function useTour() {
  const queryClient = useQueryClient();

  // Obtener progreso del tour
  const { data: progress, isLoading } = useQuery<TourProgress>({
    queryKey: ["tour-progress"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/tour");
      if (!res.ok) throw new Error("Failed to fetch tour progress");
      return res.json();
    },
  });

  // Iniciar tour
  const startTour = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/onboarding/tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) throw new Error("Failed to start tour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tour-progress"]);
    },
  });

  // Completar paso
  const completeStep = useMutation({
    mutationFn: async (stepIndex: number) => {
      const res = await fetch(`/api/onboarding/tour/${stepIndex}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to complete step");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tour-progress"]);
    },
  });

  // Completar tour
  const completeTour = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/onboarding/tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      if (!res.ok) throw new Error("Failed to complete tour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tour-progress"]);
    },
  });

  // Saltar tour
  const skipTour = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/onboarding/tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skip" }),
      });
      if (!res.ok) throw new Error("Failed to skip tour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tour-progress"]);
    },
  });

  // Reiniciar tour
  const restartTour = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/onboarding/tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" }),
      });
      if (!res.ok) throw new Error("Failed to restart tour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tour-progress"]);
    },
  });

  const currentStep = progress?.current_step ?? 0;
  const totalSteps = TOUR_STEPS.length;
  const isActive = progress?.status === "in_progress";
  const isCompleted = progress?.status === "completed";
  const isDisabled = progress?.status === "disabled";

  return {
    progress,
    isLoading,
    currentStep,
    totalSteps,
    isActive,
    isCompleted,
    isDisabled,
    startTour: startTour.mutate,
    completeStep: completeStep.mutate,
    completeTour: completeTour.mutate,
    skipTour: skipTour.mutate,
    restartTour: restartTour.mutate,
  };
}
```

### Paso 4: Crear Componentes del Tour

**Archivo:** `src/components/onboarding/TourOverlay.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TourOverlayProps {
  selector: string;
  isActive: boolean;
  children: React.ReactNode;
}

export function TourOverlay({ selector, isActive, children }: TourOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [elementBounds, setElementBounds] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const element = document.querySelector(selector);
    if (!element) return;

    const updateBounds = () => {
      const rect = element.getBoundingClientRect();
      setElementBounds(rect);
    };

    updateBounds();
    window.addEventListener('scroll', updateBounds);
    window.addEventListener('resize', updateBounds);

    return () => {
      window.removeEventListener('scroll', updateBounds);
      window.removeEventListener('resize', updateBounds);
    };
  }, [selector, isActive]);

  if (!isActive || !elementBounds) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9998] pointer-events-none"
      style={{
        background: `radial-gradient(
          ellipse ${elementBounds.width + 20}px ${elementBounds.height + 20}px at
          ${elementBounds.left + elementBounds.width / 2}px
          ${elementBounds.top + elementBounds.height / 2}px,
          transparent 0%,
          transparent 60%,
          rgba(0, 0, 0, 0.5) 100%
        )`,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
```

**Archivo:** `src/components/onboarding/TourCard.tsx`

```typescript
'use client';

import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TourCardProps {
  step: {
    id: string;
    title: string;
    description: string;
    keyActions: string[];
    actionUrl?: string;
    actionLabel?: string;
  };
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  elementBounds: DOMRect | null;
}

export function TourCard({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  position = 'bottom',
  elementBounds,
}: TourCardProps) {
  const isLastStep = currentStep === totalSteps - 1;

  // Calcular posición de la tarjeta
  const cardStyle: React.CSSProperties = {};
  if (elementBounds) {
    switch (position) {
      case 'top':
        cardStyle.bottom = `${window.innerHeight - elementBounds.top + 20}px`;
        cardStyle.left = `${elementBounds.left}px`;
        break;
      case 'bottom':
        cardStyle.top = `${elementBounds.bottom + 20}px`;
        cardStyle.left = `${elementBounds.left}px`;
        break;
      case 'left':
        cardStyle.top = `${elementBounds.top}px`;
        cardStyle.right = `${window.innerWidth - elementBounds.left + 20}px`;
        break;
      case 'right':
        cardStyle.top = `${elementBounds.top}px`;
        cardStyle.left = `${elementBounds.right + 20}px`;
        break;
      case 'center':
        cardStyle.top = '50%';
        cardStyle.left = '50%';
        cardStyle.transform = 'translate(-50%, -50%)';
        break;
    }
  }

  return (
    <Card
      className="fixed z-[9999] w-96 shadow-2xl pointer-events-auto"
      style={cardStyle}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{step.title}</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Paso {currentStep + 1} de {totalSteps}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">{step.description}</p>

        {step.keyActions.length > 0 && (
          <ul className="space-y-2">
            {step.keyActions.map((action, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-gray-600">{action}</span>
              </li>
            ))}
          </ul>
        )}

        {step.actionUrl && step.actionLabel && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              window.location.href = step.actionUrl!;
            }}
          >
            {step.actionLabel}
          </Button>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Saltar Tour
            </Button>
            {isLastStep ? (
              <Button size="sm" onClick={onComplete}>
                Finalizar
                <Check className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={onNext}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Paso 5: Crear API Routes

**Archivo:** `src/app/api/onboarding/tour/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { getUser } = await createClientFromRequest(request);
    const {
      data: { user },
      error: userError,
    } = await getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener progreso del tour desde la base de datos
    const supabase = await createClientFromRequest(request);
    const { data: progress, error } = await supabase.client
      .from("user_tour_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching tour progress:", error);
      return NextResponse.json(
        { error: "Failed to fetch tour progress" },
        { status: 500 },
      );
    }

    // Si no existe, retornar estado inicial
    if (!progress) {
      return NextResponse.json({
        status: "not_started",
        current_step: 0,
        completed_steps: [],
        skip_on_next_login: false,
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Tour progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getUser } = await createClientFromRequest(request);
    const {
      data: { user },
      error: userError,
    } = await getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const supabase = await createClientFromRequest(request);

    // Obtener organización del usuario
    const { data: adminUser } = await supabase.client
      .from("admin_users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const organizationId = adminUser?.organization_id || null;

    let updateData: any = {};

    switch (action) {
      case "start":
        updateData = {
          status: "in_progress",
          current_step: 0,
          started_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        };
        break;
      case "complete":
        updateData = {
          status: "completed",
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        };
        break;
      case "skip":
        updateData = {
          status: "disabled",
          skip_on_next_login: true,
          last_accessed_at: new Date().toISOString(),
        };
        break;
      case "restart":
        updateData = {
          status: "in_progress",
          current_step: 0,
          completed_steps: [],
          started_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        };
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Upsert tour progress
    const { data, error } = await supabase.client
      .from("user_tour_progress")
      .upsert(
        {
          user_id: user.id,
          organization_id: organizationId,
          ...updateData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,organization_id",
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating tour progress:", error);
      return NextResponse.json(
        { error: "Failed to update tour progress" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Tour action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Archivo:** `src/app/api/onboarding/tour/[step]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/utils/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { step: string } },
) {
  try {
    const { getUser } = await createClientFromRequest(request);
    const {
      data: { user },
      error: userError,
    } = await getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stepIndex = parseInt(params.step, 10);
    if (isNaN(stepIndex)) {
      return NextResponse.json(
        { error: "Invalid step index" },
        { status: 400 },
      );
    }

    const supabase = await createClientFromRequest(request);

    // Obtener progreso actual
    const { data: progress } = await supabase.client
      .from("user_tour_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!progress) {
      return NextResponse.json({ error: "Tour not started" }, { status: 400 });
    }

    // Actualizar paso actual y agregar a completados
    const completedSteps = [...(progress.completed_steps || []), stepIndex];
    const nextStep = stepIndex + 1;

    const { data, error } = await supabase.client
      .from("user_tour_progress")
      .update({
        current_step: nextStep,
        completed_steps: completedSteps,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating step:", error);
      return NextResponse.json(
        { error: "Failed to update step" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Step completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Paso 6: Integrar Tour en Admin Layout

**Archivo:** `src/app/admin/layout.tsx`

Agregar al inicio del componente:

```typescript
import { TourProvider } from '@/components/onboarding/TourProvider';

// Dentro del componente AdminLayout:
<TourProvider>
  {/* ... resto del layout ... */}
</TourProvider>
```

**Archivo:** `src/components/onboarding/TourProvider.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useTour } from '@/hooks/useTour';
import { TourOverlay } from './TourOverlay';
import { TourCard } from './TourCard';
import { TOUR_STEPS, TOUR_CONFIG } from '@/lib/onboarding/tour-config';

export function TourProvider({ children }: { children: React.ReactNode }) {
  const {
    progress,
    isLoading,
    currentStep,
    totalSteps,
    isActive,
    startTour,
    completeStep,
    completeTour,
    skipTour,
  } = useTour();

  // Auto-iniciar tour en primera visita
  useEffect(() => {
    if (!isLoading && progress?.status === 'not_started' && TOUR_CONFIG.autoStart) {
      startTour();
    }
  }, [isLoading, progress?.status, startTour]);

  if (!isActive) {
    return <>{children}</>;
  }

  const currentStepData = TOUR_STEPS[currentStep];
  if (!currentStepData) {
    return <>{children}</>;
  }

  // Obtener bounds del elemento
  const element = document.querySelector(currentStepData.selector);
  const elementBounds = element?.getBoundingClientRect() || null;

  return (
    <>
      {children}
      <TourOverlay
        selector={currentStepData.selector}
        isActive={isActive}
      >
        <TourCard
          step={currentStepData}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={() => {
            if (currentStep < totalSteps - 1) {
              completeStep(currentStep);
            } else {
              completeTour();
            }
          }}
          onPrevious={() => {
            // Implementar navegación hacia atrás
          }}
          onSkip={skipTour}
          onComplete={completeTour}
          position={currentStepData.position}
          elementBounds={elementBounds}
        />
      </TourOverlay>
    </>
  );
}
```

### Paso 7: Agregar Selectores de Datos a las Páginas

Agregar atributos `data-tour` a los elementos clave de cada página:

**Ejemplo en Dashboard:**

```typescript
<div data-tour="dashboard-header">
  <h1>Dashboard</h1>
</div>
```

**Ejemplo en Customers:**

```typescript
<div data-tour="customers-search">
  <Input placeholder="Buscar cliente..." />
</div>
```

---

## ⚙️ Configuración y Personalización

### Variables de Entorno

```env
# Tour Configuration
NEXT_PUBLIC_TOUR_AUTO_START=true
NEXT_PUBLIC_TOUR_SHOW_PROGRESS=true
NEXT_PUBLIC_TOUR_ALLOW_SKIP=true
```

### Personalización por Tipo de Usuario

Modificar `tour-config.ts` para incluir diferentes tours según el rol:

```typescript
export const getTourStepsForUser = (userRole: string): TourStep[] => {
  const baseSteps = TOUR_STEPS;

  if (userRole === "super_admin") {
    return [
      ...baseSteps,
      {
        id: "branches-management",
        section: "branches",
        title: "Gestión de Sucursales",
        // ...
      },
    ];
  }

  return baseSteps;
};
```

---

## 🔄 Acceso y Re-visitación

### Botón Flotante de Ayuda

**Archivo:** `src/components/onboarding/TourButton.tsx`

```typescript
'use client';

import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTour } from '@/hooks/useTour';

export function TourButton() {
  const { restartTour, isCompleted } = useTour();

  return (
    <Button
      onClick={restartTour}
      className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
      title={isCompleted ? 'Ver tour nuevamente' : 'Iniciar tour'}
    >
      <HelpCircle className="h-6 w-6" />
    </Button>
  );
}
```

### Acceso desde Menú de Usuario

Agregar opción "Ver Guía del Sistema" en el menú de usuario del header.

### Acceso desde Configuración

Agregar sección "Guía y Tutoriales" en `/admin/system` con opción para reiniciar el tour.

---

## ✅ Checklist de Implementación

- [ ] Crear migración de base de datos
- [ ] Crear configuración del tour (`tour-config.ts`)
- [ ] Crear hook `useTour`
- [ ] Crear componentes del tour (Overlay, Card, Progress)
- [ ] Crear API routes (GET/POST tour progress)
- [ ] Integrar TourProvider en AdminLayout
- [ ] Agregar selectores `data-tour` a todas las páginas
- [ ] Crear botón flotante de ayuda
- [ ] Agregar opción en menú de usuario
- [ ] Agregar opción en configuración del sistema
- [ ] **Implementar tests (ver sección Testing)**
- [ ] Probar flujo completo del tour
- [ ] Ajustar estilos y animaciones
- [ ] Documentar para usuarios finales

---

## 🧪 Testing del Tour

### Prioridad: 🔴 ALTA

El tour es una funcionalidad compleja que requiere tests exhaustivos para garantizar una experiencia de usuario fluida.

### Tests Unitarios Requeridos

#### Hook `useTour`

**Archivo:** `src/__tests__/unit/hooks/useTour.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTour } from '@/hooks/useTour';

describe('useTour', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('should initialize with not_started status', async () => {
    // Mock API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'not_started',
        current_step: 0,
        completed_steps: [],
      }),
    });

    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isActive).toBe(false);
      expect(result.current.currentStep).toBe(0);
    });
  });

  it('should start tour correctly', async () => {
    // Mock start mutation
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'in_progress', current_step: 0 }),
      });

    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    result.current.startTour();

    await waitFor(() => {
      expect(result.current.isActive).toBe(true);
    });
  });

  it('should complete step and advance', async () => {
    // Test step completion
  });

  it('should skip tour', async () => {
    // Test skip functionality
  });

  it('should restart tour', async () => {
    // Test restart functionality
  });

  it('should handle errors gracefully', async () => {
    // Test error handling
  });
});
```

#### Componente `TourCard`

**Archivo:** `src/__tests__/unit/components/onboarding/TourCard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TourCard } from '@/components/onboarding/TourCard';

describe('TourCard', () => {
  const mockStep = {
    id: 'test-step',
    title: 'Test Step',
    description: 'Test description',
    keyActions: ['Action 1', 'Action 2'],
    actionUrl: '/test',
    actionLabel: 'Go to Test',
  };

  it('should render step information correctly', () => {
    render(
      <TourCard
        step={mockStep}
        currentStep={0}
        totalSteps={5}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onSkip={vi.fn()}
        onComplete={vi.fn()}
        position="bottom"
        elementBounds={null}
      />
    );

    expect(screen.getByText('Test Step')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument();
  });

  it('should call onNext when next button clicked', () => {
    const onNext = vi.fn();
    render(
      <TourCard
        step={mockStep}
        currentStep={0}
        totalSteps={5}
        onNext={onNext}
        onPrevious={vi.fn()}
        onSkip={vi.fn()}
        onComplete={vi.fn()}
        position="bottom"
        elementBounds={null}
      />
    );

    fireEvent.click(screen.getByText('Siguiente'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('should disable previous button on first step', () => {
    render(
      <TourCard
        step={mockStep}
        currentStep={0}
        totalSteps={5}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onSkip={vi.fn()}
        onComplete={vi.fn()}
        position="bottom"
        elementBounds={null}
      />
    );

    const prevButton = screen.getByText('Anterior');
    expect(prevButton).toBeDisabled();
  });

  it('should show complete button on last step', () => {
    render(
      <TourCard
        step={mockStep}
        currentStep={4}
        totalSteps={5}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onSkip={vi.fn()}
        onComplete={vi.fn()}
        position="bottom"
        elementBounds={null}
      />
    );

    expect(screen.getByText('Finalizar')).toBeInTheDocument();
    expect(screen.queryByText('Siguiente')).not.toBeInTheDocument();
  });
});
```

### Tests de Integración Requeridos

#### API Routes

**Archivo:** `src/__tests__/integration/api/onboarding/tour.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestOrganization,
  createTestUser,
  cleanupTestData,
  makeAuthenticatedRequest,
} from "../../helpers/test-setup";

describe("Tour API - Integration Tests", () => {
  let org: any;
  let user: any;

  beforeAll(async () => {
    org = await createTestOrganization("Test Org", "basic");
    user = await createTestUser(org.id, "test@example.com");
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("should create tour progress on start", async () => {
    const response = await makeAuthenticatedRequest(
      "/api/onboarding/tour",
      {
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      },
      user,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("in_progress");
    expect(data.current_step).toBe(0);
  });

  it("should update step correctly", async () => {
    // Start tour first
    await makeAuthenticatedRequest(
      "/api/onboarding/tour",
      {
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      },
      user,
    );

    // Complete step 0
    const response = await makeAuthenticatedRequest(
      "/api/onboarding/tour/0",
      {
        method: "POST",
      },
      user,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.current_step).toBe(1);
    expect(data.completed_steps).toContain(0);
  });

  it("should mark tour as completed", async () => {
    const response = await makeAuthenticatedRequest(
      "/api/onboarding/tour",
      {
        method: "POST",
        body: JSON.stringify({ action: "complete" }),
      },
      user,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("completed");
  });

  it("should handle multi-tenancy correctly", async () => {
    // Create second org and user
    const org2 = await createTestOrganization("Test Org 2", "basic");
    const user2 = await createTestUser(org2.id, "test2@example.com");

    // Start tour for user1
    await makeAuthenticatedRequest(
      "/api/onboarding/tour",
      {
        method: "POST",
        body: JSON.stringify({ action: "start" }),
      },
      user,
    );

    // Get tour progress for user2 (should be not_started)
    const response = await makeAuthenticatedRequest(
      "/api/onboarding/tour",
      {
        method: "GET",
      },
      user2,
    );

    const data = await response.json();
    expect(data.status).toBe("not_started");
  });
});
```

#### Flujo Completo

**Archivo:** `src/__tests__/integration/onboarding/tour-flow.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TourProvider } from "@/components/onboarding/TourProvider";

describe("Tour Flow Integration", () => {
  it("should complete full tour flow", async () => {
    // Mock API responses
    // Render TourProvider
    // Simulate user completing each step
    // Verify progress saved correctly
    // Verify completion status
  });

  it("should resume tour from last step", async () => {
    // Mock partial completion
    // Verify tour resumes from correct step
  });

  it("should handle tour restart", async () => {
    // Mock completed tour
    // Restart tour
    // Verify starts from beginning
  });
});
```

### Tests E2E (Opcional)

**Archivo:** `src/__tests__/e2e/onboarding/tour.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Onboarding Tour E2E", () => {
  test("should complete tour as new user", async ({ page }) => {
    // Login as new user
    // Verify tour starts automatically
    // Complete all steps
    // Verify tour completion
  });

  test("should allow skipping tour", async ({ page }) => {
    // Start tour
    // Click skip button
    // Verify tour dismissed
  });

  test("should show tour button for completed tours", async ({ page }) => {
    // Login as user with completed tour
    // Verify tour button visible
    // Click to restart tour
  });
});
```

### Cobertura Objetivo

- **Tests Unitarios:** 90%+
- **Tests de Integración:** 85%+
- **Tests E2E:** Opcional pero recomendado para flujos críticos

### Comandos de Testing

```bash
# Ejecutar todos los tests del tour
npm run test:run -- src/__tests__/unit/hooks/useTour.test.ts
npm run test:run -- src/__tests__/unit/components/onboarding/
npm run test:run -- src/__tests__/integration/api/onboarding/tour.test.ts

# Coverage específico
npm run test:coverage -- src/__tests__/unit/hooks/useTour.test.ts
```

---

## 📝 Notas Adicionales

- El tour debe ser responsive y funcionar en móviles
- Considerar usar una librería como `react-joyride` o `intro.js` si se necesita más funcionalidad
- El tour puede ser extendido para incluir tooltips contextuales después de completarlo
- Considerar analytics para medir la efectividad del tour
- **Los tests son críticos para garantizar una experiencia de usuario fluida**

---

**Última Actualización:** 2026-01-29  
**Versión:** 1.0.0
