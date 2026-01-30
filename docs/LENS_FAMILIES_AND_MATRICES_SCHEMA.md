# Documentación del Schema: Familias de Lentes y Matrices de Precios

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Schema de Base de Datos](#schema-de-base-de-datos)
4. [Funciones SQL](#funciones-sql)
5. [Políticas de Seguridad (RLS)](#políticas-de-seguridad-rls)
6. [Índices y Optimización](#índices-y-optimización)
7. [Flujo de Funcionamiento](#flujo-de-funcionamiento)
8. [Ejemplos de Uso](#ejemplos-de-uso)
9. [API Endpoints](#api-endpoints)

---

## Resumen Ejecutivo

El sistema de **Familias de Lentes y Matrices de Precios** es un módulo central del sistema de gestión óptica que permite:

- **Definir familias de lentes** con características genéticas (tipo y material)
- **Establecer matrices de precios** basadas en rangos de esfera, cilindro y adición
- **Calcular precios automáticamente** según la receta del paciente
- **Gestionar diferentes tipos de sourcing** (stock vs surfaced)
- **Soportar presbicia** mediante rangos de adición

### Conceptos Clave

- **Familia de Lentes**: Define las características genéticas de un lente (tipo y material). Ejemplo: "Varilux Comfort Progresivo Alto Índice 1.67"
- **Matriz de Precios**: Define el precio y costo para un rango específico de valores de esfera, cilindro y adición dentro de una familia
- **Sourcing Type**: Indica si el lente está disponible en inventario (`stock`) o debe ser fabricado a pedido (`surfaced`)

---

## Arquitectura del Sistema

### Modelo de Datos

El sistema utiliza un modelo de dos niveles:

1. **Nivel 1 - Familias (`lens_families`)**: Define las características genéticas
   - Tipo de lente (monofocal, bifocal, progresivo, etc.)
   - Material (CR-39, policarbonato, alto índice, etc.)
   - Información comercial (nombre, marca, descripción)

2. **Nivel 2 - Matrices (`lens_price_matrices`)**: Define los precios por rangos
   - Rangos de esfera (sphere_min, sphere_max)
   - Rangos de cilindro (cylinder_min, cylinder_max)
   - Rangos de adición (addition_min, addition_max) - para presbicia
   - Precio de venta (base_price)
   - Costo de compra (cost)
   - Tipo de sourcing (stock/surfaced)

### Principios de Diseño

- **Separación de responsabilidades**: Las características genéticas están en la familia, los precios en las matrices
- **Sin multiplicadores**: Los precios se expresan directamente en las filas de la matriz, no mediante multiplicadores
- **Rangos inclusivos**: Los rangos utilizan comparaciones `BETWEEN` con límites inclusivos
- **Soft delete**: Se utiliza `is_active` en lugar de eliminación física

---

## Schema de Base de Datos

### Tabla: `lens_families`

Define las familias de lentes con sus características genéticas.

```sql
CREATE TABLE public.lens_families (
  -- Identificador único
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Información comercial
  name TEXT NOT NULL,                    -- Nombre comercial: "Varilux Comfort", "Poly Blue Defense"
  brand TEXT,                            -- Marca: "Essilor", "Zeiss", "Rodenstock", etc.
  description TEXT,                      -- Descripción opcional del producto

  -- Características genéticas (heredadas por todas las matrices)
  lens_type TEXT NOT NULL CHECK (lens_type IN (
    'single_vision',   -- Monofocal
    'bifocal',         -- Bifocal
    'trifocal',        -- Trifocal
    'progressive',     -- Progresivo
    'reading',         -- Lectura
    'computer',        -- Computadora
    'sports'           -- Deportivo
  )),

  lens_material TEXT NOT NULL CHECK (lens_material IN (
    'cr39',              -- CR-39 (índice estándar)
    'polycarbonate',     -- Policarbonato
    'high_index_1_67',   -- Alto índice 1.67
    'high_index_1_74',   -- Alto índice 1.74
    'trivex',            -- Trivex
    'glass'              -- Vidrio
  )),

  -- Control de estado
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Descripción de Campos

| Campo           | Tipo        | Descripción                                                 |
| --------------- | ----------- | ----------------------------------------------------------- |
| `id`            | UUID        | Identificador único generado automáticamente                |
| `name`          | TEXT        | Nombre comercial del producto (requerido)                   |
| `brand`         | TEXT        | Marca del fabricante (opcional)                             |
| `description`   | TEXT        | Descripción detallada del producto (opcional)               |
| `lens_type`     | TEXT        | Tipo de lente, restringido a valores específicos            |
| `lens_material` | TEXT        | Material del lente, restringido a valores específicos       |
| `is_active`     | BOOLEAN     | Indica si la familia está activa (soft delete)              |
| `created_at`    | TIMESTAMPTZ | Fecha de creación                                           |
| `updated_at`    | TIMESTAMPTZ | Fecha de última actualización (actualizado automáticamente) |

#### Valores Permitidos

**Tipos de Lente (`lens_type`):**

- `single_vision`: Lente monofocal (una sola potencia)
- `bifocal`: Lente bifocal (dos potencias: lejos y cerca)
- `trifocal`: Lente trifocal (tres potencias)
- `progressive`: Lente progresivo (transición suave entre potencias)
- `reading`: Lente de lectura
- `computer`: Lente para uso con computadora
- `sports`: Lente deportivo

**Materiales (`lens_material`):**

- `cr39`: CR-39, material estándar económico
- `polycarbonate`: Policarbonato, resistente a impactos
- `high_index_1_67`: Alto índice 1.67, más delgado para graduaciones altas
- `high_index_1_74`: Alto índice 1.74, el más delgado disponible
- `trivex`: Trivex, combinación de resistencia y delgadez
- `glass`: Vidrio tradicional

---

### Tabla: `lens_price_matrices`

Define las matrices de precios para cada familia de lentes según rangos de valores ópticos.

```sql
CREATE TABLE public.lens_price_matrices (
  -- Identificador único
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con familia
  lens_family_id UUID REFERENCES public.lens_families(id) ON DELETE CASCADE NOT NULL,

  -- Rangos de esfera (dioptrías)
  sphere_min DECIMAL(5,2) NOT NULL,      -- Ejemplo: -10.00
  sphere_max DECIMAL(5,2) NOT NULL,      -- Ejemplo: +6.00

  -- Rangos de cilindro (dioptrías)
  cylinder_min DECIMAL(5,2) NOT NULL,    -- Ejemplo: -4.00
  cylinder_max DECIMAL(5,2) NOT NULL,    -- Ejemplo: +4.00

  -- Rangos de adición (para presbicia)
  addition_min DECIMAL(5,2) DEFAULT 0,   -- Ejemplo: 0.00 (para monofocales)
  addition_max DECIMAL(5,2) DEFAULT 4.0, -- Ejemplo: 4.00 (para progresivos)

  -- Precios y costos
  base_price DECIMAL(10,2) NOT NULL,      -- Precio de venta al cliente
  cost DECIMAL(10,2) NOT NULL,            -- Costo de compra/producción

  -- Tipo de sourcing
  sourcing_type TEXT CHECK (sourcing_type IN ('stock','surfaced')) DEFAULT 'surfaced',

  -- Control de estado
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints de validación
  CONSTRAINT valid_sphere_range CHECK (sphere_min <= sphere_max),
  CONSTRAINT valid_cylinder_range CHECK (cylinder_min <= cylinder_max)
);
```

#### Descripción de Campos

| Campo            | Tipo          | Descripción                                           |
| ---------------- | ------------- | ----------------------------------------------------- |
| `id`             | UUID          | Identificador único generado automáticamente          |
| `lens_family_id` | UUID          | Referencia a la familia de lentes (FK)                |
| `sphere_min`     | DECIMAL(5,2)  | Valor mínimo de esfera en dioptrías (ej: -10.00)      |
| `sphere_max`     | DECIMAL(5,2)  | Valor máximo de esfera en dioptrías (ej: +6.00)       |
| `cylinder_min`   | DECIMAL(5,2)  | Valor mínimo de cilindro en dioptrías (ej: -4.00)     |
| `cylinder_max`   | DECIMAL(5,2)  | Valor máximo de cilindro en dioptrías (ej: +4.00)     |
| `addition_min`   | DECIMAL(5,2)  | Valor mínimo de adición para presbicia (default: 0)   |
| `addition_max`   | DECIMAL(5,2)  | Valor máximo de adición para presbicia (default: 4.0) |
| `base_price`     | DECIMAL(10,2) | Precio de venta al cliente                            |
| `cost`           | DECIMAL(10,2) | Costo de compra o producción                          |
| `sourcing_type`  | TEXT          | Tipo de sourcing: `'stock'` o `'surfaced'`            |
| `is_active`      | BOOLEAN       | Indica si la matriz está activa                       |
| `created_at`     | TIMESTAMPTZ   | Fecha de creación                                     |
| `updated_at`     | TIMESTAMPTZ   | Fecha de última actualización                         |

#### Tipos de Sourcing

- **`stock`**: El lente está disponible en inventario. Generalmente más rápido y económico.
- **`surfaced`**: El lente debe ser fabricado a pedido. Requiere más tiempo pero permite más opciones.

#### Reglas de Negocio

1. **Rangos inclusivos**: Los valores `sphere`, `cylinder` y `addition` deben estar dentro de los rangos definidos (inclusive en ambos extremos)
2. **Validación de rangos**: `sphere_min <= sphere_max` y `cylinder_min <= cylinder_max`
3. **Adición para monofocales**: Para lentes `single_vision`, `addition_min` y `addition_max` deben ser 0
4. **Cascada de eliminación**: Si se elimina una familia, todas sus matrices se eliminan automáticamente

---

## Funciones SQL

### Función: `calculate_lens_price`

Calcula el precio y costo de un lente basándose en la familia, esfera, cilindro y adición.

```sql
CREATE OR REPLACE FUNCTION public.calculate_lens_price(
  p_lens_family_id UUID,
  p_sphere DECIMAL,
  p_cylinder DECIMAL DEFAULT 0,
  p_addition DECIMAL DEFAULT NULL,
  p_sourcing_type TEXT DEFAULT NULL
) RETURNS TABLE (
  price DECIMAL(10,2),
  sourcing_type TEXT,
  cost DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lpm.base_price AS price,
    lpm.sourcing_type,
    lpm.cost
  FROM public.lens_price_matrices lpm
  JOIN public.lens_families lf ON lf.id = lpm.lens_family_id
  WHERE lpm.lens_family_id = p_lens_family_id
    AND p_sphere BETWEEN lpm.sphere_min AND lpm.sphere_max
    AND p_cylinder BETWEEN lpm.cylinder_min AND lpm.cylinder_max
    AND (
      p_addition IS NULL
      OR (p_addition BETWEEN lpm.addition_min AND lpm.addition_max)
    )
    AND lpm.is_active = TRUE
    AND lf.is_active = TRUE
    AND (p_sourcing_type IS NULL OR lpm.sourcing_type = p_sourcing_type)
  ORDER BY
    CASE WHEN p_sourcing_type IS NULL AND lpm.sourcing_type = 'stock' THEN 0 ELSE 1 END,
    lpm.base_price ASC
  LIMIT 1;
END;
$$;
```

#### Parámetros

| Parámetro          | Tipo    | Descripción                                                            |
| ------------------ | ------- | ---------------------------------------------------------------------- |
| `p_lens_family_id` | UUID    | ID de la familia de lentes (requerido)                                 |
| `p_sphere`         | DECIMAL | Valor de esfera en dioptrías (requerido)                               |
| `p_cylinder`       | DECIMAL | Valor de cilindro en dioptrías (default: 0)                            |
| `p_addition`       | DECIMAL | Valor de adición para presbicia (default: NULL)                        |
| `p_sourcing_type`  | TEXT    | Filtrar por tipo de sourcing: `'stock'` o `'surfaced'` (default: NULL) |

#### Retorno

La función retorna una tabla con:

| Campo           | Tipo          | Descripción                                            |
| --------------- | ------------- | ------------------------------------------------------ |
| `price`         | DECIMAL(10,2) | Precio de venta del lente                              |
| `sourcing_type` | TEXT          | Tipo de sourcing encontrado (`'stock'` o `'surfaced'`) |
| `cost`          | DECIMAL(10,2) | Costo del lente                                        |

#### Lógica de Búsqueda

1. **Filtros aplicados**:
   - La familia debe estar activa (`lf.is_active = TRUE`)
   - La matriz debe estar activa (`lpm.is_active = TRUE`)
   - La esfera debe estar dentro del rango (`p_sphere BETWEEN sphere_min AND sphere_max`)
   - El cilindro debe estar dentro del rango (`p_cylinder BETWEEN cylinder_min AND cylinder_max`)
   - Si se proporciona adición, debe estar dentro del rango
   - Si se especifica `sourcing_type`, debe coincidir

2. **Ordenamiento**:
   - Si no se especifica `sourcing_type`, se prefiere `'stock'` sobre `'surfaced'`
   - Luego se ordena por precio ascendente
   - Se retorna solo el primer resultado (`LIMIT 1`)

#### Ejemplo de Uso

```sql
-- Calcular precio para un lente progresivo con esfera -2.50, cilindro -0.75, adición +2.00
SELECT * FROM calculate_lens_price(
  '123e4567-e89b-12d3-a456-426614174000'::UUID,  -- lens_family_id
  -2.50,                                           -- sphere
  -0.75,                                           -- cylinder
  2.00,                                            -- addition
  NULL                                             -- sourcing_type (busca stock primero)
);

-- Resultado esperado:
-- price: 450.00
-- sourcing_type: 'stock'
-- cost: 180.00
```

---

## Políticas de Seguridad (RLS)

El sistema utiliza **Row Level Security (RLS)** para controlar el acceso a los datos. Solo los usuarios administradores pueden acceder a las familias y matrices.

### Políticas para `lens_families`

```sql
-- Ver familias
CREATE POLICY "Admins can view lens families"
ON public.lens_families
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND is_active = TRUE
  )
);

-- Crear familias
CREATE POLICY "Admins can insert lens families"
ON public.lens_families
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND is_active = TRUE
  )
);

-- Actualizar familias
CREATE POLICY "Admins can update lens families"
ON public.lens_families
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND is_active = TRUE
  )
);

-- Eliminar familias
CREATE POLICY "Admins can delete lens families"
ON public.lens_families
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND is_active = TRUE
  )
);
```

### Políticas para `lens_price_matrices`

Las políticas son idénticas a las de `lens_families`, aplicadas a la tabla `lens_price_matrices`.

**Nota**: Todas las operaciones requieren que el usuario sea un administrador activo (`admin_users.is_active = TRUE`).

---

## Índices y Optimización

### Índices en `lens_families`

```sql
-- Índice para búsquedas por estado activo
CREATE INDEX idx_lens_families_active
ON public.lens_families(is_active)
WHERE is_active = TRUE;

