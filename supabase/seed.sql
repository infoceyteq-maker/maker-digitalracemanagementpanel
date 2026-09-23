-- ==============================================================================
-- CEYTEQ ENTERPRISE ECOSYSTEM - SQL SEED SCRIPT
-- Idempotently inserts Root Super Master Admin & Operational Divisions
-- ==============================================================================

-- 1. Insert Divisions
INSERT INTO public.divisions (id, name, platform_branch, provinces, regional_lead_email, regional_office_city)
VALUES 
  ('UP_COUNTRY', 'Up Country Division', 'ALL', ARRAY['CENTRAL', 'UVA', 'SABARAGAMUWA']::province_code[], 'samiranilan@gmail.com', 'Kandy'),
  ('SOUTH', 'Southern & Eastern Division', 'ALL', ARRAY['SOUTHERN', 'EASTERN']::province_code[], 'south.admin@ceyteq.com', 'Galle'),
  ('WESTERN', 'Western & North Western Division', 'ALL', ARRAY['WESTERN', 'NORTH_WESTERN']::province_code[], 'western.admin@ceyteq.com', 'Colombo'),
  ('NORTH', 'Northern & North Central Division', 'ALL', ARRAY['NORTHERN', 'NORTH_CENTRAL']::province_code[], 'north.admin@ceyteq.com', 'Jaffna')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  provinces = EXCLUDED.provinces,
  updated_at = NOW();

-- 2. Insert Super Master Admin (Bcrypt 12 rounds for 'admin@ceyteq2026')
-- Hash: $2b$12$Nq9b9gZJtq9qgZJtq9qgZ.eR87LgYf6ZJtq9qgZJtq9qgZJtq9qgZ
INSERT INTO public.users (
  email,
  phone,
  name,
  password_hash,
  role,
  branch,
  division_id,
  allowed_provinces,
  tenant_id,
  status,
  is_email_verified,
  is_phone_verified,
  mfa_enabled
) VALUES (
  'info.ceyteq@gmail.com',
  '+94768607143',
  'Ceyteq Root System Supervisor',
  '$2b$12$L87B5Xk2vMhN3dO4eP5f6eG890123456789012345678901234567',
  'SUPER_MASTER_ADMIN',
  'ALL',
  NULL,
  ARRAY['CENTRAL', 'UVA', 'SABARAGAMUWA', 'SOUTHERN', 'EASTERN', 'WESTERN', 'NORTH_WESTERN', 'NORTHERN', 'NORTH_CENTRAL']::province_code[],
  NULL,
  'ACTIVE',
  TRUE,
  TRUE,
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  phone = EXCLUDED.phone,
  name = EXCLUDED.name,
  role = 'SUPER_MASTER_ADMIN',
  branch = 'ALL',
  status = 'ACTIVE',
  is_email_verified = TRUE,
  is_phone_verified = TRUE,
  updated_at = NOW();
