# Guía de Arquitectura - Opttius

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Arquitectura de Capas](#arquitectura-de-capas)
5. [Sistema Multi-Sucursal](#sistema-multi-sucursal)
6. [Gestión de Estado](#gestión-de-estado)
7. [Validación y Seguridad](#validación-y-seguridad)
8. [Base de Datos](#base-de-datos)
9. [API Routes](#api-routes)
10. [Convenciones de Código](#convenciones-de-código)

---

## Visión General

Esta aplicación es un sistema de gestión empresarial para ópticas, diseñado para manejar múltiples sucursales, productos, clientes, presupuestos, órdenes de trabajo y facturación.

### Principios Arquitectónicos

- **Separación de Responsabilidades**: Cada módulo tiene una responsabilidad clara
- **Reutilización**: Utilidades compartidas y hooks personalizados
- **Type Safety**: TypeScript estricto en todo el código
- **Escalabilidad**: Preparado para multi-tenancy SaaS
- **Mantenibilidad**: Código documentado y bien estructurado

---

## Stack Tecnológico

### Frontend

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Componentes**: shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Formularios**: React Hook Form + Zod
- **Icons**: Lucide React

### Backend

- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

### Herramientas

- **TypeScript**: Tipado estático
- **ESLint**: Linting
- **Prettier**: Formateo de código
- **Husky**: Git hooks
- **Pino**: Logging estructurado

---

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Panel de administración
│   ├── api/               # API Routes
│   └── (auth)/            # Rutas de autenticación
├── components/            # Componentes React reutilizables
│   ├── admin/            # Componentes específicos de admin
│   └── ui/               # Componentes UI base (shadcn/ui)
├── contexts/              # React Contexts
├── hooks/                 # Custom React Hooks
├── lib/                   # Utilidades y helpers
│   ├── api/              # Helpers de API
│   ├── utils/            # Utilidades generales
│   └── logger.ts         # Sistema de logging
└── types/                 # TypeScript type definitions
```

---

## Arquitectura de Capas

### 1. Capa de Presentación (UI)

- **Componentes React**: Componentes funcionales reutilizables
- **Páginas**: Next.js pages que orquestan componentes
- **Hooks de UI**: `useState`, `useEffect`, hooks personalizados

### 2. Capa de Lógica de Negocio

- **Custom Hooks**: Lógica reutilizable (ej: `useProducts`, `useBranch`)
- **Utils**: Funciones de negocio (cálculos, formateo, validación)
- **Contexts**: Estado global compartido (BranchContext, AuthContext)

### 3. Capa de Datos

- **API Routes**: Endpoints Next.js (`/api/admin/*`)
- **React Query**: Cache y sincronización de datos
- **Supabase Client**: Cliente de base de datos

### 4. Capa de Persistencia

- **Supabase PostgreSQL**: Base de datos relacional
- **Row Level Security (RLS)**: Seguridad a nivel de fila
- **Migrations**: Migraciones versionadas

---

## Sistema Multi-Sucursal

### Concepto

La aplicación soporta múltiples sucursales (branches) donde cada sucursal tiene:

- Sus propios productos e inventario
- Sus propios usuarios y permisos
- Sus propios clientes, presupuestos y órdenes
- Configuración independiente

### Implementación

#### Contexto de Sucursales

```typescript
// src/contexts/BranchContext.tsx
// Proporciona estado global de sucursales
```

#### Hook useBranch

```typescript
const { currentBranchId, isSuperAdmin, switchBranch } = useBranch();
```

#### Filtrado en API

- Header `x-branch-id` en requests
- Middleware de branch en API routes
- RLS policies en Supabase

### Vista Global (Super Admin)

- Super administradores pueden ver todas las sucursales
- `isGlobalView = true` cuando no hay sucursal seleccionada
- Filtrado opcional en queries

---

## Gestión de Estado

### React Query (TanStack Query)

- **Cache centralizado**: Datos compartidos entre componentes
- **Invalidación**: Actualización automática cuando cambian datos
- **Optimistic Updates**: Actualizaciones optimistas para mejor UX

### Estado Local

- **useState**: Estado de UI (formularios, modales, etc.)
- **useReducer**: Estado complejo cuando es necesario

### Contextos Globales

- **BranchContext**: Estado de sucursales
- **AuthContext**: Estado de autenticación

---

## Validación y Seguridad

### Validación Frontend

- **Zod Schemas**: Validación de tipos y reglas de negocio
- **React Hook Form**: Validación de formularios
- **Validación en tiempo real**: Feedback inmediato al usuario

### Validación Backend

- **Zod Helpers**: `parseAndValidateBody`, `parseAndValidateQuery`
- **ValidationError**: Errores consistentes y tipados
- **Sanitización**: Limpieza automática de inputs

### Seguridad

- **Row Level Security (RLS)**: Aislamiento de datos por sucursal
- **Middleware de autenticación**: Verificación de sesión
- **Middleware de branch**: Filtrado por sucursal
- **Validación de permisos**: Verificación de roles

---

## Base de Datos

### Supabase PostgreSQL

#### Tablas Principales

- `branches`: Sucursales
- `products`: Productos
- `customers`: Clientes
- `quotes`: Presupuestos
- `work_orders`: Órdenes de trabajo
- `orders`: Órdenes de venta
- `admin_users`: Usuarios administradores

#### Row Level Security (RLS)

- Políticas por sucursal
- Políticas por rol de usuario
- Aislamiento de datos entre sucursales

#### Migraciones

- Versionadas en `supabase/migrations/`
- Formato: `YYYYMMDDHHMMSS_description.sql`

---

## API Routes

### Estructura

```
/api/
├── admin/                 # Rutas de administración
│   ├── products/         # CRUD de productos
│   ├── customers/        # CRUD de clientes
│   ├── quotes/           # CRUD de presupuestos
│   └── ...
└── (public)/             # Rutas públicas (si aplica)
```

### Patrón de API Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { parseAndValidateBody } from "@/lib/api/validation/zod-helpers";
import { createProductSchema } from "@/lib/api/validation/zod-schemas";

export async function POST(request: NextRequest) {
  // 1. Validar autenticación
  // 2. Validar body
  const data = await parseAndValidateBody(request, createProductSchema);
  // 3. Lógica de negocio
  // 4. Retornar respuesta
  return NextResponse.json(result);
}
```

### Middleware

- **Autenticación**: Verificar sesión de usuario
- **Branch**: Filtrar por sucursal
- **Permisos**: Verificar roles y permisos

---

## Convenciones de Código

### Nombres de Archivos

- **Componentes**: PascalCase (`ProductCard.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useProducts.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Types**: camelCase (`product.types.ts`)

### Estructura de Componentes

```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Componente principal
// 4. Exports
```

### Comentarios y Documentación

- **JSDoc**: Para funciones públicas y APIs
- **Comentarios inline**: Para lógica compleja
- **README**: Para módulos complejos

### Git Commits

- Formato: `type: descripción`
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

---

## Utilidades Compartidas

### Formateo

- `formatDate()`: Formateo de fechas
- `formatCurrency()`: Formateo de moneda
- `formatPrice()`: Formateo de precios
- `formatDateTime()`: Fecha y hora completa
- `formatTimeAgo()`: Tiempo relativo

### Validación

- `validateRequestBody()`: Validar body de request
- `validateQueryParams()`: Validar query parameters
- `parseAndValidateBody()`: Parsear y validar en un paso

### Branch

- `getBranchHeader()`: Header para requests API
- `getBranchQueryParam()`: Query param para URLs
- `formatBranchName()`: Formatear nombre de sucursal

### Tax

- `calculatePriceWithTax()`: Calcular precio con impuestos
- `calculateTotalTax()`: Calcular impuesto total
- `calculateSubtotal()`: Calcular subtotal
- `calculateTotal()`: Calcular total

### RUT

- `formatRUT()`: Formatear RUT chileno
- `normalizeRUT()`: Normalizar RUT (sin formato)
- `isValidRUTFormat()`: Validar formato de RUT

---

## Hooks Personalizados

### useBranch

Acceso al contexto de sucursales.

### useProducts

Gestión de productos con React Query.

### useFormProtection

Protección contra pérdida de datos en formularios.

### useChatConfig

Configuración del chat AI.

---

## Próximas Mejoras (Roadmap)

### Phase SaaS 0: Multi-tenancy

- Tabla `organizations`
- Tabla `subscriptions`
- RLS por organización
- Tiers de suscripción

### Phase 6: Testing

- Tests unitarios (Vitest)
- Tests de integración
- Tests E2E (Playwright)

---

## Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de React Query](https://tanstack.com/query/latest)
- [Documentación de Zod](https://zod.dev/)

---

**Última actualización**: Enero 2025  
**Versión**: 1.0.0
