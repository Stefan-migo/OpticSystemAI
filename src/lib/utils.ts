import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export formatting utilities
export {
  formatDate,
  formatRelativeDate,
  formatCurrency,
  formatPrice,
  formatNumber,
  formatDateTime,
  formatTimeAgo,
  type Locale,
  type DateFormatOptions,
  type CurrencyFormatOptions,
} from "./utils/formatting";
