# Script de Seeding para Datos de Testing

Este script pobla la base de datos con datos de prueba para desarrollo y testing.

## ¿Qué hace este script?

El script `seed-test-data.js` crea:

1. **SuperAdmin User**
   - Email: `admin@test.com` (o el valor de `ADMIN_EMAIL`)
   - Password: `Admin123!` (o el valor de `ADMIN_PASSWORD`)
   - Rol: `super_admin`

2. **Categorías**
   - Marcos
   - Lentes de Sol
   - Accesorios
   - Servicios

3. **Productos** (11 productos en total)
   - **3 Marcos**: Ray-Ban Wayfarer, Oakley Holbrook, Persol PO3019S
   - **3 Lentes de Sol**: Ray-Ban Aviator, Oakley Holbrook Polarizados, Maui Jim Peahi
   - **3 Accesorios**: Estuche rígido, Paño de microfibra, Spray limpiador
   - **2 Servicios**: Montaje de lentes, Ajuste y reparación

4. **Familias de Lentes** (15 familias)
   - **Bifocales**: CR-39, Policarbonato, Alto Índice 1.67
   - **Progresivos (Multifocales)**: CR-39, Policarbonato, Alto Índice 1.67, Alto Índice 1.74
   - **Gafas Ópticas de Sol**: Monofocal Polarizado (CR-39, Policarbonato), Progresivo Polarizado (CR-39, Alto Índice 1.67)
   - **Monofocales Estándar**: CR-39, Policarbonato, Alto Índice 1.67, Alto Índice 1.74

5. **Matrices de Precios**
   - Matrices de precios realistas para cada familia de lentes
   - Rangos de esfera: -10.0 a +10.0
   - Rangos de cilindro: -4.0 a +4.0
   - Dos tipos de sourcing: `surfaced` y `stock`
   - Precios ajustados según material, tipo de lente y rango de graduación

## Requisitos

- Supabase corriendo localmente (Docker)
- Variables de entorno configuradas en `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_EMAIL` (opcional, default: `admin@test.com`)
  - `ADMIN_PASSWORD` (opcional, default: `Admin123!`)

## Uso

### Ejecutar el script

```bash
npm run seed:test-data
```

O directamente:

```bash
node scripts/seed-test-data.js
```

### Con variables de entorno personalizadas

```bash
ADMIN_EMAIL="mi-admin@test.com" ADMIN_PASSWORD="MiPassword123!" npm run seed:test-data
```

## Características de los Productos

Todos los productos creados tienen:

- ✅ **IVA incluido** (`price_includes_tax: true`)
- ✅ **URL de imagen** (usando Unsplash como referencia)
- ✅ **SKU único**
- ✅ **Precio y costo configurados**
- ✅ **Inventario inicial** (excepto servicios)
- ✅ **Estado activo**

## Características de las Familias de Lentes

Las familias incluyen:

- ✅ **Tipos realistas**: Bifocales, Progresivos, Monofocales
- ✅ **Materiales variados**: CR-39, Policarbonato, Alto Índice 1.67, Alto Índice 1.74
- ✅ **Marcas reconocidas**: Essilor, Varilux
- ✅ **Descripciones detalladas**

## Características de las Matrices de Precios

Las matrices de precios:

- ✅ **Cubren todos los rangos comunes** de esfera y cilindro
- ✅ **Precios diferenciados** según material y tipo
- ✅ **Dos tipos de sourcing**: `surfaced` (más caro) y `stock` (más barato)
- ✅ **Precios realistas** basados en el mercado óptico

## Notas

- El script es **idempotente** para categorías (usa `upsert` con `slug`)
- Los productos se crean como nuevos cada vez (pueden duplicarse si se ejecuta múltiples veces)
- Las familias de lentes se crean como nuevas cada vez
- Las matrices de precios se crean para cada familia

## Solución de Problemas

### Error: "Missing Supabase environment variables"

- Verifica que `.env.local` existe y tiene las variables necesarias
- Asegúrate de que Supabase está corriendo localmente

### Error: "Cannot connect to database"

- Verifica que Supabase está corriendo: `npm run supabase:status`
- Inicia Supabase si no está corriendo: `npm run supabase:start`

### Productos duplicados

- El script no verifica duplicados para productos
- Si necesitas limpiar, puedes ejecutar SQL directamente o resetear la base de datos

## Limpiar Datos

Para limpiar los datos de testing, puedes:

1. **Resetear la base de datos completa**:

   ```bash
   npm run supabase:reset
   ```

2. **Eliminar manualmente** (SQL):
   ```sql
   DELETE FROM lens_price_matrices;
   DELETE FROM lens_families;
   DELETE FROM products WHERE slug LIKE '%test%' OR slug LIKE '%ray-ban%' OR slug LIKE '%oakley%';
   DELETE FROM categories WHERE slug IN ('marcos', 'lentes-de-sol', 'accesorios', 'servicios');
   ```
