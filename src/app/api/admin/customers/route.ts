import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { NotificationService } from "@/lib/notifications/notification-service";
import { getBranchContext, addBranchFilter } from "@/lib/api/branch-middleware";
import { appLogger as logger } from "@/lib/logger";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";
import { withRateLimit, rateLimitConfigs } from "@/lib/api/middleware";
import { RateLimitError, ValidationError } from "@/lib/api/errors";
import { z } from "zod";
import {
  createCustomerSchema,
  searchCustomerSchema,
  paginationSchema,
} from "@/lib/api/validation/zod-schemas";
import {
  parseAndValidateBody,
  parseAndValidateQuery,
  validateBody,
  validationErrorResponse,
} from "@/lib/api/validation/zod-helpers";

export async function GET(request: NextRequest) {
  try {
    logger.info("Customers API GET called");

    // Validate query parameters with Zod
    let queryParams;
    try {
      // Combine pagination and search schemas
      const combinedSchema = paginationSchema.merge(searchCustomerSchema);
      queryParams = parseAndValidateQuery(request, combinedSchema);
    } catch (error) {
      if (error instanceof ValidationError) {
        return validationErrorResponse(error);
      }
      throw error;
    }

    const search = queryParams.q || queryParams.search || "";
    const status =
      queryParams.is_active !== undefined
        ? queryParams.is_active
          ? "active"
          : "inactive"
        : "";
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 20;
    const offset = (page - 1) * limit;

    logger.debug("Query params", { search, status, page, limit });

    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      logger.error("User authentication failed", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.debug("User authenticated", { email: user.email });

    const { data: isAdmin, error: adminError } = (await supabase.rpc(
      "is_admin",
      { user_id: user.id } as IsAdminParams,
    )) as { data: IsAdminResult | null; error: Error | null };
    if (adminError) {
      logger.error("Admin check error", adminError);
      return NextResponse.json(
        { error: "Admin verification failed" },
        { status: 500 },
      );
    }
    if (!isAdmin) {
      logger.warn("User is not admin", { email: user.email });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }
    logger.debug("Admin access confirmed", { email: user.email });

    // Get branch context
    const branchContext = await getBranchContext(request, user.id);

    // Build branch filter function
    const applyBranchFilter = (query: any) => {
      return addBranchFilter(
        query,
        branchContext.branchId,
        branchContext.isSuperAdmin,
      );
    };

    // Build the query to get customers from customers table (not profiles)
    let query = applyBranchFilter(supabase.from("customers").select("*"));

    // Apply filters
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,rut.ilike.%${search}%`,
      );
    }

    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }

    // Get total count for pagination
    const countQuery = applyBranchFilter(
      supabase.from("customers").select("*", { count: "exact", head: true }),
    );

    if (search) {
      countQuery.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,rut.ilike.%${search}%`,
      );
    }

    if (status === "active") {
      countQuery.eq("is_active", true);
    } else if (status === "inactive") {
      countQuery.eq("is_active", false);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error("Error getting customer count", countError);
      return NextResponse.json(
        { error: "Failed to count customers" },
        { status: 500 },
      );
    }
    logger.debug("Customer count retrieved", { count });

    // Apply pagination and ordering
    const { data: customers, error } = await query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching customers", error);
      return NextResponse.json(
        { error: "Failed to fetch customers" },
        { status: 500 },
      );
    }
    logger.debug("Customers fetched successfully", {
      count: customers?.length || 0,
    });

    // Calculate customer analytics
    const customerStats = customers?.map((customer: any) => {
      // Basic segment classification based on order count
      let segment = "new";
      // Segment will be calculated based on orders in the detail endpoint

      return {
        ...customer,
        analytics: {
          totalSpent: 0, // TODO: Calculate from orders
          orderCount: 0, // TODO: Calculate from orders
          lastOrderDate: null, // TODO: Get from orders
          avgOrderValue: 0, // TODO: Calculate from orders
          segment,
          lifetimeValue: 0, // TODO: Calculate from orders
        },
      };
    });

    return NextResponse.json({
      customers: customerStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error("Error in customers API GET", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Handle both analytics and customer creation
export async function POST(request: NextRequest) {
  try {
    return await (withRateLimit(rateLimitConfigs.modification) as any)(
      request,
      async () => {
        try {
          const supabase = await createClient();

          // Check admin authorization
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError || !user) {
            logger.error("User authentication failed", userError);
            return NextResponse.json(
              { error: "Unauthorized" },
              { status: 401 },
            );
          }
          logger.debug("User authenticated", { email: user.email });

          const { data: isAdmin, error: adminError } = (await supabase.rpc(
            "is_admin",
            { user_id: user.id } as IsAdminParams,
          )) as { data: IsAdminResult | null; error: Error | null };
          if (adminError) {
            logger.error("Admin check error", adminError);
            return NextResponse.json(
              { error: "Admin verification failed" },
              { status: 500 },
            );
          }
          if (!isAdmin) {
            logger.warn("User is not admin", { email: user.email });
            return NextResponse.json(
              { error: "Admin access required" },
              { status: 403 },
            );
          }
          logger.debug("Admin access confirmed", { email: user.email });

          // Get request body to determine action
          let body: any;
          try {
            body = await request.json();
            logger.debug("Request body parsed successfully", {
              bodyKeys: Object.keys(body || {}),
              bodyType: typeof body,
            });
          } catch (error) {
            logger.error(
              "Failed to parse request body",
              error instanceof Error ? error : new Error(String(error)),
            );
            return NextResponse.json(
              { error: "Invalid JSON in request body" },
              { status: 400 },
            );
          }

          // Check if this is a customer creation request (has first_name or last_name)
          // Analytics requests have empty body or only summary-related fields
          const isCustomerCreation = body.first_name || body.last_name;

          if (isCustomerCreation) {
            logger.info("Customers API POST called (create new customer)");
            logger.debug("Create customer data received", {
              bodyKeys: Object.keys(body || {}),
              hasFirstName: !!body.first_name,
              hasLastName: !!body.last_name,
            });

            // Validate request body with Zod (body already parsed)
            let validatedBody;
            try {
              logger.debug("Starting Zod validation");
              validatedBody = validateBody(body, createCustomerSchema);
              logger.debug("Zod validation successful", {
                validatedKeys: Object.keys(validatedBody || {}),
              });
            } catch (error: unknown) {
              logger.error(
                "Validation error caught",
                error instanceof Error ? error : new Error(String(error)),
              );
              if (error instanceof ValidationError) {
                logger.debug(
                  "ValidationError detected, returning error response",
                );
                return validationErrorResponse(error);
              }
              // For ZodError that wasn't caught as ValidationError
              if (error instanceof z.ZodError) {
                logger.warn("ZodError not wrapped in ValidationError", {
                  errors: error.errors,
                });
                const errors = error.errors.map((err: z.ZodIssue) => ({
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
              // Log and re-throw unexpected errors
              logger.error(
                "Unexpected error in validation",
                error instanceof Error ? error : new Error(String(error)),
              );
              throw error;
            }

            // Get branch context
            const branchContext = await getBranchContext(request, user.id);

            logger.debug("Branch context for customer creation", {
              branchId: branchContext.branchId,
              isGlobalView: branchContext.isGlobalView,
              isSuperAdmin: branchContext.isSuperAdmin,
              bodyBranchId: validatedBody.branch_id,
            });

            // Determine customer branch_id
            // Priority: 1) branchContext.branchId (from header - selected branch), 2) validatedBody.branch_id (explicit), 3) error
            let customerBranchId: string | null = null;

            // First, try to use branch from context (header) - this is the selected branch
            if (branchContext.branchId) {
              customerBranchId = branchContext.branchId;
              logger.debug("Using branch_id from context (selected branch)", {
                branchId: customerBranchId,
              });
            } else if (validatedBody.branch_id) {
              // If no branch in context but provided in body (super admin in global view)
              customerBranchId = validatedBody.branch_id;
              logger.debug("Using branch_id from request body", {
                branchId: customerBranchId,
              });
            } else if (
              branchContext.isGlobalView &&
              branchContext.isSuperAdmin
            ) {
              // Super admin in global view must provide branch_id in body
              return NextResponse.json(
                {
                  error:
                    "Como super administrador en vista global, debe especificar la sucursal para el cliente",
                },
                { status: 400 },
              );
            } else {
              // Regular admin must have a branch selected
              return NextResponse.json(
                {
                  error: "Debe seleccionar una sucursal para crear un cliente",
                },
                { status: 400 },
              );
            }

            if (!customerBranchId) {
              return NextResponse.json(
                { error: "Debe especificar una sucursal para el cliente" },
                { status: 400 },
              );
            }

            // Check if customer already exists in this branch (by email, phone, or RUT)
            const existingCustomerQuery = supabase
              .from("customers")
              .select("id")
              .eq("branch_id", customerBranchId);

            if (validatedBody.email) {
              const { data: existingByEmail } = await existingCustomerQuery
                .eq("email", validatedBody.email)
                .maybeSingle();

              if (existingByEmail) {
                return NextResponse.json(
                  {
                    error:
                      "Ya existe un cliente con este email en esta sucursal.",
                  },
                  { status: 400 },
                );
              }
            }

            if (validatedBody.rut) {
              const { data: existingByRut } = await existingCustomerQuery
                .eq("rut", validatedBody.rut)
                .maybeSingle();

              if (existingByRut) {
                return NextResponse.json(
                  {
                    error:
                      "Ya existe un cliente con este RUT en esta sucursal.",
                  },
                  { status: 400 },
                );
              }
            }

            // Create customer data (NO auth user creation - customers don't need authentication)
            // Usar datos validados por Zod
            const customerData = {
              branch_id: customerBranchId,
              first_name: validatedBody.first_name || null,
              last_name: validatedBody.last_name || null,
              email: validatedBody.email || null,
              phone: validatedBody.phone || null,
              rut: validatedBody.rut || null,
              date_of_birth: validatedBody.date_of_birth || null,
              gender: validatedBody.gender || null,
              address_line_1: validatedBody.address_line_1 || null,
              address_line_2: validatedBody.address_line_2 || null,
              city: validatedBody.city || null,
              state: validatedBody.state || null,
              postal_code: validatedBody.postal_code || null,
              country: validatedBody.country || "Chile",
              medical_conditions: validatedBody.medical_conditions || null,
              allergies: validatedBody.allergies || null,
              medications: validatedBody.medications || null,
              medical_notes: validatedBody.medical_notes || null,
              last_eye_exam_date: validatedBody.last_eye_exam_date || null,
              next_eye_exam_due: validatedBody.next_eye_exam_due || null,
              preferred_contact_method:
                validatedBody.preferred_contact_method || null,
              emergency_contact_name:
                validatedBody.emergency_contact_name || null,
              emergency_contact_phone:
                validatedBody.emergency_contact_phone || null,
              insurance_provider: validatedBody.insurance_provider || null,
              insurance_policy_number:
                validatedBody.insurance_policy_number || null,
              notes: validatedBody.notes || null,
              tags: validatedBody.tags || null,
              is_active:
                validatedBody.is_active !== undefined
                  ? validatedBody.is_active
                  : true,
              created_by: user.id,
            };

            const { data: newCustomer, error: customerError } = await supabase
              .from("customers")
              .insert(customerData)
              .select()
              .single();

            if (customerError) {
              logger.error("Error creating customer", customerError);
              return NextResponse.json(
                {
                  error: `Error al crear cliente: ${customerError.message}`,
                },
                { status: 500 },
              );
            }

            if (!newCustomer) {
              logger.error("Customer was not created");
              return NextResponse.json(
                { error: "Failed to create customer" },
                { status: 500 },
              );
            }

            logger.info("Customer created successfully", {
              customerId: newCustomer.id,
            });

            // Create notification for new customer (non-blocking)
            const customerName =
              `${validatedBody.first_name || ""} ${validatedBody.last_name || ""}`.trim() ||
              "Cliente";
            NotificationService.notifyNewCustomer(
              newCustomer.id,
              customerName,
              validatedBody.email || undefined,
            ).catch((err) => logger.error("Error creating notification", err));

            return NextResponse.json({
              success: true,
              customer: newCustomer,
            });
          } else {
            // This is an analytics request
            logger.info("Customers API POST called (analytics summary)");

            // Get branch context
            const branchContext = await getBranchContext(request, user.id);

            // Build branch filter function
            const applyBranchFilter = (query: any) => {
              return addBranchFilter(
                query,
                branchContext.branchId,
                branchContext.isSuperAdmin,
              );
            };

            // Get customer analytics summary (filtered by branch)
            const { count: totalCount } = await applyBranchFilter(
              supabase
                .from("customers")
                .select("*", { count: "exact", head: true }),
            );

            const { count: activeCount } = await applyBranchFilter(
              supabase
                .from("customers")
                .select("*", { count: "exact", head: true })
                .eq("is_active", true),
            );

            const { count: recentCount } = await applyBranchFilter(
              supabase
                .from("customers")
                .select("*", { count: "exact", head: true })
                .gte(
                  "created_at",
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                ),
            );

            return NextResponse.json({
              summary: {
                totalCustomers: totalCount || 0,
                activeCustomers: activeCount || totalCount || 0,
                newCustomersThisMonth: recentCount || 0,
              },
            });
          }
        } catch (error) {
          if (error instanceof RateLimitError) {
            logger.warn("Rate limit exceeded for customer creation", {
              error: error.message,
            });
            return NextResponse.json({ error: error.message }, { status: 429 });
          }

          // Log error details for debugging
          if (error instanceof Error) {
            logger.error("Error in customers API POST", error);
          } else {
            logger.error(
              "Error in customers API POST",
              new Error(String(error)),
            );
          }

          // Return proper JSON error response
          const errorMessage =
            error instanceof Error ? error.message : "Internal server error";
          return NextResponse.json(
            {
              error: errorMessage,
              ...(process.env.NODE_ENV === "development" &&
              error instanceof Error
                ? { details: error.stack }
                : {}),
            },
            { status: 500 },
          );
        }
      },
    );
  } catch (error) {
    // Catch any errors from withRateLimit itself (e.g., RateLimitError thrown before try-catch)
    if (error instanceof RateLimitError) {
      logger.warn("Rate limit exceeded", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    // Log and return error response for any other unexpected errors
    logger.error(
      "Unexpected error in POST handler",
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