-- Índice compuesto para búsquedas por tipo y material
CREATE INDEX idx_lens_families_type_material
ON public.lens_families(lens_type, lens_material);
```

### Índices en `lens_price_matrices`

```sql
-- Índice para búsquedas por familia
CREATE INDEX idx_lens_matrices_family
ON public.lens_price_matrices(lens_family_id);

-- Índice GIST para búsquedas rápidas de rangos de esfera
CREATE INDEX idx_lens_matrices_sphere_range
ON public.lens_price_matrices USING GIST (
  numrange(sphere_min::numeric, sphere_max::numeric, '[]')
);

-- Índice GIST para búsquedas rápidas de rangos de cilindro
CREATE INDEX idx_lens_matrices_cylinder_range
ON public.lens_price_matrices USING GIST (
  numrange(cylinder_min::numeric, cylinder_max::numeric, '[]')
);

-- Índice GIST para búsquedas rápidas de rangos de adición
CREATE INDEX idx_lens_matrices_addition_range
ON public.lens_price_matrices USING GIST (
  numrange(addition_min::numeric, addition_max::numeric, '[]')
);
```

#### Explicación de Índices GIST

Los índices **GIST (Generalized Search Tree)** son especialmente eficientes para búsquedas de rangos numéricos. Permiten que PostgreSQL encuentre rápidamente todas las filas donde un valor específico cae dentro de un rango, lo cual es crítico para la función `calculate_lens_price`.

---

## Flujo de Funcionamiento

### 1. Creación de una Familia de Lentes

```
1. Admin crea una familia con:
   - Nombre: "Varilux Comfort"
   - Marca: "Essilor"
   - Tipo: "progressive"
   - Material: "high_index_1_67"
   - Descripción: "Lente progresivo premium"

