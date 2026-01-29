# Scripts para Encontrar y Recuperar Archivos Perdidos

## Problema

Cuando trabajas localmente sin commitear cambios y luego haces un `git pull` de una versión anterior, puedes perder archivos que estaban en tu versión local pero nunca fueron commiteados.

## Solución

### 1. Script de Detección (`find-missing-files.js`)

Este script analiza todos los archivos fuente y encuentra imports que apuntan a archivos que no existen.

**Uso:**

```bash
node scripts/find-missing-files.js
```

**Qué hace:**

- Analiza todos los archivos `.ts`, `.tsx`, `.js`, `.jsx` en `src/`
- Extrae todos los imports que usan `@/`
- Verifica si cada archivo importado existe
- Busca en el historial de Git si el archivo alguna vez existió
- Muestra dónde se usa cada archivo faltante

### 2. Script de Recuperación Automática (`recover-missing-files.js`)

Este script hace lo mismo que el anterior, pero además intenta recuperar automáticamente los archivos del historial de Git.

**Uso:**

```bash
node scripts/recover-missing-files.js
```

**Qué hace:**

- Detecta archivos faltantes
- Busca en el historial de Git el commit más reciente que agregó cada archivo
- Recupera automáticamente el contenido del archivo desde Git
- Crea el archivo en la ubicación correcta
- Muestra un resumen de lo que se recuperó y lo que no

## Metodología Recomendada

### Paso 1: Detectar archivos faltantes

```bash
node scripts/find-missing-files.js
```

### Paso 2: Intentar recuperación automática

```bash
node scripts/recover-missing-files.js
```

### Paso 3: Para archivos no encontrados en Git

Si un archivo no se encuentra en Git, tienes varias opciones:

1. **Revisar el reflog de Git** (archivos que estuvieron en commits locales):

```bash
git reflog
git show <commit-hash>:<ruta-del-archivo>
```

2. **Buscar en backups locales**:
   - Archivos `.backup`, `.old`, `.bak`
   - Carpetas temporales
   - Historial de Cursor/IDE

3. **Recrear manualmente** basándote en:
   - Cómo se usa el archivo (imports)
   - Documentación del proyecto
   - Patrones similares en otros archivos

## Ejemplo de Uso

```bash
# 1. Detectar problemas
$ node scripts/find-missing-files.js
🔍 Buscando archivos faltantes...
📁 Analizando 345 archivos...
❌ Se encontraron 1 archivos/modulos faltantes:
📦 @/components/ui/pagination
   Referenciado en:
   - src/app/admin/cash-register/page.tsx
   - src/app/admin/lens-matrices/page.tsx

# 2. Recuperar automáticamente
$ node scripts/recover-missing-files.js
🔍 Buscando y recuperando archivos faltantes...
📁 Analizando 345 archivos...
❌ Se encontraron 1 archivos/modulos faltantes:
🔍 Buscando: @/components/ui/pagination
   ✅ Encontrado en Git (commit: f8e9340e)
   📝 Recuperando: src/components/ui/pagination.tsx
   ✅ Recuperado exitosamente!

📊 RESUMEN
✅ Recuperados: 1
   - @/components/ui/pagination → src/components/ui/pagination.tsx
```

## Notas

- Los scripts solo buscan archivos que fueron alguna vez commiteados a Git
- Si un archivo nunca fue commiteado, necesitarás recrearlo manualmente
- Los scripts respetan la estructura de directorios del proyecto
- Se crean automáticamente los directorios necesarios si no existen
