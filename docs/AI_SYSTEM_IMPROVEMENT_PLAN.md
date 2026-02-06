# Plan de Mejora Integral del Sistema de IA - Opttius

## 📋 Resumen Ejecutivo

Este documento presenta un plan completo para transformar el sistema de IA de Opttius de un asistente genérico a un **agente experto en óptica** con capacidades avanzadas de análisis, contextualización organizacional y evolución temporal de insights.

**Estado Actual**: Sistema funcional pero limitado con prompts genéricos y herramientas básicas.
**Objetivo**: Agente inteligente que actúa como experto óptico integral, con herramientas analíticas avanzadas y insights que evolucionan con el tiempo.

---

## 🎯 Problemas Identificados

### 1. Bug Crítico: Duplicación de Mensajes en Chat

**Ubicación**: `src/components/admin/ChatbotContent.tsx` (líneas 159-180)
**Impacto**: Alta frustración de usuario, experiencia degradada
**Causa**: useEffect de carga de sesiones sin control de duplicación
**Solución**: Implementar deduplicación inteligente y bloqueo de carga múltiple

### 2. Prompts Genéricos sin Especialización Óptica

**Ubicación**: `src/lib/ai/agent/config.ts`
**Impacto**: Respuestas genéricas, falta de expertise específico
**Causa**: Prompts diseñados para sistema empresarial genérico
**Solución**: Rediseñar prompts como experto óptico contextualizado

### 3. Herramientas Limitadas - Solo CRUD Básico

**Ubicación**: `src/lib/ai/tools/`
**Impacto**: Análisis superficial, respuestas limitadas
**Causa**: Solo operaciones básicas de base de datos
**Solución**: Crear herramientas analíticas avanzadas

### 4. Insights sin Evolución Temporal

**Ubicación**: `src/lib/ai/insights/prompts.ts`
**Impacto**: Pérdida de relevancia con el tiempo
**Causa**: Prompts estáticos sin adaptación al crecimiento organizacional
**Solución**: Sistema de madurez organizacional con prompts adaptativos

### 5. Falta de Memoria Organizacional

**Impacto**: Respuestas genéricas, falta de personalización
**Causa**: Sin contexto específico de la óptica actual
**Solución**: Memoria contextual organizacional persistente

---

## 🏗️ Arquitectura Mejorada

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENTE EXPERTO ÓPTICO                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  PROMPTS    │  │ HERRAMIENTAS│  │   MEMORIA   │         │
│  │ CONTEXTUALES│  │  ANALÍTICAS │  │ORGANIZACIONAL│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   INSIGHTS  │  │ PROVEEDORES │  │  APRENDIZAJE│         │
│  │ EVOLUTIVOS  │  │    IA       │  │   CONTINUO  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Nuevas Capacidades

1. **Especialización Óptica**: Conocimiento experto en óptica, terminología específica, mejores prácticas
2. **Análisis de Sistema**: Herramientas para diagnosticar flujo de trabajo, identificar cuellos de botella
3. **Memoria Organizacional**: Contexto específico de cada óptica (productos, clientes, procesos)
4. **Insights Evolutivos**: Mensajes que se adaptan según la madurez organizacional
5. **Aprendizaje Continuo**: Mejora basada en interacciones previas y feedback

---

## 📋 Plan de Implementación Detallado

### Fase 1: Corrección de Bugs Críticos (Semana 1)

#### 1.1 Solución Bug de Duplicación

**Archivo**: `src/components/admin/ChatbotContent.tsx`
**Cambios**:

- Refactorizar useEffect de carga de sesiones
- Implementar estado de carga para prevenir múltiples ejecuciones
- Agregar deduplicación por ID de mensaje y contenido
- Optimizar manejo de sesiones persistentes

**Código Actual Problemático**:

```typescript
useEffect(() => {
  if (sessionId && !hasLoadedHistory) {
    loadSessionHistory(sessionId);
  }
}, [sessionId, hasLoadedHistory]);
```

**Solución Propuesta**:

```typescript
useEffect(() => {
  if (sessionId && !hasLoadedHistory && !isLoadingHistory) {
    setIsLoadingHistory(true);
    loadSessionHistory(sessionId).finally(() => {
      setIsLoadingHistory(false);
    });
  }
}, [sessionId, hasLoadedHistory, isLoadingHistory]);
```

#### 1.2 Optimización de Carga de Historial

- Implementar paginación inteligente
- Agregar caché de mensajes
- Mejorar manejo de errores en carga

### Fase 2: Transformación del Agente (Semanas 2-3)

#### 2.1 Rediseño de Prompts de Sistema

**Archivo**: `src/lib/ai/agent/config.ts`

