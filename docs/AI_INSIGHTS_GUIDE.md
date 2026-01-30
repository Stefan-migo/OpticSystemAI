# 🤖 Guía Completa de Insights de IA

**Fecha:** 2026-01-29  
**Versión:** 2.0 - Widget Flotante Compacto

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Secciones con Insights](#secciones-con-insights)
3. [Diseño del Widget](#diseño-del-widget)
4. [Rutas del Sistema](#rutas-del-sistema)
5. [Cómo Funciona](#cómo-funciona)
6. [Mejoras Implementadas](#mejoras-implementadas)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Resumen Ejecutivo

Los **Insights de IA** son widgets flotantes compactos que aparecen en la esquina superior derecha de las secciones principales del sistema. Proporcionan recomendaciones contextuales basadas en datos reales del sistema.

### Características Principales

- ✅ **Widget Flotante Compacto**: No ocupa espacio en el layout principal
- ✅ **Colapsable/Expandible**: Puede minimizarse o expandirse
- ✅ **Priorización Inteligente**: Muestra primero los insights más importantes
- ✅ **Rutas Reales**: Solo usa rutas que existen en el sistema
- ✅ **Feedback del Usuario**: Permite calificar la utilidad de cada insight

---

## 📍 Secciones con Insights

Los insights aparecen en las siguientes secciones:

| Sección                  | Ruta               | Widget ID   | Estado          |
| ------------------------ | ------------------ | ----------- | --------------- |
| **Dashboard**            | `/admin`           | `dashboard` | ✅ Implementado |
| **Productos/Inventario** | `/admin/products`  | `inventory` | ✅ Implementado |
| **Clientes**             | `/admin/customers` | `clients`   | ✅ Implementado |
| **POS**                  | `/admin/pos`       | `pos`       | ✅ Implementado |
| **Analíticas**           | `/admin/analytics` | `analytics` | ✅ Implementado |

### Nota sobre Otras Secciones

Las secciones como `/admin/work-orders`, `/admin/quotes`, y `/admin/appointments` **NO tienen widgets propios** porque sus insights aparecen en el Dashboard. Esto evita duplicación y mantiene la interfaz limpia.

---

## 🎨 Diseño del Widget

### Características del Diseño

1. **Posición**: Esquina superior derecha (fixed positioning)
2. **Tamaño**: Ancho máximo de 320px (80 en Tailwind)
3. **Responsive**: Se adapta en móviles (`max-w-[calc(100vw-2rem)]`)
4. **Z-Index**: 40 (por encima del contenido pero debajo de modales)

### Estados del Widget

#### Estado Minimizado

- Muestra un pequeño badge con el número de insights
- Click para expandir

#### Estado Expandido

- Muestra el insight de mayor prioridad primero
- Botón para expandir/colapsar si hay más insights
- Botón X para minimizar completamente

#### Estado de Carga

- Muestra un indicador compacto con spinner
- Texto: "Cargando insights..."

### Componente InsightCard Compacto

Cada insight en modo compacto incluye:

- **Icono**: Indicador visual del tipo (warning, opportunity, info, neutral)
- **Título**: Texto corto y descriptivo (máx. 100 caracteres)
- **Mensaje**: Descripción breve (máx. 500 caracteres, truncado a 2 líneas)
- **Prioridad**: Dots visuales (máx. 5 dots para compacto)
- **Feedback**: Estrellas para calificar (1-5)
- **Acción**: Botón con label y URL (opcional)

---

## 🗺️ Rutas del Sistema

### Rutas Disponibles por Sección

#### Dashboard (`dashboard`)

```
/admin/work-orders?status=ordered
/admin/work-orders?status=sent_to_lab
/admin/quotes?status=draft
/admin/quotes?status=sent
/admin/analytics
/admin/products
/admin/customers
/admin/pos
```

#### Inventario (`inventory`)

```
/admin/products
/admin/products?lowStock=true
/admin/categories
```

#### Clientes (`clients`)

```
/admin/customers
/admin/customers/[id]
/admin/appointments
/admin/customers/new
```

#### POS (`pos`)

```
/admin/pos
/admin/products
/admin/customers
```

#### Analíticas (`analytics`)

```
/admin/analytics
/admin/orders
/admin/products
/admin/work-orders
```

### ⚠️ Rutas que NO Existen (y por qué)

| Ruta Incorrecta                    | Ruta Correcta                       | Razón                                 |
| ---------------------------------- | ----------------------------------- | ------------------------------------- |
| `/admin/lab/orders?status=overdue` | `/admin/work-orders?status=ordered` | No existe subdirectorio `/lab/orders` |
| `/admin/reports/sales`             | `/admin/analytics`                  | No existe subdirectorio `/reports`    |
| `/admin/quotes/pending`            | `/admin/quotes?status=draft`        | No existe subdirectorio `/pending`    |

**Solución**: Los prompts ahora incluyen la lista completa de rutas válidas para cada sección.

---

## ⚙️ Cómo Funciona

### Flujo de Datos

1. **Frontend**: El componente `SmartContextWidget` se monta en cada sección
2. **API Call**: Hace fetch a `/api/ai/insights?section={section}`
3. **Backend**: Consulta la tabla `ai_insights` filtrada por:
   - `organization_id` (multi-tenancy)
   - `section` (dashboard, inventory, etc.)
   - `is_dismissed = false`
4. **Ordenamiento**: Por `priority` DESC, luego `created_at` DESC
5. **Límite**: Máximo 5 insights por sección

### Generación de Insights

Los insights se generan mediante:

1. **Preparación de Datos**: `GET /api/ai/insights/prepare-data?section={section}`
   - Obtiene datos reales del sistema
   - Calcula métricas (ventas, trabajos pendientes, etc.)
   - Prepara datos específicos por sección

2. **Generación**: `POST /api/ai/insights/generate`
   - Recibe datos preparados
   - LLM Provider: DeepSeek (configurable)
   - Prompts Específicos: Cada sección tiene su propio prompt
   - Validación: Schema Zod para asegurar formato correcto
   - Persistencia: Se guardan en `ai_insights` table

### Métodos para Generar Insights

1. **Botón en Widget**: Click en el icono de refresh en el widget flotante
2. **Script Node.js**: `npm run ai:generate-insights [section]`
3. **Consola del Navegador**: Función `generateInsights(section)`

Ver [GENERATE_AI_INSIGHTS.md](./GENERATE_AI_INSIGHTS.md) para más detalles.

### Datos que se Analizan

#### Dashboard

- Ventas de ayer
- Promedio mensual
- Trabajos pendientes
- Presupuestos pendientes

#### Inventario

- Productos sin movimiento (stock zombie)
- Productos con stock bajo
- Valor monetario inmovilizado

#### Clientes

- Clientes inactivos (> 6 meses)
- Recetas vencidas (> 12 meses)
- Renovaciones de lentes de contacto

#### POS

- Dioptría del cliente
- Historial de compras
- Preferencias del cliente

#### Analíticas

- Comparación de períodos
- Tendencias de ventas
- Desglose por categoría

---

## 🚀 Mejoras Implementadas

### Versión 2.0 - Widget Flotante Compacto

#### Cambios de UI/UX

1. **Widget Flotante**
   - ✅ Posición fija en esquina superior derecha
   - ✅ No interfiere con el contenido principal
   - ✅ Diseño compacto y moderno

2. **InsightCard Compacto**
   - ✅ Tamaño reducido (de Card completo a tarjeta compacta)
   - ✅ Prioridad visual con dots (máx. 5)
   - ✅ Feedback simplificado (estrellas pequeñas)
   - ✅ Botón de acción más pequeño

3. **Interactividad**
   - ✅ Minimizar/Expandir
   - ✅ Colapsar insights adicionales
   - ✅ Dismiss individual
   - ✅ Feedback por insight

#### Cambios de Funcionalidad

1. **Prompts Mejorados**
   - ✅ Lista explícita de rutas válidas por sección
   - ✅ Instrucciones claras sobre qué rutas usar
   - ✅ Eliminación de referencias a funcionalidades no implementadas

2. **Validación de Rutas**
   - ✅ Schema actualizado para aceptar rutas relativas (`/admin/...`)
   - ✅ Prevención de rutas inventadas por la IA

3. **Manejo de Errores**
   - ✅ Logging mejorado con `contentPreview`
   - ✅ Manejo graceful de errores de validación

---

## 🔧 Solución de Problemas

### Problema: Los insights no aparecen

**Causas posibles:**

1. No hay insights generados para la sección
2. Todos los insights están descartados (`is_dismissed = true`)
3. El usuario no tiene organización asignada
4. Error en la API

**Solución:**

```sql
-- Verificar insights en la base de datos
SELECT * FROM ai_insights
WHERE section = 'dashboard'
  AND is_dismissed = false
ORDER BY priority DESC, created_at DESC;
```

### Problema: Las rutas de los insights no funcionan

**Causa**: La IA generó una ruta que no existe

**Solución**:

1. Los prompts ahora incluyen solo rutas válidas
2. Regenerar los insights con los nuevos prompts
3. Verificar en los logs el `contentPreview` si hay errores

### Problema: El widget es muy grande

**Solución**: Ya implementado en v2.0

- Widget flotante compacto
- InsightCard en modo compacto
- Minimizable

### Problema: Los insights no son útiles

**Solución**:

1. Ajustar los prompts en `src/lib/ai/insights/prompts.ts`
2. Proporcionar mejores datos de contexto
3. Usar el feedback (estrellas) para entrenar la IA

---

## 📊 Estructura de Datos

### Tabla `ai_insights`

```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  section TEXT NOT NULL, -- 'dashboard', 'inventory', 'clients', 'pos', 'analytics'
  type TEXT NOT NULL, -- 'warning', 'opportunity', 'info', 'neutral'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,
  action_url TEXT,
  priority INTEGER DEFAULT 5,
  metadata JSONB DEFAULT '{}',
  is_dismissed BOOLEAN DEFAULT FALSE,
  feedback_score INTEGER, -- 1-5
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tipos TypeScript

```typescript
type InsightSection =
  | "dashboard"
  | "inventory"
  | "clients"
  | "pos"
  | "analytics";
type InsightType = "warning" | "opportunity" | "info" | "neutral";

interface DatabaseInsight {
  id: string;
  organization_id: string;
  section: InsightSection;
  type: InsightType;
  title: string;
  message: string;
  action_label?: string;
  action_url?: string;
  priority: number; // 1-10
  metadata?: Record<string, any>;
  is_dismissed: boolean;
  feedback_score?: number; // 1-5
  created_at: string;
  updated_at: string;
}
```

---

## 🎓 Mejores Prácticas

### Para Desarrolladores

1. **Agregar Nuevas Secciones**
   - Crear prompt específico en `prompts.ts`
   - Agregar ruta al enum `InsightSection`
   - Incluir lista de rutas válidas en el prompt

2. **Mejorar Prompts**
   - Ser específico sobre qué rutas usar
   - Incluir ejemplos de `action_url` válidos
   - Evitar referencias a funcionalidades no implementadas

3. **Testing**
   - Verificar que las rutas generadas existen
   - Probar con datos reales del sistema
   - Validar que los insights son útiles

### Para Usuarios

1. **Feedback**
   - Usa las estrellas para calificar insights útiles
   - Descarta insights que no son relevantes
   - El sistema aprende de tu feedback

2. **Minimizar Widget**
   - Si no necesitas ver los insights, minimiza el widget
   - Aparecerá un badge con el número de insights pendientes

---

## 📝 Changelog

### v2.0 (2026-01-29)

- ✅ Widget flotante compacto
- ✅ InsightCard rediseñado para modo compacto
- ✅ Prompts actualizados con rutas reales
- ✅ Mejor manejo de errores y logging

### v1.0 (2026-01-28)

- ✅ Implementación inicial
- ✅ Widgets en todas las secciones principales
- ✅ Integración con DeepSeek

---

## 🔗 Referencias

- [AI Implementation Guide](./AI_IMPLEMENTATION_GUIDE.md)
- [Testing Strategy](./TESTING_STRATEGY_NEW_FEATURES.md)
- [Architecture Guide](./ARCHITECTURE_GUIDE.md)

---

**Última actualización**: 2026-01-29
