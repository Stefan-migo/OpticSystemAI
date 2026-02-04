# Opttius - Sistema de Gestión Óptica

Un sistema completo de gestión para ópticas y laboratorios ópticos, construido con Next.js 14, TypeScript y Supabase. Este sistema proporciona funcionalidad completa de administración para gestionar clientes, citas, presupuestos, trabajos de laboratorio, productos ópticos, ventas y más.

## 🎯 Características Principales

### Gestión de Clientes

- **Perfiles Completos**: Información médica, recetas, historial de compras
- **Búsqueda Inteligente**: Búsqueda por nombre, email, teléfono o RUT (con o sin formato)
- **Formateo Automático de RUT**: Normaliza RUTs chilenos al formato estándar `xx.xxx.xxx-x`
- **Historial Completo**: Citas, presupuestos, trabajos y compras asociadas
- **Clientes No Registrados**: Sistema para agendar citas sin registro previo

### Sistema de Citas (Agendas)

- **Calendario Interactivo**: Vista semanal y mensual con slots de tiempo
- **Gestión Completa**: Crear, editar, cancelar y gestionar estados de citas
- **Clientes No Registrados**: Agendar citas con clientes no registrados (se registran al asistir)
- **Configuración Flexible**: Horarios de trabajo, duración de slots, días bloqueados
- **Disponibilidad Automática**: Verificación automática de disponibilidad
- **Tipos de Cita**: Examen de vista, consulta, ajuste, entrega, reparación, seguimiento, emergencia

### Sistema de Presupuestos (Quotes)

- **Presupuestos Detallados**: Marcos, lentes, tratamientos y mano de obra
- **Expiración Automática**: Configuración de tiempo de validez y expiración automática
- **Conversión a Trabajos**: Convertir presupuestos aceptados en trabajos de laboratorio
- **Envío por Email**: Enviar presupuestos directamente a clientes
- **Impresión/PDF**: Generar documentos imprimibles y PDFs
- **Estados**: Borrador, enviado, aceptado, rechazado, expirado

### Trabajos de Laboratorio (Work Orders)

- **Gestión de Trabajos**: Seguimiento completo del ciclo de vida de trabajos
- **Estados Detallados**: Ordenado, enviado a laboratorio, en proceso, listo, recibido, montado, control de calidad, entregado
- **Timeline Visual**: Indicador visual del estado actual y progreso
- **Historial de Cambios**: Registro completo de cambios de estado
- **Asignación de Personal**: Asignar trabajos a miembros del equipo
- **Relación con Presupuestos**: Vinculación con presupuestos originales

### Punto de Venta (POS)

- **Ventas Rápidas**: Sistema de punto de venta integrado
- **Búsqueda de Clientes**: Búsqueda inteligente por RUT, nombre, email o teléfono
- **Carga de Presupuestos**: Cargar presupuestos existentes al carrito
- **Órdenes Completas**: Crear órdenes con marco, lente, tratamientos y mano de obra
- **Múltiples Métodos de Pago**: Efectivo, tarjeta de débito, tarjeta de crédito, cuotas
- **Cálculo Automático**: IVA, descuentos y totales calculados automáticamente

### Sistema de Recetas (Prescriptions)

- **Recetas Médicas**: Gestión completa de recetas oftalmológicas
- **Mediciones Detalladas**: Esfera, cilindro, eje, adición, distancia pupilar
- **Ojo Derecho e Izquierdo**: Especificaciones independientes para cada ojo
- **Tipos de Lente**: Visión simple, bifocal, trifocal, progresivo, lectura, computadora, deportes
- **Historial**: Seguimiento de recetas por cliente

### Gestión de Productos Ópticos

- **Catálogo Completo**: Marcos, lentes, accesorios y servicios
- **Especificaciones Ópticas**: Tipo de marco, material, medidas, forma, color
- **Especificaciones de Lente**: Tipo, material, índice de refracción, tratamientos
- **Opciones Personalizables**: Campos configurables por tipo de producto
- **Control de Inventario**: Stock, SKU, códigos de barras

### Sistema de Notificaciones

- **Notificaciones en Tiempo Real**: Sistema completo de notificaciones para administradores
- **Tipos de Notificación**: Nuevos clientes, presupuestos, cambios de estado, trabajos, citas, ventas
- **Configuración Flexible**: Activar/desactivar tipos de notificación
- **Prioridades**: Sistema de prioridades para notificaciones importantes

### Características Técnicas

