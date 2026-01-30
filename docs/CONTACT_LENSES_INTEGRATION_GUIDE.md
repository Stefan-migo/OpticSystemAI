# 👁️ Guía de Integración: Lentes de Contacto en Opttius

**Fecha Creación:** 2026-01-29  
**Estado:** 📋 Documentación Completa - Listo para Implementación  
**Objetivo:** Integrar la gestión de lentes de contacto al sistema Opttius, manteniendo la modularidad y aprovechando la arquitectura existente

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Análisis del Sistema Actual](#análisis-del-sistema-actual)
3. [Arquitectura Propuesta](#arquitectura-propuesta)
4. [Schema de Base de Datos](#schema-de-base-de-datos)
5. [Funciones SQL](#funciones-sql)
6. [Integración con Módulos Existentes](#integración-con-módulos-existentes)
7. [Implementación Paso a Paso](#implementación-paso-a-paso)
8. [API Endpoints](#api-endpoints)
9. [Frontend Components](#frontend-components)

---

## 🎯 Visión General

### ¿Por Qué Integrar Lentes de Contacto?

1. **Ingreso Recurrente:** Muchos usuarios de lentes de contacto compran sus suministros regularmente (mensual, trimestral), lo que representa un flujo de ingresos predecible.
2. **Gestión de Inventario Específica:** Los lentes de contacto tienen características propias (curva base, diámetro, caja, tipo de uso) que requieren una gestión de inventario diferenciada.
3. **Recetas Diferentes:** La receta de lentes de contacto no es idéntica a la de lentes ópticos. Requiere ajustes (vertex distance) y parámetros específicos.
4. **Servicios Asociados:** Adaptación, chequeos de seguimiento, educación sobre uso y cuidado.
5. **Competencia:** Muchas ópticas ya ofrecen este servicio, no tenerlo te pondría en desventaja.
6. **Experiencia del Cliente:** Una aplicación completa permite al cliente gestionar todas sus necesidades visuales en un solo lugar.

### Diferencias Clave con Lentes Ópticos

| Aspecto                  | Lentes Ópticos                 | Lentes de Contacto                          |
| ------------------------ | ------------------------------ | ------------------------------------------- |
| **Parámetros**           | Esfera, Cilindro, Eje, Adición | Esfera, Cilindro, Eje, Curva Base, Diámetro |
| **Unidad de Venta**      | Par de lentes                  | Caja (6, 30 lentes)                         |
| **Frecuencia de Compra** | Cada 1-2 años                  | Mensual/Trimestral                          |
| **Gestión de Stock**     | Por par individual             | Por caja                                    |
| **Proceso**              | Fabricación a medida           | Stock directo (mayoría)                     |
| **Servicios**            | Montaje, ajuste                | Adaptación, educación, seguimiento          |

---

## 🔍 Análisis del Sistema Actual

### Sistema de Lentes Ópticos Existente

El sistema actual utiliza:

- **`lens_families`**: Define características genéticas (tipo, material)
- **`lens_price_matrices`**: Define precios por rangos de esfera, cilindro, adición
- **`calculate_lens_price()`**: Función SQL para calcular precios automáticamente
- **Integración con `quotes` y `lab_work_orders`**: Campos para referenciar familias de lentes

### Limitaciones del Sistema Actual para Lentes de Contacto

El esquema actual de `lens_families` y `lens_price_matrices` está optimizado para **lentes oftálmicos tradicionales**. Las columnas como `sphere_min`, `sphere_max`, `cylinder_min`, `cylinder_max`, `addition_min`, `addition_max` y `sourcing_type` son perfectas para lentes de armazón.

Sin embargo, los lentes de contacto tienen diferentes parámetros y modelos de precios:

- **Curva Base (BC)** y **Diámetro (DIA)**: Parámetros específicos de lentes de contacto
- **Tipo de Uso**: Diario, quincenal, mensual (no aplica a lentes ópticos)
- **Modalidad**: Esférico, tórico, multifocal, cosmético
- **Embalaje**: Caja de 30, 6, 3 lentes (no "par")
- **Precio por Caja**: No por par individual

### Decisión Arquitectónica

**Opción Elegida: Nuevo conjunto de tablas paralelas**

Crear un conjunto de tablas **paralelas** para lentes de contacto (`contact_lens_families` y `contact_lens_price_matrices`), manteniendo la modularidad. Esto es análogo a cómo se separan las familias de lentes de otras tablas de productos genéricos.

**Ventajas:**

- ✅ Mantiene la separación de responsabilidades
- ✅ No fuerza campos NULL innecesarios
- ✅ Permite evolución independiente
- ✅ Facilita el mantenimiento
- ✅ No afecta el sistema existente

---

## 🏗️ Arquitectura Propuesta

### Modelo de Datos

```
contact_lens_families (Familias de Lentes de Contacto)
├── Características genéticas: nombre, marca, tipo de uso, modalidad, material
├── Parámetros físicos: curva base, diámetro (si son fijos)
└── Embalaje: tipo de caja (30, 6, 3 lentes)

contact_lens_price_matrices (Matrices de Precios)
├── Rangos de parámetros: esfera, cilindro, eje, adición
├── Precios: precio por caja, costo por caja
└── Relación: contact_lens_family_id

quotes (Presupuestos)
├── Campos existentes: lens_family_id (lentes ópticos)
└── Nuevos campos: contact_lens_family_id, contact_lens_rx_* (receta LC)

lab_work_orders (Trabajos)
├── Campos existentes: lens_family_id (lentes ópticos)
└── Nuevos campos: contact_lens_family_id, contact_lens_rx_* (receta LC)
```

---

## 📊 Schema de Base de Datos

### Migración SQL Completa

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_contact_lenses_system.sql`

```sql
-- ============================================================================
-- Migration: Create Contact Lenses System
-- Phase: Contact Lenses Integration
-- Description: Sistema completo para gestión de lentes de contacto
-- ============================================================================

-- ===== CREATE CONTACT_LENS_FAMILIES TABLE =====
CREATE TABLE IF NOT EXISTS public.contact_lens_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Información comercial
  name TEXT NOT NULL,                     -- "Acuvue Oasys", "Air Optix Aqua"
  brand TEXT,                             -- "Johnson & Johnson", "Alcon", "Bausch + Lomb"
  description TEXT,                       -- Descripción opcional

  -- Características de Lentes de Contacto
  use_type TEXT NOT NULL CHECK (use_type IN (
    'daily',           -- Uso diario (desechable)
    'bi_weekly',       -- Quincenal
    'monthly',         -- Mensual
    'extended_wear'    -- Uso prolongado (menos común hoy)
  )),

  modality TEXT NOT NULL CHECK (modality IN (
    'spherical',       -- Esférico (monofocal)
    'toric',           -- Tórico (para astigmatismo)
    'multifocal',      -- Multifocal (para presbicia)
    'cosmetic'         -- Cosmético (color)
  )),

  material TEXT CHECK (material IN (
    'silicone_hydrogel',  -- Hidrogel de silicona (más transpirable)
    'hydrogel',           -- Hidrogel tradicional
    'rigid_gas_permeable' -- RGP (menos común)
  )),

  packaging TEXT NOT NULL CHECK (packaging IN (
    'box_30',          -- Caja de 30 lentes (común para diario)
    'box_6',           -- Caja de 6 lentes (común para quincenal/mensual)
    'box_3',           -- Caja de 3 lentes
    'bottle'           -- Envase de botella (para lentes de uso anual, menos común)
  )),

  -- Parámetros Fijos (si aplica, a menudo varían por matriz/modelo)
  base_curve DECIMAL(4,2),                 -- Curva Base (ej: 8.4, 8.6)
  diameter DECIMAL(4,2),                   -- Diámetro (ej: 14.0, 14.2)

  -- Multi-tenancy
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Control de estado
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== CREATE CONTACT_LENS_PRICE_MATRICES TABLE =====
CREATE TABLE IF NOT EXISTS public.contact_lens_price_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_lens_family_id UUID REFERENCES public.contact_lens_families(id) ON DELETE CASCADE NOT NULL,

  -- Rangos de parámetros de Lentes de Contacto
  sphere_min DECIMAL(5,2) NOT NULL,
  sphere_max DECIMAL(5,2) NOT NULL,

  cylinder_min DECIMAL(5,2) DEFAULT 0,  -- 0 para esféricos
  cylinder_max DECIMAL(5,2) DEFAULT 0,

  axis_min INTEGER DEFAULT 0,           -- Eje para lentes tóricos (0-180)
  axis_max INTEGER DEFAULT 180,

  addition_min DECIMAL(5,2) DEFAULT 0,  -- Adición para multifocales
  addition_max DECIMAL(5,2) DEFAULT 4.0,

  -- Si los BC/DIA varían por precio (menos común, a menudo por familia)
  -- base_curve DECIMAL(4,2),
  -- diameter DECIMAL(4,2),

  -- Precios y costos (por caja, no por lente individual)
  base_price DECIMAL(10,2) NOT NULL,      -- Precio de venta de la caja
  cost DECIMAL(10,2) NOT NULL,            -- Costo de la caja

  -- Multi-tenancy
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Control de estado
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints de validación
  CONSTRAINT valid_cl_sphere_range CHECK (sphere_min <= sphere_max),
  CONSTRAINT valid_cl_cylinder_range CHECK (cylinder_min <= cylinder_max),
  CONSTRAINT valid_cl_axis_range CHECK (axis_min >= 0 AND axis_max <= 180 AND axis_min <= axis_max),
  CONSTRAINT valid_cl_addition_range CHECK (addition_min <= addition_max)
);

-- ===== CREATE INDEXES =====
CREATE INDEX IF NOT EXISTS idx_contact_lens_families_org ON public.contact_lens_families(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_lens_families_active ON public.contact_lens_families(is_active);
CREATE INDEX IF NOT EXISTS idx_contact_lens_families_use_type ON public.contact_lens_families(use_type);
CREATE INDEX IF NOT EXISTS idx_contact_lens_families_modality ON public.contact_lens_families(modality);

CREATE INDEX IF NOT EXISTS idx_contact_lens_matrices_family ON public.contact_lens_price_matrices(contact_lens_family_id);
CREATE INDEX IF NOT EXISTS idx_contact_lens_matrices_org ON public.contact_lens_price_matrices(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_lens_matrices_active ON public.contact_lens_price_matrices(is_active);

-- Índices GIST para búsqueda rápida de rangos
CREATE INDEX IF NOT EXISTS idx_contact_lens_matrices_sphere_range ON public.contact_lens_price_matrices USING GIST (
  numrange(sphere_min::numeric, sphere_max::numeric, '[]')
);

CREATE INDEX IF NOT EXISTS idx_contact_lens_matrices_cylinder_range ON public.contact_lens_price_matrices USING GIST (
  numrange(cylinder_min::numeric, cylinder_max::numeric, '[]')
);

CREATE INDEX IF NOT EXISTS idx_contact_lens_matrices_addition_range ON public.contact_lens_price_matrices USING GIST (
  numrange(addition_min::numeric, addition_max::numeric, '[]')
);

-- ===== CREATE TRIGGERS FOR UPDATED_AT =====
CREATE TRIGGER update_contact_lens_families_updated_at
  BEFORE UPDATE ON public.contact_lens_families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_lens_price_matrices_updated_at
  BEFORE UPDATE ON public.contact_lens_price_matrices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== ROW LEVEL SECURITY (RLS) =====
ALTER TABLE public.contact_lens_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lens_price_matrices ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios solo ven lentes de contacto de su organización
CREATE POLICY "Users can view contact lens families for their org"
ON public.contact_lens_families FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM public.admin_users
    WHERE id = auth.uid() AND is_active = true
    LIMIT 1
  )
);

CREATE POLICY "Admins can manage contact lens families for their org"
ON public.contact_lens_families FOR ALL
USING (
  organization_id = (
    SELECT organization_id FROM public.admin_users
    WHERE id = auth.uid() AND is_active = true
    LIMIT 1
  )
);

CREATE POLICY "Users can view contact lens price matrices for their org"
ON public.contact_lens_price_matrices FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM public.admin_users
    WHERE id = auth.uid() AND is_active = true
    LIMIT 1
  )
);

CREATE POLICY "Admins can manage contact lens price matrices for their org"
ON public.contact_lens_price_matrices FOR ALL
USING (
  organization_id = (
    SELECT organization_id FROM public.admin_users
    WHERE id = auth.uid() AND is_active = true
    LIMIT 1
  )
);

-- ===== COMMENTS =====
COMMENT ON TABLE public.contact_lens_families IS 'Familias de lentes de contacto con características genéticas';
COMMENT ON TABLE public.contact_lens_price_matrices IS 'Matrices de precios para lentes de contacto por rangos de parámetros';
COMMENT ON COLUMN public.contact_lens_families.use_type IS 'Frecuencia de reemplazo: diario, quincenal, mensual, uso prolongado';
COMMENT ON COLUMN public.contact_lens_families.modality IS 'Tipo de corrección: esférico, tórico (astigmatismo), multifocal (presbicia), cosmético';
COMMENT ON COLUMN public.contact_lens_families.packaging IS 'Formato de venta: caja de 30, 6, 3 lentes, o botella';
COMMENT ON COLUMN public.contact_lens_price_matrices.base_price IS 'Precio de venta por caja (no por lente individual)';
COMMENT ON COLUMN public.contact_lens_price_matrices.cost IS 'Costo de compra por caja';
```

---

## 🔧 Funciones SQL

### Función: `calculate_contact_lens_price`

```sql
CREATE OR REPLACE FUNCTION public.calculate_contact_lens_price(
  p_contact_lens_family_id UUID,
  p_sphere DECIMAL,
  p_cylinder DECIMAL DEFAULT 0,
  p_axis INTEGER DEFAULT NULL,
  p_addition DECIMAL DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
) RETURNS TABLE (
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  base_curve DECIMAL(4,2),
  diameter DECIMAL(4,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    clpm.base_price AS price,
    clpm.cost,
    clf.base_curve,
    clf.diameter
  FROM public.contact_lens_price_matrices clpm
  JOIN public.contact_lens_families clf ON clf.id = clpm.contact_lens_family_id
  WHERE clpm.contact_lens_family_id = p_contact_lens_family_id
    AND (p_organization_id IS NULL OR clpm.organization_id = p_organization_id)
    AND p_sphere BETWEEN clpm.sphere_min AND clpm.sphere_max
    AND p_cylinder BETWEEN clpm.cylinder_min AND clpm.cylinder_max
    AND (p_axis IS NULL OR (p_axis BETWEEN clpm.axis_min AND clpm.axis_max))
    AND (p_addition IS NULL OR (p_addition BETWEEN clpm.addition_min AND clpm.addition_max))
    AND clpm.is_active = TRUE
    AND clf.is_active = TRUE
  ORDER BY
    clpm.base_price ASC -- O alguna otra lógica si hay solapamiento (ej. más específico gana)
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.calculate_contact_lens_price IS 'Calcula el precio de un lente de contacto basado en la familia y parámetros de la receta';
```

---

## 🔗 Integración con Módulos Existentes

### Modificación de Tabla `quotes`

```sql
-- Agregar campos para lentes de contacto en presupuestos
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS contact_lens_family_id UUID REFERENCES public.contact_lens_families(id) ON DELETE SET NULL,

  -- Receta Ojo Derecho (OD)
  ADD COLUMN IF NOT EXISTS contact_lens_rx_sphere_od DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_cylinder_od DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_axis_od INTEGER,
  ADD COLUMN IF NOT EXISTS contact_lens_rx_add_od DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_base_curve_od DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_diameter_od DECIMAL(4,2),

  -- Receta Ojo Izquierdo (OS)
  ADD COLUMN IF NOT EXISTS contact_lens_rx_sphere_os DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_cylinder_os DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_axis_os INTEGER,
  ADD COLUMN IF NOT EXISTS contact_lens_rx_add_os DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_base_curve_os DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_diameter_os DECIMAL(4,2),

  -- Cantidad y precios
  ADD COLUMN IF NOT EXISTS contact_lens_quantity INTEGER DEFAULT 1, -- Cantidad de cajas
  ADD COLUMN IF NOT EXISTS contact_lens_cost DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS contact_lens_price DECIMAL(10,2);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quotes_contact_lens_family ON public.quotes(contact_lens_family_id) WHERE contact_lens_family_id IS NOT NULL;
```

### Modificación de Tabla `lab_work_orders`

```sql
-- Agregar campos para lentes de contacto en trabajos
ALTER TABLE public.lab_work_orders
  ADD COLUMN IF NOT EXISTS contact_lens_family_id UUID REFERENCES public.contact_lens_families(id) ON DELETE SET NULL,

  -- Receta Ojo Derecho (OD)
  ADD COLUMN IF NOT EXISTS contact_lens_rx_sphere_od DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_cylinder_od DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_axis_od INTEGER,
  ADD COLUMN IF NOT EXISTS contact_lens_rx_add_od DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_base_curve_od DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_diameter_od DECIMAL(4,2),

  -- Receta Ojo Izquierdo (OS)
  ADD COLUMN IF NOT EXISTS contact_lens_rx_sphere_os DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_cylinder_os DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_axis_os INTEGER,
  ADD COLUMN IF NOT EXISTS contact_lens_rx_add_os DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_base_curve_os DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS contact_lens_rx_diameter_os DECIMAL(4,2),

  -- Cantidad y costo
  ADD COLUMN IF NOT EXISTS contact_lens_quantity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS contact_lens_cost DECIMAL(10,2);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lab_work_orders_contact_lens_family ON public.lab_work_orders(contact_lens_family_id) WHERE contact_lens_family_id IS NOT NULL;
```

**Nota:** Muchos lentes de contacto son de stock directo, por lo que `lab_work_orders` podría no ser necesario para todos los casos. Sin embargo, es útil para seguimiento de adaptaciones y servicios asociados.

---

## 🚀 Implementación Paso a Paso

### Paso 1: Crear Migración de Base de Datos

1. Crear archivo de migración con el SQL completo de arriba
2. Ejecutar migración: `npm run supabase:reset` o `supabase db push`
3. Verificar que las tablas se crearon correctamente

### Paso 2: Crear Tipos TypeScript

**Archivo:** `src/types/contact-lens.ts`

```typescript
export type ContactLensUseType =
  | "daily"
  | "bi_weekly"
  | "monthly"
  | "extended_wear";
export type ContactLensModality =
  | "spherical"
  | "toric"
  | "multifocal"
  | "cosmetic";
export type ContactLensMaterial =
  | "silicone_hydrogel"
  | "hydrogel"
  | "rigid_gas_permeable";
export type ContactLensPackaging = "box_30" | "box_6" | "box_3" | "bottle";

export interface ContactLensFamily {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  use_type: ContactLensUseType;
  modality: ContactLensModality;
  material?: ContactLensMaterial;
  packaging: ContactLensPackaging;
  base_curve?: number;
  diameter?: number;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactLensPriceMatrix {
  id: string;
  contact_lens_family_id: string;
  sphere_min: number;
  sphere_max: number;
  cylinder_min: number;
  cylinder_max: number;
  axis_min: number;
  axis_max: number;
  addition_min: number;
  addition_max: number;
  base_price: number;
  cost: number;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactLensRx {
  sphere: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  base_curve?: number;
  diameter?: number;
}
```

### Paso 3: Crear API Routes

**Archivo:** `src/app/api/admin/contact-lens-families/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api/middleware";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const { getUser } = await createClientFromRequest(request);
    const { client } = await createClientFromRequest(request);

    // Obtener organización del usuario
    const { data: adminUser } = await client
      .from("admin_users")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!adminUser?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Obtener familias de lentes de contacto
    const { data: families, error } = await client
      .from("contact_lens_families")
      .select("*")
      .eq("organization_id", adminUser.organization_id)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching contact lens families:", error);
      return NextResponse.json(
        { error: "Failed to fetch contact lens families" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: families });
  } catch (error) {
    console.error("Contact lens families error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const { client } = await createClientFromRequest(request);

    const body = await request.json();

    // Obtener organización del usuario
    const { data: adminUser } = await client
      .from("admin_users")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!adminUser?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Crear familia de lentes de contacto
    const { data: family, error } = await client
      .from("contact_lens_families")
      .insert({
        ...body,
        organization_id: adminUser.organization_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating contact lens family:", error);
      return NextResponse.json(
        { error: "Failed to create contact lens family" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: family });
  } catch (error) {
    console.error("Create contact lens family error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Archivo:** `src/app/api/admin/contact-lens-families/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Implementar GET por ID
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Implementar UPDATE
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Implementar DELETE (soft delete)
}
```

**Archivo:** `src/app/api/admin/contact-lens-matrices/route.ts`

```typescript
// Similar a contact-lens-families pero para matrices de precios
```

**Archivo:** `src/app/api/admin/contact-lens-matrices/calculate/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api/middleware";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const { client } = await createClientFromRequest(request);

    const body = await request.json();
    const {
      contact_lens_family_id,
      sphere,
      cylinder = 0,
      axis = null,
      addition = null,
    } = body;

    // Obtener organización del usuario
    const { data: adminUser } = await client
      .from("admin_users")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!adminUser?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Llamar a la función SQL
    const { data, error } = await client.rpc("calculate_contact_lens_price", {
      p_contact_lens_family_id: contact_lens_family_id,
      p_sphere: sphere,
      p_cylinder: cylinder,
      p_axis: axis,
      p_addition: addition,
      p_organization_id: adminUser.organization_id,
    });

    if (error) {
      console.error("Error calculating contact lens price:", error);
      return NextResponse.json(
        { error: "Failed to calculate price" },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No matching price matrix found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error("Calculate contact lens price error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Paso 4: Crear Componentes Frontend

**Archivo:** `src/components/admin/ContactLensFamilyForm.tsx`

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const contactLensFamilySchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  brand: z.string().optional(),
  description: z.string().optional(),
  use_type: z.enum(["daily", "bi_weekly", "monthly", "extended_wear"]),
  modality: z.enum(["spherical", "toric", "multifocal", "cosmetic"]),
  material: z
    .enum(["silicone_hydrogel", "hydrogel", "rigid_gas_permeable"])
    .optional(),
  packaging: z.enum(["box_30", "box_6", "box_3", "bottle"]),
  base_curve: z.number().optional(),
  diameter: z.number().optional(),
});

// Implementar formulario completo...
```

### Paso 5: Integrar en Presupuestos y Trabajos

Modificar los componentes `CreateQuoteForm.tsx` y `CreateWorkOrderForm.tsx` para incluir opción de lentes de contacto.

---

## ✅ Checklist de Implementación

- [ ] Crear migración de base de datos
- [ ] Crear tipos TypeScript
- [ ] Crear API routes (CRUD familias y matrices)
- [ ] Crear API route para calcular precios
- [ ] Crear componentes frontend (formularios, listas)
- [ ] Integrar en módulo de presupuestos
- [ ] Integrar en módulo de trabajos
- [ ] **Implementar tests (ver sección Testing)**
- [ ] Agregar a catálogo de productos (opcional)
- [ ] Crear documentación para usuarios
- [ ] Probar flujo completo

---

## 🧪 Testing de Lentes de Contacto

### Prioridad: 🔴 ALTA

La integración de lentes de contacto es una funcionalidad crítica del negocio que requiere tests exhaustivos para garantizar cálculos correctos y aislamiento de datos.

### Tests Unitarios Requeridos

#### Función SQL `calculate_contact_lens_price`

**Archivo:** `src/__tests__/unit/lib/contact-lens/calculate-price.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("calculate_contact_lens_price", () => {
  let supabase: any;
  let testFamilyId: string;
  let testMatrixId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Create test data
    const { data: family } = await supabase
      .from("contact_lens_families")
      .insert({
        name: "Test Contact Lens",
        use_type: "monthly",
        modality: "spherical",
        packaging: "box_6",
      })
      .select()
      .single();

    testFamilyId = family.id;

    const { data: matrix } = await supabase
      .from("contact_lens_price_matrices")
      .insert({
        contact_lens_family_id: testFamilyId,
        sphere_min: -6.0,
        sphere_max: 6.0,
        cylinder_min: 0,
        cylinder_max: 0,
        base_price: 15000,
        cost: 10000,
      })
      .select()
      .single();

    testMatrixId = matrix.id;
  });

  afterAll(async () => {
    // Cleanup
    await supabase
      .from("contact_lens_price_matrices")
      .delete()
      .eq("id", testMatrixId);
    await supabase
      .from("contact_lens_families")
      .delete()
      .eq("id", testFamilyId);
  });

  it("should calculate price for spherical lens", async () => {
    const { data, error } = await supabase.rpc("calculate_contact_lens_price", {
      p_contact_lens_family_id: testFamilyId,
      p_sphere: -2.5,
      p_cylinder: 0,
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].price).toBe(15000);
    expect(data[0].cost).toBe(10000);
  });

  it("should calculate price for toric lens", async () => {
    // Create toric matrix
    const { data: toricMatrix } = await supabase
      .from("contact_lens_price_matrices")
      .insert({
        contact_lens_family_id: testFamilyId,
        sphere_min: -6.0,
        sphere_max: 6.0,
        cylinder_min: -2.0,
        cylinder_max: -0.25,
        axis_min: 0,
        axis_max: 180,
        base_price: 20000,
        cost: 15000,
      })
      .select()
      .single();

    const { data, error } = await supabase.rpc("calculate_contact_lens_price", {
      p_contact_lens_family_id: testFamilyId,
      p_sphere: -2.5,
      p_cylinder: -1.0,
      p_axis: 90,
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].price).toBe(20000);

    // Cleanup
    await supabase
      .from("contact_lens_price_matrices")
      .delete()
      .eq("id", toricMatrix.id);
  });

  it("should return null if no matching matrix found", async () => {
    const { data, error } = await supabase.rpc("calculate_contact_lens_price", {
      p_contact_lens_family_id: testFamilyId,
      p_sphere: 10.0, // Outside range
      p_cylinder: 0,
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("should respect organization_id isolation", async () => {
    // Create second organization with same family name
    // Verify prices are isolated
  });
});
```

#### Validación de Schemas

**Archivo:** `src/__tests__/unit/types/contact-lens-schemas.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  contactLensFamilySchema,
  contactLensPriceMatrixSchema,
} from "@/types/contact-lens";

describe("Contact Lens Schemas", () => {
  it("should validate contact lens family schema", () => {
    const validFamily = {
      name: "Acuvue Oasys",
      use_type: "monthly",
      modality: "spherical",
      packaging: "box_6",
    };

    expect(() => contactLensFamilySchema.parse(validFamily)).not.toThrow();
  });

  it("should reject invalid use_type", () => {
    const invalidFamily = {
      name: "Test",
      use_type: "invalid",
      modality: "spherical",
      packaging: "box_6",
    };

    expect(() => contactLensFamilySchema.parse(invalidFamily)).toThrow();
  });

  it("should reject invalid modality", () => {
    const invalidFamily = {
      name: "Test",
      use_type: "monthly",
      modality: "invalid",
      packaging: "box_6",
    };

    expect(() => contactLensFamilySchema.parse(invalidFamily)).toThrow();
  });

  it("should validate price matrix schema", () => {
    const validMatrix = {
      contact_lens_family_id: "test-id",
      sphere_min: -6.0,
      sphere_max: 6.0,
      cylinder_min: 0,
      cylinder_max: 0,
      base_price: 15000,
      cost: 10000,
    };

    expect(() => contactLensPriceMatrixSchema.parse(validMatrix)).not.toThrow();
  });

  it("should reject invalid sphere range", () => {
    const invalidMatrix = {
      contact_lens_family_id: "test-id",
      sphere_min: 6.0,
      sphere_max: -6.0, // Invalid: min > max
      cylinder_min: 0,
      cylinder_max: 0,
      base_price: 15000,
      cost: 10000,
    };

    expect(() => contactLensPriceMatrixSchema.parse(invalidMatrix)).toThrow();
  });
});
```

### Tests de Integración Requeridos

#### API Routes - Familias

**Archivo:** `src/__tests__/integration/api/contact-lens-families.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestOrganization,
  createTestUser,
  cleanupTestData,
  makeAuthenticatedRequest,
} from "../../helpers/test-setup";

describe("Contact Lens Families API - Integration Tests", () => {
  let org: any;
  let user: any;

  beforeAll(async () => {
    org = await createTestOrganization("Test Org", "basic");
    user = await createTestUser(org.id, "test@example.com");
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it("should create contact lens family", async () => {
    const response = await makeAuthenticatedRequest(
      "/api/admin/contact-lens-families",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Acuvue Oasys",
          brand: "Johnson & Johnson",
          use_type: "monthly",
          modality: "spherical",
          packaging: "box_6",
        }),
      },
      user,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Acuvue Oasys");
    expect(data.data.organization_id).toBe(org.id);
  });

  it("should list families with multi-tenancy", async () => {
    // Create family for org A
    // Create family for org B
    // Verify each user only sees their org's families
  });

  it("should update family correctly", async () => {
    // Create family
    // Update family
    // Verify changes saved
  });

  it("should soft delete family", async () => {
    // Create family
    // Delete family
    // Verify is_active = false
    // Verify not returned in list
  });

  it("should validate required fields", async () => {
    const response = await makeAuthenticatedRequest(
      "/api/admin/contact-lens-families",
      {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          // Missing required fields
        }),
      },
      user,
    );

    expect(response.status).toBe(400);
  });
});
```

#### API Routes - Matrices y Cálculo

**Archivo:** `src/__tests__/integration/api/contact-lens-matrices.test.ts`

```typescript
describe("Contact Lens Price Matrices API - Integration Tests", () => {
  it("should create price matrix", async () => {
    // Create family first
    // Create matrix
    // Verify saved correctly
  });

  it("should calculate price correctly", async () => {
    const response = await makeAuthenticatedRequest(
      "/api/admin/contact-lens-matrices/calculate",
      {
        method: "POST",
        body: JSON.stringify({
          contact_lens_family_id: "test-id",
          sphere: -2.5,
          cylinder: 0,
        }),
      },
      user,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.price).toBeGreaterThan(0);
  });

  it("should handle overlapping ranges", async () => {
    // Create multiple matrices with overlapping ranges
    // Verify correct matrix selected (lowest price or most specific)
  });

  it("should respect organization isolation", async () => {
    // Create matrices for different orgs
    // Verify isolation
  });
});
```

#### Integración con Quotes

**Archivo:** `src/__tests__/integration/api/quotes-contact-lens.test.ts`

```typescript
describe("Quotes with Contact Lenses - Integration Tests", () => {
  it("should create quote with contact lenses", async () => {
    const response = await makeAuthenticatedRequest(
      "/api/admin/quotes",
      {
        method: "POST",
        body: JSON.stringify({
          customer_id: "test-customer-id",
          contact_lens_family_id: "test-family-id",
          contact_lens_rx_sphere_od: -2.5,
          contact_lens_rx_sphere_os: -2.0,
          contact_lens_quantity: 2,
        }),
      },
      user,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.contact_lens_family_id).toBe("test-family-id");
    expect(data.data.contact_lens_price).toBeGreaterThan(0);
  });

  it("should calculate total price correctly", async () => {
    // Create quote with contact lenses
    // Verify total includes contact lens price
  });

  it("should save contact lens RX correctly", async () => {
    // Create quote with full RX
    // Verify all RX fields saved
  });
});
```

### Cobertura Objetivo

- **Tests Unitarios:** 85%+
- **Tests de Integración:** 80%+
- **Enfoque especial en:** Cálculos de precios, validación de datos, multi-tenancy

### Comandos de Testing

```bash
# Ejecutar tests de lentes de contacto
npm run test:run -- src/__tests__/unit/lib/contact-lens/
npm run test:run -- src/__tests__/integration/api/contact-lens-families.test.ts
npm run test:run -- src/__tests__/integration/api/contact-lens-matrices.test.ts

# Coverage específico
npm run test:coverage -- src/__tests__/unit/lib/contact-lens/
```

---

## 📝 Notas Adicionales

- Los lentes de contacto generalmente se venden por caja, no por par
- La mayoría de lentes de contacto son de stock directo (no requieren fabricación)
- Considerar agregar campos para seguimiento de adaptación y servicios asociados
- El sistema puede extenderse para incluir recordatorios de renovación automática
- **Los tests son críticos para garantizar cálculos correctos y aislamiento de datos**

---

**Última Actualización:** 2026-01-29  
**Versión:** 1.0.0
