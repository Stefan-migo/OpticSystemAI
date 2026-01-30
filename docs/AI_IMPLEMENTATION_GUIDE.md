# 🤖 Guía de Implementación: Sistema de IA Mejorado para Opttius

**Fecha Creación:** 2026-01-29  
**Estado:** 📋 Documentación Completa - Listo para Implementación  
**Objetivo:** Transformar el sistema de IA en un "Socio Gerente Activo" con widgets de inteligencia contextual en cada sección, mejorando el chatbot flotante y removiendo el chatbot del sidebar

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Análisis del Sistema Actual](#análisis-del-sistema-actual)
3. [Arquitectura Propuesta](#arquitectura-propuesta)
4. [Implementación por Módulo](#implementación-por-módulo)
5. [Mejoras del Chatbot Flotante](#mejoras-del-chatbot-flotante)
6. [Remoción del Chatbot del Sidebar](#remoción-del-chatbot-del-sidebar)
7. [Implementación Paso a Paso](#implementación-paso-a-paso)
8. [Estrategia de Costos](#estrategia-de-costos)

---

## 🎯 Visión General

### Objetivo

Transformar Opttius en un "Socio Gerente Activo" mediante:

1. **Widgets de Inteligencia Contextual** en cada vista principal que proporcionen insights accionables
2. **Chatbot Flotante Mejorado** como asistente conversacional siempre disponible
3. **Remoción del Chatbot del Sidebar** para reducir uso innecesario y simplificar la UI

### Filosofía UX

**"No me hagas pensar, dime qué hacer"**

La IA debe actuar como un asistente proactivo que:

- Analiza datos y proporciona insights relevantes
- Sugiere acciones concretas
- Explica el "por qué" detrás de las métricas
- Aprende de la retroalimentación del usuario

---

## 🔍 Análisis del Sistema Actual

### Estado Actual del Chatbot

**Ubicaciones:**

1. **Sidebar:** Item de navegación "Chatbot IA" (`/admin/chat`)
2. **Burbuja Flotante:** Botón flotante en esquina inferior derecha (`Chatbot.tsx`)

**Problemas Identificados:**

- El chatbot del sidebar ocupa espacio valioso
- No está funcionando correctamente al 100%
- El usuario puede acceder fácilmente desde la burbuja flotante
- Falta de integración contextual con las secciones

### Sistema de IA Actual

**Componentes:**

- `ChatbotContent.tsx`: Contenido principal del chat
- `Chatbot.tsx`: Componente flotante con Sheet
- `useChatSession.ts`: Hook para gestión de sesiones
- `useChatConfig.ts`: Hook para configuración
- API Route: `/api/admin/chat/route.ts`
- Agente AI: `src/lib/ai/agent/core.ts`

**Herramientas Disponibles:**

- Analytics
- Categories
- Customers
- Orders
- Products
- Support

---

## 🏗️ Arquitectura Propuesta

### Modelo de Datos

#### Nueva Tabla: `ai_insights`

```sql
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,

  -- Contexto del insight
  section TEXT NOT NULL, -- 'dashboard', 'inventory', 'clients', 'pos', 'analytics'
  type TEXT NOT NULL CHECK (type IN ('warning', 'opportunity', 'info', 'neutral')),

  -- Contenido
  title TEXT NOT NULL, -- Título corto (máx 100 caracteres)
  message TEXT NOT NULL, -- Explicación detallada (máx 500 caracteres)

  -- Acción sugerida
  action_label TEXT, -- Texto del botón (máx 50 caracteres)
  action_url TEXT, -- URL de destino
  metadata JSONB DEFAULT '{}'::jsonb, -- Datos para pre-rellenar formularios

  -- Estado y prioridad
  is_dismissed BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10) NOT NULL,

  -- Feedback del usuario
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),

  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_insights_org_section ON public.ai_insights(organization_id, section);
CREATE INDEX IF NOT EXISTS idx_ai_insights_priority ON public.ai_insights(priority DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_dismissed ON public.ai_insights(is_dismissed) WHERE is_dismissed = FALSE;

-- RLS Policies
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view insights for their org"
ON public.ai_insights FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM public.admin_users
    WHERE id = auth.uid() AND is_active = true
    LIMIT 1
  )
);

CREATE POLICY "Admins can manage insights for their org"
ON public.ai_insights FOR ALL
USING (
  organization_id = (
    SELECT organization_id FROM public.admin_users
    WHERE id = auth.uid() AND is_active = true
    LIMIT 1
  )
);
```

### Componentes Frontend

```
src/
├── components/
│   └── ai/
│       ├── SmartContextWidget.tsx    # Widget reutilizable para insights
│       ├── InsightCard.tsx           # Tarjeta individual de insight
│       └── ChatbotFloating.tsx       # Chatbot flotante mejorado
├── lib/
│   └── ai/
│       ├── insights/
│       │   ├── generator.ts          # Generador de insights por sección
│       │   ├── schemas.ts            # Schemas Zod para validación
│       │   └── prompts.ts            # Prompts del sistema por sección
│       └── agent/
│           └── core.ts               # Agente mejorado (ya existe)
└── app/
    └── api/
        └── ai/
            ├── insights/
            │   └── route.ts          # GET/POST insights
            └── generate/
            │   └── route.ts          # Generar insights para sección
            └── feedback/
                └── route.ts          # Feedback del usuario
```

---

## 📍 Implementación por Módulo

### 1. Dashboard (`/admin`)

**Rol:** El Gerente General  
**Trigger:** Cron Job diario a las 8:00 AM  
**Lógica:** Analizar ventas de ayer vs meta diaria + Trabajos atrasados

**Prompt del Sistema:**

```
Eres un asistente de gestión de óptica. Analiza las ventas de ayer de la {nombre_organizacion} y compáralas con el promedio del mes y la meta diaria de {meta_diaria}. Revisa si hay trabajos de laboratorio con fecha de entrega vencida. Genera un resumen ejecutivo de máximo 2 líneas. Si no hay problemas, genera un insight de tipo 'neutral' indicando que todo está en orden. Asigna prioridad del 1 al 10, donde 10 es crítico.
```

**Ejemplo de Insight:**

- **Tipo:** Warning ⚠️
- **Título:** "Ventas por debajo del promedio"
- **Mensaje:** "Ayer vendiste un 15% menos que tu promedio mensual. Tienes 3 trabajos atrasados para entrega hoy."
- **Acción:** "Ver Trabajos Atrasados" → `/admin/work-orders?status=overdue`

### 2. Punto de Venta (POS) (`/admin/pos`)

**Rol:** El Experto en Ventas (Upselling)  
**Trigger:** Tiempo Real - Al ingresar receta (OnBlur del campo 'esfera' o 'cilindro')  
**Lógica:** Sugerir materiales y tratamientos basados en dioptrías

**Prompt del Sistema:**

```
Eres un experto óptico de la {nombre_organizacion} especializado en venta y mejora de la experiencia visual. Basado en la dioptría {json_dioptria} y el historial de compras del cliente {json_historial_cliente}, sugiere el material de cristal ideal, un tratamiento complementario (antirreflejo, filtro azul, fotocromático) para maximizar la venta, estética y confort visual. Considera si el cliente tiene preferencia por alta gama. Asigna una prioridad del 1 al 10 a la recomendación.
```

**Ejemplo de Insight:**

- **Tipo:** Opportunity 🚀
- **Título:** "Recomendación de Alto Índice"
- **Mensaje:** "Para esta dioptría, el material de alto índice con filtro azul sería ideal. ¡Mejora la estética y protege de pantallas!"
- **Acción:** "Ver Opciones de Alto Índice" → `/admin/products?filter=high_index&treatment=blue_light`

### 3. Productos (Inventario) (`/admin/products`)

**Rol:** El Auditor de Stock  
**Trigger:** Cron Job Semanal (Lunes AM)  
**Lógica:** Buscar productos sin movimiento > 180 días

**Prompt del Sistema:**

```
Eres un auditor de inventario de óptica de la {nombre_organizacion}. Analiza esta lista de productos sin movimiento (Stock Zombie) en formato JSON: {json_productos_zombie}. Calcula el valor monetario total retenido y el margen potencial. Sugiere una estrategia de liquidación o bundling específica para estos productos. Si la {nombre_organizacion} tiene políticas de descuento para stock inactivo, menciónalas. Asigna prioridad del 1 al 10 (mayor valor inmovilizado = mayor prioridad).
```

**Ejemplo de Insight:**

- **Tipo:** Warning ⚠️
- **Título:** "Stock Zombie Detectado"
- **Mensaje:** "Detecté 45 armazones sin movimiento hace 6 meses, valor $850.000. Considera bundle 2x1 o 30% off para liberar capital."
- **Acción:** "Crear Oferta Liquidación" → `/admin/products/bulk?action=create_promotion&productIds=[ID1,ID2]`
- **Metadata:** `{ "productIds": [1, 2, 3], "suggestedDiscount": 30 }`

### 4. Clientes (CRM) (`/admin/customers`)

**Rol:** Marketing & Fidelización  
**Trigger:** Cron Job Diario  
**Lógica:** Buscar clientes inactivos > 12 meses (receta vencida) o > 6 meses (lentes de contacto)

**Prompt del Sistema:**

```
Eres un especialista en marketing y fidelización de la óptica {nombre_organizacion}. De esta lista de clientes inactivos en JSON: {json_clientes_inactivos}, redacta un mensaje de WhatsApp corto y empático (máximo 160 caracteres) invitándolos a su control anual o renovación de lentes de contacto, mencionando el beneficio (ej. salud visual, comodidad). Asigna prioridad del 1 al 10 (mayor tiempo inactivo = mayor prioridad).
```

**Ejemplo de Insight:**

- **Tipo:** Opportunity 🚀
- **Título:** "Clientes Requieren Renovación"
- **Mensaje:** "Hay 12 pacientes que deben renovar su receta este mes. Mensaje sugerido: '¡Hola [Nombre]! Te recordamos que tu control anual está próximo. ¡Tu salud visual es nuestra prioridad! Agenda tu cita aquí [link].'"
- **Acción:** "Enviar Recordatorios" → `/admin/customers?action=send_reminders&customerIds=[ID1,ID2]`
- **Metadata:** `{ "customerIds": [1, 2, 3], "messageTemplate": "..." }`

### 5. Analíticas (`/admin/analytics`)

**Rol:** Data Scientist  
**Trigger:** On Load (con caché de 24h)  
**Lógica:** Interpretar gráfico principal de ventas y tendencias

**Prompt del Sistema:**

```
Actúa como un analista de datos experto para la óptica {nombre_organizacion}. Explica en lenguaje natural (máximo 3 líneas) por qué las ventas cambiaron este mes/período ({periodo_analizado}), basándote en los siguientes datos de ventas {json_datos_ventas}, tendencias y desglose por categoría (Armazones, Cristales, Lentes de Contacto). Identifica el factor más influyente (ej. baja en ventas de armazones) y sugiere una pregunta de seguimiento clave o una acción. Asigna prioridad del 1 al 10 (mayor desviación de meta/tendencia = mayor prioridad).
```

**Ejemplo de Insight:**

- **Tipo:** Info / Warning ⚠️
- **Título:** "Análisis de Ventas del Mes"
- **Mensaje:** "Las ventas cayeron un 8% este mes, principalmente por una baja en armazones. Podría ser un efecto estacional o falta de stock en modelos populares."
- **Acción:** "Investigar Stock/Tendencias" → `/admin/products?filter=low_stock&category=frames`

---

## 💬 Mejoras del Chatbot Flotante

### Problemas Actuales

1. No funciona correctamente al 100%
2. Falta de contexto sobre la sección actual
3. No recuerda conversaciones anteriores de forma efectiva
4. Interfaz puede ser mejorada

### Mejoras Propuestas

#### 1. Contexto de Sección Actual

El chatbot debe saber en qué sección está el usuario y proporcionar ayuda contextual:

```typescript
// Detectar sección actual desde pathname
const currentSection = pathname.split("/")[2] || "dashboard";

// Inyectar contexto en el prompt del sistema
const systemPrompt = `
Eres un asistente experto de Opttius. El usuario está en la sección: ${currentSection}.
Proporciona ayuda específica para esta sección. Si el usuario pregunta sobre otra sección,
puedes ayudar pero también sugiere navegar a esa sección.
`;
```

#### 2. Memoria Mejorada

- Guardar contexto de conversaciones por sección
- Recordar preferencias del usuario
- Aprender de acciones anteriores

#### 3. Sugerencias Rápidas

Mostrar sugerencias rápidas basadas en la sección actual:

```typescript
const quickSuggestions = {
  dashboard: [
    "¿Cómo puedo mejorar mis ventas?",
    "Muéstrame los trabajos atrasados",
    "¿Qué productos tienen stock bajo?",
  ],
  pos: [
    "¿Qué material de lente recomiendas para esta dioptría?",
    "¿Cómo calcular el precio con descuento?",
    "¿Qué tratamientos van bien con este tipo de lente?",
  ],
  customers: [
    "¿Qué clientes necesitan seguimiento?",
    "¿Cómo crear un nuevo cliente?",
    "¿Cómo buscar por RUT?",
  ],
  // ...
};
```

#### 4. UI Mejorada

- Animaciones suaves
- Indicador de escritura mejorado
- Historial de conversaciones más accesible
- Botones de acción rápida

---

## 🗑️ Remoción del Chatbot del Sidebar

### Pasos para Remover

#### 1. Remover del Sidebar

**Archivo:** `src/app/admin/layout.tsx`

```typescript
// Remover esta línea del array de navegación:
{
  href: "/admin/chat",
  label: "Chatbot IA",
  icon: MessageSquare,
  description: "Asistente inteligente",
},
```

#### 2. Mantener Página de Chat (Opcional)

Si se quiere mantener la página `/admin/chat` para acceso directo, mantenerla pero no mostrar en el sidebar. El usuario puede acceder desde la burbuja flotante.

#### 3. Actualizar Navegación

Asegurarse de que no haya referencias al chatbot en el sidebar.

---

## 🚀 Implementación Paso a Paso

### Paso 1: Crear Migración de Base de Datos

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_ai_insights.sql`

```sql
-- Ver schema completo en sección "Arquitectura Propuesta"
```

### Paso 2: Crear Schemas de Validación

**Archivo:** `src/lib/ai/insights/schemas.ts`

```typescript
import { z } from "zod";

export const InsightSchema = z.object({
  insights: z.array(
    z.object({
      type: z.enum(["warning", "opportunity", "info", "neutral"]),
      title: z.string().max(100),
      message: z.string().max(500),
      action_label: z.string().max(50).optional(),
      action_url: z.string().url().optional(),
      priority: z.number().min(1).max(10),
      metadata: z.record(z.any()).optional(),
    }),
  ),
});

export type Insight = z.infer<typeof InsightSchema>["insights"][0];
```

### Paso 3: Crear Generador de Insights

**Archivo:** `src/lib/ai/insights/generator.ts`

```typescript
import { AIProvider } from "@/lib/ai/factory";
import { InsightSchema, Insight } from "./schemas";
import { getSectionPrompt } from "./prompts";

export async function generateInsights(
  section: string,
  data: any,
  organizationName: string,
): Promise<Insight[]> {
  const provider = AIProvider.getDefaultProvider();
  const prompt = getSectionPrompt(section, data, organizationName);

  const response = await provider.generate({
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: JSON.stringify(data) },
    ],
    schema: InsightSchema,
    temperature: 0.7,
  });

  return response.insights;
}
```

### Paso 4: Crear Componente SmartContextWidget

**Archivo:** `src/components/ai/SmartContextWidget.tsx`

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, AlertTriangle, TrendingUp, Info, CheckCircle, X } from 'lucide-react';
import { InsightCard } from './InsightCard';

interface SmartContextWidgetProps {
  section: string;
}

export function SmartContextWidget({ section }: SmartContextWidgetProps) {
  const queryClient = useQueryClient();

  const { data: insights = [], isLoading, error } = useQuery({
    queryKey: ['ai-insights', section],
    queryFn: async () => {
      const res = await fetch(`/api/ai/insights?section=${section}`);
      if (!res.ok) throw new Error('Failed to fetch insights');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  const dismissInsight = useMutation({
    mutationFn: async (insightId: string) => {
      const res = await fetch(`/api/ai/insights/${insightId}/dismiss`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to dismiss');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-insights', section]);
    },
  });

  const sendFeedback = useMutation({
    mutationFn: async ({ insightId, score }: { insightId: string; score: number }) => {
      const res = await fetch(`/api/ai/insights/${insightId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
      if (!res.ok) throw new Error('Failed to send feedback');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-insights', section]);
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg border bg-gray-50 flex items-center justify-center h-24 mb-6">
        <Sparkles className="w-6 h-6 text-gray-400 animate-pulse" />
        <span className="ml-2 text-sm text-gray-500">Cargando insights inteligentes...</span>
      </div>
    );
  }

  if (error || !insights.length) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {insights.map((insight: any) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          onDismiss={() => dismissInsight.mutate(insight.id)}
          onFeedback={(score) => sendFeedback.mutate({ insightId: insight.id, score })}
        />
      ))}
    </div>
  );
}
```

### Paso 5: Crear API Routes

**Archivo:** `src/app/api/ai/insights/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api/middleware";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || "dashboard";

    const { client } = await createClientFromRequest(request);

    // Obtener organización
    const { data: adminUser } = await client
      .from("admin_users")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!adminUser?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Obtener insights no descartados
    const { data: insights, error } = await client
      .from("ai_insights")
      .select("*")
      .eq("organization_id", adminUser.organization_id)
      .eq("section", section)
      .eq("is_dismissed", false)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching insights:", error);
      return NextResponse.json(
        { error: "Failed to fetch insights" },
        { status: 500 },
      );
    }

    return NextResponse.json(insights || []);
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Paso 6: Crear Cron Jobs (Supabase Edge Functions)

