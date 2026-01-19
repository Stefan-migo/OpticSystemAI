/**
 * Tax calculation utilities
 * Handles tax calculations for products with tax-inclusive or tax-exclusive pricing
 */

/**
 * Calculate price breakdown with tax
 * @param basePrice - The base price of the product/item
 * @param includesTax - Whether the base price already includes tax
 * @param taxRate - Tax rate as a percentage (e.g., 19 for 19%)
 * @returns Object with subtotal, tax amount, and total
 */
export function calculatePriceWithTax(
  basePrice: number,
  includesTax: boolean,
  taxRate: number
): { subtotal: number; tax: number; total: number } {
  if (includesTax) {
    // Price already includes tax, extract the tax from the price
    // Formula: subtotal = price / (1 + taxRate/100)
    const subtotal = basePrice / (1 + taxRate / 100);
    const tax = basePrice - subtotal;
    return {
      subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimals
      tax: Math.round(tax * 100) / 100,
      total: basePrice
    };
  } else {
    // Price does not include tax, add tax to the price
    const subtotal = basePrice;
    const tax = basePrice * (taxRate / 100);
    return {
      subtotal,
      tax: Math.round(tax * 100) / 100,
      total: Math.round((subtotal + tax) * 100) / 100
    };
  }
}

/**
 * Calculate total tax for multiple items
 * @param items - Array of items with price and includesTax flag
 * @param taxRate - Tax rate as a percentage
 * @returns Total tax amount
 */
export function calculateTotalTax(
  items: Array<{ price: number; includesTax: boolean }>,
  taxRate: number
): number {
  return items.reduce((totalTax, item) => {
    const { tax } = calculatePriceWithTax(item.price, item.includesTax, taxRate);
    return totalTax + tax;
  }, 0);
}

/**
 * Calculate subtotal for multiple items (without tax)
 * @param items - Array of items with price and includesTax flag
 * @param taxRate - Tax rate as a percentage
 * @returns Total subtotal (without tax)
 */
export function calculateSubtotal(
  items: Array<{ price: number; includesTax: boolean }>,
  taxRate: number
): number {
  return items.reduce((subtotal, item) => {
    const { subtotal: itemSubtotal } = calculatePriceWithTax(
      item.price,
      item.includesTax,
      taxRate
    );
    return subtotal + itemSubtotal;
  }, 0);
}

/**
 * Calculate total for multiple items (with tax)
 * @param items - Array of items with price and includesTax flag
 * @param taxRate - Tax rate as a percentage
 * @returns Total amount (with tax)
 */
export function calculateTotal(
  items: Array<{ price: number; includesTax: boolean }>,
  taxRate: number
): number {
  return items.reduce((total, item) => {
    const { total: itemTotal } = calculatePriceWithTax(
      item.price,
      item.includesTax,
      taxRate
    );
    return total + itemTotal;
  }, 0);
}
