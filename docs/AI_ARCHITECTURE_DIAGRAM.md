# Arquitectura del Sistema de IA Mejorado - Opttius

## 🏗️ Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph "Capa de Interfaz"
        UI[Chatbot UI<br/>ChatbotContent.tsx]
        INSIGHTS[Smart Context Widget<br/>InsightCard.tsx]
    end

    subgraph "Capa de Control"
        AGENT[Agente IA<br/>Agent Core]
        INSIGHTS_ENGINE[Motor de Insights<br/>Insights Generator]
    end

    subgraph "Capa de Memoria y Contexto"
        ORG_MEM[Memoria Organizacional<br/>OrganizationalMemory]
        USER_MEM[Memoria de Usuario<br/>UserMemory]
        SEMANTIC_MEM[Memoria Semántica<br/>Vector Database]
    end

    subgraph "Capa de Herramientas"
        CRUD[CRUD Tools<br/>Products, Orders, Customers]
        ANALYTICS[Analytics Tools<br/>Business Flow, System Diagnosis]
        RECOMMENDATIONS[Recommendation Tools<br/>Sales Cross-sell]
    end

    subgraph "Capa de Proveedores IA"
        PROVIDERS[Proveedores IA<br/>OpenAI, Anthropic, Google, DeepSeek, OpenRouter]
        LOAD_BALANCER[Balanceador de Carga<br/>AILoadBalancer]
    end

    subgraph "Base de Datos"
        SUPABASE[Supabase PostgreSQL]
        EMBEDDINGS[Embeddings Table<br/>Vector Search]
    end

    UI --> AGENT
    UI --> INSIGHTS
    AGENT --> ORG_MEM
    AGENT --> USER_MEM
    AGENT --> SEMANTIC_MEM
    AGENT --> ANALYTICS
    AGENT --> PROVIDERS
    INSIGHTS_ENGINE --> ORG_MEM
    INSIGHTS_ENGINE --> PROVIDERS
    PROVIDERS --> LOAD_BALANCER
    LOAD_BALANCER --> PROVIDERS
    ORG_MEM --> SUPABASE
    USER_MEM --> SUPABASE
    SEMANTIC_MEM --> EMBEDDINGS
    ANALYTICS --> SUPABASE
```

---

## 🔄 Flujo de Trabajo del Agente Experto

```mermaid
sequenceDiagram
    participant User as Usuario
    participant UI as Chatbot UI
    participant Agent as Agente IA
    participant Memory as Memoria Organizacional
    participant Tools as Herramientas Analíticas
    participant Provider as Proveedor IA
    participant DB as Base de Datos

    User->>UI: Pregunta sobre el sistema
    UI->>Agent: Iniciar conversación
    Agent->>Memory: Obtener contexto organizacional
    Memory-->>Agent: Datos de la óptica específica
    Agent->>Tools: Analizar pregunta y contexto
    Tools-->>Agent: Información relevante
    Agent->>Provider: Generar respuesta con herramientas
    Provider-->>Agent: Respuesta con insights
    Agent->>DB: Guardar interacción
    Agent-->>UI: Respuesta contextualizada
    UI-->>User: Mostrar respuesta
```

---

## 📊 Sistema de Madurez Organizacional

```mermaid
graph LR
    subgraph "Fase 1: Nueva"
        A1[<7 días<br/>Sin órdenes]
        A2[Bienvenida]
        A3[Configuración inicial]
        A4[Guía de primeros pasos]
    end

    subgraph "Fase 2: Inicio"
        B1[7-30 días<br/><10 órdenes]
        B2[Análisis de datos iniciales]
        B3[Optimización de procesos básicos]
        B4[Mejoras en flujo de trabajo]
    end

    subgraph "Fase 3: Crecimiento"
        C1[30-90 días<br/><50 órdenes]
        C2[Análisis profundo de métricas]
        C3[Identificación de oportunidades]
        C4[Optimización y expansión]
    end

    subgraph "Fase 4: Establecida"
        D1[>90 días<br/>>50 órdenes]
        D2[Análisis avanzado de tendencias]
        D3[Excelencia operacional]
        D4[Innovación y optimización continua]
    end

    A1 --> A2 --> A3 --> A4
    B1 --> B2 --> B3 --> B4
    C1 --> C2 --> C3 --> C4
    D1 --> D2 --> D3 --> D4

    style A1 fill:#e1f5ff
    style B1 fill:#fff4e1
    style C1 fill:#e8f5e9
    style D1 fill:#f3e5f5
