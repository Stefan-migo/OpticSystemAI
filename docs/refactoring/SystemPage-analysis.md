# Análisis y Plan de Refactorización - System Page

**Fecha:** 2025-01-27  
**Componente:** `src/app/admin/system/page.tsx`  
**Líneas Actuales:** 2,110  
**Objetivo:** < 400 líneas (página principal)

---

## 📋 Análisis del Componente Actual

### Estructura Actual

El componente `SystemAdministrationPage` es una página monolítica que maneja la administración completa del sistema. Contiene:

1. **Estado Complejo:**
   - 20+ estados locales (useState)
   - Estados de configuración, health metrics, backups
   - Estados de diálogos múltiples
   - Estados de mantenimiento

2. **Tabs Existentes:**
   - ✅ `overview` - Resumen del sistema
   - ✅ `config` - Configuración general
   - ✅ `email` - Plantillas de email (ya usa `EmailTemplatesManager`)
   - ✅ `notifications` - Notificaciones (ya usa `NotificationSettings`)
   - ✅ `health` - Métricas de salud
   - ✅ `maintenance` - Mantenimiento y backups

3. **Secciones Identificadas:**
   - **Overview Tab** (líneas ~777-850): ~73 líneas
     - Quick Actions
     - System Health Overview Cards
   - **Config Tab** (líneas ~850-1066): ~216 líneas
     - Lista de configuraciones por categoría
     - Edición inline de configuraciones
   - **Email Tab** (línea ~1068-1070): ~2 líneas
     - Ya usa `EmailTemplatesManager` ✅
   - **Notifications Tab** (línea ~1072-1074): ~2 líneas
     - Ya usa `NotificationSettings` ✅
   - **Health Tab** (líneas ~1076-1230): ~154 líneas
     - Health Metrics Table
     - Critical Issues Display
     - Warning Metrics Display
   - **Maintenance Tab** (líneas ~1230-1500): ~270 líneas
     - Maintenance Actions
     - Backup Management
     - Security Audit
     - System Status
   - **Diálogos** (líneas ~1500-2107): ~607 líneas
     - Security Audit Dialog
     - System Status Dialog
     - Backup Results Dialog
     - Restore Backup Dialog
     - Restore Results Dialog
     - Delete Backup Dialog

4. **Funciones y Lógica:**
   - `fetchSystemData()`: Obtiene configs y health metrics
   - `fetchConfigs()`: Obtiene configuraciones
   - `fetchHealthMetrics()`: Obtiene métricas de salud
   - `handleUpdateConfig()`: Actualiza configuración
   - `handleRefreshHealth()`: Refresca métricas
   - `handleMaintenanceAction()`: Ejecuta acciones de mantenimiento
   - `handleClearMemory()`: Limpia memoria
   - Múltiples handlers de backups (create, restore, delete)
   - Funciones de utilidad (formatMetricValue, translateMetricName, etc.)

---

## 🎯 Plan de Refactorización

### Estructura Propuesta

```
src/app/admin/system/
├── page.tsx                    # Página principal (< 400 líneas)
├── components/
│   ├── SystemOverview.tsx      # Tab Overview (~100 líneas)
│   ├── SystemConfig.tsx        # Tab Configuración (~250 líneas)
│   ├── SystemHealth.tsx        # Tab Salud (~200 líneas)
│   ├── SystemMaintenance.tsx   # Tab Mantenimiento (~300 líneas)
│   ├── BackupManager.tsx      # Gestión de backups (~400 líneas)
│   └── MaintenanceActions.tsx # Acciones de mantenimiento (~200 líneas)
└── hooks/
    ├── useSystemConfig.ts      # Fetch y gestión de configs
    ├── useSystemHealth.ts      # Fetch y gestión de health metrics
    └── useBackups.ts           # Gestión de backups
```

### Componentes a Extraer

#### 1. SystemOverview

**Responsabilidad:** Tab de resumen del sistema

- Quick Actions
- System Health Overview Cards
- Navegación rápida a otros tabs

**Props:**

```typescript
interface SystemOverviewProps {
  healthStatus: HealthStatus | null;
  onTabChange: (tab: string) => void;
}
```

#### 2. SystemConfig

**Responsabilidad:** Tab de configuración general

- Lista de configuraciones por categoría
- Edición inline de configuraciones
- Filtros por categoría
- Toggle de configuraciones sensibles

**Props:**