**Archivo:** `supabase/functions/generate-insights/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Implementar generación de insights por cron job
  // Llamar a generateInsights() y guardar en DB
});
```

### Paso 7: Integrar Widgets en Páginas

**Ejemplo en Dashboard:**

```typescript
import { SmartContextWidget } from '@/components/ai/SmartContextWidget';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <SmartContextWidget section="dashboard" />
      {/* ... resto del dashboard ... */}
    </div>
  );
}
```

### Paso 8: Mejorar Chatbot Flotante

**Archivo:** `src/components/ai/ChatbotFloating.tsx`

```typescript
'use client';

import { usePathname } from 'next/navigation';
import { Chatbot } from '@/components/admin/Chatbot';
import { useChatConfig } from '@/hooks/useChatConfig';

export function ChatbotFloating() {
  const pathname = usePathname();
  const currentSection = pathname.split('/')[2] || 'dashboard';

  // Inyectar contexto de sección en el chatbot
  // Mejorar UI y funcionalidad

  return <Chatbot />;
}
```

---

## 💰 Estrategia de Costos

### Reglas de Oro

1. **Nunca generar insights en cada renderizado** - Usar cron jobs y caché
2. **Caché agresivo** - Insights generados 1 vez al día/semana, frontend solo lee DB
3. **Modelos económicos** - Usar GPT-4o-mini o Claude 3 Haiku para análisis
4. **Monitoreo** - Implementar alertas de presupuesto en APIs

