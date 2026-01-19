/**
 * Example usage of the logger
 * This file demonstrates how to use the logger in different scenarios
 */

import { logger } from './index'

// Example 1: Simple info log
export function logUserLogin(userId: string) {
  logger.info('User logged in', { userId, timestamp: new Date().toISOString() })
}

// Example 2: Debug log (only in development)
export function logDebugInfo(data: any) {
  logger.debug('Debug information', data)
}

// Example 3: Warning log
export function logLowStock(productId: string, currentStock: number) {
  logger.warn('Low stock warning', { productId, currentStock, threshold: 10 })
}

// Example 4: Error log with Error object
export function logError(message: string, error: Error, context?: any) {
  logger.error(message, error, context)
}

// Example 5: Error log with plain object
export function logApiError(message: string, errorData: any) {
  logger.error(message, errorData)
}
