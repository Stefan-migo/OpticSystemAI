import { z } from "zod";
import { isValidRUTFormat, normalizeRUT } from "@/lib/utils/rut";

/**
 * Base Zod Schemas - Reutilizables en todo el sistema
 *
 * Estos schemas proporcionan validación consistente para campos comunes
 * usados en múltiples rutas API.
 */

// ============================================================================
// Schemas Base Reutilizables
// ============================================================================

/**
 * Schema para validar email
 */
export const emailSchema = z
  .string()
  .email("Debe ser un email válido")
  .min(1, "El email es requerido")
  .max(255, "El email es demasiado largo")
  .toLowerCase()
  .trim();

/**
 * Schema para validar RUT chileno
 */
export const rutSchema = z
  .string()
  .min(1, "El RUT es requerido")
  .refine((rut) => isValidRUTFormat(rut), {
    message: "El formato del RUT no es válido (debe ser xx.xxx.xxx-x)",
  })
  .transform((rut) => normalizeRUT(rut));

/**
 * Schema para validar RUT opcional
 */
export const rutOptionalSchema = z
  .string()
  .optional()
  .refine((rut) => !rut || isValidRUTFormat(rut), {
    message: "El formato del RUT no es válido (debe ser xx.xxx.xxx-x)",
  })
  .transform((rut) => (rut ? normalizeRUT(rut) : undefined));

/**
 * Schema para validar teléfono
 */
export const phoneSchema = z
  .string()
  .min(8, "El teléfono debe tener al menos 8 dígitos")
  .max(20, "El teléfono es demasiado largo")
  .regex(/^[\d\s\-\+\(\)]+$/, "El teléfono contiene caracteres inválidos")
  .trim();

/**
 * Schema para validar teléfono opcional
 */
export const phoneOptionalSchema = z
  .string()
  .optional()
  .refine((phone) => !phone || phone.length >= 8, {
    message: "El teléfono debe tener al menos 8 dígitos",
  })
  .transform((phone) => phone?.trim() || undefined);

/**
 * Schema para validar UUID
 */
export const uuidSchema = z.string().uuid("Debe ser un UUID válido");

/**
 * Schema para validar UUID opcional
 */
export const uuidOptionalSchema = z
  .union([z.string().uuid("Debe ser un UUID válido"), z.null(), z.undefined()])
  .optional()
  .nullable();

/**
 * Schema para validar URL
 */
export const urlSchema = z
  .string()
  .url("Debe ser una URL válida")
  .max(2048, "La URL es demasiado larga");

/**
 * Schema para validar URL opcional
 */
export const urlOptionalSchema = z
  .union([
    z
      .string()
      .url("Debe ser una URL válida")
      .max(2048, "La URL es demasiado larga"),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .optional()
  .nullable()
  .transform((val) => {
    if (!val || val === "") return null;
    return val;
  });

/**
 * Schema para validar precio (número positivo)
 * Acepta número o string que se convierte a número
 */
export const priceSchema = z.preprocess(
  (val) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return undefined;
      const num = parseFloat(trimmed);
      return isNaN(num) ? undefined : num;
    }
    return val;
  },
  z
    .number({
      required_error: "El precio es requerido",
      invalid_type_error: "El precio debe ser un número",
    })
    .positive("El precio debe ser un número positivo")
    .finite("El precio debe ser un número finito"),
);

/**
 * Schema para validar precio que permite 0 (no negativo)
 * Útil para costos que pueden ser 0
 */
export const priceNonNegativeSchema = z.preprocess(
  (val) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return 0;
      const num = parseFloat(trimmed);
      return isNaN(num) ? 0 : num;
    }
    return val;
  },
  z
    .number({
      invalid_type_error: "El precio debe ser un número",
    })
    .nonnegative("El precio debe ser un número no negativo")
    .finite("El precio debe ser un número finito"),
);

/**
 * Schema para validar precio opcional
 */
export const priceOptionalSchema = z
  .number()
  .positive("El precio debe ser un número positivo")
  .finite("El precio debe ser un número finito")
  .optional()
  .nullable()
  .or(
    z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val === "") return undefined;
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          throw new z.ZodError([
            {
              code: "custom",
              path: [],
              message: "El precio debe ser un número positivo",
            },
          ]);
        }
        return num;
      }),
  );

