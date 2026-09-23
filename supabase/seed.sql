-- ==============================================================================
-- CEYTEQ ENTERPRISE ECOSYSTEM - SUPABASE IDEMPOTENT SQL SEED
-- Platforms:
--   1. Digital Race: Restaurant Management System & Digital Menu
--   2. TasteTrip: Food Delivery and Order Management Application
-- Root Credentials:
--   - Super Master Admin Email: info.ceyteq@gmail.com
--   - Super Master Admin Mobile: +94768607143
-- ==============================================================================

-- 1. LEVEL 1: SUPER MASTER ADMIN (ROOT SYSTEM SUPERVISOR)
INSERT INTO public.users (
  email,
  phone,
  name,
  password_hash,
  role,
  tier,
  status,
  is_email_verified,
  is_phone_verified,
  mfa_enabled,
  failed_login_attempts
)
VALUES (
  'info.ceyteq@gmail.com',
  '+94768607143',
  'Ceyteq Root System Supervisor',
  crypt('CeyteqMaster@2026!', gen_salt('bf', 12)),
  'SUPER_MASTER_ADMIN',
  'PRO',
  'ACTIVE',
  TRUE,
  TRUE,
  TRUE,
  0
)
ON CONFLICT (email) DO UPDATE SET
  phone = EXCLUDED.phone,
  role = 'SUPER_MASTER_ADMIN',
  status = 'ACTIVE',
  is_email_verified = TRUE,
  is_phone_verified = TRUE;

