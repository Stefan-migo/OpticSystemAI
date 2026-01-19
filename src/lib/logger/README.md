# Sistema de Logging

Este módulo proporciona un sistema de logging estructurado usando Pino.

## Uso Básico

```typescript
import { logger } from '@/lib/logger'

// Debug (solo en desarrollo)
logger.debug('Mensaje de debug', { userId: '123' })

// Info
logger.info('Operación completada', { orderId: '456' })

// Warning
logger.warn('Stock bajo', { productId: '789', stock: 5 })

// Error
logger.error('Error al procesar pago', error, { orderId: '456' })
```

## Niveles de Log

- **debug**: Información detallada (solo en desarrollo)
- **info**: Mensajes informativos generales
- **warn**: Advertencias
- **error**: Errores

## Configuración

El logger se configura automáticamente según el entorno:

- **Desarrollo**: Formato legible con colores (pino-pretty)
- **Producción**: Formato JSON para agregación de logs

## Variables de Entorno

- `LOG_LEVEL`: Nivel de log (debug, info, warn, error). Por defecto: 'debug' en desarrollo, 'info' en producción
- `NODE_ENV`: Entorno (development/production)

## Migración desde console.log

Reemplazar:
```typescript
// ❌ Antes
console.log('User logged in', { userId })
console.error('Error:', error)

// ✅ Después
import { logger } from '@/lib/logger'
logger.info('User logged in', { userId })
logger.error('Error al iniciar sesión', error)
```