/**
 * Schema para validar cantidad (número entero no negativo)
 */
export const quantitySchema = z
  .number()
  .int("La cantidad debe ser un número entero")
  .nonnegative("La cantidad no puede ser negativa")
  .finite("La cantidad debe ser un número finito")
  .or(
    z.string().transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 0) {
        throw new z.ZodError([
          {
            code: "custom",
            path: [],
            message: "La cantidad debe ser un número entero no negativo",
          },
        ]);
      }
      return num;
    }),
  );

/**
 * Schema para validar cantidad opcional
 */
export const quantityOptionalSchema = z
  .number()
  .int("La cantidad debe ser un número entero")
  .nonnegative("La cantidad no puede ser negativa")
  .optional()
  .nullable()
  .or(
    z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val === "") return undefined;
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 0) {
          throw new z.ZodError([
            {
              code: "custom",
              path: [],
              message: "La cantidad debe ser un número entero no negativo",
            },
          ]);
        }
        return num;
      }),
  );

/**
 * Schema para validar fecha ISO
 */
export const dateISOSchema = z
  .string()
  .datetime("Debe ser una fecha válida en formato ISO")
  .or(z.date());

/**
 * Schema para validar fecha ISO opcional
 * Acepta string ISO, Date object, o null/undefined
 */
export const dateISOOptionalSchema = z
  .union([
    z.string().datetime("Debe ser una fecha válida en formato ISO"),
    z.date(),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Debe ser una fecha en formato YYYY-MM-DD"), // También acepta YYYY-MM-DD
    z.null(),
    z.undefined(),
  ])
  .nullable()
  .optional()
  .transform((val) => {
    if (!val || val === null || val === undefined) return null;
    if (val instanceof Date) return val.toISOString();
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      // Convert YYYY-MM-DD to ISO string
      return new Date(val + "T00:00:00.000Z").toISOString();
    }
    return val;
  });

/**
 * Schema para validar paginación
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  sort: z.enum(["asc", "desc"]).default("desc").optional(),
});

/**
 * Schema para validar búsqueda
 */
export const searchSchema = z.object({
  q: z
    .string()
    .min(1, "El término de búsqueda es requerido")
    .max(255)
    .optional(),
  search: z.string().min(1).max(255).optional(),
});

// ============================================================================
// Schemas para Customers
// ============================================================================

/**
 * Schema base para datos de cliente
 */
export const customerBaseSchema = z
  .object({
    first_name: z
      .string()
      .min(1, "El nombre es requerido")
      .max(100)
      .trim()
      .optional(),
    last_name: z
      .string()
      .min(1, "El apellido es requerido")
      .max(100)
      .trim()
      .optional(),
    email: emailSchema.optional().nullable(),
    phone: phoneOptionalSchema,
    rut: rutOptionalSchema,
    date_of_birth: dateISOOptionalSchema,
    gender: z
      .enum(["male", "female", "other", "prefer_not_to_say"])
      .optional()
      .nullable(),
    address_line_1: z.string().max(255).trim().optional().nullable(),
    address_line_2: z.string().max(255).trim().optional().nullable(),
    city: z.string().max(100).trim().optional().nullable(),
    state: z.string().max(100).trim().optional().nullable(),
    postal_code: z.string().max(20).trim().optional().nullable(),
    country: z.string().max(100).trim().default("Chile").optional(),
    medical_conditions: z.string().max(1000).trim().optional().nullable(),
    allergies: z.string().max(1000).trim().optional().nullable(),
    medications: z.string().max(1000).trim().optional().nullable(),
    medical_notes: z.string().max(5000).trim().optional().nullable(),
    last_eye_exam_date: dateISOOptionalSchema,
    next_eye_exam_due: dateISOOptionalSchema,
    preferred_contact_method: z
      .enum(["email", "phone", "sms", "whatsapp"])
      .optional()
      .nullable(),
    emergency_contact_name: z.string().max(100).trim().optional().nullable(),
    emergency_contact_phone: phoneOptionalSchema,
    insurance_provider: z.string().max(100).trim().optional().nullable(),
    insurance_policy_number: z.string().max(100).trim().optional().nullable(),
    notes: z.string().max(5000).trim().optional().nullable(),
    tags: z.array(z.string()).optional().nullable(),
    is_active: z.boolean().default(true).optional(),
    branch_id: uuidOptionalSchema,
  })
  .refine((data) => data.first_name || data.last_name, {
    message: "Al menos el nombre o apellido es requerido",
    path: ["first_name"],
  });