### Costos Estimados

- **Dashboard (diario):** ~$0.01/día
- **Inventario (semanal):** ~$0.02/semana
- **Clientes (diario):** ~$0.01/día
- **POS (tiempo real):** ~$0.05/día (depende del uso)
- **Analíticas (diario):** ~$0.01/día

**Total estimado:** ~$0.50/mes por organización

---

## ✅ Checklist de Implementación

- [ ] Crear migración de base de datos (`ai_insights`)
- [ ] Crear schemas de validación (Zod)
- [ ] Crear generador de insights
- [ ] Crear prompts por sección
- [ ] Crear componente `SmartContextWidget`
- [ ] Crear componente `InsightCard`
- [ ] Crear API routes (GET/POST insights, feedback)
- [ ] Crear cron jobs (Supabase Edge Functions)
- [ ] Integrar widgets en todas las páginas principales
- [ ] Mejorar chatbot flotante
- [ ] Remover chatbot del sidebar
- [ ] **Implementar tests (ver sección Testing)**
- [ ] Probar flujo completo
- [ ] Implementar monitoreo de costos

---

## 🧪 Testing del Sistema de IA

### Prioridad: 🔴 CRÍTICA

El sistema de IA es complejo y crítico para la experiencia del usuario. Requiere tests exhaustivos, especialmente para validar la generación de insights y el manejo de errores.

