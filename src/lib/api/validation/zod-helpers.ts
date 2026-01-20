import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "../errors";
import { logger } from "@/lib/logger";

/**
 * Helpers para usar Zod en rutas API de Next.js
 *
 * Estos helpers proporcionan funciones convenientes para validar
 * request bodies, query parameters y path parameters usando Zod.
 */

/**
 * Valida un objeto usando un schema Zod (para cuando el body ya fue parseado)
 *
 * @param body - Objeto ya parseado
 * @param schema - Zod schema para validar el body
 * @returns Datos validados y parseados
 * @throws ValidationError si la validación falla
 */
export function validateBody<T extends z.ZodTypeAny>(
  body: unknown,
  schema: T,
): z.infer<T> {
  try {
    const validated = schema.parse(body);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      logger.warn(
        {
          errors: errors.map((e) => `${e.field}: ${e.message}`).join(", "),
        },
        "Validation failed",
      );

      throw new ValidationError(
        `Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
        errors,
      );
    }

    throw error;
  }
}

/**
 * Valida y parsea el body de una request usando un schema Zod
 *
 * @param request - NextRequest object
 * @param schema - Zod schema para validar el body
 * @returns Datos validados y parseados
 * @throws ValidationError si la validación falla
 */
export async function parseAndValidateBody<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T,
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return validateBody(body, schema);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new ValidationError("Invalid JSON in request body");
    }

    throw error;
  }
}

/**
 * Valida query parameters usando un schema Zod
 *
 * @param request - NextRequest object
 * @param schema - Zod schema para validar los query params
 * @returns Query parameters validados y parseados
 * @throws ValidationError si la validación falla
 */
export function parseAndValidateQuery<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T,
): z.infer<T> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string | string[]> = {};

    // Convertir URLSearchParams a objeto
    searchParams.forEach((value, key) => {
      if (params[key]) {
        // Si ya existe, convertir a array
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value);
        } else {
          params[key] = [params[key] as string, value];
        }
      } else {
        params[key] = value;
      }
    });

    const validated = schema.parse(params);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      logger.warn(
        {
          errors: errors.map((e) => `${e.field}: ${e.message}`).join(", "),
        },
        "Query validation failed",
      );

      throw new ValidationError(
        `Query validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
        errors,
      );
    }

    throw error;
  }
}

/**
 * Valida path parameters usando un schema Zod
 *
 * @param params - Path parameters object
 * @param schema - Zod schema para validar los params
 * @returns Path parameters validados y parseados
 * @throws ValidationError si la validación falla
 */
export function parseAndValidateParams<T extends z.ZodTypeAny>(
  params: Record<string, string | string[] | undefined>,
  schema: T,
): z.infer<T> {
  try {
    const validated = schema.parse(params);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      logger.warn(
        {
          errors: errors.map((e) => `${e.field}: ${e.message}`).join(", "),
        },
        "Path params validation failed",
      );

      throw new ValidationError(
        `Path params validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
        errors,
      );
    }

    throw error;
  }
}

/**
 * Middleware wrapper para manejar errores de validación
 *
 * @param handler - Función handler de la ruta API
 * @returns Handler envuelto con manejo de errores de validación
 */
export function withValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (
    validatedData: z.infer<T>,
    request: NextRequest,
  ) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const validatedData = await parseAndValidateBody(request, schema);
      return await handler(validatedData, request);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          {
            error: error.message,
            details: error.details || undefined,
          },
          { status: 400 },
        );
      }

      if (error instanceof Error) {
        logger.error(error, "Unexpected error in validation handler");
      } else {
        logger.error(
          new Error(String(error)),
          "Unexpected error in validation handler",
        );
      }
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}

/**
 * Helper para crear respuestas de error de validación consistentes
 *
 * @param error - Error de validación
 * @returns NextResponse con error de validación
 */
export function validationErrorResponse(
  error: ValidationError | z.ZodError,
): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details || undefined,
      },
      { status: 400 },
    );
  }

  if (error instanceof z.ZodError) {
    const errors = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    return NextResponse.json(
      {
        error: "Validation failed",
        details: errors,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ error: "Validation error" }, { status: 400 });
}