/**
 * Schema para crear un cliente
 */
export const createCustomerSchema = customerBaseSchema;

/**
 * Schema para actualizar un cliente
 * Todos los campos son opcionales para actualización
 */
export const updateCustomerSchema = z.object({
  first_name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100)
    .trim()
    .optional(),
  last_name: z
    .string()
    .min(1, "El apellido es requerido")
    .max(100)
    .trim()
    .optional(),
  email: emailSchema.optional().nullable(),
  phone: phoneOptionalSchema,
  rut: rutOptionalSchema,
  date_of_birth: dateISOOptionalSchema,
  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional()
    .nullable(),
  address_line_1: z.string().max(255).trim().optional().nullable(),
  address_line_2: z.string().max(255).trim().optional().nullable(),
  city: z.string().max(100).trim().optional().nullable(),
  state: z.string().max(100).trim().optional().nullable(),
  postal_code: z.string().max(20).trim().optional().nullable(),
  country: z.string().max(100).trim().default("Chile").optional(),
  medical_conditions: z.string().max(1000).trim().optional().nullable(),
  allergies: z.string().max(1000).trim().optional().nullable(),
  medications: z.string().max(1000).trim().optional().nullable(),
  medical_notes: z.string().max(5000).trim().optional().nullable(),
  last_eye_exam_date: dateISOOptionalSchema,
  next_eye_exam_due: dateISOOptionalSchema,
  preferred_contact_method: z
    .enum(["email", "phone", "sms", "whatsapp"])
    .optional()
    .nullable(),
  emergency_contact_name: z.string().max(100).trim().optional().nullable(),
  emergency_contact_phone: phoneOptionalSchema,
  insurance_provider: z.string().max(100).trim().optional().nullable(),
  insurance_policy_number: z.string().max(100).trim().optional().nullable(),
  notes: z.string().max(5000).trim().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  is_active: z.boolean().default(true).optional(),
  branch_id: uuidOptionalSchema,
});

/**
 * Schema para búsqueda de clientes
 */
export const searchCustomerSchema = searchSchema.extend({
  branch_id: uuidOptionalSchema,
  is_active: z.boolean().optional(),
});

// ============================================================================
// Schemas para Products
// ============================================================================

/**
 * Schema para ingredientes de productos
 */
const ingredientSchema = z.object({
  name: z.string().min(1).max(200),
  percentage: z.number().min(0).max(100).optional(),
});

/**
 * Schema base para datos de producto
 */