### Estrategia de Mocking

**⚠️ IMPORTANTE:** Todas las llamadas a LLMs deben ser mockeadas en tests para:

- Evitar costos de API
- Garantizar respuestas consistentes
- Acelerar ejecución de tests
- Permitir tests determinísticos

### Tests Unitarios Requeridos

#### Generador de Insights

**Archivo:** `src/__tests__/unit/lib/ai/insights/generator.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateInsights } from "@/lib/ai/insights/generator";
import { AIProvider } from "@/lib/ai/factory";

describe("Insight Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate insights for dashboard section", async () => {
    // Mock LLM response
    const mockLLMResponse = {
      insights: [
        {
          type: "warning",
          title: "Ventas por debajo del promedio",
          message: "Ayer vendiste un 15% menos que tu promedio mensual.",
          priority: 8,
          action_label: "Ver Trabajos Atrasados",
          action_url: "/admin/work-orders?status=overdue",
        },
      ],
    };

    vi.spyOn(AIProvider, "getDefaultProvider").mockReturnValue({
      generate: vi.fn().mockResolvedValue(mockLLMResponse),
    } as any);

    const dashboardData = {
      yesterdaySales: 50000,
      monthlyAverage: 58823,
      overdueWorkOrders: 3,
    };

    const insights = await generateInsights(
      "dashboard",
      dashboardData,
      "Test Organization",
    );

    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe("warning");
    expect(insights[0].priority).toBe(8);
  });

  it("should handle LLM errors gracefully", async () => {
    vi.spyOn(AIProvider, "getDefaultProvider").mockReturnValue({
      generate: vi.fn().mockRejectedValue(new Error("API Error")),
    } as any);

    await expect(
      generateInsights("dashboard", {}, "Test Organization"),
    ).rejects.toThrow("API Error");
  });

  it("should validate insight schema correctly", async () => {
    // Mock invalid LLM response
    const mockInvalidResponse = {
      insights: [
        {
          type: "invalid_type", // Invalid
          title: "A".repeat(200), // Too long
          // Missing required fields
        },
      ],
    };

    vi.spyOn(AIProvider, "getDefaultProvider").mockReturnValue({
      generate: vi.fn().mockResolvedValue(mockInvalidResponse),
    } as any);

    await expect(
      generateInsights("dashboard", {}, "Test Organization"),
    ).rejects.toThrow();
  });

  it("should assign correct priority", async () => {
    // Test priority assignment logic
  });
});
```

