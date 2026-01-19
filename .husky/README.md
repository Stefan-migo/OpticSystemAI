# Husky Pre-commit Hooks

Este directorio contiene los hooks de Git configurados con Husky.

## Hooks Configurados

### pre-commit

Ejecuta automáticamente antes de cada commit:

- **lint-staged**: Ejecuta ESLint y Prettier en archivos staged
- Solo verifica archivos que están siendo commiteados (rápido)

## Verificación Manual

Si necesitas verificar todo el proyecto:

```bash
# Type checking completo
npm run type-check

# Linting completo
npm run lint

# Tests
npm test
```

## Deshabilitar Temporalmente

Si necesitas hacer un commit sin pasar los hooks (no recomendado):

```bash
git commit --no-verify -m "mensaje"
```

**⚠️ Advertencia**: Solo usar en casos excepcionales. Los hooks están para mantener la calidad del código.
