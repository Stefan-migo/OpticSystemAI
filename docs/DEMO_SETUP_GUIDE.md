# Guía de Configuración de Óptica Demo

Esta guía explica cómo configurar la óptica demo con datos de ejemplo y crear un usuario SuperAdmin para desarrollo.

## 📋 Requisitos Previos

- Supabase ejecutándose localmente (`npm run supabase:start`)
- Todas las migraciones base aplicadas
- Variables de entorno configuradas en `.env.local`

## 🚀 Paso 1: Aplicar Migración de Datos Demo

La migración crea la organización demo con todos los datos de ejemplo.

### Opción A: Resetear Base de Datos (Recomendado para desarrollo limpio)

Esto aplicará TODAS las migraciones incluyendo la demo:

```bash
npm run supabase:reset
```

**Ventajas:**

- Aplica todas las migraciones en orden
- Base de datos limpia y consistente
- Más rápido si estás empezando

**Desventajas:**

- Elimina todos los datos existentes
- Necesitas recrear otros usuarios después

### Opción B: Aplicar Solo la Migración Demo

Si ya tienes datos y solo quieres agregar la demo:

```bash
# Opción 1: Usando Supabase CLI
npx supabase migration up

# Opción 2: Usando Docker directamente
docker exec -i supabase_db_web psql -U postgres -d postgres < supabase/migrations/20260130000000_seed_demo_organization.sql

# Opción 3: Usando Supabase Studio
# 1. Abre http://127.0.0.1:54323
# 2. Ve a SQL Editor
# 3. Copia y pega el contenido de supabase/migrations/20260130000000_seed_demo_organization.sql
# 4. Ejecuta el script
```

### Verificar que la Migración se Aplicó

```bash
# Verificar organización demo
docker exec -i supabase_db_web psql -U postgres -d postgres -c "SELECT id, name, slug FROM public.organizations WHERE slug = 'optica-demo-global';"

# Verificar clientes demo
docker exec -i supabase_db_web psql -U postgres -d postgres -c "SELECT COUNT(*) as total_customers FROM public.customers WHERE organization_id = '00000000-0000-0000-0000-000000000001';"

# Deberías ver: total_customers = 25
```

## 👤 Paso 2: Crear Usuario SuperAdmin para Demo

Tienes dos opciones para crear el usuario SuperAdmin:

### Opción A: Script Node.js (Recomendado - Más Fácil)

Este script crea el usuario en `auth.users` y lo configura como SuperAdmin:

```bash
# Configura en .env.local: DEMO_ADMIN_EMAIL y DEMO_ADMIN_PASSWORD (ver env.example)
node scripts/create-demo-super-admin.js

# O pasa las variables al ejecutar
DEMO_ADMIN_EMAIL=tu-email@ejemplo.com DEMO_ADMIN_PASSWORD=TuPassword123! node scripts/create-demo-super-admin.js
```

**Credenciales:** Usa las variables de entorno `DEMO_ADMIN_EMAIL` y `DEMO_ADMIN_PASSWORD` en `.env.local`. No se documentan valores por defecto por seguridad.

### Opción B: Script SQL (Más Control)

Si prefieres usar SQL directamente:

1. **Primero, crea el usuario en Supabase Auth:**

   **Opción B1: Usando Supabase Studio**
   - Ve a http://127.0.0.1:54323
   - Ve a Authentication > Users
   - Click "Add user"
   - Email y contraseña: los mismos que uses en `DEMO_ADMIN_EMAIL` y `DEMO_ADMIN_PASSWORD`
   - Auto-confirm: Yes
   - Click "Create user"

   **Opción B2: Usando Script Node.js (solo para crear auth user)**

   ```bash
   node scripts/create-admin-via-api.js "$DEMO_ADMIN_EMAIL" "$DEMO_ADMIN_PASSWORD"
   ```

2. **Luego, ejecuta el script SQL para asignar permisos:**

   ```bash
   # Opción 1: Docker
   docker exec -i supabase_db_web psql -U postgres -d postgres < scripts/sql-utils/create-demo-super-admin.sql

   # Opción 2: Supabase Studio SQL Editor
   # Copia y pega el contenido de scripts/sql-utils/create-demo-super-admin.sql
   ```

### Verificar que el Usuario se Creó Correctamente

```bash
# Verificar admin_users (reemplaza TU_EMAIL_DEMO por tu DEMO_ADMIN_EMAIL)
docker exec -i supabase_db_web psql -U postgres -d postgres -c "SELECT au.email, au.role, o.name as organization FROM public.admin_users au LEFT JOIN public.organizations o ON au.organization_id = o.id WHERE au.email = 'TU_EMAIL_DEMO';"

# Deberías ver tu email con role super_admin y organization Óptica Demo Global
```