2. Sistema valida:
   - Tipo y material están en los valores permitidos
   - Nombre es único (opcional, según reglas de negocio)

3. Se crea el registro en `lens_families`
```

### 2. Creación de Matrices de Precios

```
1. Admin crea múltiples matrices para la familia:

   Matriz 1:
   - Esfera: -10.00 a -4.00
   - Cilindro: -4.00 a +4.00
   - Adición: 0.00 a 4.00
   - Precio: $450.00
   - Costo: $180.00
   - Sourcing: "surfaced"

   Matriz 2:
   - Esfera: -4.00 a +4.00
   - Cilindro: -2.00 a +2.00
   - Adición: 0.00 a 4.00
   - Precio: $380.00
   - Costo: $150.00
   - Sourcing: "stock"

2. Sistema valida:
   - Los rangos son válidos (min <= max)
   - No hay solapamientos problemáticos (opcional, según reglas)

3. Se crean los registros en `lens_price_matrices`
```

### 3. Cálculo de Precio en una Cotización

```
1. Usuario selecciona:
   - Familia: "Varilux Comfort"
   - Receta: Esfera -2.50, Cilindro -0.75, Adición +2.00

2. Sistema llama a `calculate_lens_price()`:
   - Busca matrices donde:
     * -2.50 está entre sphere_min y sphere_max
     * -0.75 está entre cylinder_min y cylinder_max
     * 2.00 está entre addition_min y addition_max
     * Familia y matriz están activas

