# 🧪 Estrategia de Testing para Nuevas Implementaciones

**Fecha Creación:** 2026-01-29  
**Objetivo:** Definir qué implementaciones requieren tests y cómo estructurarlos

---

## 📊 Análisis por Implementación

### 1. ✅ Login/Signup Mejorados

**Prioridad de Testing:** 🟢 BAJA

**Razón:**

- Solo cambios de UI/textos (traducción)
- La lógica de autenticación ya existe y funciona
- No hay cambios funcionales

**Tests Recomendados:**

- ⚠️ Tests E2E opcionales para verificar que los textos están en español
- ✅ No requiere tests unitarios ni de integración nuevos

---

### 2. ✅ Landing Page con Detección de Auth

**Prioridad de Testing:** 🟡 MEDIA

**Razón:**

- Lógica nueva de detección de autenticación
- Cambio en comportamiento de UI según estado
- Impacto en UX

**Tests Recomendados:**

#### Tests Unitarios

```typescript
// src/__tests__/unit/components/landing/LandingHeader.test.tsx
describe("LandingHeader", () => {
  it("should show login/signup buttons when user is not authenticated", () => {});
  it("should show dashboard button when user is authenticated", () => {});
  it("should handle loading state correctly", () => {});
});
```

#### Tests de Integración

```typescript
// src/__tests__/integration/components/landing/LandingHeader.test.tsx
describe("LandingHeader Integration", () => {
  it("should detect authenticated user from Supabase", () => {});
  it("should redirect to dashboard when clicking dashboard button", () => {});
});
```

**Cobertura Esperada:** 70-80%

---

### 3. 🎯 Tour de Primera Visita (Onboarding Tour)

**Prioridad de Testing:** 🔴 ALTA

**Razón:**

- Funcionalidad compleja con múltiples componentes
- Interacción con base de datos
- Flujo crítico para UX de nuevos usuarios
- Múltiples estados y transiciones

**Tests Requeridos:**

#### Tests Unitarios

**Hook `useTour`:**

```typescript
// src/__tests__/unit/hooks/useTour.test.ts
describe("useTour", () => {
  it("should initialize with not_started status", () => {});
  it("should start tour correctly", () => {});
  it("should complete step and advance", () => {});
  it("should skip tour", () => {});
  it("should restart tour", () => {});
  it("should handle errors gracefully", () => {});
});
```

**Componentes:**

```typescript
// src/__tests__/unit/components/onboarding/TourCard.test.tsx
describe("TourCard", () => {
  it("should render step information correctly", () => {});
  it("should call onNext when next button clicked", () => {});
  it("should call onSkip when skip button clicked", () => {});
  it("should disable previous button on first step", () => {});
  it("should show complete button on last step", () => {});
});

// src/__tests__/unit/components/onboarding/TourOverlay.test.tsx
describe("TourOverlay", () => {
  it("should create spotlight effect correctly", () => {});
  it("should update bounds on scroll/resize", () => {});
  it("should not render when not active", () => {});
});
```

#### Tests de Integración

**API Routes:**

```typescript
// src/__tests__/integration/api/onboarding/tour.test.ts
describe("Tour API", () => {
  it("should create tour progress on start", () => {});
  it("should update step correctly", () => {});
  it("should mark tour as completed", () => {});
  it("should handle multi-tenancy correctly", () => {});
  it("should return correct progress for user", () => {});
});
```

**Flujo Completo:**

```typescript
// src/__tests__/integration/onboarding/tour-flow.test.ts
describe("Tour Flow Integration", () => {
  it("should complete full tour flow", async () => {
    // 1. Start tour
    // 2. Complete each step
    // 3. Verify progress saved
    // 4. Complete tour
    // 5. Verify completion status
  });

  it("should resume tour from last step", () => {});
  it("should handle tour restart", () => {});
});
```

#### Tests E2E (Opcional pero Recomendado)

```typescript
// src/__tests__/e2e/onboarding/tour.spec.ts
describe("Onboarding Tour E2E", () => {
  it("should complete tour as new user", () => {});
  it("should allow skipping tour", () => {});
  it("should show tour button for completed tours", () => {});
});
```

**Cobertura Esperada:** 85-90%

---

### 4. 👁️ Integración de Lentes de Contacto

**Prioridad de Testing:** 🔴 ALTA

**Razón:**

- Nueva funcionalidad crítica del negocio
- Cálculos de precios complejos
- Integración con módulos existentes
- Validación de datos importante

**Tests Requeridos:**

#### Tests Unitarios

**Función SQL `calculate_contact_lens_price`:**

