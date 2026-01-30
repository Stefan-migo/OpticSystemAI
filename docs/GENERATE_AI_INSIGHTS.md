# 🚀 Guía para Generar Insights de IA

**Fecha:** 2026-01-29  
**Versión:** 2.0

---

## 📋 Métodos para Generar Insights

Hay **3 formas** de generar insights de IA en el sistema:

### 1. Desde el Widget Flotante (Recomendado)

El widget flotante ahora incluye un botón de **regenerar** (icono de refresh) en el header.

1. Ve a cualquier sección con insights (Dashboard, Products, Customers, POS, Analytics)
2. Haz clic en el icono de refresh en el widget flotante
3. El sistema automáticamente:
   - Obtiene datos reales del sistema
   - Genera nuevos insights con IA
   - Actualiza el widget automáticamente

### 2. Desde la Consola del Navegador

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Generar insights para Dashboard
async function generateInsights(section) {
  // Paso 1: Obtener datos reales
  const prepareResponse = await fetch(
    `/api/ai/insights/prepare-data?section=${section}`,
  );
  const prepareData = await prepareResponse.json();

  // Paso 2: Generar insights
  const generateResponse = await fetch("/api/ai/insights/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      section,
      data: prepareData.data[section] || prepareData.data,
    }),
  });

  const result = await generateResponse.json();
  console.log("✅ Insights generados:", result);
  window.location.reload(); // Recargar para ver los insights
}

// Usar:
generateInsights("dashboard");
generateInsights("inventory");
generateInsights("clients");
generateInsights("analytics");
```

### 3. Usando Script Node.js (Terminal)

El script más completo que usa datos reales del sistema:

```bash
# Generar insights para una sección específica
npm run ai:generate-insights dashboard

# Generar insights para todas las secciones
npm run ai:generate-insights

# Con email específico
npm run ai:generate-insights dashboard tu-email@ejemplo.com
```

**Requisitos:**

- El servidor Next.js debe estar corriendo (`npm run dev`)
- Debes tener un usuario admin configurado
- DeepSeek API key configurada en `.env.local`

---

## 📊 Datos que se Analizan

### Dashboard

- Ventas de ayer (comparado con promedio mensual)
- Trabajos de laboratorio pendientes/atrasados
- Presupuestos pendientes

### Inventory (Productos)

- Productos sin movimiento (> 6 meses)
- Productos con stock bajo (< 5 unidades)
- Valor monetario inmovilizado

### Clients (Clientes)

- Clientes inactivos (> 6 meses sin visita)
- Recetas vencidas (> 12 meses)
- Renovaciones de lentes de contacto pendientes

### Analytics

- Comparación de ventas (período actual vs anterior)
- Tendencias (crecimiento/disminución)
- Desglose por categoría (Armazones, Cristales, etc.)

---

## 🔍 Verificar que Funciona

### 1. Verificar en la Base de Datos

```sql
-- Ver insights generados
SELECT
  id,
  section,
  type,
  title,
  message,
  priority,
  action_url,
  created_at
FROM ai_insights
WHERE organization_id = 'tu-organization-id'
  AND is_dismissed = false
ORDER BY section, priority DESC, created_at DESC;
```

### 2. Verificar en el Frontend

1. Inicia sesión en `/admin`
2. Navega a cualquier sección (Dashboard, Products, etc.)
3. Deberías ver el widget flotante en la esquina superior derecha
4. Si no hay insights, haz clic en el botón de refresh

### 3. Verificar Logs del Servidor

Cuando generes insights, deberías ver en los logs:

```
✅ Insights generated successfully
   section: dashboard
   count: 2
   provider: deepseek
```

---

## 🐛 Solución de Problemas

### Error: "No available LLM providers configured"

**Causa:** DeepSeek no está configurado correctamente

**Solución:**

1. Verifica que `DEEPSEEK_API_KEY` esté en `.env.local`
2. Reinicia el servidor (`npm run dev`)
3. Verifica que la API key sea válida

### Error: "Organization not found"

**Causa:** El usuario no tiene organización asignada

**Solución:**

1. Verifica que el usuario esté en la tabla `admin_users`
2. Verifica que tenga `organization_id` asignado
3. Verifica que `is_active = true`

### Los Insights No Aparecen

**Causas posibles:**

1. No se generaron insights aún
2. Todos los insights están descartados
3. El widget está minimizado

**Solución:**

1. Genera insights usando uno de los métodos arriba
2. Verifica en la base de datos que existan insights
3. Busca el badge minimizado en la esquina superior derecha

### Las Rutas de los Insights No Funcionan

**Causa:** La IA generó una ruta incorrecta (ya corregido en v2.0)

**Solución:**

1. Regenera los insights con los nuevos prompts
2. Los prompts ahora incluyen solo rutas válidas
3. Si persiste, verifica los logs para ver qué ruta generó la IA

---

## 📝 Ejemplos de Uso

### Generar Insights para Dashboard

```bash
# Terminal
npm run ai:generate-insights dashboard

# O desde el navegador (consola)
generateInsights('dashboard');
```

### Generar Insights para Todas las Secciones

```bash
# Terminal
npm run ai:generate-insights
```

### Ver Insights Generados

```sql
-- Ver todos los insights activos
SELECT
  section,
  type,
  title,
  priority,
  action_url
FROM ai_insights
WHERE is_dismissed = false
ORDER BY section, priority DESC;
```

---

## 🎯 Próximos Pasos

1. **Implementar Cron Jobs** (Opcional)
   - Dashboard: Diario a las 8:00 AM
   - Inventory: Semanal (Lunes AM)
   - Clients: Diario
   - Analytics: Diario con caché de 24h

2. **Monitorear Calidad**
   - Revisar feedback de usuarios (estrellas)
   - Ajustar prompts según resultados
   - Mejorar datos que se analizan

3. **Optimizar Costos**
   - Implementar logging de uso de LLM
   - Crear alertas de presupuesto
   - Dashboard de costos

---

**Última actualización**: 2026-01-29
