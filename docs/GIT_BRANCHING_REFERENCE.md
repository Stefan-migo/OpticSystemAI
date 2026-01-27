# 🚀 Quick Reference - Git Branching Commands

## Phase 5: Mantenibilidad (1 semana)

```bash
# Iniciar Phase 5
git checkout main
git pull origin main
git checkout -b phase-5-maintainability

# Hacer cambios...
git add .
git commit -m "refactor: Reducir código duplicado - utilidades compartidas"

# Finalizar Phase 5
npm run type-check && npm run lint && npm run build
npm run dev  # Verificar manualmente

git checkout main
git merge phase-5-maintainability
git push origin main
git branch -d phase-5-maintainability
```

---

## Phase SaaS 0: Multi-Tenancy Architecture (3 semanas)

```bash
# ⚠️ IMPORTANTE: NO MERGEAR A MAIN HASTA COMPLETAR TESTS EN PHASE 6

# Iniciar Phase SaaS 0
git checkout main
git pull origin main
git checkout -b phase-saas-0-multitenancy

# Tarea 0.1: Schema
git add . && git commit -m "feat: Crear schema de organizations y subscriptions"

# Tarea 0.2: RLS
git add . && git commit -m "feat: Extender RLS para multi-tenancy"

# Tarea 0.3: Tier System
git add . && git commit -m "feat: Implementar tier system base"

# Verificar que Phase SaaS 0 está completo
npm run type-check && npm run lint && npm run build
npm run dev

# ⚠️ ESPERAR A PHASE 6 TESTS ANTES DE MERGEAR
# Ver instrucciones Phase 6 abajo...
```

---

## Phase 6: Testing (3-4 semanas, PARALELO)

```bash
# Iniciar Phase 6
git checkout main
git pull origin main
git checkout -b phase-6-testing

# Tarea 6.1: Tests Unitarios
npm run test  # Ejecutar tests
git add . && git commit -m "test: Agregar tests unitarios para utilidades"

# Tarea 6.2A: Tests Básicos
npm run test
git add . && git commit -m "test: Agregar tests de integración para APIs"

# ⚠️ CRÍTICO: Tests Multi-Tenancy
# Antes de hacer esto, asegúrate que Phase SaaS 0 está completo
git pull origin phase-saas-0-multitenancy  # Traer cambios de SaaS 0
npm run test  # Tests contra schema multi-tenant

# Si tests FALLAN:
git reset --hard HEAD~1
# Ir a Phase SaaS 0 y arreglar

# Si tests PASAN:
git add . && git commit -m "test: Validar multi-tenancy isolation con tests de integración"

# Verificar
npm run test:coverage
npm run build

# Mergear Phase SaaS 0 PRIMERO
git checkout main
git merge phase-saas-0-multitenancy
git push origin main

# LUEGO mergear Phase 6
git checkout main
git merge phase-6-testing
git push origin main

# Cleanup
git branch -d phase-saas-0-multitenancy phase-6-testing
```

---

## Phase SaaS 1: Billing (2 semanas)

```bash
# ⚠️ SOLO INICIAR DESPUÉS QUE Phase SaaS 0 ESTÉ EN MAIN

# Iniciar Phase SaaS 1
git checkout main
git pull origin main
git checkout -b phase-saas-1-billing

# Tarea 1.1: Stripe Integration
npm install stripe @stripe/react-stripe-js
git add . && git commit -m "feat: Integrar Stripe para pagos de suscripciones"

# Tarea 1.2: Subscription Management
git add . && git commit -m "feat: Implementar gestión de suscripciones"

# Tarea 1.3: Tier Enforcement
git add . && git commit -m "feat: Implementar tier enforcement middleware"

# Verificar
npm run type-check && npm run lint && npm run build
npm run dev

# Mergear
git checkout main
git merge phase-saas-1-billing
git push origin main

# Cleanup
git branch -d phase-saas-1-billing
```

---

## ⚠️ EMERGENCY: Rollback

### Si algo se rompe EN EL BRANCH (antes de mergear):

```bash
# Opción 1: Revertir último commit
git revert HEAD
git push origin phase-X-nombre

# Opción 2: Resetear a commit anterior
git reset --hard HEAD~1
git push --force origin phase-X-nombre

# Ver commits
git log --oneline -10
```

### Si algo se rompe DESPUÉS de mergear a main:

```bash
# 1. Identificar merge commit
git log --oneline --merges -5

# 2. Revertir merge
git revert -m 1 <merge-commit-hash>

# 3. Verificar
npm run build
npm run dev

# 4. Push
git push origin main
```

---

## 📊 Estado de Branches en Cualquier Momento

```bash
# Ver todos los branches
git branch -a

# Ver historial de merges
git log --oneline --merges -10

# Ver cambios no commiteados
git status
git diff

# Ver commits en un branch vs main
git log main..phase-X-nombre --oneline
```

---

## ✅ Checklist Antes de Cada Merge a Main

- [ ] `npm run type-check` ✓
- [ ] `npm run lint` ✓
- [ ] `npm run build` ✓
- [ ] `npm run dev` ✓ (verificar manualmente)
- [ ] Tests pasan (si aplica)
- [ ] Sin console.log de debug
- [ ] Documentación actualizada
- [ ] PROGRESO_MEJORAS.md actualizado

```bash
# Script de verificación rápida
npm run type-check && npm run lint && npm run build && npm run test:run
```

---

## 📝 Convención de Commits

```
Format: <type>: <subject>

Types:
  feat:     Nueva funcionalidad
  fix:      Arreglo de bug
  refactor: Cambio sin nueva funcionalidad
  test:     Agregar tests
  docs:     Cambios de documentación
  perf:     Mejora de performance
  chore:    Cambios de build, dependencies, etc.

Examples:
  ✅ feat: Crear schema de organizations
  ✅ test: Validar multi-tenancy isolation
  ✅ refactor: Extraer utilidades compartidas
  ❌ fix: stuff
  ❌ update files
```

---

## 🔄 Flujo Normal de Una Fase

```
1. git checkout -b phase-X-nombre
2. Hacer cambios (múltiples commits)
3. git push origin phase-X-nombre
4. Verificaciones (npm run type-check, lint, build)
5. Si es SaaS 0: Esperar tests en Phase 6
6. Si tests OK: git checkout main && git merge phase-X-nombre
7. git push origin main
8. git branch -d phase-X-nombre
```

---

**Próximo Paso:** `git checkout -b phase-5-maintainability`