```typescript
// src/__tests__/unit/lib/contact-lens/calculate-price.test.ts
describe("calculate_contact_lens_price", () => {
  it("should calculate price for spherical lens", () => {});
  it("should calculate price for toric lens", () => {});
  it("should calculate price for multifocal lens", () => {});
  it("should return null if no matching matrix found", () => {});
  it("should respect organization_id isolation", () => {});
});
```

**Validación de Schemas:**

```typescript
// src/__tests__/unit/types/contact-lens-schemas.test.ts
describe("Contact Lens Schemas", () => {
  it("should validate contact lens family schema", () => {});
  it("should validate price matrix schema", () => {});
  it("should reject invalid use_type", () => {});
  it("should reject invalid modality", () => {});
});
```

#### Tests de Integración

**API Routes:**

```typescript
// src/__tests__/integration/api/contact-lens-families.test.ts
describe("Contact Lens Families API", () => {
  it("should create contact lens family", () => {});
  it("should list families with multi-tenancy", () => {});
  it("should update family correctly", () => {});
  it("should soft delete family", () => {});
  it("should validate required fields", () => {});
});

// src/__tests__/integration/api/contact-lens-matrices.test.ts
describe("Contact Lens Price Matrices API", () => {
  it("should create price matrix", () => {});
  it("should calculate price correctly", () => {});
  it("should handle overlapping ranges", () => {});
  it("should respect organization isolation", () => {});
});
```

**Integración con Quotes:**

```typescript
// src/__tests__/integration/api/quotes-contact-lens.test.ts
describe("Quotes with Contact Lenses", () => {
  it("should create quote with contact lenses", () => {});
  it("should calculate total price correctly", () => {});
  it("should save contact lens RX correctly", () => {});
});
```

**Integración con Lab Work Orders:**

```typescript
// src/__tests__/integration/api/work-orders-contact-lens.test.ts
describe("Work Orders with Contact Lenses", () => {
  it("should create work order with contact lenses", () => {});
  it("should track contact lens adaptation", () => {});
});
```

**Cobertura Esperada:** 80-85%

---

### 5. 🤖 Sistema de IA Mejorado

**Prioridad de Testing:** 🔴 CRÍTICA

**Razón:**

- Sistema complejo con múltiples componentes
- Generación de contenido con LLMs
- Integración con múltiples secciones
- Costos asociados (necesita validación)
- Crítico para experiencia del usuario

**Tests Requeridos:**

#### Tests Unitarios

**Generador de Insights:**

```typescript
// src/__tests__/unit/lib/ai/insights/generator.test.ts
describe("Insight Generator", () => {
  it("should generate insights for dashboard section", async () => {
    // Mock LLM response
    // Verify schema validation
    // Verify insight structure
  });

  it("should handle LLM errors gracefully", () => {});
  it("should validate insight schema correctly", () => {});
  it("should assign correct priority", () => {});
});
```

**Schemas de Validación:**

```typescript
// src/__tests__/unit/lib/ai/insights/schemas.test.ts
describe("Insight Schemas", () => {
  it("should validate insight schema correctly", () => {});
  it("should reject invalid insight types", () => {});
  it("should enforce character limits", () => {});
  it("should validate action_url format", () => {});
});
```

**Componentes:**

```typescript
// src/__tests__/unit/components/ai/SmartContextWidget.test.tsx
describe("SmartContextWidget", () => {
  it("should render loading state", () => {});
  it("should render insights correctly", () => {});
  it("should handle dismiss action", () => {});
  it("should handle feedback action", () => {});
  it("should show neutral insight when no problems", () => {});
});

// src/__tests__/unit/components/ai/InsightCard.test.tsx
describe("InsightCard", () => {
  it("should render different types correctly", () => {
    // warning, opportunity, info, neutral
  });
  it("should call onDismiss when dismissed", () => {});
  it("should call onFeedback when rated", () => {});
  it("should handle action button click", () => {});
  it("should pre-fill form with metadata", () => {});
});
```

#### Tests de Integración

**API Routes:**

```typescript
// src/__tests__/integration/api/ai/insights.test.ts
describe("AI Insights API", () => {
  it("should fetch insights for section", () => {});
  it("should filter dismissed insights", () => {});
  it("should order by priority", () => {});
  it("should respect organization isolation", () => {});
  it("should handle dismiss action", () => {});
  it("should handle feedback action", () => {});
});

// src/__tests__/integration/api/ai/generate-insights.test.ts
describe("Generate Insights API", () => {
  it("should generate insights for dashboard", async () => {
    // Mock data
    // Call API
    // Verify insights created
    // Verify schema validation
  });

  it("should handle LLM errors", () => {});
  it("should cache insights correctly", () => {});
});
```

**Cron Jobs (Mocked):**