#### Schemas de Validación

**Archivo:** `src/__tests__/unit/lib/ai/insights/schemas.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { InsightSchema } from "@/lib/ai/insights/schemas";

describe("Insight Schemas", () => {
  it("should validate insight schema correctly", () => {
    const validInsight = {
      insights: [
        {
          type: "warning",
          title: "Test Title",
          message: "Test message",
          priority: 5,
        },
      ],
    };

    expect(() => InsightSchema.parse(validInsight)).not.toThrow();
  });

  it("should reject invalid insight types", () => {
    const invalidInsight = {
      insights: [
        {
          type: "invalid_type",
          title: "Test",
          message: "Test",
          priority: 5,
        },
      ],
    };

    expect(() => InsightSchema.parse(invalidInsight)).toThrow();
  });

  it("should enforce character limits", () => {
    const invalidInsight = {
      insights: [
        {
          type: "warning",
          title: "A".repeat(200), // Exceeds 100 char limit
          message: "Test",
          priority: 5,
        },
      ],
    };

    expect(() => InsightSchema.parse(invalidInsight)).toThrow();
  });

  it("should validate action_url format", () => {
    const invalidInsight = {
      insights: [
        {
          type: "warning",
          title: "Test",
          message: "Test",
          priority: 5,
          action_url: "not-a-valid-url",
        },
      ],
    };

    expect(() => InsightSchema.parse(invalidInsight)).toThrow();
  });
});
```