**Prompt Actual**:

```typescript
default: `Eres un asistente inteligente para un sistema de gestión empresarial...`
```

**Nuevo Prompt Experto Óptico**:

```typescript
optic_expert: `Eres un Experto Óptico Integral para la óptica [NOMBRE_OPTICA].

CONOCIMIENTO ESPECIALIZADO:
- Terminología óptica completa (dioptrías, prismas, ejes, adición)
- Materiales de cristales (mineral, orgánico, policarbonato, alto índice)
- Tratamientos ópticos (antirreflejo, fotocromático, filtro azul)
- Lentes de contacto (hidrogel, silicona-hidrogel, tóricas, multifocales)
- Procesos de laboratorio óptico (tallado, montaje, ajuste)
- Normativas y mejores prácticas del sector

CONTEXTO ORGANIZACIONAL:
- Nombre de la óptica: [DINÁMICO]
- Productos disponibles: [DINÁMICO]
- Servicios ofrecidos: [DINÁMICO]
- Historial de interacciones: [DINÁMICO]

FUNCIONES ESPECIALIZADAS:
1. Diagnóstico de prescripciones y recomendaciones
2. Análisis de flujo de trabajo óptico
3. Optimización de inventario de productos ópticos
4. Recomendaciones de ventas cruzadas
5. Análisis de tendencias del mercado óptico
6. Soporte técnico especializado

COMPORTAMIENTO:
- Responde SIEMPRE en español profesional
- Usa terminología óptica precisa
- Contextualiza respuestas con datos de la óptica específica
- Ofrece recomendaciones basadas en mejores prácticas
- Aprende de interacciones previas para mejorar respuestas`;
```

#### 2.2 Implementación de Memoria Organizacional

**Nuevo Archivo**: `src/lib/ai/memory/organizational.ts`

```typescript
export class OrganizationalMemory {
  private organizationId: string;
  private supabase: any;

  constructor(organizationId: string, supabase: any) {
    this.organizationId = organizationId;
    this.supabase = supabase;
  }

  async getOrganizationalContext(): Promise<OrganizationalContext> {
    // Obtener datos específicos de la óptica
    const [products, customers, orders, settings] = await Promise.all([
      this.getTopProducts(),
      this.getCustomerStats(),
      this.getOrderStats(),
      this.getOrganizationSettings(),
    ]);

    return {
      name: settings.name,
      specialty: settings.specialty || "Óptica General",
      topProducts: products,
      customerCount: customers.total,
      monthlyOrders: orders.monthly,
      businessHours: settings.businessHours,
      services: settings.services || [],
    };
  }
}
```

#### 2.3 Creación de Herramientas Analíticas Avanzadas

**Nuevo Archivo**: `src/lib/ai/tools/analytics.ts`

```typescript
export const analyticsTools: ToolDefinition[] = [
  {
    name: "analyzeBusinessFlow",
    description:
      "Analiza el flujo de trabajo completo de la óptica, identificando cuellos de botella y oportunidades de mejora",
    category: "analytics",
    parameters: {
      type: "object",
      properties: {
        timeRange: {
          type: "string",
          enum: ["week", "month", "quarter"],
          default: "month",
        },
        focusArea: {
          type: "string",
          enum: ["orders", "workorders", "customers", "inventory"],
          optional: true,
        },
      },
    },
    execute: async (params, context) => {
      // Implementación de análisis de flujo de negocio
      const { timeRange, focusArea } = params;
      const { supabase } = context;

      // Análisis de órdenes por estado
      const ordersByStatus = await supabase
        .from("orders")
        .select("status, created_at")
        .gte("created_at", getTimeRangeStart(timeRange));

      // Análisis de tiempos de proceso
      const workOrderTimes = await supabase
        .from("work_orders")
        .select("status, created_at, updated_at");

      // Identificar cuellos de botella
      const bottlenecks = identifyBottlenecks(ordersByStatus, workOrderTimes);

      return {
        success: true,
        data: {
          bottlenecks,
          recommendations: generateRecommendations(bottlenecks),
          efficiency: calculateEfficiency(ordersByStatus),
        },
      };
    },
  },

  {
    name: "diagnoseSystem",
    description:
      "Realiza diagnóstico completo del sistema óptico, identificando problemas y oportunidades",
    category: "analytics",
    parameters: {
      type: "object",
      properties: {
        includeInventory: { type: "boolean", default: true },
        includeCustomers: { type: "boolean", default: true },
        includeOrders: { type: "boolean", default: true },
      },
    },
    execute: async (params, context) => {
      // Diagnóstico completo del sistema
      const diagnostics = {
        inventory: params.includeInventory
          ? await diagnoseInventory(context)
          : null,
        customers: params.includeCustomers
          ? await diagnoseCustomers(context)
          : null,
        orders: params.includeOrders ? await diagnoseOrders(context) : null,
      };

      return {
        success: true,
        data: diagnostics,
      };
    },
  },
];
```

