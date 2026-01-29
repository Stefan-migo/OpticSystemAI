# Recuperación de Funcionalidad Pre-Phase 0

## Problema

Después de implementar Phase 0 de SaaS, se perdió funcionalidad que existía antes. Necesitamos recuperar esa funcionalidad sin perder el trabajo de SaaS y Testing.

## Solución

Este script compara el código actual con la versión antes del Phase 0, analiza los diffs línea por línea, y recupera inteligentemente la funcionalidad perdida, preservando todo el trabajo de SaaS y Testing.

## Características

### Análisis Inteligente de Diffs

- ✅ Evalúa cada archivo modificado línea por línea
- ✅ Identifica cambios de SaaS vs funcionalidad
- ✅ Calcula confianza para cada decisión
- ✅ Categoriza automáticamente: recuperar, preservar, o revisar manualmente

### Preservación Automática

- ✅ Migraciones de SaaS (`20260128*`, `20260129*`)
- ✅ Tests (`src/__tests__/`, `*.test.*`, `*.spec.*`)
- ✅ Configuración de testing (`vitest.config.*`)
- ✅ Tablas de SaaS (`organizations`, `subscriptions`, etc.)
- ✅ Documentación de SaaS

### Recuperación Inteligente

- ✅ Funcionalidad de POS
- ✅ Componentes admin
- ✅ Hooks y utilities
- ✅ APIs de funcionalidad core
- ✅ Componentes UI

## Uso

### 1. Análisis (sin cambios)

```bash
node scripts/recover-pre-saas-functionality.js
```

Esto:

- Encuentra el commit antes del Phase 0 (2026-01-27)
- Compara archivos actuales vs pre-Phase 0
- Analiza diffs línea por línea
- Categoriza archivos automáticamente
- Genera un reporte detallado
- **NO modifica nada**

### 2. Recuperación Automática

```bash
# Revisa el reporte primero, luego:
node scripts/recover-pre-saas-functionality.js --execute
```

Esto:

- Recupera archivos eliminados
- Recupera archivos modificados con alta confianza (≥70%)
- Crea backups de todos los archivos antes de modificar
- Preserva archivos con cambios de SaaS/Testing

### 3. Búsqueda en Historial de Cursor

```bash
node scripts/search-cursor-history.js "nombre-archivo"
```

Busca en el historial local de Cursor por nombre de archivo.

## Proceso Recomendado

### Paso 1: Análisis Inicial

```bash
node scripts/recover-pre-saas-functionality.js
```

### Paso 2: Revisar Reporte

Abre `.recovery-backup/recovery-report.json` y revisa:

- Archivos eliminados (recuperar automáticamente)
- Archivos a recuperar (alta confianza)
- Archivos a preservar (contienen SaaS/Testing)
- Archivos para revisión manual (cambios balanceados)

### Paso 3: Recuperación Automática

```bash
node scripts/recover-pre-saas-functionality.js --execute
```

### Paso 4: Revisión Manual

Para archivos marcados como "revisar manualmente":

1. Abre el diff:
   ```bash
   git diff <pre-phase0-commit> HEAD -- ruta/archivo.tsx
   ```
2. Identifica funcionalidad perdida
3. Haz merge manual preservando cambios de SaaS

### Paso 5: Validación

```bash
npm run type-check
npm run build
npm test
```

## Criterios de Decisión

El script usa estos criterios para decidir qué versión mantener:

### Recuperar (Confianza ≥70%)

- Mucha funcionalidad eliminada (>2x líneas eliminadas vs agregadas)
- No contiene cambios de SaaS
- Contiene funciones/interfaces/componentes eliminados

### Preservar (Confianza ≥70%)

- Contiene cambios de SaaS (organizations, subscriptions, multi-tenant)
- Contiene cambios de testing
- Mucha funcionalidad nueva agregada (>2x líneas agregadas vs eliminadas)

### Revisar Manualmente

- Cambios balanceados
- Confianza <70%
- Mezcla de cambios de SaaS y funcionalidad

## Archivos de Backup

Todos los backups se guardan en `.recovery-backup/`:

- `backup-info.json` - Información del backup
- `recovery-report.json` - Reporte completo de comparación y análisis
- Archivos individuales - Backups de archivos antes de recuperar (formato: `ruta_archivo.tsx`)

## Ejemplo de Salida

```
🔍 Recuperando funcionalidad pre-Phase 0 de SaaS...

1️⃣ Buscando commit antes del Phase 0...
   ✅ Encontrado: a1b2c3d4
   📅 Fecha: 2026-01-26
   💬 Mensaje: feat: Agregar funcionalidad de presbicia

2️⃣ Commit actual: e5f6g7h8

3️⃣ Comparando archivos y analizando diffs...
   📊 Archivos eliminados: 3
   📊 Archivos modificados: 15
   📊 Archivos nuevos (SaaS/Testing): 8
   📊 Archivos sin cambios: 120

📋 RESUMEN DE ANÁLISIS
============================================================

📦 Archivos eliminados a recuperar (3):
   ✅ src/hooks/useLensPriceCalculation.ts
   ✅ src/lib/presbyopia-helpers.ts
   ✅ src/components/ui/pagination.tsx

🔄 Archivos a recuperar (5):
   ✅ src/app/admin/pos/page.tsx
      Razón: Mucha funcionalidad eliminada (150 líneas vs 20) (confianza: 80%)
   ✅ src/app/admin/products/page.tsx
      Razón: Mucha funcionalidad eliminada (80 líneas vs 15) (confianza: 75%)

💾 Archivos a preservar (6):
   ⏭️  supabase/migrations/20260128000000_create_organizations.sql
      Razón: Contiene cambios de SaaS
   ⏭️  src/__tests__/integration/api/products.test.ts
      Razón: Cambios de testing

⚠️  Archivos que requieren revisión manual (4):
   🔍 src/app/api/admin/products/route.ts
      Cambios balanceados (45 agregadas, 50 eliminadas)
      Cambios: +45 -50
```

## Troubleshooting

### No se encuentra commit pre-Phase 0

El script busca commits antes del 2026-01-27. Si no encuentra ninguno, busca el commit más reciente que no contenga "phase", "saas", o "multi-tenant" en el mensaje.

### Archivo no se puede recuperar

- Verifica que el archivo existía en el commit pre-Phase 0
- Revisa los permisos del sistema de archivos
- Intenta recuperar manualmente: `git show <commit>:ruta/archivo.tsx > ruta/archivo.tsx`

### Conflicto después de recuperar

1. Revisa el backup en `.recovery-backup/`
2. Compara con la versión actual
3. Haz merge manual preservando cambios de SaaS

## Notas Importantes

- ⚠️ **Siempre revisa el reporte antes de ejecutar `--execute`**
- ⚠️ **Los backups se guardan automáticamente antes de cualquier cambio**
- ⚠️ **Archivos marcados para "revisar" requieren atención manual**
- ✅ **Todo el trabajo de SaaS y Testing se preserva automáticamente**