```

---

## 🛠️ Herramientas Analíticas Avanzadas

```mermaid
graph TD
    subgraph "Herramientas CRUD Básicas"
        H1[getProducts]
        H2[getOrders]
        H3[getCustomers]
        H4[getCategories]
    end

    subgraph "Herramientas Analíticas Nuevas"
        H5[analyzeBusinessFlow]
        H6[diagnoseSystem]
        H7[analyzeMarketTrends]
        H8[optimizeInventory]
        H9[generateRecommendations]
    end

    subgraph "Herramientas de Soporte"
        H10[getDashboardStats]
        H11[getSalesAnalytics]
        H12[getTicketById]
    end

    H1 --> CRUD
    H2 --> CRUD
    H3 --> CRUD
    H4 --> CRUD
    H5 --> ANALYTICS
    H6 --> ANALYTICS
    H7 --> ANALYTICS
    H8 --> ANALYTICS
    H9 --> ANALYTICS
    H10 --> SUPPORT
    H11 --> SUPPORT
    H12 --> SUPPORT

    style H5 fill:#ffeb3b
    style H6 fill:#ffeb3b
    style H7 fill:#ffeb3b
    style H8 fill:#ffeb3b
    style H9 fill:#ffeb3b
```

---

## 🔄 Ciclo de Vida de los Insights

```mermaid
stateDiagram-v2
    [*] --> Inicial: Sistema nuevo
    Inicial --> Evolucionando: Tiempo de uso
    Evolucionando --> Evolucionando: Datos crecientes
    Evolucionando --> Optimizado: Madurez organizacional
    Optimizado --> [*]: Sistema estable

    state Evolucionando {
        [*] --> Recopilando: Datos nuevos
        Recopilando --> Analizando: Procesamiento
        Analizando --> Generando: Insights
        Generando --> Priorizando: Clasificación
        Priorizando --> Mostrando: Presentación
        Mostrando --> Recopilando: Feedback usuario
    }

    state Optimizado {
        [*] --> Personalizando: Aprendizaje
        Personalizando --> Refinando: Mejoras
        Refinando --> Mostrando: Presentación
        Mostrando --> Personalizando: Feedback usuario
    }
```

---

## 🔄 Sistema de Balanceo de Carga de Proveedores

```mermaid
graph TB
    subgraph "Solicitud de IA"
        REQ[Solicitud de IA]
    end

    subgraph "Balanceador de Carga"
        BAL[AILoadBalancer]
        FILTER[Filtrar proveedores disponibles]
        SCORE[Calcular score por proveedor]
        SELECT[Seleccionar mejor proveedor]
    end

    subgraph "Criterios de Selección"
        CRIT1[Latencia]
        CRIT2[Tasa de error]
        CRIT3[Costo-efectividad]
        CRIT4[Soporte de herramientas]
    end

    subgraph "Proveedores"
        P1[OpenAI]
        P2[Anthropic]
        P3[Google]
        P4[DeepSeek]
        P5[OpenRouter]
    end

    REQ --> BAL
    BAL --> FILTER
    FILTER --> P1
    FILTER --> P2
    FILTER --> P3
    FILTER --> P4
    FILTER --> P5
    P1 --> SCORE
    P2 --> SCORE
    P3 --> SCORE
    P4 --> SCORE
    P5 --> SCORE
    SCORE --> SELECT
    SELECT --> REQ

    style BAL fill:#4caf50
    style SELECT fill:#2196f3
```

---

## 📈 Métricas de Rendimiento

```mermaid
graph LR
    subgraph "KPIs Técnicos"
        K1[Eliminación bug<br/>100%]
        K2[Reducción tiempo<br/>50%]
        K3[Aumento precisión<br/>70%]
        K4[Disponibilidad<br/>99.9%]
    end

    subgraph "KPIs de Usuario"
        U1[Mejora relevancia<br/>90%]
        U2[Aumento satisfacción<br/>80%]
        U3[Reducción consultas<br/>60%]
        U4[Incremento uso<br/>40%]
    end

    subgraph "KPIs de Negocio"
        B1[Mejora eficiencia<br/>30%]
        B2[Aumento ventas<br/>25%]
        B3[Reducción tiempo<br/>35%]
        B4[Incremento adopción<br/>50%]
    end

    K1 --> KPI
    K2 --> KPI
    K3 --> KPI
    K4 --> KPI
    U1 --> KPI
    U2 --> KPI
    U3 --> KPI
    U4 --> KPI
    B1 --> KPI
    B2 --> KPI
    B3 --> KPI
    B4 --> KPI

    style KPI fill:#ff9800
