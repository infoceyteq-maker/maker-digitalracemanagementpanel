-- ==============================================================================
-- CEYTEQ ENTERPRISE ECOSYSTEM - PRODUCTION SUPABASE POSTGRESQL DDL
-- Target: PostgreSQL 15+ (Supabase Cloud)
-- Schema: Users, Tenants, Divisions, ActivationTokens, OtpVerifications, RLS Policies
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'SUPER_MASTER_ADMIN',
    'DIGITAL_RACE_MASTER',
    'TASTETRIP_MASTER',
    'DIVISION_ADMIN',
    'RESTAURANT_ADMIN',
    'RESTAURANT_STAFF',
    'DELIVERY_DRIVER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE platform_branch AS ENUM (
    'DIGITAL_RACE',
    'TASTETRIP',
    'ALL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE division_id AS ENUM (
    'UP_COUNTRY',
    'SOUTH',
    'WESTERN',
    'NORTH'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE province_code AS ENUM (
    'CENTRAL',
    'UVA',
    'SABARAGAMUWA',
    'SOUTHERN',
    'EASTERN',
    'WESTERN',
    'NORTH_WESTERN',
    'NORTHERN',
    'NORTH_CENTRAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM (
    'FREE',
    'PRO',
    'PLUS'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM (
    'PENDING_ACTIVATION',
    'ACTIVE',
    'SUSPENDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. DIVISIONS TABLE (SRI LANKA OPERATIONAL REGIONS)
CREATE TABLE IF NOT EXISTS public.divisions (
  id division_id PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  platform_branch platform_branch NOT NULL DEFAULT 'ALL',
  provinces province_code[] NOT NULL,
  regional_lead_email VARCHAR(255),
  regional_office_city VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Divisions
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

-- 4. TENANTS (RESTAURANTS / STORES)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  branch platform_branch NOT NULL DEFAULT 'DIGITAL_RACE',
  division_id division_id NOT NULL DEFAULT 'WESTERN' REFERENCES public.divisions(id),
  province province_code NOT NULL DEFAULT 'WESTERN',
  city VARCHAR(100) NOT NULL DEFAULT 'Colombo',
  address TEXT NOT NULL,
  
  subscription_tier subscription_tier NOT NULL DEFAULT 'PRO',
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 129.00,
  status account_status NOT NULL DEFAULT 'ACTIVE',
  
  -- Add-Ons
  has_ai_chatbot BOOLEAN NOT NULL DEFAULT FALSE,
  has_whatsapp_bot BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_phone_number_id VARCHAR(100),
  whatsapp_webhook_token VARCHAR(255),
  
  -- Operations
  currency VARCHAR(10) NOT NULL DEFAULT 'LKR',
  table_count INT NOT NULL DEFAULT 15,
  accent_color VARCHAR(50) DEFAULT '#00C8FF',
  logo_url TEXT,
  cover_image_url TEXT,
  delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  payment_gateway_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibility alias for existing restaurant references
CREATE OR REPLACE VIEW public.restaurants AS SELECT * FROM public.tenants;

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_branch_div ON public.tenants(branch, division_id);
CREATE INDEX IF NOT EXISTS idx_tenants_province ON public.tenants(province);

-- 5. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'RESTAURANT_ADMIN',
  branch platform_branch NOT NULL DEFAULT 'DIGITAL_RACE',
  division_id division_id REFERENCES public.divisions(id) ON DELETE RESTRICT,
  allowed_provinces province_code[],
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  status account_status NOT NULL DEFAULT 'PENDING_ACTIVATION',
  
  -- Security
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret TEXT,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_branch_div ON public.users(branch, division_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);

-- 6. FIRST-TIME ACTIVATION TOKENS
CREATE TABLE IF NOT EXISTS public.activation_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  branch platform_branch NOT NULL DEFAULT 'DIGITAL_RACE',
  division_id division_id REFERENCES public.divisions(id) ON DELETE SET NULL,
  allowed_provinces province_code[],
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE OR REPLACE VIEW public.account_activation_tokens AS SELECT * FROM public.activation_tokens;

CREATE INDEX IF NOT EXISTS idx_activation_tokens_hash ON public.activation_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_user ON public.activation_tokens(user_id, used);

-- 7. DUAL-CHANNEL OTP VERIFICATIONS (EMAIL + WHATSAPP)
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  identifier VARCHAR(255) NOT NULL,
  email_otp_hash TEXT NOT NULL,
  phone_otp_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_identifier ON public.otp_verifications(identifier, verified);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: SUPER_MASTER_ADMIN Full Bypass
CREATE POLICY "super_master_admin_all_tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'SUPER_MASTER_ADMIN'));

CREATE POLICY "super_master_admin_all_users" ON public.users
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'SUPER_MASTER_ADMIN'));

-- Policy: DIVISION_ADMIN Province Isolation
CREATE POLICY "division_admin_province_tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
        AND u.role = 'DIVISION_ADMIN'
        AND (u.branch = tenants.branch OR u.branch = 'ALL')
        AND tenants.province = ANY(u.allowed_provinces)
    )
  );

CREATE POLICY "division_admin_province_users" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users admin_u
      JOIN public.tenants t ON t.id = users.tenant_id
      WHERE admin_u.id = auth.uid()
        AND admin_u.role = 'DIVISION_ADMIN'
        AND (admin_u.branch = t.branch OR admin_u.branch = 'ALL')
        AND t.province = ANY(admin_u.allowed_provinces)
    )
  );

-- Policy: RESTAURANT_ADMIN Tenant Isolation
CREATE POLICY "restaurant_admin_isolated_tenant" ON public.tenants
  FOR ALL TO authenticated
  USING (id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

CREATE POLICY "restaurant_admin_isolated_staff" ON public.users
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE users.id = auth.uid()));

-- Policy: Public Read for Active Storefronts
CREATE POLICY "public_read_active_tenants" ON public.tenants
  FOR SELECT TO anon
  USING (status = 'ACTIVE');

-- 9. AUTOMATIC TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_tenants_updated_at ON public.tenants;
CREATE TRIGGER tr_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_column();

DROP TRIGGER IF EXISTS tr_users_updated_at ON public.users;
CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_column();
