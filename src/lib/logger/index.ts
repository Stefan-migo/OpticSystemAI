import pino from 'pino'

/**
 * Logger configuration
 * Uses pino for structured logging
 * 
 * In development: Pretty printing for readability
 * In production: JSON format for log aggregation
 */

const isDevelopment = process.env.NODE_ENV === 'development'

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

/**
 * Logger interface for application-wide use
 * 
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   
 *   logger.debug('Debug message', { data })
 *   logger.info('Info message', { data })
 *   logger.warn('Warning message', { data })
 *   logger.error('Error message', { error, data })
 */
export const appLogger = {
  /**
   * Debug level - detailed information for debugging
   * Only shown in development
   */
  debug: (message: string, data?: any) => {
    if (data) {
      logger.debug(data, message)
    } else {
      logger.debug(message)
    }
  },

  /**
   * Info level - general informational messages
   */
  info: (message: string, data?: any) => {
    if (data) {
      logger.info(data, message)
    } else {
      logger.info(message)
    }
  },

  /**
   * Warn level - warning messages
   */
  warn: (message: string, data?: any) => {
    if (data) {
      logger.warn(data, message)
    } else {
      logger.warn(message)
    }
  },

  /**
   * Error level - error messages
   * Accepts Error objects or plain messages
   */
  error: (message: string, error?: Error | any, data?: any) => {
    if (error instanceof Error) {
      logger.error(
        {
          err: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          ...data,
        },
        message
      )
    } else if (error) {
      logger.error({ ...error, ...data }, message)
    } else if (data) {
      logger.error(data, message)
    } else {
      logger.error(message)
    }
  },
}

// Export default logger for convenience
export default appLogger

// Export pino logger for advanced use cases
export { logger }
