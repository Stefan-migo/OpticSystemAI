# Development Scripts

This directory contains development-only scripts for local setup and testing.

## ⚠️ Security Warning

**These scripts are for LOCAL DEVELOPMENT ONLY.**

- Never commit credentials or secrets
- Never use these scripts in production
- Always use environment variables for sensitive data
- Review scripts before running them

## Available Scripts

### create-admin-via-api.js

Creates an admin user via Supabase Auth API.

**Usage:**
```bash
# Using environment variables (recommended)
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="SecurePassword123!"
node create-admin-via-api.js

# Or pass as arguments
node create-admin-via-api.js admin@example.com SecurePassword123!
```

**Security:**
- Uses environment variables or command-line arguments
- Never hardcodes credentials
- Only works with local Supabase instance

