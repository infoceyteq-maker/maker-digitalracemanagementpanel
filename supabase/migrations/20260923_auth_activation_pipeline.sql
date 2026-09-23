-- ==============================================================================
-- CEYTEQ ENTERPRISE ACCESS ARCHITECTURE - SUPABASE MIGRATION
-- Migration Name: 20260923_auth_activation_pipeline.sql
-- Platforms: Digital Race & TasteTrip Ecosystem
-- Defines: User, AccountActivationToken, Division, and DivisionAssignment Tables
-- Security: Multi-Tier RBAC, Geographic Province Boundaries, and Bcrypt Credentials
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'SUPER_MASTER_ADMIN',
    'DIGITAL_RACE_MASTER',
    'TASTETRIP_MASTER',
    'DIVISION_ADMIN',
    'RESTAURANT_ADMIN',
    'KITCHEN_STAFF',
    'WAITER_STAFF',
    'DELIVERY_PARTNER'
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
  CREATE TYPE division_code AS ENUM (
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
  CREATE TYPE account_status AS ENUM (
    'PENDING_ACTIVATION',
    'ACTIVE',
    'SUSPENDED',
    'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. DIVISIONS TABLE (SRI LANKA OPERATIONAL REGIONS)
CREATE TABLE IF NOT EXISTS public.divisions (
  id division_code PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  platform_branch platform_branch NOT NULL DEFAULT 'ALL',
  provinces province_code[] NOT NULL,
  regional_lead_email VARCHAR(255),
  regional_office_city VARCHAR(100),
  active_tenants_count INT NOT NULL DEFAULT 0,
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

-- 4. USERS TABLE (ENTERPRISE PRINCIPALS)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'RESTAURANT_ADMIN',
  status account_status NOT NULL DEFAULT 'PENDING_ACTIVATION',
  platform_branch platform_branch NOT NULL DEFAULT 'DIGITAL_RACE',
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  
  -- Security and Lifecycle Flags
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

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON public.users(restaurant_id);

-- 5. DIVISION ASSIGNMENTS (GEOGRAPHIC BOUNDARIES FOR DIVISION ADMINS)
CREATE TABLE IF NOT EXISTS public.division_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  platform_branch platform_branch NOT NULL DEFAULT 'DIGITAL_RACE',
  division division_code NOT NULL REFERENCES public.divisions(id) ON DELETE RESTRICT,
  allowed_provinces province_code[] NOT NULL,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_division_assignments_user ON public.division_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_division_assignments_lookup ON public.division_assignments(platform_branch, division);

-- 6. ACCOUNT ACTIVATION TOKENS (SINGLE-USE HMAC-SHA256 48-HOUR TTL)
CREATE TABLE IF NOT EXISTS public.account_activation_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  platform_branch platform_branch NOT NULL DEFAULT 'DIGITAL_RACE',
  division division_code REFERENCES public.divisions(id) ON DELETE SET NULL,
  allowed_provinces province_code[],
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  
  -- Lifecycle
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Backward compatibility alias
CREATE OR REPLACE VIEW public.account_invitations AS 
SELECT * FROM public.account_activation_tokens;

CREATE INDEX IF NOT EXISTS idx_activation_tokens_hash ON public.account_activation_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_email ON public.account_activation_tokens(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_activation_tokens_active ON public.account_activation_tokens(is_used, expires_at);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.division_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_activation_tokens ENABLE ROW LEVEL SECURITY;

-- Super Master Admin Bypass
CREATE POLICY "super_master_admin_manage_users" ON public.users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid() AND u.role = 'SUPER_MASTER_ADMIN'
    )
  );

CREATE POLICY "super_master_admin_manage_tokens" ON public.account_activation_tokens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid() AND u.role = 'SUPER_MASTER_ADMIN'
    )
  );

CREATE POLICY "super_master_admin_manage_divisions" ON public.divisions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid() AND u.role = 'SUPER_MASTER_ADMIN'
    )
  );

-- Division Admin Boundary Control
CREATE POLICY "division_admin_read_provinces_users" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.division_assignments da
      JOIN public.restaurants r ON r.id = users.restaurant_id
      WHERE da.user_id = auth.uid()
        AND da.platform_branch::text = r.platform_branch::text
        AND r.province::text = ANY(da.allowed_provinces::text[])
    )
  );

