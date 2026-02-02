-- Migration: Replace Daluz references with Opttius in system_config
-- Part of production readiness plan

UPDATE public.system_config
SET config_value = '"Opttius"'
WHERE config_key = 'site_name' AND config_value::text LIKE '%DA LUZ%';

UPDATE public.system_config
SET config_value = '"contacto@opttius.com"'
WHERE config_key = 'contact_email';

UPDATE public.system_config
SET config_value = '"soporte@opttius.com"'
WHERE config_key = 'support_email';

UPDATE public.system_config
SET config_value = '"Gestión óptica profesional"'
WHERE config_key = 'site_description' AND config_value::text LIKE '%Biocosmética%';