3. Si encuentra múltiples matrices:
   - Prefiere "stock" sobre "surfaced"
   - Selecciona la de menor precio

4. Retorna:
   - Precio: $380.00
   - Sourcing: "stock"
   - Costo: $150.00

5. Frontend muestra el precio al usuario
```

### 4. Gestión de Presbicia

Para pacientes con presbicia, el sistema soporta diferentes soluciones:

- **`two_separate`**: Dos lentes separados (lejos y cerca)
- **`bifocal`**: Lente bifocal
- **`trifocal`**: Lente trifocal
- **`progressive`**: Lente progresivo

El campo `addition` en las matrices permite definir precios específicos según el valor de adición requerido.

---

## Ejemplos de Uso

### Ejemplo 1: Crear una Familia Monofocal

```sql
INSERT INTO public.lens_families (
  name,
  brand,
  lens_type,
  lens_material,
  description
) VALUES (
  'Poly Blue Defense',
  'Essilor',
  'single_vision',
  'polycarbonate',
  'Lente monofocal con protección blue light'
) RETURNING id;
```

### Ejemplo 2: Crear Matrices para la Familia

```sql
-- Matriz para rangos estándar (stock)
INSERT INTO public.lens_price_matrices (
  lens_family_id,
  sphere_min, sphere_max,
  cylinder_min, cylinder_max,
  addition_min, addition_max,
  base_price, cost, sourcing_type
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  -6.00, 6.00,        -- Esfera: -6 a +6
  -2.00, 2.00,        -- Cilindro: -2 a +2
  0.00, 0.00,         -- Adición: 0 (monofocal)
  250.00,             -- Precio
  100.00,             -- Costo
  'stock'             -- En inventario
);

