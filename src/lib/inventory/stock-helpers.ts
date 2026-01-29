import type { SupabaseClient } from "@supabase/supabase-js";
import { appLogger as logger } from "@/lib/logger";

/**
 * Get product stock for a specific branch
 * @param productId - Product ID
 * @param branchId - Branch ID
 * @param supabase - Supabase client
 * @returns Stock record or null if not found
 */
export async function getProductStock(
  productId: string,
  branchId: string,
  supabase: SupabaseClient,
): Promise<{
  id?: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  created_at?: string;
  updated_at?: string;
} | null> {
  try {
    const { data, error } = await supabase
      .from("product_branch_stock")
      .select("*")
      .eq("product_id", productId)
      .eq("branch_id", branchId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - stock doesn't exist for this product/branch
        logger.debug("No stock record found", { productId, branchId });
        return null;
      }
      logger.error("Error fetching product stock", {
        error,
        productId,
        branchId,
      });
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Exception in getProductStock", {
      error,
      productId,
      branchId,
    });
    return null;
  }
}

/**
 * Update product stock for a specific branch
 * @param productId - Product ID
 * @param branchId - Branch ID
 * @param quantityChange - Change in quantity (can be positive or negative)
 * @param isReserved - Whether the change is in reserved_quantity (true) or quantity (false)
 * @param supabase - Supabase client
 * @returns Success status and updated stock or error
 */
export async function updateProductStock(
  productId: string,
  branchId: string,
  quantityChange: number,
  isReserved: boolean,
  supabase: SupabaseClient,
): Promise<{
  success: boolean;
  stock?: {
    id: string;
    product_id: string;
    branch_id: string;
    quantity: number;
    reserved_quantity: number;
    low_stock_threshold: number;
  };
  error?: string;
}> {
  try {
    // Get current stock
    const currentStock = await getProductStock(productId, branchId, supabase);

    if (!currentStock) {
      // Stock doesn't exist, create it
      const initialQuantity = isReserved ? 0 : Math.max(0, quantityChange);
      const initialReserved = isReserved ? Math.max(0, quantityChange) : 0;

      const { data, error } = await supabase
        .from("product_branch_stock")
        .insert({
          product_id: productId,
          branch_id: branchId,
          quantity: initialQuantity,
          reserved_quantity: initialReserved,
          low_stock_threshold: 5, // Default threshold
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating product stock", {
          error,
          productId,
          branchId,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        stock: data,
      };
    }

    // Update existing stock
    const newQuantity = isReserved
      ? currentStock.quantity
      : Math.max(0, (currentStock.quantity || 0) + quantityChange);
    const newReserved = isReserved
      ? Math.max(0, (currentStock.reserved_quantity || 0) + quantityChange)
      : currentStock.reserved_quantity || 0;

    const { data, error } = await supabase
      .from("product_branch_stock")
      .update({
        quantity: newQuantity,
        reserved_quantity: newReserved,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", productId)
      .eq("branch_id", branchId)
      .select()
      .single();

    if (error) {
      logger.error("Error updating product stock", {
        error,
        productId,
        branchId,
      });
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      stock: data,
    };
  } catch (error) {
    logger.error("Exception in updateProductStock", {
      error,
      productId,
      branchId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create or update product stock (upsert)
 * @param productId - Product ID
 * @param branchId - Branch ID
 * @param quantity - Quantity to set
 * @param reservedQuantity - Reserved quantity to set
 * @param supabase - Supabase client
 * @returns Success status and stock record
 */
export async function upsertProductStock(
  productId: string,
  branchId: string,
  quantity: number,
  reservedQuantity: number = 0,
  supabase: SupabaseClient,
): Promise<{
  success: boolean;
  stock?: {
    id: string;
    product_id: string;
    branch_id: string;
    quantity: number;
    reserved_quantity: number;
    low_stock_threshold: number;
  };
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("product_branch_stock")
      .upsert(
        {
          product_id: productId,
          branch_id: branchId,
          quantity: Math.max(0, quantity),
          reserved_quantity: Math.max(0, reservedQuantity),
          low_stock_threshold: 5, // Default threshold
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "product_id,branch_id",
        },
      )
      .select()
      .single();

    if (error) {
      logger.error("Error upserting product stock", {
        error,
        productId,
        branchId,
      });
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      stock: data,
    };
  } catch (error) {
    logger.error("Exception in upsertProductStock", {
      error,
      productId,
      branchId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