```

---

## 🔄 Flujo de Implementación

```mermaid
gantt
    title Plan de Implementación - 7 Semanas
    dateFormat  YYYY-MM-DD
    section Fase 1
    Corrección bug duplicación    :a1, 2026-02-07, 3d
    Optimización carga historial  :a2, after a1, 3d

    section Fase 2
    Rediseño prompts experto óptico :b1, after a2, 5d
    Memoria organizacional         :b2, after b1, 4d
    Herramientas analíticas        :b3, after b2, 6d

    section Fase 3
    Sistema madurez organizacional :c1, after b3, 5d
    Retroalimentación continua     :c2, after c1, 4d

    section Fase 4
    Integración OpenRouter         :d1, after c2, 4d
    Balanceo de carga              :d2, after d1, 3d

    section Fase 5
    Suite de pruebas               :e1, after d2, 5d
    Documentación                  :e2, after e1, 4d
```

---

## 🎯 Componentes Clave del Sistema Mejorado

### 1. Agente Experto Óptico

- **Conocimiento Especializado**: Terminología óptica, materiales, tratamientos
- **Memoria Organizacional**: Contexto específico de cada óptica
- **Herramientas Analíticas**: Análisis de flujo, diagnóstico, recomendaciones
- **Aprendizaje Continuo**: Mejora basado en interacciones

### 2. Sistema de Insights Evolutivos

- **Madurez Organizacional**: 4 fases de crecimiento
- **Prompts Adaptativos**: Mensajes que evolucionan con el tiempo
- **Retroalimentación**: Aprendizaje continuo de preferencias
- **Priorización Dinámica**: Insights según importancia

### 3. Balanceo de Carga Inteligente

- **Múltiples Proveedores**: OpenAI, Anthropic, Google, DeepSeek, OpenRouter
- **Criterios de Selección**: Latencia, costo, error rate, soporte de herramientas
- **Fallback Automático**: Cambio transparente entre proveedores
- **Optimización de Costos**: Selección de proveedores más económicos

### 4. Memoria Contextual

- **Organizacional**: Datos específicos de cada óptica
- **Usuario**: Preferencias y comportamiento
- **Semántica**: Búsqueda vectorial para contexto relevante
- **Persistente**: Guardada en base de datos

---

## 🚀 Beneficios Esperados

### Para el Usuario

- ✅ Respuestas contextualizadas y especializadas
- ✅ Análisis profundo del sistema y del negocio
- ✅ Insights relevantes que evolucionan con el tiempo
- ✅ Asistente que aprende y mejora continuamente

### Para la Óptica

- ✅ Mejora en eficiencia operativa
- ✅ Aumento en ventas cruzadas
- ✅ Reducción en tiempo de resolución de problemas
- ✅ Adopción de mejores prácticas

### Para el Sistema

- ✅ Mayor precisión y relevancia
- ✅ Mejor rendimiento
- ✅ Mayor disponibilidad
- ✅ Flexibilidad de proveedores

---

## 📋 Próximos Pasos Inmediatos

1. **Corrección del Bug** (Prioridad CRÍTICA)
   - Implementar solución en `ChatbotContent.tsx`
   - Probar carga de chats antiguos
   - Verificar eliminación de duplicados

2. **Transformación del Agente** (Prioridad ALTA)
   - Rediseñar prompts de sistema
   - Implementar memoria organizacional
   - Crear herramientas analíticas

3. **Sistema de Insights** (Prioridad ALTA)
   - Implementar madurez organizacional
   - Crear prompts adaptativos
   - Implementar retroalimentación

4. **Expansión de Proveedores** (Prioridad MEDIA)
   - Integrar OpenRouter
   - Implementar balanceo de carga
   - Configurar sistema de fallback

---

**Estado**: Arquitectura completa documentada y lista para implementación
**Tiempo Estimado**: 7 semanas
**Impacto**: Transformacional para la experiencia de usuario