export const productBaseSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre del producto es requerido")
    .max(255)
    .trim(),
  slug: z.string().max(255).trim().optional(),
  short_description: z.string().max(500).trim().optional().nullable(),
  description: z.string().max(10000).trim().optional().nullable(),
  price: priceSchema,
  compare_at_price: priceOptionalSchema,
  cost_price: priceOptionalSchema,
  price_includes_tax: z.boolean().default(false).optional(),
  inventory_quantity: quantityOptionalSchema,
  category_id: uuidOptionalSchema,
  branch_id: uuidOptionalSchema,
  featured_image: urlOptionalSchema,
  gallery: z
    .array(urlSchema)
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || val.length === 0) return [];
      return val.filter((url) => url && url !== "");
    }),
  tags: z.array(z.string()).optional(),
  product_type: z
    .enum(["frame", "lens", "accessory", "other"])
    .default("frame")
    .optional(),
  optical_category: z.string().max(100).trim().optional().nullable(),
  sku: z.string().max(100).trim().optional().nullable(),
  barcode: z.string().max(100).trim().optional().nullable(),
  brand: z.string().max(100).trim().optional().nullable(),
  manufacturer: z.string().max(100).trim().optional().nullable(),
  model_number: z.string().max(100).trim().optional().nullable(),
  // Frame fields
  frame_type: z.string().max(100).trim().optional().nullable(),
  frame_material: z.string().max(100).trim().optional().nullable(),
  frame_shape: z.string().max(100).trim().optional().nullable(),
  frame_color: z.string().max(100).trim().optional().nullable(),
  frame_size: z.string().max(50).trim().optional().nullable(),
  frame_bridge_width: z.number().positive().optional().nullable(),
  frame_temple_length: z.number().positive().optional().nullable(),
  frame_lens_width: z.number().positive().optional().nullable(),
  frame_lens_height: z.number().positive().optional().nullable(),
  // Lens fields
  lens_type: z.string().max(100).trim().optional().nullable(),
  lens_material: z.string().max(100).trim().optional().nullable(),
  lens_coating: z.string().max(100).trim().optional().nullable(),
  lens_prescription_type: z.string().max(100).trim().optional().nullable(),
  // Cosmetic/Skincare fields
  skin_type: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  ingredients: z.array(ingredientSchema).optional(),
  usage_instructions: z.string().max(2000).trim().optional().nullable(),
  precautions: z.string().max(2000).trim().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  dimensions: z.string().max(100).trim().optional().nullable(),
  package_characteristics: z.string().max(500).trim().optional().nullable(),
  is_featured: z.boolean().default(false).optional(),
  status: z.enum(["active", "draft", "archived"]).default("draft").optional(),
  published_at: dateISOOptionalSchema,
});

/**
 * Schema para crear un producto
 */
export const createProductSchema = productBaseSchema;

/**
 * Schema para actualizar un producto
 */
export const updateProductSchema = productBaseSchema.partial().extend({
  name: z.string().min(1).max(255).trim().optional(),
});

/**
 * Schema para búsqueda de productos
 */
export const searchProductSchema = searchSchema.extend({
  category_id: uuidOptionalSchema,
  product_type: z.enum(["frame", "lens", "accessory", "other"]).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  branch_id: uuidOptionalSchema,
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
});

// ============================================================================
// Schemas para POS (Point of Sale)
// ============================================================================

/**
 * Schema para precio que permite negativos (para descuentos)
 */
const priceAllowNegativeSchema = z.preprocess(
  (val) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "") return undefined;
      const num = parseFloat(trimmed);
      return isNaN(num) ? undefined : num;
    }
    return val;
  },
  z
    .number({
      required_error: "El precio es requerido",
      invalid_type_error: "El precio debe ser un número",
    })
    .finite("El precio debe ser un número finito"),
);

/**
 * Schema para item de venta POS
 * Permite product_id null para servicios, descuentos, etc.
 * Permite precios negativos para descuentos
 */