-- Matriz para rangos altos (surfaced)
INSERT INTO public.lens_price_matrices (
  lens_family_id,
  sphere_min, sphere_max,
  cylinder_min, cylinder_max,
  addition_min, addition_max,
  base_price, cost, sourcing_type
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  -10.00, -6.25,      -- Esfera alta negativa
  -4.00, 4.00,        -- Cilindro amplio
  0.00, 0.00,         -- Adición: 0
  350.00,             -- Precio más alto
  150.00,             -- Costo más alto
  'surfaced'          -- A pedido
);
```

### Ejemplo 3: Calcular Precio desde la Aplicación

```typescript
// Llamada a la API
const response = await fetch(
  `/api/admin/lens-matrices/calculate?` +
    `lens_family_id=${familyId}&` +
    `sphere=-2.50&` +
    `cylinder=-0.75&` +
    `addition=2.00&` +
    `sourcing_type=stock`,
);

const { calculation } = await response.json();
// calculation.price: 380.00
// calculation.sourcing_type: "stock"
// calculation.cost: 150.00
```

### Ejemplo 4: Consultar Todas las Matrices de una Familia

```sql
SELECT
  lpm.*,
  lf.name as family_name,
  lf.lens_type,
  lf.lens_material
FROM public.lens_price_matrices lpm
JOIN public.lens_families lf ON lf.id = lpm.lens_family_id
WHERE lpm.lens_family_id = '123e4567-e89b-12d3-a456-426614174000'::UUID
  AND lpm.is_active = TRUE