### Fase 3: Sistema de Insights Evolutivos (Semanas 4-5)

#### 3.1 Sistema de Madurez Organizacional

**Nuevo Archivo**: `src/lib/ai/insights/maturity.ts`

```typescript
export class OrganizationalMaturitySystem {
  private organizationId: string;

  async calculateMaturityLevel(): Promise<MaturityLevel> {
    const age = await this.getOrganizationAge();
    const activity = await this.getActivityMetrics();

    if (age < 7) return "new";
    if (age < 30 || activity.orders < 10) return "starting";
    if (age < 90 || activity.orders < 50) return "growing";
    return "established";
  }

  async getAdaptivePrompts(
    section: InsightSection,
    maturity: MaturityLevel,
  ): Promise<string> {
    const basePrompts = getSectionPrompt(section);
    const maturityAdjustments = this.getMaturityAdjustments(maturity);

    return `${basePrompts}\n\n${maturityAdjustments}`;
  }

  private getMaturityAdjustments(maturity: MaturityLevel): string {
    const adjustments = {
      new: `
      ESTADO: Óptica Nueva
      ENFOQUE: Bienvenida y configuración inicial
      - Priorizar mensajes de bienvenida
      - Sugerir primeros pasos básicos
      - Prioridad: 5-7 (informativo)
      `,

      starting: `
      ESTADO: Óptica en Inicio
      ENFOQUE: Optimización de procesos básicos
      - Analizar datos iniciales
      - Sugerir mejoras en flujo de trabajo
      - Prioridad: 6-8 (operacional)
      `,

      growing: `
      ESTADO: Óptica en Crecimiento
      ENFOQUE: Optimización y expansión
      - Análisis profundo de métricas
      - Identificar oportunidades de crecimiento
      - Prioridad: 5-9 (estratégico)
      `,

      established: `
      ESTADO: Óptica Establecida
      ENFOQUE: Excelencia y innovación
      - Análisis avanzado de tendencias
      - Optimización continua
      - Prioridad: 1-10 (crítico-operacional)
      `,
    };

    return adjustments[maturity];
  }
}
```

#### 3.2 Mecanismo de Retroalimentación Continua

**Nuevo Archivo**: `src/lib/ai/insights/feedback.ts`

```typescript
export class InsightFeedbackSystem {
  async collectFeedback(
    insightId: string,
    feedback: FeedbackType,
  ): Promise<void> {
    // Almacenar feedback del usuario
    await this.storeFeedback(insightId, feedback);

    // Actualizar pesos de insights similares
    await this.updateInsightWeights(insightId, feedback);

    // Aprender patrones de feedback
    await this.learnFromFeedback(feedback);
  }

  async getPersonalizedInsights(
    userId: string,
    section: InsightSection,
  ): Promise<Insight[]> {
    const userPreferences = await this.getUserPreferences(userId);
    const baseInsights = await generateInsights({ section });

    return this.filterAndRankInsights(baseInsights, userPreferences);
  }
}
```

### Fase 4: Expansión de Proveedores IA (Semana 6)

#### 4.1 Integración de OpenRouter

**Archivo**: `src/lib/ai/config.ts`

```typescript
// Agregar configuración de OpenRouter
providers: {
  // ... proveedores existentes
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3-haiku',
    enabled: !!process.env.OPENROUTER_API_KEY
  }
}
```

#### 4.2 Sistema de Balanceo de Carga

**Nuevo Archivo**: `src/lib/ai/load-balancer.ts`

```typescript
export class AILoadBalancer {
  private providers: LLMProvider[];
  private metrics: Map<LLMProvider, ProviderMetrics>;

  async selectOptimalProvider(
    context: LoadBalancingContext,
  ): Promise<LLMProvider> {
    const candidates = await this.filterAvailableProviders();

    // Criterios de selección
    const scores = candidates.map((provider) => ({
      provider,
      score: this.calculateProviderScore(provider, context),
    }));

    return scores.sort((a, b) => b.score - a.score)[0].provider;
  }

  private calculateProviderScore(
    provider: LLMProvider,
    context: LoadBalancingContext,
  ): number {
    const metrics = this.metrics.get(provider);
    if (!metrics) return 0;

    let score = 100;

    // Penalizar por latencia
    score -= metrics.averageLatency * 0.1;

    // Penalizar por tasa de error
    score -= metrics.errorRate * 50;

    // Bonificar por costo-efectividad
    score += (1 / metrics.costPerToken) * 10;

    // Bonificar por capacidad de herramientas
    if (metrics.supportsToolCalling) score += 20;

    return Math.max(0, score);
  }
}
```