#### Componentes

**Archivo:** `src/__tests__/unit/components/ai/SmartContextWidget.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SmartContextWidget } from '@/components/ai/SmartContextWidget';

describe('SmartContextWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('should render loading state', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(
      <QueryClientProvider client={queryClient}>
        <SmartContextWidget section="dashboard" />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Cargando insights/i)).toBeInTheDocument();
  });

  it('should render insights correctly', async () => {
    const mockInsights = [
      {
        id: '1',
        type: 'warning',
        title: 'Test Warning',
        message: 'Test message',
        priority: 8,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockInsights,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SmartContextWidget section="dashboard" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Warning')).toBeInTheDocument();
    });
  });

  it('should handle dismiss action', async () => {
    const mockInsights = [
      {
        id: '1',
        type: 'warning',
        title: 'Test',
        message: 'Test',
        priority: 5,
      },
    ];

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsights,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(
      <QueryClientProvider client={queryClient}>
        <SmartContextWidget section="dashboard" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    // Click dismiss button
    const dismissButton = screen.getByRole('button', { name: /×/i });
    dismissButton.click();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/insights/1/dismiss'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('should show neutral insight when no problems', async () => {
    const mockInsights = [
      {
        id: '1',
        type: 'neutral',
        title: 'Todo está bien',
        message: 'No hay problemas detectados',
        priority: 1,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockInsights,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SmartContextWidget section="dashboard" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Todo está bien')).toBeInTheDocument();
    });
  });
});
```