ORDER BY lpm.sphere_min, lpm.cylinder_min;
```

---

## API Endpoints

### Familias de Lentes

#### `GET /api/admin/lens-families`

Lista todas las familias de lentes.

**Query Parameters:**

- `include_inactive` (boolean, opcional): Incluir familias inactivas

**Response:**

```json
{
  "families": [
    {
      "id": "uuid",
      "name": "Varilux Comfort",
      "brand": "Essilor",
      "lens_type": "progressive",
      "lens_material": "high_index_1_67",
      "description": "...",
      "is_active": true,
      "created_at": "2026-01-29T...",
      "updated_at": "2026-01-29T..."
    }
  ]
}
```

#### `POST /api/admin/lens-families`

Crea una nueva familia de lentes.

**Body:**

```json
{
  "name": "Varilux Comfort",
  "brand": "Essilor",
  "lens_type": "progressive",
  "lens_material": "high_index_1_67",
  "description": "Lente progresivo premium",
  "is_active": true
}
```

#### `PUT /api/admin/lens-families/[id]`

Actualiza una familia existente.

#### `DELETE /api/admin/lens-families/[id]`

Desactiva una familia (soft delete).

---

### Matrices de Precios

#### `GET /api/admin/lens-matrices`

Lista todas las matrices de precios.

**Query Parameters:**

- `family_id` (UUID, opcional): Filtrar por familia específica
- `include_inactive` (boolean, opcional): Incluir matrices inactivas

**Response:**

```json
{
  "matrices": [
    {
      "id": "uuid",
      "lens_family_id": "uuid",
      "sphere_min": -6.0,
      "sphere_max": 6.0,
      "cylinder_min": -2.0,
      "cylinder_max": 2.0,
      "addition_min": 0.0,
      "addition_max": 4.0,
      "base_price": 380.0,
      "cost": 150.0,
      "sourcing_type": "stock",
      "is_active": true,
      "lens_families": {
        "id": "uuid",
        "name": "Varilux Comfort",
        "brand": "Essilor",
        "lens_type": "progressive",
        "lens_material": "high_index_1_67"
      }
    }
  ]
}
```

#### `POST /api/admin/lens-matrices`

Crea una nueva matriz de precios.

**Body:**

```json
{
  "lens_family_id": "uuid",
  "sphere_min": -6.0,
  "sphere_max": 6.0,
  "cylinder_min": -2.0,
  "cylinder_max": 2.0,
  "addition_min": 0.0,
  "addition_max": 4.0,
  "base_price": 380.0,
  "cost": 150.0,
  "sourcing_type": "stock",
  "is_active": true
}
```

#### `GET /api/admin/lens-matrices/calculate`

Calcula el precio de un lente.

**Query Parameters:**

- `lens_family_id` (UUID, requerido): ID de la familia
- `sphere` (decimal, requerido): Valor de esfera
- `cylinder` (decimal, opcional, default: 0): Valor de cilindro
- `addition` (decimal, opcional): Valor de adición
- `sourcing_type` (string, opcional): Filtrar por tipo de sourcing

**Response:**

```json
{
  "calculation": {
    "price": 380.0,
    "sourcing_type": "stock",
    "cost": 150.0
  }
}
```

---

## Relaciones con Otras Tablas

### Tabla `quotes`

Las cotizaciones pueden referenciar familias de lentes:

```sql
ALTER TABLE public.quotes
  ADD COLUMN presbyopia_solution TEXT CHECK (presbyopia_solution IN (
    'none', 'two_separate', 'bifocal', 'trifocal', 'progressive'
  )) DEFAULT 'none',
  ADD COLUMN far_lens_family_id UUID REFERENCES public.lens_families(id) ON DELETE SET NULL,
  ADD COLUMN near_lens_family_id UUID REFERENCES public.lens_families(id) ON DELETE SET NULL,
  ADD COLUMN far_lens_cost DECIMAL(10,2),
  ADD COLUMN near_lens_cost DECIMAL(10,2);