```typescript
interface SystemConfigProps {
  configs: SystemConfig[];
  onUpdateConfig: (key: string, value: any) => Promise<void>;
  onRefresh: () => void;
}
```

#### 3. SystemHealth

**Responsabilidad:** Tab de métricas de salud

- Health Metrics Table
- Critical Issues Display
- Warning Metrics Display
- Refresh de métricas
- Clear Memory action

**Props:**

```typescript
interface SystemHealthProps {
  healthMetrics: HealthMetric[];
  healthStatus: HealthStatus | null;
  onRefresh: () => void;
  onClearMemory: () => void;
  refreshing: boolean;
  clearingMemory: boolean;
}
```

#### 4. SystemMaintenance

**Responsabilidad:** Tab de mantenimiento

- Maintenance Actions
- Security Audit
- System Status
- Backup Management (usando BackupManager)

**Props:**

```typescript
interface SystemMaintenanceProps {
  onMaintenanceAction: (action: string) => Promise<void>;
  maintenanceLoading: boolean;
}
```

#### 5. BackupManager

**Responsabilidad:** Gestión completa de backups

- Lista de backups disponibles
- Crear backup
- Restaurar backup
- Eliminar backup
- Diálogos de resultados

**Props:**

```typescript
interface BackupManagerProps {
  availableBackups: Backup[];
  loading: boolean;
  onCreateBackup: () => Promise<void>;
  onRestoreBackup: (backup: Backup) => Promise<void>;
  onDeleteBackup: (backup: Backup) => Promise<void>;
}
```

#### 6. MaintenanceActions

**Responsabilidad:** Acciones de mantenimiento

- Botones de acciones
- Diálogos de resultados
- Security Audit Dialog
- System Status Dialog

**Props:**

```typescript
interface MaintenanceActionsProps {
  onAction: (action: string) => Promise<void>;
  loading: boolean;
}
```

### Hooks Personalizados

#### 1. useSystemConfig

**Responsabilidad:** Fetch y gestión de configuraciones

- Query para configs
- Mutation para actualizar config

**Retorna:**

```typescript
{
  configs: SystemConfig[];
  isLoading: boolean;
  updateConfig: (key: string, value: any) => Promise<void>;
  refetch: () => void;
}
```

#### 2. useSystemHealth

**Responsabilidad:** Fetch y gestión de health metrics

- Query para health metrics
- Mutation para refresh
- Mutation para clear memory

**Retorna:**

```typescript
{
  healthMetrics: HealthMetric[];
  healthStatus: HealthStatus | null;
  isLoading: boolean;
  refreshHealth: () => Promise<void>;
  clearMemory: () => Promise<void>;
  refreshing: boolean;
  clearingMemory: boolean;
}
```

#### 3. useBackups

**Responsabilidad:** Gestión de backups

- Query para backups disponibles
- Mutations para create, restore, delete

**Retorna:**

```typescript
{
  backups: Backup[];
  isLoading: boolean;
  createBackup: () => Promise<BackupResult>;
  restoreBackup: (backup: Backup) => Promise<RestoreResult>;
  deleteBackup: (backup: Backup) => Promise<void>;
}
```

---

## 📝 Dependencias Identificadas

### Componentes Externos

- `EmailTemplatesManager` - Ya extraído ✅
- `NotificationSettings` - Ya extraído ✅

### APIs

- `/api/admin/system/config` - CRUD de configuraciones
- `/api/admin/system/health` - Health metrics
- `/api/admin/system/maintenance` - Acciones de mantenimiento
- `/api/admin/system/backups` - Gestión de backups

---

## ✅ Criterios de Aceptación

- [ ] Página dividida en tabs/secciones
- [ ] Cada sección es un componente independiente
- [ ] Funcionalidad preservada
- [ ] Página principal < 400 líneas
- [ ] Hooks con React Query para data fetching
- [ ] Carga más rápida (lazy loading de tabs)

---

## 📅 Plan de Ejecución

1. ✅ Análisis y planificación (0.5 días)
2. ⏳ Crear hooks de datos (1 día)
3. ⏳ Extraer SystemOverview (0.5 días)
4. ⏳ Extraer SystemConfig (1 día)
5. ⏳ Extraer SystemHealth (1 día)
6. ⏳ Extraer SystemMaintenance y BackupManager (1.5 días)
7. ⏳ Refactorizar página principal (1 día)
8. ⏳ Verificación final (0.5 días)

**Total Estimado:** 1 semana