**Archivo:** `src/__tests__/unit/components/ai/InsightCard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InsightCard } from '@/components/ai/InsightCard';

describe('InsightCard', () => {
  const mockInsight = {
    id: '1',
    type: 'warning',
    title: 'Test Warning',
    message: 'Test message',
    priority: 8,
    action_label: 'View Details',
    action_url: '/admin/test',
    metadata: { productIds: [1, 2, 3] },
  };

  it('should render different types correctly', () => {
    const types = ['warning', 'opportunity', 'info', 'neutral'];

    types.forEach((type) => {
      const { container, unmount } = render(
        <InsightCard
          insight={{ ...mockInsight, type }}
          onDismiss={vi.fn()}
          onFeedback={vi.fn()}
        />
      );

      expect(screen.getByText('Test Warning')).toBeInTheDocument();
      unmount();
    });
  });

  it('should call onDismiss when dismissed', () => {
    const onDismiss = vi.fn();
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={onDismiss}
        onFeedback={vi.fn()}
      />
    );

    const dismissButton = screen.getByRole('button', { name: /×/i });
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should call onFeedback when rated', () => {
    const onFeedback = vi.fn();
    render(
      <InsightCard
        insight={mockInsight}
        onDismiss={vi.fn()}
        onFeedback={onFeedback}
      />
    );

    const starButton = screen.getByTitle('5 estrellas');
    fireEvent.click(starButton);

    expect(onFeedback).toHaveBeenCalledWith(5);
  });

  it('should handle action button click', () => {
    const { container } = render(
      <InsightCard
        insight={mockInsight}
        onDismiss={vi.fn()}
        onFeedback={vi.fn()}
      />
    );

    const actionButton = screen.getByText('View Details');
    fireEvent.click(actionButton);

    // Verify URL constructed with metadata
    expect(window.location.href).toContain('/admin/test');
  });

  it('should pre-fill form with metadata', () => {
    // Test metadata pre-filling logic
  });
});
```

### Tests de Integración Requeridos

#### API Routes

**Archivo:** `src/__tests__/integration/api/ai/insights.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestOrganization,
  createTestUser,
  cleanupTestData,
  makeAuthenticatedRequest,
} from "../../helpers/test-setup";

describe("AI Insights API - Integration Tests", () => {
  let org: any;
  let user: any;

  beforeAll(async () => {
    org = await createTestOrganization("Test Org", "basic");
    user = await createTestUser(org.id, "test@example.com");
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("should fetch insights for section", async () => {
    // Create test insight in DB
    // Fetch insights
    // Verify returned correctly
  });

  it("should filter dismissed insights", async () => {
    // Create dismissed and active insights
    // Fetch insights
    // Verify only active returned
  });

  it("should order by priority", async () => {
    // Create insights with different priorities
    // Fetch insights
    // Verify ordered correctly
  });

  it("should respect organization isolation", async () => {
    // Create insights for different orgs
    // Verify isolation
  });

  it("should handle dismiss action", async () => {
    const response = await makeAuthenticatedRequest(
      "/api/ai/insights/test-id/dismiss",
      {
        method: "POST",
      },
      user,
    );

    expect(response.status).toBe(200);
    // Verify insight marked as dismissed
  });

  it("should handle feedback action", async () => {
    const response = await makeAuthenticatedRequest(
      "/api/ai/insights/test-id/feedback",
      {
        method: "POST",
        body: JSON.stringify({ score: 5 }),
      },
      user,
    );

    expect(response.status).toBe(200);
    // Verify feedback saved
  });
});
```