```typescript
// src/__tests__/integration/ai/cron-jobs.test.ts
describe("AI Insights Cron Jobs", () => {
  it("should generate dashboard insights daily", async () => {
    // Mock Supabase Edge Function
    // Verify insights generated
    // Verify saved to DB
  });

  it("should generate inventory insights weekly", () => {});
  it("should generate client insights daily", () => {});
});
```

**Integración por Sección:**

```typescript
// src/__tests__/integration/ai/sections/dashboard.test.ts
describe("Dashboard AI Insights", () => {
  it("should show insights on dashboard load", () => {});
  it("should update insights when data changes", () => {});
  it("should handle action buttons correctly", () => {});
});

// src/__tests__/integration/ai/sections/pos.test.ts
describe("POS AI Insights", () => {
  it("should generate suggestion on prescription input", () => {});
  it("should show recommendation card", () => {});
  it("should handle action to view products", () => {});
});
```

#### Tests E2E (Opcional pero Recomendado)

```typescript
// src/__tests__/e2e/ai/insights.spec.ts
describe("AI Insights E2E", () => {
  it("should show and interact with insights", () => {});
  it("should dismiss insight and not show again", () => {});
  it("should provide feedback on insight", () => {});
});
```

**Cobertura Esperada:** 75-80% (LLM calls mocked)

---

## 📋 Resumen de Prioridades

| Implementación  | Prioridad  | Tests Unitarios | Tests Integración | Tests E2E   | Cobertura Objetivo |
| --------------- | ---------- | --------------- | ----------------- | ----------- | ------------------ |
| Login/Signup    | 🟢 Baja    | ❌              | ❌                | ⚠️ Opcional | N/A                |
| Landing Auth    | 🟡 Media   | ✅              | ✅                | ❌          | 70-80%             |
| Onboarding Tour | 🔴 Alta    | ✅              | ✅                | ✅ Opcional | 85-90%             |
| Lentes Contacto | 🔴 Alta    | ✅              | ✅                | ❌          | 80-85%             |
| Sistema IA      | 🔴 Crítica | ✅              | ✅                | ✅ Opcional | 75-80%             |

---

## 🛠️ Estructura de Tests Propuesta

```
src/
└── __tests__/
    ├── unit/
    │   ├── hooks/
    │   │   └── useTour.test.ts
    │   ├── components/
    │   │   ├── landing/
    │   │   │   └── LandingHeader.test.tsx
    │   │   ├── onboarding/
    │   │   │   ├── TourCard.test.tsx
    │   │   │   └── TourOverlay.test.tsx
    │   │   └── ai/
    │   │       ├── SmartContextWidget.test.tsx
    │   │       └── InsightCard.test.tsx
    │   └── lib/
    │       ├── contact-lens/
    │       │   └── calculate-price.test.ts
    │       └── ai/
    │           └── insights/
    │               ├── generator.test.ts
    │               └── schemas.test.ts
    ├── integration/
    │   ├── api/
    │   │   ├── onboarding/
    │   │   │   └── tour.test.ts
    │   │   ├── contact-lens-families.test.ts
    │   │   ├── contact-lens-matrices.test.ts
    │   │   ├── quotes-contact-lens.test.ts
    │   │   ├── work-orders-contact-lens.test.ts
    │   │   └── ai/
    │   │       ├── insights.test.ts
    │   │       └── generate-insights.test.ts
    │   ├── components/
    │   │   └── landing/
    │   │       └── LandingHeader.test.tsx
    │   ├── onboarding/
    │   │   └── tour-flow.test.ts
    │   └── ai/
    │       ├── cron-jobs.test.ts
    │       └── sections/
    │           ├── dashboard.test.ts
    │           └── pos.test.ts
    └── e2e/
        ├── onboarding/
        │   └── tour.spec.ts
        └── ai/
            └── insights.spec.ts
```

---

## 🎯 Recomendaciones Finales

### Implementación Prioritaria

1. **Sistema de IA** - Crítico para experiencia del usuario
2. **Lentes de Contacto** - Funcionalidad crítica del negocio
3. **Onboarding Tour** - Importante para adopción
4. **Landing Auth** - Mejora UX pero no crítico
5. **Login/Signup** - No requiere tests nuevos

### Estrategia de Implementación

1. **Empezar con Tests Unitarios** - Más rápidos, mejor feedback
2. **Luego Tests de Integración** - Validar flujos completos
3. **Finalmente Tests E2E** - Solo para flujos críticos

### Mocking de LLMs

Para tests de IA, es crítico mockear las llamadas a LLMs:

- Usar respuestas predefinidas
- Validar que los prompts son correctos
- No hacer llamadas reales a APIs (costos y tiempo)

---

**Última Actualización:** 2026-01-29  
**Versión:** 1.0.0