- **Next.js 14** con App Router
- **TypeScript** para seguridad de tipos
- **Supabase** para backend y base de datos (desarrollo local soportado)
- **Tailwind CSS** para estilos
- **Diseño Responsive** para móvil y escritorio
- **Control de Acceso Basado en Roles** (RBAC)
- **Actualizaciones en Tiempo Real** y notificaciones
- **Multi-Provider AI Support**: OpenAI, Anthropic, Google Gemini, DeepSeek
- **AI Agent con Tool Calling**: Operaciones autónomas de base de datos mediante lenguaje natural
- **Pagos con Criptomonedas**: Acepta 300+ criptomonedas vía NOWPayments (Bitcoin, Ethereum, USDT, etc.)
- **Múltiples Pasarelas de Pago**: Mercado Pago, PayPal, NOWPayments (Crypto)

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0
- **npm** o **yarn**
- **Docker** o **Podman** (para Supabase local)
- **Git**

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Stefan-migo/OpticSystemAI.git
cd Opttius
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Base de Datos Local Supabase

Este proyecto usa **Supabase local** para desarrollo. Sigue estos pasos:

#### Iniciar Supabase Local

```bash
npm run supabase:start
```

**Primera vez:**

- Descarga ~800MB de imágenes Docker
- Toma 5-10 minutos
- Inicios posteriores toman 10-30 segundos

#### Obtener Credenciales de Base de Datos

```bash
npm run supabase:status
```

Esto mostrará:

- API URL (generalmente `http://127.0.0.1:54321`)
- Anon Key (clave pública)
- Service Role Key (clave privada)
- Database URL
- Studio URL (generalmente `http://127.0.0.1:54323`)

#### Configurar Variables de Entorno

Crea un archivo `.env.local` en el directorio raíz:

```bash
cp env.example .env.local
```

Actualiza `.env.local` con los valores de `supabase:status`:

````env
# Supabase Configuration (Local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key_del_status>
SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key_del_status>

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Email (Opcional - para envío de presupuestos)
RESEND_API_KEY=<tu_resend_api_key>

# Pagos (Opcional - para MercadoPago)
MERCADOPAGO_ACCESS_TOKEN=<tu_mercadopago_token>
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=<tu_mercadopago_public_key>

# Pagos con Criptomonedas (Opcional - para NOWPayments)
NOWPAYMENTS_API_KEY=<tu_nowpayments_api_key>
NOWPAYMENTS_IPN_SECRET=<tu_nowpayments_ipn_secret>
NOWPAYMENTS_SANDBOX_MODE=true

# PayPal (Opcional)
PAYPAL_CLIENT_ID=<tu_paypal_client_id>
PAYPAL_CLIENT_SECRET=<tu_paypal_client_secret>
PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com


#### Aplicar Migraciones de Base de Datos

```bash
npm run supabase:reset
````

Esto:

- Crea todas las tablas de base de datos
- Configura políticas de Row Level Security (RLS)
- Crea funciones y triggers necesarios
- Aplica todas las migraciones del sistema óptico

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en:

- **Aplicación Principal**: http://localhost:3000
- **Panel de Administración**: http://localhost:3000/admin
- **Supabase Studio**: http://127.0.0.1:54323 (UI de Base de Datos)
- **Prueba de Email (Mailpit)**: http://127.0.0.1:54324

## 👤 Crear Tu Primer Usuario Administrador

Después de configurar la base de datos, necesitas crear un usuario administrador para acceder al panel de administración.

**⚠️ Nota de Seguridad**: El script `create-admin-via-api.js` es **solo para desarrollo local**. Nunca uses credenciales hardcodeadas en producción.

### Método 1: Usando Script SQL (Recomendado)

1. **Registra un usuario regular** a través de la página de registro en http://localhost:3000/signup

2. **Otorga acceso de administrador** usando el script SQL:

```bash
docker exec -i supabase_db_web psql -U postgres -d postgres < scripts/sql-utils/grant-admin-access.sql
```

Edita `scripts/sql-utils/grant-admin-access.sql` y cambia el email al de tu usuario antes de ejecutar.

### Método 2: Usando Script Node.js (Solo Desarrollo)

**⚠️ Advertencia**: Este método usa un script de desarrollo. Para producción, usa el Método 1.

1. Configura variables de entorno (opcional, o pasa como argumentos):

   ```bash
   export ADMIN_EMAIL="tu-email@ejemplo.com"
   export ADMIN_PASSWORD="TuContraseñaSegura123!"
   ```

2. Ejecuta el script:

   ```bash
   # Usando variables de entorno
   node scripts/create-admin-via-api.js

   # O pasa credenciales como argumentos (menos seguro)
   node scripts/create-admin-via-api.js tu-email@ejemplo.com TuContraseña123!
   ```

3. Inicia sesión en http://localhost:3000/login

### Método 3: Usando Supabase Studio

1. Abre Supabase Studio: http://127.0.0.1:54323
2. Ve a **SQL Editor**
3. Ejecuta este SQL (reemplaza `tu-email@ejemplo.com` con tu email):

```sql
DO $$
DECLARE
  user_id uuid;
  user_email text := 'tu-email@ejemplo.com';