#### Generación de Insights

**Archivo:** `src/__tests__/integration/api/ai/generate-insights.test.ts`

```typescript
describe("Generate Insights API - Integration Tests", () => {
  it("should generate insights for dashboard", async () => {
    // Mock LLM response
    // Call API
    // Verify insights created in DB
    // Verify schema validation
  });

  it("should handle LLM errors", async () => {
    // Mock LLM error
    // Call API
    // Verify error handled gracefully
  });

  it("should cache insights correctly", async () => {
    // Generate insights
    // Verify cached
    // Generate again
    // Verify uses cache
  });
});
```

#### Cron Jobs (Mocked)

**Archivo:** `src/__tests__/integration/ai/cron-jobs.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("AI Insights Cron Jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate dashboard insights daily", async () => {
    // Mock Supabase Edge Function
    // Mock LLM response
    // Call cron job
    // Verify insights generated
    // Verify saved to DB
  });

  it("should generate inventory insights weekly", async () => {
    // Similar to above
  });

  it("should generate client insights daily", async () => {
    // Similar to above
  });
});
```

#### Integración por Sección

**Archivo:** `src/__tests__/integration/ai/sections/dashboard.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

describe("Dashboard AI Insights Integration", () => {
  it("should show insights on dashboard load", async () => {
    // Mock API response
    // Render dashboard with SmartContextWidget
    // Verify insights displayed
  });

  it("should update insights when data changes", async () => {
    // Test reactivity
  });

  it("should handle action buttons correctly", async () => {
    // Test action button clicks
    // Verify navigation
  });
});
```

**Archivo:** `src/__tests__/integration/ai/sections/pos.test.ts`

```typescript
describe("POS AI Insights Integration", () => {
  it("should generate suggestion on prescription input", async () => {
    // Mock prescription input
    // Verify suggestion generated
  });

  it("should show recommendation card", async () => {
    // Verify UI displays recommendation
  });

  it("should handle action to view products", async () => {
    // Test action button
    // Verify navigation to products
  });
});
```

### Tests E2E (Opcional)

**Archivo:** `src/__tests__/e2e/ai/insights.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("AI Insights E2E", () => {
  test("should show and interact with insights", async ({ page }) => {
    // Login
    // Navigate to dashboard
    // Verify insights displayed
    // Click dismiss
    // Verify dismissed
  });

  test("should provide feedback on insight", async ({ page }) => {
    // Login
    // Navigate to dashboard
    // Rate insight
    // Verify feedback saved
  });
});
```

### Cobertura Objetivo

- **Tests Unitarios:** 80%+
- **Tests de Integración:** 75%+
- **Enfoque especial en:** Validación de schemas, manejo de errores, mocking de LLMs

### Comandos de Testing

```bash
# Ejecutar tests de IA
npm run test:run -- src/__tests__/unit/lib/ai/
npm run test:run -- src/__tests__/unit/components/ai/
npm run test:run -- src/__tests__/integration/api/ai/

# Coverage específico
npm run test:coverage -- src/__tests__/unit/lib/ai/insights/
```

### Notas Importantes

1. **Mocking de LLMs es crítico** - Nunca hacer llamadas reales en tests
2. **Validar schemas exhaustivamente** - Los insights deben cumplir formato exacto
3. **Probar manejo de errores** - LLMs pueden fallar, el sistema debe manejarlo
4. **Validar multi-tenancy** - Insights deben estar aislados por organización

---

**Última Actualización:** 2026-01-29  
**Versión:** 1.0.0