const posSaleItemSchema = z.object({
  product_id: z
    .union([
      uuidSchema,
      z.string().min(1), // Allow non-UUID strings for special items (e.g., "discount-xxx")
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable(),
  quantity: quantitySchema,
  unit_price: priceAllowNegativeSchema, // Allow negative prices for discounts
  total_price: priceAllowNegativeSchema.optional().nullable(), // Allow negative prices for discounts
  product_name: z.string().min(1).max(255).trim(),
});

/**
 * Schema para procesar una venta POS
 */
export const processSaleSchema = z
  .object({
    email: emailSchema.optional().nullable(),
    customer_id: uuidSchema, // Required for work order creation
    customer_name: z.string().max(200).trim().optional(),
    payment_method_type: z.enum(["cash", "card", "credit", "installments"]),
    payment_status: z
      .enum(["paid", "pending", "failed", "refunded"])
      .default("paid")
      .optional(),
    status: z
      .enum(["pending", "processing", "delivered", "cancelled"])
      .default("delivered")
      .optional(),
    subtotal: priceSchema,
    tax_amount: priceNonNegativeSchema.default(0).optional(),
    total_amount: priceSchema,
    currency: z.string().max(10).default("CLP").optional(),
    installments_count: z.number().int().positive().default(1).optional(),
    sii_invoice_type: z
      .enum(["none", "invoice", "credit_note", "debit_note", "boleta"])
      .default("none")
      .optional(),
    sii_rut: rutOptionalSchema,
    sii_business_name: z.string().max(200).trim().optional().nullable(),
    items: z.array(posSaleItemSchema).min(1, "Debe incluir al menos un item"),
    cash_received: priceOptionalSchema,
    change_amount: priceOptionalSchema,
    branch_id: uuidOptionalSchema,
    notes: z.string().max(1000).trim().optional().nullable(),
  })
  .refine(
    (data) => {
      // Validar que el total sea consistente (permitir pequeña diferencia por redondeo)
      const calculatedTotal = (data.subtotal || 0) + (data.tax_amount || 0);
      return Math.abs(calculatedTotal - data.total_amount) < 0.01;
    },
    {
      message:
        "El total_amount no coincide con el cálculo (subtotal + tax_amount)",
      path: ["total_amount"],
    },
  );

// ============================================================================
// Schemas para Work Orders
// ============================================================================

/**
 * Schema para crear un work order
 */
export const createWorkOrderSchema = z.object({
  customer_id: uuidSchema,
  prescription_id: uuidOptionalSchema,
  quote_id: uuidOptionalSchema,
  frame_product_id: uuidOptionalSchema,
  frame_name: z
    .string()
    .min(1, "El nombre del marco es requerido")
    .max(255)
    .trim(),
  frame_brand: z.string().max(100).trim().optional().nullable(),
  frame_model: z.string().max(100).trim().optional().nullable(),
  frame_color: z.string().max(100).trim().optional().nullable(),
  frame_size: z.string().max(50).trim().optional().nullable(),
  frame_sku: z.string().max(100).trim().optional().nullable(),
  frame_serial_number: z.string().max(100).trim().optional().nullable(),
  lens_type: z.string().min(1, "El tipo de lente es requerido").max(100).trim(),
  lens_material: z
    .string()
    .min(1, "El material del lente es requerido")
    .max(100)
    .trim(),
  lens_index: z.number().positive().optional().nullable(),
  lens_treatments: z.array(z.string()).optional(),
  lens_tint_color: z.string().max(100).trim().optional().nullable(),
  lens_tint_percentage: z.number().min(0).max(100).optional().nullable(),
  lab_name: z.string().max(200).trim().optional().nullable(),
  lab_contact: z.string().max(200).trim().optional().nullable(),
  lab_order_number: z.string().max(100).trim().optional().nullable(),
  lab_estimated_delivery_date: dateISOOptionalSchema,
  status: z
    .enum([
      "quote",
      "pending",
      "in_progress",
      "completed",
      "cancelled",
      "ordered",
    ])
    .default("quote")
    .optional(),
  frame_cost: priceNonNegativeSchema.default(0).optional(),
  lens_cost: priceNonNegativeSchema.default(0).optional(),
  treatments_cost: priceNonNegativeSchema.default(0).optional(),
  labor_cost: priceNonNegativeSchema.default(0).optional(),
  lab_cost: priceNonNegativeSchema.default(0).optional(),
  subtotal: priceNonNegativeSchema.default(0).optional(),
  tax_amount: priceNonNegativeSchema.default(0).optional(),
  discount_amount: priceNonNegativeSchema.default(0).optional(),
  total_amount: priceSchema,
  currency: z.string().max(10).default("CLP").optional(),
  payment_status: z
    .enum(["pending", "partial", "paid", "refunded"])
    .default("pending")
    .optional(),
  payment_method: z.string().max(50).trim().optional().nullable(),
  deposit_amount: priceNonNegativeSchema.default(0).optional(),
  balance_amount: priceSchema.optional(),
  pos_order_id: uuidOptionalSchema,
  internal_notes: z.string().max(5000).trim().optional().nullable(),
  customer_notes: z.string().max(5000).trim().optional().nullable(),
  assigned_to: uuidOptionalSchema,
  branch_id: uuidOptionalSchema,
});

// ============================================================================
// Schemas para Quotes
// ============================================================================

/**
 * Schema para crear un presupuesto
 */
export const createQuoteSchema = z.object({
  customer_id: uuidSchema,
  prescription_id: uuidOptionalSchema,
  frame_product_id: uuidOptionalSchema,
  frame_name: z.string().max(255).trim().optional().nullable(),
  frame_brand: z.string().max(100).trim().optional().nullable(),
  frame_model: z.string().max(100).trim().optional().nullable(),
  frame_color: z.string().max(100).trim().optional().nullable(),
  frame_size: z.string().max(50).trim().optional().nullable(),
  frame_sku: z.string().max(100).trim().optional().nullable(),
  frame_price: priceNonNegativeSchema.default(0).optional(),
  lens_type: z.string().max(100).trim().optional().nullable(),
  lens_material: z.string().max(100).trim().optional().nullable(),
  lens_index: z.number().positive().optional().nullable(),
  lens_treatments: z.array(z.string()).optional(),
  lens_tint_color: z.string().max(100).trim().optional().nullable(),
  lens_tint_percentage: z.number().min(0).max(100).optional().nullable(),
  frame_cost: priceNonNegativeSchema.default(0).optional(),
  lens_cost: priceNonNegativeSchema.default(0).optional(),
  treatments_cost: priceNonNegativeSchema.default(0).optional(),
  labor_cost: priceNonNegativeSchema.default(0).optional(),
  subtotal: priceNonNegativeSchema.default(0).optional(),
  tax_amount: priceNonNegativeSchema.default(0).optional(),
  discount_amount: priceNonNegativeSchema.default(0).optional(),
  discount_percentage: z.number().min(0).max(100).default(0).optional(),
  total_amount: priceSchema,
  currency: z.string().max(10).default("CLP").optional(),
  status: z
    .enum(["draft", "sent", "accepted", "rejected", "expired"])
    .default("draft")
    .optional(),
  notes: z.string().max(5000).trim().optional().nullable(),
  customer_notes: z.string().max(5000).trim().optional().nullable(),
  terms_and_conditions: z.string().max(5000).trim().optional().nullable(),
  expiration_date: dateISOOptionalSchema,
  branch_id: uuidOptionalSchema,
});

// ============================================================================
// Schemas para Appointments
// ============================================================================

/**
 * Schema para datos de cliente invitado (guest customer)
 */
const guestCustomerSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido").max(100).trim(),
  last_name: z.string().min(1, "El apellido es requerido").max(100).trim(),
  rut: z.string().max(20).trim().optional().nullable(),
  email: emailSchema.optional().nullable(),
  phone: z.string().max(20).trim().optional().nullable(),
});

