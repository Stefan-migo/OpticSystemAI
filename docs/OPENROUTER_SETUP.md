# Configuración de OpenRouter

## ¿Qué es OpenRouter?

OpenRouter es un agregador de proveedores LLM que ofrece acceso a más de 100 modelos de diferentes proveedores (OpenAI, Anthropic, Google, Meta, Mistral, etc.) a través de una única API compatible con OpenAI.

### Ventajas de OpenRouter

1. **Acceso Unificado**: Un solo API key para acceder a múltiples proveedores
2. **Precios Competitivos**: A menudo más económico que acceder directamente a los proveedores
3. **Fallback Automático**: Si un modelo no está disponible, puede hacer fallback automático
4. **Sin Necesidad de Múltiples Cuentas**: No necesitas cuentas separadas con cada proveedor
5. **Más Modelos Disponibles**: Acceso a modelos que no están disponibles directamente
6. **Analytics Incluido**: Dashboard con métricas de uso y costos

## Configuración

### 1. Obtener API Key

1. Visita [openrouter.ai](https://openrouter.ai)
2. Crea una cuenta o inicia sesión
3. Ve a **Settings** → **API Keys**
4. Crea un nuevo API key
5. (Opcional) Configura límites de gasto para control de costos

### 2. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```bash
# OpenRouter API Key (requerido)
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Base URL (opcional, usa el default si no se especifica)
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Modelo por defecto (opcional)
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet

# URL de tu aplicación para tracking (opcional)
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### 3. Configuración Recomendada

Para la aplicación Opttius, recomendamos:

**Para producción:**

```bash
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

- Excelente balance entre calidad y costo
- Soporte completo de herramientas (function calling)
- 200k tokens de contexto

**Para desarrollo/testing:**

```bash
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3-haiku
```

- Muy económico (10x más barato que Sonnet)
- Rápido
- Bueno para testing

**Para cargas pesadas de análisis:**

```bash
OPENROUTER_DEFAULT_MODEL=deepseek/deepseek-chat
```

- Súper económico ($0.14 por millón de tokens de entrada)
- Excelente para análisis de datos e insights
- 64k tokens de contexto

## Modelos Disponibles

### Modelos Anthropic (Recomendados para Opttius)

| Modelo                        | Precio (por 1M tokens) | Uso Recomendado                                       |
| ----------------------------- | ---------------------- | ----------------------------------------------------- |
| `anthropic/claude-3.5-sonnet` | $3 in / $15 out        | **Producción general** - Mejor balance calidad/precio |
| `anthropic/claude-3-opus`     | $15 in / $75 out       | Tareas críticas que requieren máxima calidad          |
| `anthropic/claude-3-haiku`    | $0.25 in / $1.25 out   | **Development/Testing** - Muy económico               |

### Modelos OpenAI

| Modelo                 | Precio (por 1M tokens) | Uso Recomendado                |
| ---------------------- | ---------------------- | ------------------------------ |
| `openai/gpt-4o`        | $5 in / $15 out        | General purpose, buena calidad |
| `openai/gpt-4-turbo`   | $10 in / $30 out       | Tareas complejas               |
| `openai/gpt-3.5-turbo` | $0.5 in / $1.5 out     | Tareas simples, muy económico  |

### Modelos Google

| Modelo                    | Precio (por 1M tokens) | Uso Recomendado            |
| ------------------------- | ---------------------- | -------------------------- |
| `google/gemini-pro-1.5`   | $2.5 in / $10 out      | Contexto largo (1M tokens) |
| `google/gemini-flash-1.5` | $0.25 in / $1 out      | Muy rápido y económico     |

### Modelos DeepSeek

| Modelo                   | Precio (por 1M tokens) | Uso Recomendado                          |
| ------------------------ | ---------------------- | ---------------------------------------- |
| `deepseek/deepseek-chat` | $0.14 in / $0.28 out   | **Insights/Analytics** - Súper económico |

### Modelos Meta Llama

| Modelo                              | Precio (por 1M tokens) | Uso Recomendado        |
| ----------------------------------- | ---------------------- | ---------------------- |
| `meta-llama/llama-3.1-70b-instruct` | $0.52 in / $0.75 out   | Open source, económico |

## Uso en la Aplicación

### En el Chatbot

El usuario puede seleccionar OpenRouter desde el panel de configuración del chatbot:

1. Abrir chatbot flotante
2. Click en el ícono de configuración (⚙️)
3. Seleccionar **Provider**: `openrouter`
4. Seleccionar **Model**: Elegir de los modelos disponibles

### En Generación de Insights

Para usar OpenRouter automáticamente en la generación de insights, configura:

```bash
AI_DEFAULT_PROVIDER=openrouter
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

### Fallback Providers

Si OpenRouter falla, el sistema puede hacer fallback automático a otros proveedores:

```bash
AI_FALLBACK_PROVIDERS=google,deepseek,openai
```

## Control de Costos

### 1. Límites en OpenRouter Dashboard

OpenRouter permite configurar límites de gasto directamente en su dashboard:

1. Ve a [openrouter.ai/settings/limits](https://openrouter.ai/settings/limits)
2. Configura:
   - **Monthly Limit**: Límite mensual en USD
   - **Per-Request Limit**: Gasto máximo por request
   - **Alerts**: Recibe alertas al 50%, 80%, 90% del límite

### 2. Selección Inteligente de Modelos

Para optimizar costos en Opttius:

**Chatbot interactivo** → `anthropic/claude-3-haiku` ($0.25/$1.25)

- Respuestas rápidas
- Conversaciones casuales
- Testing

**Insights automáticos** → `deepseek/deepseek-chat` ($0.14/$0.28)

- Análisis de inventario
- Generación de recomendaciones
- Estadísticas

**Consultas complejas** → `anthropic/claude-3.5-sonnet` ($3/$15)

- Análisis de negocio detallado
- Diagnóstico de sistema
- Consultas críticas del usuario

### 3. Estimación de Costos

**Ejemplo: Óptica promedio (50 usuarios activos/mes)**

| Función            | Requests/mes               | Tokens promedio   | Modelo   | Costo/mes      |
| ------------------ | -------------------------- | ----------------- | -------- | -------------- |
| Chatbot            | 500                        | 1000 in / 500 out | Haiku    | $0.88          |
| Insights Dashboard | 900 (30 días × 30 órdenes) | 2000 in / 300 out | DeepSeek | $0.34          |
| Insights Inventory | 120 (semanal)              | 3000 in / 400 out | DeepSeek | $0.06          |
| Insights Clientes  | 900                        | 1500 in / 200 out | DeepSeek | $0.25          |
| **TOTAL ESTIMADO** |                            |                   |          | **~$1.53/mes** |

**Comparación con proveedores directos:**

- OpenAI GPT-4: ~$20-30/mes para la misma carga
- Anthropic directo: ~$15-20/mes
- **Ahorro con OpenRouter: ~85-90%**

## Monitoreo y Analytics

OpenRouter provee analytics detallados en [openrouter.ai/activity](https://openrouter.ai/activity):

- **Uso por modelo**: Cuánto se usa cada modelo
- **Costos por día**: Gasto diario/semanal/mensual
- **Requests exitosos vs fallidos**: Tasa de éxito
- **Latencia promedio**: Performance de cada modelo
- **Top prompts**: Prompts más usados

## Troubleshooting

### Error: "OpenRouter API key is required"

**Solución:**

1. Verifica que `OPENROUTER_API_KEY` esté en `.env.local`
2. Reinicia el servidor de desarrollo: `npm run dev`
3. Verifica que el API key sea válido en openrouter.ai

### Error: "Model not available"

**Solución:**

1. El modelo puede estar temporalmente no disponible
2. El sistema hará fallback automático si tienes configurado `AI_FALLBACK_PROVIDERS`
3. Prueba con un modelo alternativo

### Error: "Rate limit exceeded"

**Solución:**

1. Espera unos minutos (los límites se resetean)
2. Considera actualizar tu plan en OpenRouter
3. Configura `maxTokens` más bajo para reducir uso

### Error: "Insufficient credits"

**Solución:**

1. Agrega créditos en [openrouter.ai/credits](https://openrouter.ai/credits)
2. OpenRouter requiere créditos prepagados

## Mejores Prácticas

### 1. Configuración por Ambiente

**Desarrollo:**

```bash
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3-haiku
AI_DEFAULT_PROVIDER=openrouter
```

**Producción:**

```bash
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
AI_DEFAULT_PROVIDER=openrouter
AI_FALLBACK_PROVIDERS=google,deepseek
```

### 2. Caching de Prompts

OpenRouter soporta prompt caching para reducir costos. Los system prompts largos se cachean automáticamente.

### 3. Monitoreo de Costos

1. Configura alertas en OpenRouter dashboard
2. Revisa semanalmente el uso en analytics
3. Ajusta modelos según necesidad vs costo

## Migración desde Otros Proveedores

### Desde OpenAI

Simplemente cambia:

```bash
# Antes
AI_DEFAULT_PROVIDER=openai
OPENAI_DEFAULT_MODEL=gpt-4

# Después
AI_DEFAULT_PROVIDER=openrouter
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o
```

### Desde Anthropic

```bash
# Antes
AI_DEFAULT_PROVIDER=anthropic
ANTHROPIC_DEFAULT_MODEL=claude-3-sonnet-20240229

# Después
AI_DEFAULT_PROVIDER=openrouter
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

## Recursos Adicionales

- **Documentación oficial**: [openrouter.ai/docs](https://openrouter.ai/docs)
- **Lista de modelos**: [openrouter.ai/models](https://openrouter.ai/models)
- **Status page**: [status.openrouter.ai](https://status.openrouter.ai)
- **Discord community**: [discord.gg/openrouter](https://discord.gg/openrouter)

---

**Última Actualización**: 2026-02-06
**Versión de Implementación**: Opttius v3.0 - Fase 4