-- 2. LEVEL 2: BRANCH MASTER ADMINS (VERTICAL BUSINESS SEPARATION)
-- Vertical A: Digital Race
INSERT INTO public.users (email, phone, name, password_hash, role, platform_branch, tier, status, is_email_verified)
VALUES (
  'digitalrace.master@ceyteq.com',
  '+94771110001',
  'Digital Race Branch Master Admin',
  crypt('CeyteqMaster@2026!', gen_salt('bf', 12)),
  'DIGITAL_RACE_MASTER',
  'DIGITAL_RACE',
  'PRO',
  'ACTIVE',
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  role = 'DIGITAL_RACE_MASTER',
  platform_branch = 'DIGITAL_RACE';

-- Vertical B: TasteTrip
INSERT INTO public.users (email, phone, name, password_hash, role, platform_branch, tier, status, is_email_verified)
VALUES (
  'tastetrip.master@ceyteq.com',
  '+94771110002',
  'TasteTrip Delivery Branch Master Admin',
  crypt('CeyteqMaster@2026!', gen_salt('bf', 12)),
  'TASTETRIP_MASTER',
  'TASTETRIP',
  'PRO',
  'ACTIVE',
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  role = 'TASTETRIP_MASTER',
  platform_branch = 'TASTETRIP';

-- 3. LEVEL 3: 4 REGIONAL DIVISION ADMINS (GEOGRAPHIC PROVINCIAL PARTITIONING)
-- 3.1 Up Country Division (Central, Uva, Sabaragamuwa)
INSERT INTO public.users (email, phone, name, password_hash, role, platform_branch, status, is_email_verified)
VALUES (
  'div.upcountry.dr@ceyteq.com',
  '+94772220001',
  'Up Country Regional Division Admin',
  crypt('CeyteqMaster@2026!', gen_salt('bf', 12)),
  'DIVISION_ADMIN',
  'DIGITAL_RACE',
  'ACTIVE',
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  role = 'DIVISION_ADMIN',
  platform_branch = 'DIGITAL_RACE';

-- 3.2 South Division (Southern, Eastern)
INSERT INTO public.users (email, phone, name, password_hash, role, platform_branch, status, is_email_verified)
VALUES (
  'div.south.dr@ceyteq.com',
  '+94772220002',
  'South Regional Division Admin',
  crypt('CeyteqMaster@2026!', gen_salt('bf', 12)),
  'DIVISION_ADMIN',
  'DIGITAL_RACE',
  'ACTIVE',
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  role = 'DIVISION_ADMIN',
  platform_branch = 'DIGITAL_RACE';

-- 3.3 Western Division (Western, North Western)
INSERT INTO public.users (email, phone, name, password_hash, role, platform_branch, status, is_email_verified)
VALUES (
  'div.western.dr@ceyteq.com',
  '+94772220003',
  'Western Regional Division Admin',
  crypt('CeyteqMaster@2026!', gen_salt('bf', 12)),
  'DIVISION_ADMIN',
  'DIGITAL_RACE',
  'ACTIVE',
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  role = 'DIVISION_ADMIN',
  platform_branch = 'DIGITAL_RACE';

-- 3.4 North Division (Northern, North Central)
INSERT INTO public.users (email, phone, name, password_hash, role, platform_branch, status, is_email_verified)
VALUES (
  'div.north.dr@ceyteq.com',
  '+94772220004',
  'North Regional Division Admin',
  crypt('CeyteqMaster@2026!', gen_salt('bf', 12)),
  'DIVISION_ADMIN',
  'DIGITAL_RACE',
  'ACTIVE',
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  role = 'DIVISION_ADMIN',
  platform_branch = 'DIGITAL_RACE';

-- 3.5 Assign Provinces to Regional Division Admins
INSERT INTO public.division_assignments (user_id, platform_branch, division, allowed_provinces)
SELECT id, 'DIGITAL_RACE', 'UP_COUNTRY', ARRAY['CENTRAL', 'UVA', 'SABARAGAMUWA']::province[]
FROM public.users WHERE email = 'div.upcountry.dr@ceyteq.com'
ON CONFLICT (user_id) DO UPDATE SET
  division = 'UP_COUNTRY',
  allowed_provinces = ARRAY['CENTRAL', 'UVA', 'SABARAGAMUWA']::province[];

INSERT INTO public.division_assignments (user_id, platform_branch, division, allowed_provinces)
SELECT id, 'DIGITAL_RACE', 'SOUTH', ARRAY['SOUTHERN', 'EASTERN']::province[]
FROM public.users WHERE email = 'div.south.dr@ceyteq.com'
ON CONFLICT (user_id) DO UPDATE SET
  division = 'SOUTH',
  allowed_provinces = ARRAY['SOUTHERN', 'EASTERN']::province[];

INSERT INTO public.division_assignments (user_id, platform_branch, division, allowed_provinces)
SELECT id, 'DIGITAL_RACE', 'WESTERN', ARRAY['WESTERN', 'NORTH_WESTERN']::province[]
FROM public.users WHERE email = 'div.western.dr@ceyteq.com'
ON CONFLICT (user_id) DO UPDATE SET
  division = 'WESTERN',
  allowed_provinces = ARRAY['WESTERN', 'NORTH_WESTERN']::province[];

INSERT INTO public.division_assignments (user_id, platform_branch, division, allowed_provinces)
SELECT id, 'DIGITAL_RACE', 'NORTH', ARRAY['NORTHERN', 'NORTH_CENTRAL']::province[]
FROM public.users WHERE email = 'div.north.dr@ceyteq.com'
ON CONFLICT (user_id) DO UPDATE SET
  division = 'NORTH',
  allowed_provinces = ARRAY['NORTHERN', 'NORTH_CENTRAL']::province[];

-- 4. LEVEL 4: SAMPLE GEOGRAPHIC RESTAURANTS & VENDORS
INSERT INTO public.restaurants (
  name, slug, subdomain, division, province, city, platform_branch,
  owner_name, owner_email, owner_phone, tier, status, address
)
VALUES
  ('Colombo Harbour Bistro', 'colombo-harbour', 'colombo-harbour', 'WESTERN', 'WESTERN', 'Colombo', 'DIGITAL_RACE', 'Dinesh Perera', 'dinesh@colomboharbour.lk', '+94777123456', 'PRO', 'ACTIVE', 'Colombo 01, Sri Lanka'),
  ('Galle Fort Heritage Cafe', 'galle-fort', 'galle-fort', 'SOUTH', 'SOUTHERN', 'Galle Fort', 'DIGITAL_RACE', 'Manuka Silva', 'owner@gallefortcafe.com', '+94777987654', 'PRO', 'ACTIVE', 'Church Street, Galle Fort, Sri Lanka'),
  ('Kandy Royal Tea Lounge', 'kandy-royal', 'kandy-royal', 'UP_COUNTRY', 'CENTRAL', 'Kandy', 'DIGITAL_RACE', 'Sunil Jayawardena', 'sunil@kandyroyal.lk', '+94777555123', 'PLUS', 'ACTIVE', 'Peradeniya Road, Kandy, Sri Lanka'),
  ('Jaffna Spice Haven', 'jaffna-spice', 'jaffna-spice', 'NORTH', 'NORTHERN', 'Jaffna', 'DIGITAL_RACE', 'Rajan Thamby', 'rajan@jaffnaspice.com', '+94777666789', 'FREE', 'ACTIVE', 'Main Street, Jaffna, Sri Lanka')
ON CONFLICT (slug) DO UPDATE SET
  division = EXCLUDED.division,
  province = EXCLUDED.province,
  city = EXCLUDED.city;