```

### Tabla `lab_work_orders`

Las órdenes de trabajo del laboratorio también pueden referenciar familias:

```sql
ALTER TABLE public.lab_work_orders
  ADD COLUMN presbyopia_solution TEXT CHECK (presbyopia_solution IN (
    'none', 'two_separate', 'bifocal', 'trifocal', 'progressive'
  )) DEFAULT 'none',
  ADD COLUMN far_lens_family_id UUID REFERENCES public.lens_families(id) ON DELETE SET NULL,
  ADD COLUMN near_lens_family_id UUID REFERENCES public.lens_families(id) ON DELETE SET NULL,
  ADD COLUMN far_lens_cost DECIMAL(10,2),
  ADD COLUMN near_lens_cost DECIMAL(10,2);
```

---

## Notas de Implementación

### Triggers

El sistema utiliza triggers para actualizar automáticamente el campo `updated_at`:

```sql
CREATE TRIGGER update_lens_families_updated_at
  BEFORE UPDATE ON public.lens_families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lens_price_matrices_updated_at
  BEFORE UPDATE ON public.lens_price_matrices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Validaciones en el Frontend

Los schemas de validación Zod están definidos en `src/lib/api/validation/zod-schemas.ts`:

- `lensFamilyBaseSchema`: Valida familias de lentes
- `createLensPriceMatrixSchema`: Valida matrices de precios
- Validaciones de rangos (sphere_min <= sphere_max, etc.)

### Consideraciones de Rendimiento

1. **Índices GIST**: Los índices GIST en rangos numéricos permiten búsquedas rápidas incluso con miles de matrices
2. **Filtrado por activos**: Los índices parciales (`WHERE is_active = TRUE`) mejoran el rendimiento de consultas comunes
3. **Cascada de eliminación**: La eliminación de familias elimina automáticamente sus matrices, evitando datos huérfanos

---

## Migraciones Relacionadas

Las siguientes migraciones crean y modifican estas tablas:

1. `20260121000000_create_lens_price_matrices.sql` - Creación inicial
2. `20260122000002_lens_matrices_v2_fix_schema.sql` - Refactorización V2
3. `20260125000000_add_addition_support_to_lens_matrices.sql` - Soporte para presbicia
4. `20260129000000_create_lens_families_and_matrices.sql` - Migración consolidada final

---

## Conclusión

El sistema de Familias de Lentes y Matrices de Precios proporciona una solución robusta y flexible para:

- ✅ Gestión de catálogos de lentes
- ✅ Cálculo automático de precios según recetas
- ✅ Soporte para diferentes tipos de sourcing
- ✅ Manejo de presbicia con rangos de adición
- ✅ Seguridad mediante RLS
- ✅ Optimización mediante índices especializados

Para más información sobre el uso del sistema en la aplicación, consultar:

- `docs/PlanDeRefraccionSecciones.md` - Plan de diseño original
- `src/app/admin/lens-families/page.tsx` - Interfaz de administración de familias
- `src/app/admin/lens-matrices/page.tsx` - Interfaz de administración de matrices