/**
 * Schema para crear una cita
 * Permite customer_id (cliente registrado) o guest_customer (cliente invitado)
 */
export const createAppointmentSchema = z
  .object({
    customer_id: uuidOptionalSchema, // Opcional si hay guest_customer
    guest_customer: guestCustomerSchema.optional().nullable(), // Opcional si hay customer_id
    appointment_type: z
      .string()
      .min(1, "El tipo de cita es requerido")
      .max(100)
      .trim(),
    appointment_date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "La fecha debe estar en formato YYYY-MM-DD",
      ),
    appointment_time: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, "La hora debe estar en formato HH:MM:SS"),
    duration_minutes: z.number().int().positive().default(30).optional(),
    notes: z.string().max(5000).trim().optional().nullable(),
    branch_id: uuidOptionalSchema,
    // Campos adicionales que pueden venir del formulario
    status: z
      .enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"])
      .optional(),
    assigned_to: uuidOptionalSchema,
    reason: z.string().max(500).trim().optional().nullable(),
    follow_up_required: z.boolean().optional(),
    follow_up_date: dateISOOptionalSchema,
    prescription_id: uuidOptionalSchema,
    order_id: uuidOptionalSchema,
    cancellation_reason: z.string().max(500).trim().optional().nullable(),
  })
  .refine(
    (data) => {
      // Al menos uno de customer_id o guest_customer debe estar presente
      return (
        (data.customer_id !== null && data.customer_id !== undefined) ||
        (data.guest_customer !== null && data.guest_customer !== undefined)
      );
    },
    {
      message:
        "Debe proporcionar un customer_id (cliente registrado) o guest_customer (cliente invitado)",
      path: ["customer_id"],
    },
  );