BEGIN
  -- Encontrar usuario por email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', user_email;
  END IF;

  -- Agregar a tabla admin_users
  INSERT INTO public.admin_users (id, email, role, is_active, created_at, updated_at)
  VALUES (user_id, user_email, 'admin', true, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = true,
    updated_at = now();

  RAISE NOTICE 'Acceso de administrador otorgado a %', user_email;
END $$;
```

4. Inicia sesión en http://localhost:3000/login con tu email y contraseña
5. Serás redirigido al panel de administración

## 📁 Estructura del Proyecto

```
Opttius/
├── src/
│   ├── app/
│   │   ├── admin/              # Páginas de administración
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── appointments/   # Sistema de citas
│   │   │   ├── customers/      # Gestión de clientes
│   │   │   ├── quotes/         # Sistema de presupuestos
│   │   │   ├── work-orders/    # Trabajos de laboratorio
│   │   │   ├── pos/            # Punto de venta
│   │   │   ├── products/       # Gestión de productos
│   │   │   ├── orders/         # Gestión de pedidos
│   │   │   ├── support/        # Sistema de tickets
│   │   │   ├── analytics/       # Dashboard de analytics
│   │   │   └── system/         # Configuración del sistema
│   │   ├── api/                # Rutas API
│   │   │   └── admin/
│   │   │       ├── appointments/    # API de citas
│   │   │       ├── customers/        # API de clientes
│   │   │       ├── quotes/          # API de presupuestos
│   │   │       ├── work-orders/     # API de trabajos
│   │   │       ├── pos/             # API de POS
│   │   │       └── notifications/   # API de notificaciones
│   │   ├── profile/            # Página de perfil de usuario
│   │   ├── login/              # Página de login
│   │   └── signup/             # Página de registro
│   ├── components/
│   │   ├── admin/              # Componentes específicos de admin
│   │   │   ├── AppointmentCalendar.tsx
│   │   │   ├── CreateAppointmentForm.tsx
│   │   │   ├── CreateQuoteForm.tsx
│   │   │   ├── CreateWorkOrderForm.tsx
│   │   │   └── NotificationSettings.tsx
│   │   └── ui/                 # Componentes UI reutilizables
│   ├── lib/
│   │   ├── utils/
│   │   │   └── rut.ts          # Utilidades para RUT chileno
│   │   ├── notifications/      # Sistema de notificaciones
│   │   └── email/              # Sistema de emails
│   └── types/                  # Definiciones de tipos TypeScript
├── supabase/
│   ├── migrations/             # Migraciones de base de datos
│   └── config.toml             # Configuración de Supabase
└── public/                     # Assets estáticos
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm run start            # Iniciar servidor de producción
npm run lint             # Ejecutar ESLint
npm run type-check       # Verificación de tipos TypeScript

# Supabase
npm run supabase:start   # Iniciar Supabase local
npm run supabase:stop    # Detener Supabase local
npm run supabase:status  # Verificar estado y obtener credenciales
npm run supabase:reset   # Resetear base de datos (re-aplicar migraciones)
```

## 📊 Esquema de Base de Datos

### Tablas Principales

#### Gestión de Clientes

- `profiles` - Perfiles de usuarios/clientes con información médica
- `prescriptions` - Recetas oftalmológicas
- `appointments` - Citas/agendas (soporta clientes registrados y no registrados)

#### Sistema de Presupuestos y Trabajos

- `quotes` - Presupuestos (presupuestos)
- `lab_work_orders` - Trabajos de laboratorio
- `lab_work_order_status_history` - Historial de estados de trabajos
- `quote_settings` - Configuración de presupuestos

#### Productos y Ventas

- `products` - Catálogo de productos ópticos (marcos, lentes, accesorios)
- `product_options` - Opciones personalizables de productos
- `orders` - Pedidos/ventas
- `order_items` - Items de pedidos

#### Sistema y Configuración

- `admin_users` - Usuarios administradores
- `admin_notifications` - Notificaciones del sistema
- `notification_settings` - Configuración de notificaciones
- `schedule_settings` - Configuración de horarios y citas
- `system_config` - Configuración general del sistema

### Funciones Clave

- `is_admin(user_id)` - Verificar privilegios de administrador
- `normalize_rut_for_search(rut_text)` - Normalizar RUT para búsqueda
- `search_customers_by_rut(rut_search_term)` - Buscar clientes por RUT
- `check_appointment_availability()` - Verificar disponibilidad de citas
- `check_and_expire_quotes()` - Expirar presupuestos automáticamente

## 🔐 Autenticación y Autorización

El sistema usa Supabase Auth con control de acceso basado en roles:

- **Usuarios Regulares**: Pueden acceder a su perfil y realizar compras
- **Usuarios Administradores**: Acceso completo al panel de administración (productos, pedidos, clientes, citas, presupuestos, trabajos, analytics, etc.)

El estado de administrador se determina por la tabla `admin_users`. Los usuarios deben ser agregados a esta tabla para obtener acceso de administrador.

## 🌐 Puntos de Acceso

- **Aplicación Principal**: http://localhost:3000
- **Panel de Administración**: http://localhost:3000/admin (requiere acceso de administrador)
- **Perfil de Usuario**: http://localhost:3000/profile (requiere autenticación)
- **Supabase Studio**: http://127.0.0.1:54323 (UI de gestión de base de datos)
- **Prueba de Email**: http://127.0.0.1:54324 (Mailpit - ver emails de prueba)

## 🎨 Características Específicas del Sistema Óptico

### Sistema de Citas

- **Calendario Visual**: Vista semanal y mensual con slots de tiempo configurables
- **Clientes No Registrados**: Agendar citas sin crear cliente en el sistema
- **Configuración Flexible**: Horarios de trabajo, duración de slots, días bloqueados
- **Verificación de Disponibilidad**: Sistema automático de verificación de disponibilidad

### Sistema de Presupuestos

- **Presupuestos Detallados**: Marcos, lentes, tratamientos, mano de obra
- **Expiración Automática**: Configuración de tiempo de validez
- **Envío por Email**: Enviar presupuestos directamente a clientes
- **Impresión/PDF**: Generar documentos imprimibles
- **Conversión a Trabajos**: Convertir presupuestos aceptados en trabajos

### Trabajos de Laboratorio

- **Estados Detallados**: Seguimiento completo del ciclo de vida
- **Timeline Visual**: Indicador visual del progreso
- **Asignación de Personal**: Asignar trabajos a miembros del equipo
- **Historial Completo**: Registro de todos los cambios de estado

### Punto de Venta (POS)

- **Ventas Rápidas**: Sistema integrado de punto de venta
- **Búsqueda Inteligente**: Búsqueda de clientes por RUT, nombre, email
- **Carga de Presupuestos**: Cargar presupuestos existentes
- **Múltiples Métodos de Pago**: Efectivo, tarjetas, cuotas

### Utilidades RUT Chileno

- **Formateo Automático**: Normaliza RUTs al formato `xx.xxx.xxx-x`
- **Búsqueda Inteligente**: Busca RUTs con o sin formato
- **Búsqueda Parcial**: Encuentra clientes con búsquedas parciales de RUT

## 🐛 Solución de Problemas

### Supabase No Inicia

```bash
# Verificar si los contenedores están corriendo
docker ps

# Detener y reiniciar
npm run supabase:stop
npm run supabase:start
```

### Conflictos de Puerto

Si los puertos 54321-54324 ya están en uso, puedes cambiarlos en `supabase/config.toml`:

```toml
[api]
port = 54321  # Cambiar si es necesario

[db]
port = 54322  # Cambiar si es necesario

[studio]
port = 54323  # Cambiar si es necesario
```

### Errores de Migración

```bash
# Resetear la base de datos completamente
npm run supabase:reset
```

### Errores de Compilación

```bash
# Limpiar caché de Next.js
rm -rf .next

# Reinstalar dependencias
rm -rf node_modules
npm install

# Intentar compilar nuevamente
npm run build
```

### No Se Puede Acceder al Panel de Administración

1. Verifica que estés logueado
2. Verifica que tu usuario exista en la tabla `admin_users`:
   ```sql
   SELECT * FROM admin_users WHERE email = 'tu-email@ejemplo.com';
   ```
3. Verifica el estado de administrador:
   ```sql
   SELECT is_admin('tu-user-id'::uuid);
   ```

## 📝 Variables de Entorno

Variables de entorno requeridas (`.env.local`):

```env
# Supabase (Local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<del_supabase_status>
SUPABASE_SERVICE_ROLE_KEY=<del_supabase_status>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

Opcionales (para funcionalidades de producción):

- `RESEND_API_KEY` - Para envío de emails (presupuestos, notificaciones)
- `MERCADOPAGO_ACCESS_TOKEN` - Para procesamiento de pagos
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` - Para procesamiento de pagos

### Configuración de Chatbot AI

El sistema incluye un agente chatbot con IA que puede gestionar la aplicación mediante lenguaje natural. Configura al menos un proveedor LLM:

```env
# AI / LLM Providers
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4-turbo-preview
AI_FALLBACK_PROVIDERS=deepseek,google

# OpenAI
OPENAI_API_KEY=tu_openai_api_key

# Anthropic (Claude)
ANTHROPIC_API_KEY=tu_anthropic_api_key

# Google (Gemini)
GOOGLE_API_KEY=tu_google_api_key

# DeepSeek
DEEPSEEK_API_KEY=tu_deepseek_api_key
```

El chatbot soporta múltiples proveedores con fallback automático. Puedes cambiar de proveedor desde la interfaz del chat.

## 📚 Documentación

- [Guía de Configuración Local](./docs/SETUP_GUIDE.md) - Configuración detallada para desarrollo local
- [Comandos Docker](./docs/DOCKER_COMMANDS.md) - Comandos útiles de Docker
- [Inicio Rápido](./docs/QUICK_SETUP.md) - Guía rápida de inicio
- [Migraciones de Base de Datos](./supabase/migrations/) - Migraciones del esquema de base de datos

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama de funcionalidad (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

[Agregar tu licencia aquí]

## 🤖 Agente Chatbot AI

La aplicación incluye un agente chatbot inteligente que permite a los administradores gestionar el sistema mediante lenguaje natural. El chatbot puede:

- **Buscar y gestionar productos**: Encontrar productos, actualizar inventario, crear nuevos productos
- **Gestionar pedidos**: Ver pedidos, actualizar estado, rastrear pagos
- **Gestionar clientes**: Ver perfiles, actualizar información, ver historial de pedidos
- **Proporcionar analytics**: Estadísticas del dashboard, tendencias de ingresos, reportes de ventas
- **Gestionar soporte**: Gestionar tickets, responder a clientes
- **Gestionar citas**: Ver citas, crear nuevas citas, actualizar estados
- **Gestionar presupuestos**: Ver presupuestos, crear nuevos, actualizar estados

### Usando el Chatbot

1. Haz clic en el botón de chat (esquina inferior derecha) en el panel de administración
2. Selecciona tu proveedor de IA preferido (OpenAI, Anthropic, Google, DeepSeek)
3. Haz preguntas o da comandos en lenguaje natural
4. El agente ejecutará las herramientas apropiadas para cumplir tu solicitud

### Comandos de Ejemplo

- "Muéstrame los productos con stock bajo"
- "Actualiza el stock del producto X a 50 unidades"
- "¿Cuántos pedidos pendientes hay?"
- "Dame las estadísticas del dashboard"
- "Crea un nuevo presupuesto para el cliente..."
- "Muéstrame las citas de hoy"
- "¿Cuántos trabajos están en proceso?"

### Configuración de Proveedores

Configura al menos un proveedor LLM en tu archivo `.env.local`. El sistema soporta fallback automático si el proveedor principal falla.

## 🆘 Soporte

Para problemas y preguntas:

- Revisa la sección de solución de problemas arriba
- Revisa los archivos de documentación
- Abre un issue en GitHub: https://github.com/Stefan-migo/OpticSystemAI/issues (repositorio Opttius)

---

**Nota**: Este proyecto usa **Supabase local** para desarrollo. Para despliegue en producción, necesitarás configurar un proyecto Supabase en la nube y actualizar las variables de entorno en consecuencia.

## 🆕 Versión Actual

**v2.0 - Sistema de Gestión Óptica Completo**

Esta versión incluye:

- ✅ Sistema completo de citas con clientes no registrados
- ✅ Sistema de presupuestos con expiración automática
- ✅ Sistema de trabajos de laboratorio con estados detallados
- ✅ Punto de venta (POS) mejorado
- ✅ Sistema de notificaciones configurable
- ✅ Búsqueda mejorada de RUT (parcial y completa)
- ✅ Formateo automático de RUT chileno
- ✅ Sistema de recetas oftalmológicas
- ✅ Gestión completa de productos ópticos