-- Public Read for Active Divisions (e.g. registration dropdowns)
CREATE POLICY "public_read_divisions" ON public.divisions
  FOR SELECT TO anon, authenticated
  USING (true);

-- 8. STORED PROCEDURES FOR ACTIVATION ENGINE

-- Validate activation token function
CREATE OR REPLACE FUNCTION public.fn_verify_activation_token(
  p_token_hash TEXT,
  p_email TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_code TEXT,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  user_role user_role,
  branch platform_branch,
  user_division division_code,
  provinces province_code[],
  target_restaurant_id UUID
) AS $$
DECLARE
  v_rec public.account_activation_tokens%ROWTYPE;
BEGIN
  SELECT * INTO v_rec 
  FROM public.account_activation_tokens
  WHERE token_hash = p_token_hash AND LOWER(email) = LOWER(p_email);

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'TOKEN_NOT_FOUND', NULL::VARCHAR, NULL::VARCHAR, NULL::user_role, NULL::platform_branch, NULL::division_code, NULL::province_code[], NULL::UUID;
    RETURN;
  END IF;

  IF v_rec.is_used THEN
    RETURN QUERY SELECT FALSE, 'TOKEN_ALREADY_USED', v_rec.email, v_rec.name, v_rec.role, v_rec.platform_branch, v_rec.division, v_rec.allowed_provinces, v_rec.restaurant_id;
    RETURN;
  END IF;

  IF NOW() > v_rec.expires_at THEN
    RETURN QUERY SELECT FALSE, 'TOKEN_EXPIRED', v_rec.email, v_rec.name, v_rec.role, v_rec.platform_branch, v_rec.division, v_rec.allowed_provinces, v_rec.restaurant_id;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, 'SUCCESS', v_rec.email, v_rec.name, v_rec.role, v_rec.platform_branch, v_rec.division, v_rec.allowed_provinces, v_rec.restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Consume token and activate account function
CREATE OR REPLACE FUNCTION public.fn_consume_token_and_activate(
  p_token_hash TEXT,
  p_email TEXT,
  p_password_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_rec public.account_activation_tokens%ROWTYPE;
  v_user_id UUID;
BEGIN
  SELECT * INTO v_rec 
  FROM public.account_activation_tokens
  WHERE token_hash = p_token_hash 
    AND LOWER(email) = LOWER(p_email)
    AND is_used = FALSE
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Mark token used
  UPDATE public.account_activation_tokens
  SET is_used = TRUE, used_at = NOW()
  WHERE id = v_rec.id;

  -- Upsert User
  INSERT INTO public.users (
    email,
    name,
    password_hash,
    role,
    status,
    platform_branch,
    restaurant_id,
    is_email_verified
  ) VALUES (
    LOWER(v_rec.email),
    v_rec.name,
    p_password_hash,
    v_rec.role,
    'ACTIVE'::account_status,
    v_rec.platform_branch,
    v_rec.restaurant_id,
    TRUE
  )
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    status = 'ACTIVE'::account_status,
    is_email_verified = TRUE,
    updated_at = NOW()
  RETURNING id INTO v_user_id;

  -- If division assignment exists, update or insert
  IF v_rec.division IS NOT NULL THEN
    INSERT INTO public.division_assignments (
      user_id,
      platform_branch,
      division,
      allowed_provinces
    ) VALUES (
      v_user_id,
      v_rec.platform_branch,
      v_rec.division,
      v_rec.allowed_provinces
    )
    ON CONFLICT (user_id) DO UPDATE SET
      platform_branch = EXCLUDED.platform_branch,
      division = EXCLUDED.division,
      allowed_provinces = EXCLUDED.allowed_provinces,
      updated_at = NOW();
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_users_updated_at ON public.users;
CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_timestamp();

DROP TRIGGER IF EXISTS tr_divisions_updated_at ON public.divisions;
CREATE TRIGGER tr_divisions_updated_at
  BEFORE UPDATE ON public.divisions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_timestamp();