## 🔧 Paso 3: Configurar Variable de Entorno

Agrega la variable de entorno para que el frontend reconozca la organización demo:

```bash
# En .env.local
NEXT_PUBLIC_DEMO_ORG_ID=00000000-0000-0000-0000-000000000001
```

## ✅ Paso 4: Verificar que Todo Funciona

1. **Inicia el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

2. **Inicia sesión:**
   - Ve a http://localhost:3000/login
   - Email y contraseña: los valores de `DEMO_ADMIN_EMAIL` y `DEMO_ADMIN_PASSWORD` de tu `.env.local`

3. **Verifica el dashboard:**
   - Deberías ver datos en el dashboard
   - 25 clientes
   - 15 órdenes de laboratorio
   - 5 ventas recientes
   - 10 citas
   - Productos y stock

## 📊 Datos Demo Incluidos

La migración crea:

- ✅ **1 Organización:** Óptica Demo Global
- ✅ **1 Sucursal:** Casa Matriz
- ✅ **25 Clientes** con datos realistas chilenos
- ✅ **10 Recetas** con diferentes tipos y graduaciones
- ✅ **15 Órdenes de Laboratorio** en diferentes estados del workflow
- ✅ **5 Ventas Recientes** con pagos aprobados
- ✅ **20 Productos:** 10 marcos, 5 lentes, 5 accesorios
- ✅ **10 Citas:** algunas completadas, algunas futuras
- ✅ **5 Presupuestos:** algunos activos, algunos aceptados
- ✅ **Stock de productos** en la sucursal

## 🔄 Re-aplicar Datos Demo

Si necesitas resetear los datos demo:

```bash
# Opción 1: Resetear toda la base de datos
npm run supabase:reset

# Opción 2: Eliminar solo datos demo y re-aplicar
docker exec -i supabase_db_web psql -U postgres -d postgres <<EOF
-- Eliminar datos demo (cuidado: esto elimina todo lo relacionado)
DELETE FROM public.orders WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.lab_work_orders WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.quotes WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.appointments WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.prescriptions WHERE customer_id IN (SELECT id FROM public.customers WHERE organization_id = '00000000-0000-0000-0000-000000000001');
DELETE FROM public.customers WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.product_branch_stock WHERE branch_id = '00000000-0000-0000-0000-000000000002';
DELETE FROM public.products WHERE organization_id = '00000000-0000-0000-0000-000000000001';
EOF

# Luego re-aplicar la migración
docker exec -i supabase_db_web psql -U postgres -d postgres < supabase/migrations/20260130000000_seed_demo_organization.sql
```

## 🐛 Troubleshooting

### Error: "User must be created first"

Si ves este error al ejecutar el script SQL, significa que el usuario no existe en `auth.users`.

**Solución:**

1. Crea el usuario primero usando el script Node.js:
   ```bash
   node scripts/create-demo-super-admin.js
   ```
2. O créalo manualmente en Supabase Studio (Authentication > Users)

### Error: "Organization not found"

Si la organización demo no existe, aplica la migración primero:

```bash
npm run supabase:reset
```

### No veo datos en el dashboard

1. Verifica que estés logueado con el usuario demo
2. Verifica que `organization_id` esté correctamente asignado (reemplaza TU_EMAIL_DEMO):
   ```bash
   docker exec -i supabase_db_web psql -U postgres -d postgres -c "SELECT email, organization_id FROM public.admin_users WHERE email = 'TU_EMAIL_DEMO';"
   ```
3. Verifica que la variable `NEXT_PUBLIC_DEMO_ORG_ID` esté en `.env.local`
4. Reinicia el servidor de desarrollo

### Los datos no aparecen por RLS

Si los datos existen pero no los ves, puede ser un problema de RLS. Verifica:

```bash
# Verificar políticas RLS
docker exec -i supabase_db_web psql -U postgres -d postgres -c "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('customers', 'orders', 'lab_work_orders');"
```

## 📝 Notas Importantes

- ⚠️ **Solo para desarrollo:** Estos scripts y datos son solo para desarrollo local
- 🔒 **No usar en producción:** Nunca uses credenciales por defecto en producción
- 🗑️ **Datos demo:** Los datos demo se pueden eliminar sin afectar otros datos si usas la organización correcta
- 🔄 **UUIDs fijos:** Los UUIDs están hardcodeados para facilitar referencias, pero puedes cambiarlos si es necesario

## 🎯 Próximos Pasos

Después de configurar la demo:

1. Explora el dashboard con datos realistas
2. Prueba el flujo de onboarding desde cero
3. Verifica que el banner de "modo demo" aparezca cuando corresponda
4. Prueba la conversión de demo a organización real