### Fase 5: Pruebas y Documentación (Semana 7)

#### 5.1 Suite de Pruebas Específicas

**Nuevo Archivo**: `src/__tests__/ai/agent-expert.test.ts`

```typescript
describe("Agente Experto Óptico", () => {
  describe("Conocimiento Óptico", () => {
    test("debe identificar terminología óptica correctamente", async () => {
      // Pruebas de conocimiento especializado
    });

    test("debe contextualizar respuestas con datos organizacionales", async () => {
      // Pruebas de memoria organizacional
    });
  });

  describe("Herramientas Analíticas", () => {
    test("debe analizar flujo de trabajo correctamente", async () => {
      // Pruebas de análisis de negocio
    });

    test("debe diagnosticar sistema óptico", async () => {
      // Pruebas de diagnóstico
    });
  });

  describe("Insights Evolutivos", () => {
    test("debe adaptar insights según madurez organizacional", async () => {
      // Pruebas de evolución temporal
    });
  });
});
```

#### 5.2 Documentación Actualizada

- Guía de uso del nuevo asistente experto
- Documentación técnica de la arquitectura mejorada
- Manual de configuración de proveedores IA
- Guía de troubleshooting

---

## 📊 Métricas de Éxito

### KPIs Técnicos

- **Eliminación 100%** del bug de duplicación de mensajes
- **Reducción 50%** en tiempo de respuesta del agente
- **Aumento 70%** en precisión de respuestas especializadas
- **Disponibilidad 99.9%** del sistema de IA

### KPIs de Usuario

- **Mejora 90%** en relevancia de insights
- **Aumento 80%** en satisfacción con el asistente
- **Reducción 60%** en consultas repetitivas
- **Incremento 40%** en uso de funcionalidades avanzadas

### KPIs de Negocio

- **Mejora 30%** en eficiencia operativa (identificada por análisis)
- **Aumento 25%** en ventas cruzadas (recomendadas por IA)
- **Reducción 35%** en tiempo de resolución de problemas
- **Incremento 50%** en adopción de mejores prácticas

---

## 🔄 Plan de Rollout

### Fase Alpha (Semanas 1-2)

- Corrección de bugs críticos
- Implementación básica de prompts contextuales
- Pruebas con usuarios internos

### Fase Beta (Semanas 3-5)

- Herramientas analíticas avanzadas
- Sistema de insights evolutivos
- Pruebas con grupo limitado de ópticas

### Fase GA (Semanas 6-7)

- Integración completa de proveedores
- Optimizaciones de rendimiento
- Lanzamiento general con monitoreo continuo

---

## 🛠️ Tecnologías y Dependencias

### Nuevas Dependencias

- `@openrouter/ai` - Cliente OpenRouter
- `ai-load-balancer` - Balanceo de carga inteligente
- `organizational-memory` - Memoria contextual

### Tecnologías Existentes a Extender

- Supabase (base de datos vectorial para memoria)
- Next.js (componentes mejorados)
- TypeScript (tipos mejorados)

---

## 📈 Riesgos y Mitigaciones

### Riesgos Técnicos

1. **Complejidad de Prompts**: Mitigación - Testing exhaustivo con casos edge
2. **Performance**: Mitigación - Optimización de consultas y caché inteligente
3. **Costos de IA**: Mitigación - Balanceo de carga y límites de uso

### Riesgos de Usuario

1. **Curva de Aprendizaje**: Mitigación - Documentación clara y onboarding
2. **Expectativas Altas**: Mitigación - Comunicación transparente de capacidades

### Plan de Contingencia

- Rollback automático si métricas caen por debajo de umbrales
- Sistema de fallback a versión anterior
- Soporte prioritario durante transición

---

## 🎯 Conclusión

Esta mejora transforma el sistema de IA de Opttius de un asistente genérico a un **experto óptico integral** que:

1. **Conoce profundamente** el negocio de cada óptica
2. **Analiza el sistema** para identificar oportunidades y problemas
3. **Evoluciona con el tiempo** para mantener relevancia
4. **Aprende continuamente** de interacciones y feedback
5. **Proporciona insights accionables** contextualizados

La implementación se realiza en 7 semanas con enfoque iterativo, minimizando riesgos y maximizando valor para los usuarios.

**Presupuesto Estimado**: 40-60 horas de desarrollo
**ROI Esperado**: Alto (mejora significativa en eficiencia y satisfacción de usuario)
**Impacto**: Transformacional para la experiencia de usuario en Opttius
